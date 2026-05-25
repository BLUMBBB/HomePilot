import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BrandLockup } from '@/components/BrandLogo'

import { forgotPassword } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setMessage('')
    if (!email.trim()) {
      setError('Введите email.')
      return
    }
    setLoading(true)
    try {
      const res = await forgotPassword(email)
      setMessage(res.message)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось отправить письмо.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-50 px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <BrandLockup className="inline-flex justify-center text-2xl" />
          <h1 className="text-3xl font-serif font-medium text-forest-950">Сброс пароля</h1>
          <p className="text-stone-500">Отправим ссылку для установки нового пароля на вашу почту</p>
        </div>

        <Card className="border-none shadow-xl bg-white rounded-2xl overflow-hidden">
          <CardContent className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-stone-700">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  placeholder="name@example.com"
                  required
                  className="h-12 rounded-xl border-stone-200 bg-cream-50/50"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              {message && <p className="text-sm text-emerald-700">{message}</p>}
              <Button type="submit" disabled={loading} className="w-full h-12 bg-forest-900 hover:bg-forest-800 rounded-xl">
                {loading ? 'Отправка…' : 'Отправить ссылку'}
              </Button>
            </form>
            <div className="mt-2 text-center text-sm text-stone-500">
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
