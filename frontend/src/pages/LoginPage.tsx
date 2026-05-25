import { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { ArrowRight } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { BrandLockup } from '@/components/BrandLogo'
import { GoogleAuthButton } from '@/components/GoogleAuthButton'
import { getPostLoginPath } from '@/lib/postLoginRedirect'

export function LoginPage() {
  const { login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)

  const onGoogleCredential = useCallback(
    async (idToken: string) => {
      setError('')
      setGoogleLoading(true)
      try {
        const user = await loginWithGoogle(idToken)
        navigate(getPostLoginPath(user), { replace: true })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Не удалось войти через Google.')
      } finally {
        setGoogleLoading(false)
      }
    },
    [loginWithGoogle, navigate]
  )

  const onGoogleError = useCallback((message: string) => {
    setError(message)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) {
      setError('Введите email и пароль.')
      return
    }
    setLoading(true)
    try {
      const user = await login({ email: email.trim(), password })
      navigate(getPostLoginPath(user), { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось войти.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-50 px-4 sm:px-6 py-8 sm:py-12">
      <div className="w-full max-w-md space-y-6 sm:space-y-8 min-w-0">
        <div className="text-center space-y-2">
          <BrandLockup className="inline-flex justify-center mb-4 sm:mb-6" />
          <h1 className="text-3xl sm:text-4xl font-serif font-medium text-forest-950">С возвращением</h1>
          <p className="text-sm sm:text-base text-stone-500">Введите данные для входа в аккаунт</p>
        </div>

        <Card className="border-none shadow-2xl shadow-forest-900/5 bg-white rounded-xl sm:rounded-2xl overflow-hidden">
          <CardContent className="p-5 sm:p-6 md:p-8 lg:p-10">
            <form onSubmit={handleSubmit} className="space-y-6">
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
                <div className="flex items-center justify-between">
                  <label htmlFor="password" className="text-sm font-medium text-stone-700">
                    Пароль
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-sm font-medium text-forest-800 hover:text-forest-600 hover:underline"
                  >
                    Забыли пароль?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="h-12 rounded-xl border-stone-200 focus:ring-forest-900 bg-cream-50/50"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <Button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full h-12 bg-forest-900 hover:bg-forest-800 text-cream-50 rounded-xl text-base shadow-lg shadow-forest-900/20"
              >
                {loading ? 'Вход…' : 'Войти'} <ArrowRight className="ml-2 w-4 h-4 inline" />
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
                {googleLoading ? (
                  <p className="text-center text-sm text-stone-500">Вход через Google…</p>
                ) : (
                  <GoogleAuthButton onCredential={onGoogleCredential} onError={onGoogleError} />
                )}
              </div>
            ) : null}

            <div className="mt-8 pt-6 border-t border-stone-100 text-center text-sm text-stone-500">
              Нет аккаунта?{' '}
              <Link to="/register" className="font-medium text-forest-900 hover:text-forest-700 hover:underline">
                Создать аккаунт
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-stone-400">
          Входя в систему, вы соглашаетесь с нашими Условиями использования и Политикой конфиденциальности.
        </p>
      </div>
    </div>
  )
}
