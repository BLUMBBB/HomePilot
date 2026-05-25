import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { CheckCircle, Mail } from 'lucide-react'
import { BrandLockup } from '@/components/BrandLogo'
import { confirmEmail } from '@/api/client'

export function ConfirmEmailPage() {
  const navigate = useNavigate()
  const [code, setCode] = useState<string[]>(Array(6).fill(''))
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const codeStr = code.join('')

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return
    const next = [...code]
    next[index] = value.slice(-1)
    setCode(next)
    if (value && index < 5) {
      const el = document.getElementById(`code-${index + 1}`)
      el?.focus()
    }
    setStatus('idle')
    setMessage('')
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prev = document.getElementById(`code-${index - 1}`)
      prev?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault()
    const text = e.clipboardData.getData('text/plain')
    const digits = text.replace(/\D/g, '').slice(0, 6).split('')
    const next = Array(6)
      .fill('')
      .map((_, i) => digits[i] ?? '')
    setCode(next)
    setStatus('idle')
    setMessage('')
    const focusIndex = Math.min(digits.length, 5)
    setTimeout(() => document.getElementById(`code-${focusIndex}`)?.focus(), 0)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (codeStr.length !== 6) return
    setStatus('loading')
    setMessage('')
    try {
      const data = await confirmEmail(codeStr)
      setStatus('ok')
      setMessage(data.message ?? 'Email успешно подтверждён.')
      setTimeout(() => navigate('/login', { replace: true }), 2500)
    } catch (err) {
      setStatus('error')
      setMessage(err instanceof Error ? err.message : 'Не удалось подтвердить email.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-50 px-4 sm:px-6 py-8 sm:py-12">
      <div className="w-full max-w-md space-y-6 sm:space-y-8 text-center min-w-0">
        <BrandLockup className="inline-flex justify-center" />

        <div className="px-2">
          <h1 className="text-xl sm:text-2xl font-serif font-medium text-forest-950 mb-2">
            Подтвердите email
          </h1>
          <p className="text-stone-600 text-xs sm:text-sm">
            Введите 6-значный код из письма, отправленного на ваш email.
          </p>
        </div>

        <div className="rounded-xl sm:rounded-2xl bg-cream-100 px-3 sm:px-4 py-3 text-xs sm:text-sm text-stone-700 flex items-center gap-3 text-left">
          <Mail className="w-5 h-5 text-forest-700 shrink-0" />
          <p>
            Письмо с кодом отправлено на ваш email. Введите код ниже. Если письмо не пришло,
            проверьте папку «Спам».
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center gap-1.5 sm:gap-2 flex-wrap" onPaste={handlePaste}>
            {code.map((digit, i) => (
              <input
                key={i}
                id={`code-${i}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-10 h-12 sm:w-12 sm:h-14 rounded-lg sm:rounded-xl border border-stone-200 bg-cream-50/50 text-center text-lg sm:text-xl font-medium tracking-[0.15em] sm:tracking-[0.2em] focus:outline-none focus:ring-2 focus:ring-forest-900"
              />
            ))}
          </div>
          {status === 'error' && <p className="text-sm text-red-600">{message}</p>}
          {status === 'ok' && (
            <div className="flex items-center justify-center gap-2 text-forest-600">
              <CheckCircle className="w-5 h-5" />
              <p className="text-sm">{message}</p>
            </div>
          )}
          <Button
            type="submit"
            disabled={codeStr.length !== 6 || status === 'loading'}
            className="w-full h-12 bg-forest-900 hover:bg-forest-800 text-cream-50 rounded-xl"
          >
            {status === 'loading' ? 'Проверка…' : 'Подтвердить и войти'}
          </Button>
        </form>

        <p className="text-sm text-stone-500">
          <Link to="/login" className="text-forest-900 font-medium hover:underline">
            ← Вернуться к входу
          </Link>
        </p>
      </div>
    </div>
  )
}
