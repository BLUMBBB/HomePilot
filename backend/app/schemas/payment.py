"""Payment schemas."""
from typing import Optional
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class CreatePaymentIntentRequest(BaseModel):
    subscription_id: UUID
    return_url: Optional[str] = None
    cancel_url: Optional[str] = None


class SubmitCardRequest(BaseModel):
    """Имитация ввода карты: данные не сохраняются, только проверка формата и возврат кода (тест)."""
    payment_id: UUID
    card_number: str = Field(..., min_length=13, max_length=19, description="Номер карты без пробелов")
    exp_month: str = Field(..., min_length=2, max_length=2, description="MM")
    exp_year: str = Field(..., min_length=2, max_length=2, description="YY")
    cvc: str = Field(..., min_length=3, max_length=4, description="CVV/CVC")
    cardholder_name: str = Field("", max_length=100)


class ConfirmPaymentRequest(BaseModel):
    payment_id: UUID
    code: str = Field(..., min_length=6, max_length=6, description="6-значный код подтверждения списания")


class StripeCheckoutCompleteRequest(BaseModel):
    """После success redirect из Stripe Checkout (session_id в query)."""

    session_id: str = Field(..., min_length=8, max_length=255, description="cs_... из Stripe")


class CreatePaymentIntentResponse(BaseModel):
    payment_id: UUID
    redirect_url: Optional[str] = None
    client_secret: Optional[str] = None


class PaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    subscription_id: Optional[UUID]
    amount_kzt: int
    currency: str
    status: str
    paid_at: Optional[datetime]
    created_at: datetime
