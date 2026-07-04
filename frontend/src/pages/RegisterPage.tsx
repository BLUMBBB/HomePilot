import { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight } from 'lucide-react'
import { BrandLockup } from '@/components/BrandLogo'
import { useAuth } from '@/contexts/AuthContext'
import { GoogleAuthButton } from '@/components/GoogleAuthButton'
import { getPostLoginPath } from '@/lib/postLoginRedirect'
import { cn } from '@/lib/utils'
import { capture } from '@/lib/analytics'

export function RegisterPage() {
  const { register, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [consentPd, setConsentPd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const onGoogleCredential = useCallback(
    async (idToken: string) => {
      setError('')
      setSuccess('')
      setGoogleLoading(true)
      try {
        const user = await loginWithGoogle(idToken)
        capture('sign_up', { method: 'google' })
        navigate(getPostLoginPath(user), { replace: true })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось зарегистрироваться через Google.')
      } finally {
        setGoogleLoading(false)
      }
    },
    [loginWithGoogle, navigate]
  )

  const onGoogleError = useCallback((message: string) => {
    setError(message)
  }, [])

  async function performRegister() {
    setShowConfirm(false)
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      await register({
        name: `${firstName.trim()} ${lastName.trim()}`,
        email: email.trim(),
        password,
        locale: 'ru',
        accept_personal_data_processing: true,
      })
      capture('sign_up', { method: 'email' })
      setSuccess('Регистрация успешно выполнена. Перенаправляем на страницу подтверждения email…')
      setTimeout(() => navigate('/auth/confirm-email'), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось зарегистрироваться.')
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      setError('Заполните все обязательные поля.')
      return
    }
    if (!consentPd) {
      setError('Необходимо согласие на обработку персональных данных.')
      return
    }
    setShowConfirm(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-50 px-4 sm:px-6 py-8 sm:py-12">
      <div className="w-full max-w-md space-y-6 sm:space-y-8 min-w-0">
        <div className="text-center space-y-2">
          <BrandLockup className="inline-flex justify-center mb-4 sm:mb-6" />
          <h1 className="text-3xl sm:text-4xl font-serif font-medium text-forest-950">Создать аккаунт</h1>
          <p className="text-sm sm:text-base text-stone-500">Присоединяйтесь к премиальному сервису Алматы</p>
        </div>

        <Card className="border-none shadow-2xl shadow-forest-900/5 bg-white rounded-xl sm:rounded-2xl overflow-hidden">
          <CardContent className="p-5 sm:p-6 md:p-8 lg:p-10">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label htmlFor="firstName" className="text-sm font-medium text-stone-700">
                    Имя
                  </label>
                  <Input
                    id="firstName"
                    placeholder="Алекс"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    autoComplete="given-name"
                    className="h-12 rounded-xl border-stone-200 focus:ring-forest-900 bg-cream-50/50"
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="lastName" className="text-sm font-medium text-stone-700">
                    Фамилия
                  </label>
                  <Input
                    id="lastName"
                    placeholder="Ким"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    autoComplete="family-name"
                    className="h-12 rounded-xl border-stone-200 focus:ring-forest-900 bg-cream-50/50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-stone-700">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="h-12 rounded-xl border-stone-200 focus:ring-forest-900 bg-cream-50/50"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-stone-700">
                  Пароль
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  className="h-12 rounded-xl border-stone-200 focus:ring-forest-900 bg-cream-50/50"
                />
              </div>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={consentPd}
                  onChange={(e) => setConsentPd(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-stone-300 text-forest-900 focus:ring-forest-900"
                />
                <span className="text-sm text-stone-600 leading-snug">
                  Я подтверждаю согласие на{' '}
                  <Link to="/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-forest-900 underline font-medium">
                    обработку персональных данных
                  </Link>
                  , а также ознакомление с{' '}
                  <Link to="/legal/offer" target="_blank" rel="noopener noreferrer" className="text-forest-900 underline font-medium">
                    договором оферты
                  </Link>{' '}
                  и{' '}
                  <Link to="/legal/terms" target="_blank" rel="noopener noreferrer" className="text-forest-900 underline font-medium">
                    условиями использования
                  </Link>
                  .
                </span>
              </label>

              {error && <p className="text-sm text-red-600">{error}</p>}
              {success && <p className="text-sm text-forest-600">{success}</p>}
              <Button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full h-12 bg-forest-900 hover:bg-forest-800 text-cream-50 rounded-xl text-base shadow-lg shadow-forest-900/20 mt-2"
              >
                {loading ? 'Регистрация…' : 'Зарегистрироваться'}{' '}
                <ArrowRight className="ml-2 w-4 h-4 inline" />
              </Button>
            </form>

            {import.meta.env.VITE_GOOGLE_CLIENT_ID ? (
              <div className="mt-8 space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-stone-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase tracking-wide">
                    <span className="bg-white px-3 text-stone-400">или</span>
                  </div>
                </div>
                {!consentPd ? (
                  <p className="text-center text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                    Чтобы войти через Google, отметьте согласие на обработку персональных данных выше.
                  </p>
                ) : null}
                <div className={cn(!consentPd && 'opacity-40 pointer-events-none select-none')}>
                  {googleLoading ? (
                    <p className="text-center text-sm text-stone-500">Google…</p>
                  ) : (
                    <GoogleAuthButton onCredential={onGoogleCredential} onError={onGoogleError} />
                  )}
                </div>
                <p className="text-center text-xs text-stone-500">
                  Быстрая регистрация: аккаунт клиента создаётся автоматически после входа через Google.
                </p>
              </div>
            ) : null}

            <div className="mt-8 pt-6 border-t border-stone-100 text-center text-sm text-stone-500">
              Уже есть аккаунт?{' '}
              <Link to="/login" className="font-medium text-forest-900 hover:text-forest-700 hover:underline">
                Войти
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-stone-400">
          Документы:{' '}
          <Link to="/legal/privacy" className="underline hover:text-stone-600">
            Политика ПД
          </Link>
          ,{' '}
          <Link to="/legal/terms" className="underline hover:text-stone-600">
            Условия
          </Link>
          ,{' '}
          <Link to="/legal/offer" className="underline hover:text-stone-600">
            Оферта
          </Link>
          .
        </p>
      </div>

      {showConfirm ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="consent-confirm-title"
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 sm:p-8 space-y-4 border border-cream-200">
            <h2 id="consent-confirm-title" className="text-lg font-serif font-semibold text-forest-950">
              Подтверждение согласия
            </h2>
            <p className="text-sm text-stone-600 leading-relaxed">
              Вы подтверждаете согласие на обработку персональных данных в целях регистрации и использования сервиса HomePilot
              в соответствии с{' '}
              <Link to="/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-forest-900 underline">
                Политикой конфиденциальности
              </Link>
              ? Это второй шаг подтверждения (двойное подтверждение).
            </p>
            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pt-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setShowConfirm(false)}>
                Отмена
              </Button>
              <Button
                type="button"
                className="rounded-xl bg-forest-900 hover:bg-forest-800 text-cream-50"
                onClick={() => void performRegister()}
              >
                Подтверждаю
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
