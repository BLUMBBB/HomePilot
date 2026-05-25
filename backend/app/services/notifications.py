"""Уведомления: отправка писем (регистрация, подтверждение email и т.п.)."""

import logging
import smtplib
from email.message import EmailMessage

from app.config import get_settings

logger = logging.getLogger(__name__)


def _log_email_to_stdout(to_email: str, subject: str, body: str, *, code: str | None = None, reason: str = "") -> None:
    """Дублирование письма в stdout (docker logs) — dev или fallback при сбое SMTP."""
    prefix = f"=== EMAIL ({reason}) ===" if reason else "=== EMAIL (SMTP не настроен) ==="
    print(prefix, flush=True)
    print("To:", to_email, flush=True)
    print("Subject:", subject, flush=True)
    print("Body:\n", body, flush=True)
    if code:
        print(">>> КОД ПОДТВЕРЖДЕНИЯ (введите на странице подтверждения):", flush=True)
        print(f">>> {code}", flush=True)
    print("=== END EMAIL ===", flush=True)


def _send_email(to_email: str, subject: str, body: str, *, code: str | None = None) -> None:
    """Простая отправка письма через SMTP.

    Если SMTP не настроен — только stdout. При ошибке доставки (неверный пароль, сеть и т.д.)
    не падаем: пишем в лог и дублируем содержимое в stdout, чтобы регистрация не отдавала 500.
    """
    settings = get_settings()
    if not settings.SMTP_HOST or not settings.EMAIL_FROM:
        _log_email_to_stdout(to_email, subject, body, code=code)
        return

    msg = EmailMessage()
    msg["From"] = settings.EMAIL_FROM
    msg["To"] = to_email
    msg["Subject"] = subject
    msg.set_content(body)

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=30) as server:
            server.starttls()
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.send_message(msg)
    except (smtplib.SMTPException, OSError, TimeoutError) as exc:
        logger.warning("SMTP send failed, falling back to stdout: %s", exc, exc_info=False)
        _log_email_to_stdout(
            to_email,
            subject,
            body,
            code=code,
            reason="SMTP ошибка — см. логи, исправьте SMTP_USER/SMTP_PASSWORD или App Password",
        )


def send_registration_confirm_email(to_email: str, code: str, locale: str = "ru") -> None:
    """Отправка письма с 6-значным кодом подтверждения email при регистрации клиента."""
    if locale == "kk":
        subject = "HomePilot: Электрондық поштаны растаңыз"
        body = (
            "Сәлеметсіз бе!\n\n"
            "HomePilot сервисінде тіркелуіңізге рахмет.\n"
            f"Тіркеуді аяқтау үшін төмендегі 6 таңбалы коды енгізіңіз: {code}\n\n"
            "Егер сіз бұл әрекетті бастамаған болсаңыз, бұл хатты елемеуге болады.\n"
        )
    else:
        subject = "HomePilot: Подтверждение email"
        body = (
            "Здравствуйте!\n\n"
            "Спасибо за регистрацию в HomePilot.\n"
            f"Чтобы завершить регистрацию, введите этот 6-значный код на странице подтверждения: {code}\n\n"
            "Если вы не регистрировались в HomePilot, просто проигнорируйте это письмо.\n"
        )

    _send_email(to_email, subject, body, code=code)


def send_password_reset_email(to_email: str, code: str, locale: str = "ru") -> None:
    """Письмо с 6-значным кодом сброса пароля (как в ResetPasswordPage — token в query)."""
    settings = get_settings()
    base = settings.FRONTEND_BASE_URL.rstrip("/")
    link = f"{base}/reset-password?token={code}"
    if locale == "kk":
        subject = "HomePilot: Құпия сөзді қалпына келтіру"
        body = (
            "Сәлеметсіз бе!\n\n"
            "Құпия сөзді қалпына келтіру сұрауы алынды.\n"
            f"Код: {code}\n"
            f"Сілтеме: {link}\n\n"
            "Егер сіз сұраныс жібермеген болсаңыз, бұл хатты елемеуге болады.\n"
        )
    else:
        subject = "HomePilot: Сброс пароля"
        body = (
            "Здравствуйте!\n\n"
            "Мы получили запрос на сброс пароля для вашего аккаунта HomePilot.\n"
            f"Код подтверждения (6 цифр): {code}\n"
            f"Страница сброса: {link}\n\n"
            "Если вы не запрашивали сброс, проигнорируйте это письмо.\n"
        )
    _send_email(to_email, subject, body, code=code)
