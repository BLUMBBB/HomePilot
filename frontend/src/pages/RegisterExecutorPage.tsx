import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight } from 'lucide-react'
import { BrandLockup } from '@/components/BrandLogo'
import { registerExecutor, setAuthTokens } from '@/api/client'
import { useAuth } from '@/contexts/AuthContext'
import { capture } from '@/lib/analytics'
import { getCaptchaToken } from '@/lib/recaptcha'

export function RegisterExecutorPage() {
  const { setUser } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [inviteCode, setInviteCode] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [consentPd, setConsentPd] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const c = searchParams.get('code')
    if (c) setInviteCode(c)
  }, [searchParams])

  async function performRegister() {
    setShowConfirm(false)
    setError('')
    setLoading(true)
    try {
      const captcha_token = await getCaptchaToken('register')
      const data = await registerExecutor({
        invite_code: inviteCode.trim(),
        email: email.trim(),
        password,
        name: name.trim() || null,
        accept_personal_data_processing: true,
        captcha_token,
      })
      setAuthTokens(data.access_token, data.refresh_token, data.user)
      setUser(data.user)
      capture('executor_sign_up')
      navigate('/executor', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось зарегистрироваться.')
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!inviteCode.trim() || !email.trim() || !password) {
      setError('Заполните код приглашения, email и пароль.')
      return
    }
    if (!consentPd) {
      setError('Необходимо согласие на обработку персональных данных.')
      return
    }
    setShowConfirm(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-50 px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <BrandLockup className="inline-flex justify-center text-xl" />
          <h1 className="text-3xl font-serif font-medium text-forest-950">Регистрация исполнителя</h1>
          <p className="text-sm text-stone-500">Введите код из приглашения администратора</p>
        </div>
        <Card className="border-none shadow-xl bg-white rounded-2xl">
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="invite" className="text-sm font-medium text-stone-700">
                  Код приглашения
                </label>
                <Input
                  id="invite"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  required
                  className="h-12 rounded-xl"
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-stone-700">
                  Имя
                </label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-12 rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-stone-700">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 rounded-xl"
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-stone-700">
                  Пароль (мин. 8 символов)
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="h-12 rounded-xl"
                  autoComplete="new-password"
                />
              </div>

              <label className="flex items-start gap-3 cursor-pointer">
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
                  , а также ознакомление с офертой и условиями (
                  <Link to="/legal/offer" target="_blank" rel="noopener noreferrer" className="underline">
                    оферта
                  </Link>
                  ,{' '}
                  <Link to="/legal/terms" target="_blank" rel="noopener noreferrer" className="underline">
                    условия
                  </Link>
                  ).
                </span>
              </label>

              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-forest-900 hover:bg-forest-800 text-cream-50 rounded-xl"
              >
                {loading ? 'Регистрация…' : 'Создать аккаунт'} <ArrowRight className="ml-2 w-4 h-4 inline" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {showConfirm ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="executor-consent-title"
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 sm:p-8 space-y-4 border border-cream-200">
            <h2 id="executor-consent-title" className="text-lg font-serif font-semibold text-forest-950">
              Подтверждение согласия
            </h2>
            <p className="text-sm text-stone-600 leading-relaxed">
              Вы подтверждаете согласие на обработку персональных данных при регистрации исполнителя в соответствии с{' '}
              <Link to="/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-forest-900 underline">
                Политикой конфиденциальности
              </Link>
              ?
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
