import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { BrandLockup } from '@/components/BrandLogo'

import { resetPassword } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const tokenFromLink = useMemo(
    () => new URLSearchParams(location.search).get('token')?.trim() ?? '',
    [location.search]
  )
  const [token, setToken] = useState(tokenFromLink)
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (tokenFromLink) setToken(tokenFromLink)
  }, [tokenFromLink])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')
    if (token.trim().length !== 6) {
      setError('Введите 6-значный код из письма.')
      return
    }
    if (newPassword.length < 8) {
      setError('Новый пароль должен быть не короче 8 символов.')
      return
    }
    setLoading(true)
    try {
      const res = await resetPassword(token, newPassword)
      setMessage(res.message)
      setTimeout(() => navigate('/login'), 1200)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось сбросить пароль.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-50 px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <BrandLockup className="inline-flex justify-center text-2xl" />
          <h1 className="text-3xl font-serif font-medium text-forest-950">Новый пароль</h1>
          <p className="text-stone-500">
            {tokenFromLink ? 'Установите новый пароль для входа в аккаунт' : 'Введите код из письма и новый пароль'}
          </p>
        </div>

        <Card className="border-none shadow-xl bg-white rounded-2xl overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {!tokenFromLink && (
                <div className="space-y-2">
                  <label htmlFor="code" className="text-sm font-medium text-stone-700">
                    Код подтверждения
                  </label>
                  <Input
                    id="code"
                    inputMode="numeric"
                    maxLength={6}
                    value={token}
                    onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    required
                    className="h-12 rounded-xl border-stone-200 bg-cream-50/50"
                  />
                </div>
              )}
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-stone-700">
                  Новый пароль
                </label>
                <Input
                  id="password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  minLength={8}
                  className="h-12 rounded-xl border-stone-200 bg-cream-50/50"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              {message && <p className="text-sm text-emerald-700">{message}</p>}
              <Button type="submit" disabled={loading} className="w-full h-12 bg-forest-900 hover:bg-forest-800 rounded-xl">
                {loading ? 'Сохраняем…' : 'Сбросить пароль'}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm text-stone-500">
              <Link to="/login" className="font-medium text-forest-900 hover:text-forest-700 hover:underline">
                Вернуться ко входу
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
