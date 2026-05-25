import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { adminGetSubscription, adminListExecutors, adminPatchSubscription, type AdminExecutorRow } from '@/api/client'
import { useAuth } from '@/contexts/AuthContext'
import { adminBackLink, adminCardTitle, adminSurface } from '@/lib/adminUi'

const DAY_LABELS: Record<number, string> = {
  1: 'Пн',
  2: 'Вт',
  3: 'Ср',
  4: 'Чт',
  5: 'Пт',
  6: 'Сб',
  7: 'Вс',
}

function sliceTime(t: unknown): string {
  if (typeof t !== 'string') return ''
  return t.length >= 5 ? t.slice(0, 5) : t
}

export function AdminSubscriptionDetail() {
  const { subscriptionId } = useParams<{ subscriptionId: string }>()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [sub, setSub] = useState<Record<string, unknown> | null>(null)
  const [executors, setExecutors] = useState<AdminExecutorRow[]>([])
  const [executorId, setExecutorId] = useState('')
  const [status, setStatus] = useState('')
  const [autoRenew, setAutoRenew] = useState(true)
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5])
  const [timeStart, setTimeStart] = useState('10:00')
  const [timeEnd, setTimeEnd] = useState('13:00')
  const [pausedUntil, setPausedUntil] = useState('')
  const [clearPause, setClearPause] = useState(false)
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  function applyFromSub(s: Record<string, unknown>) {
    setStatus(String(s.status))
    setExecutorId(s.executor_id ? String(s.executor_id) : '')
    setAutoRenew(Boolean(s.auto_renew))
    const pd = s.preferred_days as number[] | undefined
    setDays(Array.isArray(pd) && pd.length ? [...pd].sort((a, b) => a - b) : [1, 2, 3, 4, 5])
    setTimeStart(sliceTime(s.time_slot_start))
    setTimeEnd(sliceTime(s.time_slot_end))
    if (s.paused_until) {
      const d = new Date(String(s.paused_until))
      if (!Number.isNaN(d.getTime())) {
        const pad = (n: number) => String(n).padStart(2, '0')
        setPausedUntil(
          `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`,
        )
      } else setPausedUntil('')
    } else setPausedUntil('')
    setClearPause(false)
  }

  useEffect(() => {
    if (!subscriptionId) return
    let c = false
    Promise.all([adminGetSubscription(subscriptionId), adminListExecutors()])
      .then(([s, ex]) => {
        if (c) return
        setSub(s)
        applyFromSub(s)
        setExecutors(ex)
      })
      .catch((e) => {
        if (!c) setError(e instanceof Error ? e.message : 'Ошибка')
      })
      .finally(() => {
        if (!c) setLoading(false)
      })
    return () => {
      c = true
    }
  }, [subscriptionId])

  function toggleDay(d: number) {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort((a, b) => a - b)))
  }

  async function save() {
    if (!subscriptionId || !isAdmin) return
    if (days.length === 0) {
      setError('Выберите хотя бы один день недели.')
      return
    }
    setSaving(true)
    setMsg('')
    setError('')
    try {
      const body: {
        executor_id?: string | null
        status?: string
        auto_renew?: boolean
        preferred_days?: number[]
        time_slot_start?: string
        time_slot_end?: string
        paused_until?: string | null
      } = {
        executor_id: executorId || null,
        status,
        auto_renew: autoRenew,
        preferred_days: days,
        time_slot_start: timeStart.length === 5 ? `${timeStart}:00` : timeStart,
        time_slot_end: timeEnd.length === 5 ? `${timeEnd}:00` : timeEnd,
      }
      if (clearPause) body.paused_until = null
      else if (pausedUntil.trim()) body.paused_until = new Date(pausedUntil).toISOString()
      const updated = await adminPatchSubscription(subscriptionId, body)
      setSub(updated)
      applyFromSub(updated)
      setMsg('Сохранено')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-500 text-sm">Загрузка…</p>
      </div>
    )
  }
  if (error && !sub) {
    return <p className="text-red-600 text-sm">{error}</p>
  }
  if (!sub) {
    return null
  }

  const uid = String(sub.user_id)

  return (
    <div className="space-y-6 min-w-0 max-w-2xl">
      <div>
        <Link to="/admin/subscriptions" className={adminBackLink}>
          <ArrowLeft size={16} />
          К списку подписок
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-4 mb-1 font-sans">Подписка</h1>
        <p className="text-slate-500 text-sm font-mono break-all">{subscriptionId}</p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <Link to={`/admin/users/${uid}`} className="text-emerald-700 font-medium hover:text-emerald-800 transition-colors">
            Карточка клиента
          </Link>
          <Link to={`/admin/visits?subscription_id=${subscriptionId}`} className="text-emerald-700 font-medium hover:text-emerald-800 transition-colors">
            Визиты по подписке
          </Link>
        </div>
      </div>

      <div className={`${adminSurface} p-6`}>
        <h2 className={`${adminCardTitle} mb-4`}>Данные</h2>
        <div className="space-y-2 text-sm text-slate-700">
          <p>
            <span className="text-slate-500">Клиент:</span>{' '}
            <Link to={`/admin/users/${uid}`} className="text-emerald-700 font-medium hover:text-emerald-800 transition-colors">
              {(sub.user_email as string) || uid}
            </Link>
          </p>
          <p>
            <span className="text-slate-500">Тариф:</span> {(sub.tariff_code as string) || '—'}
          </p>
          <p>
            <span className="text-slate-500">Статус:</span> {String(sub.status)}
          </p>
          <p>
            <span className="text-slate-500">Цена / мес:</span> {sub.price_month_kzt != null ? `${sub.price_month_kzt} ₸` : '—'}
          </p>
          <p>
            <span className="text-slate-500">Исполнитель:</span> {(sub.executor_name as string) || '—'}
          </p>
          <p>
            <span className="text-slate-500">Адрес:</span> {String(sub.address_street)} {String(sub.address_flat)}
          </p>
          {sub.created_at ? (
            <p>
              <span className="text-slate-500">Создана:</span> {new Date(String(sub.created_at)).toLocaleString('ru-RU')}
            </p>
          ) : null}
        </div>
      </div>

      {isAdmin && (
        <div className={`${adminSurface} p-6`}>
          <h2 className={`${adminCardTitle} mb-5`}>Управление</h2>
          <div className="space-y-5">
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Исполнитель</label>
              <select
                className="w-full h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                value={executorId}
                onChange={(e) => setExecutorId(e.target.value)}
              >
                <option value="">— не назначен —</option>
                {executors.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name || e.email}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Статус подписки</label>
              <select
                className="w-full h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {['draft', 'active', 'paused', 'cancelled'].map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input type="checkbox" className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" checked={autoRenew} onChange={(e) => setAutoRenew(e.target.checked)} />
              Автопродление
            </label>
            <div>
              <span className="text-sm font-medium text-slate-700 block mb-2">Дни визитов (1–7)</span>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4, 5, 6, 7].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDay(d)}
                    className={`h-10 w-10 rounded-lg text-sm font-medium border transition-colors ${
                      days.includes(d) ? 'bg-[#064e3b] text-white border-[#064e3b]' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    {DAY_LABELS[d]}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Слот с</label>
                <Input type="time" value={timeStart} onChange={(e) => setTimeStart(e.target.value)} className="rounded-lg border-slate-200" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-1.5">Слот до</label>
                <Input type="time" value={timeEnd} onChange={(e) => setTimeEnd(e.target.value)} className="rounded-lg border-slate-200" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">Пауза до (локальное время)</label>
              <Input
                type="datetime-local"
                value={pausedUntil}
                onChange={(e) => setPausedUntil(e.target.value)}
                disabled={clearPause}
                className="rounded-lg border-slate-200"
              />
              <label className="flex items-center gap-2 text-sm mt-2 text-slate-600">
                <input type="checkbox" className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" checked={clearPause} onChange={(e) => setClearPause(e.target.checked)} />
                Снять паузу (очистить дату)
              </label>
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            {msg && <p className="text-emerald-700 text-sm font-medium">{msg}</p>}
            <Button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-lg bg-[#064e3b] hover:bg-[#064e3b]/90 text-white h-11 px-6 shadow-sm"
            >
              {saving ? 'Сохранение…' : 'Сохранить изменения'}
            </Button>
          </div>
        </div>
      )}

      {!isAdmin && <p className="text-sm text-slate-500">Изменение подписки доступно только администратору.</p>}
    </div>
  )
}
