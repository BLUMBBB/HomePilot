import { useEffect, useState, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  listSubscriptions,
  listVisits,
  rescheduleVisit,
  completeStripeCheckout,
  type SubscriptionItem,
  type VisitItem,
} from '@/api/client'

/** Рабочие часы 8:00–18:00. Варианты начала: 8:00–17:00, окончания: 9:00–18:00 */
const START_OPTIONS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00']
const END_OPTIONS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00']

function formatTime(s: string): string {
  if (!s) return '10:00'
  const part = s.split(':').slice(0, 2).join(':')
  return part
}

function formatDateForInput(d: string): string {
  if (!d) return ''
  return d.split('T')[0]
}

function addressLine(sub: SubscriptionItem): string {
  const parts = [sub.address_street, sub.address_building, sub.address_flat].filter(Boolean)
  return parts.length ? parts.join(', ') : sub.id
}

/** Макс. длительность слота в минутах по тарифу и типу квартиры */
function getMaxSlotMinutes(sub: SubscriptionItem | null): number {
  if (!sub?.tariff_cleaning_type || sub.apartment_type_duration_light_min == null || sub.apartment_type_duration_full_min == null)
    return 240 // fallback 4h
  const isLight = String(sub.tariff_cleaning_type).toLowerCase() === 'light'
  return isLight ? sub.apartment_type_duration_light_min : sub.apartment_type_duration_full_min
}

/** Время в минутах от полуночи */
function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

/** Валидные варианты окончания слота для выбранного начала */
function getValidEndOptions(start: string, maxSlotMinutes: number): string[] {
  const startMin = timeToMinutes(start)
  return END_OPTIONS.filter((t) => {
    const endMin = timeToMinutes(t)
    if (endMin <= startMin) return false
    if (endMin - startMin > maxSlotMinutes) return false
    return true
  })
}

export function DashboardSlots() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [visits, setVisits] = useState<VisitItem[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const stripeReturnHandled = useRef(false)

  const load = () => {
    setLoading(true)
    setError(null)
    Promise.all([listSubscriptions(), listVisits()])
      .then(([subs, list]) => {
        setSubscriptions(subs ?? [])
        setVisits(list ?? [])
        if (subs.length > 0 && !selectedId) setSelectedId(subs[0].id)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Ошибка загрузки'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search)
    const sid = sp.get('session_id')
    if (sp.get('payment') === 'success' && sid && !stripeReturnHandled.current) {
      stripeReturnHandled.current = true
      setLoading(true)
      setError(null)
      completeStripeCheckout(sid)
        .then(() => {
          window.history.replaceState({}, '', window.location.pathname)
          return Promise.all([listSubscriptions(), listVisits()])
        })
        .then(([subs, list]) => {
          setSubscriptions(subs ?? [])
          setVisits(list ?? [])
          if (subs.length > 0) setSelectedId((prev) => prev ?? subs[0].id)
        })
        .catch((e) => {
          stripeReturnHandled.current = false
          setError(e instanceof Error ? e.message : 'Не удалось подтвердить оплату')
        })
        .finally(() => setLoading(false))
      return
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- первый заход: либо Stripe return, либо обычная загрузка
  }, [])

  const effectiveSelectedId = selectedId ?? subscriptions[0]?.id ?? null
  const subscription = effectiveSelectedId ? subscriptions.find((s) => s.id === effectiveSelectedId) : null
  const subscriptionVisits = effectiveSelectedId
    ? visits.filter((v) => v.subscription_id === effectiveSelectedId)
    : []
  const editableVisits = subscriptionVisits.filter(
    (v) => v.status !== 'completed' && v.status !== 'cancelled'
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-stone-500">Загрузка…</p>
      </div>
    )
  }

  if (subscriptions.length === 0) {
    return (
      <div className="space-y-8">
        <h1 className="text-3xl font-serif font-medium text-forest-950">Редактирование слотов</h1>
        <Card className="border-cream-200 shadow-sm max-w-xl">
          <CardHeader>
            <CardTitle>Нет подписок</CardTitle>
            <CardDescription>
              Оформите подписку, чтобы настраивать дату и время визитов.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/booking">
              <Button className="bg-forest-900 hover:bg-forest-800 text-cream-50">
                Оформить подписку
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-medium text-forest-950 mb-2">
          Редактирование слотов
        </h1>
        <p className="text-stone-500 mb-4">
          Выберите подписку (квартиру) и укажите дату и время для каждого визита.
        </p>
        {subscriptions.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {subscriptions.map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => setSelectedId(sub.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  effectiveSelectedId === sub.id
                    ? 'bg-forest-900 text-cream-50'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                {addressLine(sub)}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm">
          {error}
        </div>
      )}

      {editableVisits.length === 0 ? (
        <Card className="border-cream-200 shadow-sm">
          <CardContent className="p-12 text-center">
            <Calendar className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-600 font-medium">Нет слотов для настройки</p>
            <p className="text-sm text-stone-500 mt-2">
              Все визиты уже выполнены или отменены. Новые слоты появятся при продлении подписки.
            </p>
            <Link to="/dashboard/visits" className="inline-block mt-6">
              <Button variant="outline" className="border-stone-200">
                К списку визитов
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {editableVisits.map((visit, index) => (
            <SlotEditor
              key={visit.id}
              visit={visit}
              subscription={subscription ?? null}
              index={index + 1}
              onSave={() => load()}
              saving={savingId === visit.id}
              setSaving={(s) => setSavingId(s ? visit.id : null)}
              setError={setError}
            />
          ))}
        </div>
      )}

      <Link to="/dashboard/visits" className="inline-block mt-6">
        <Button variant="outline" className="border-stone-200">
          К списку визитов
        </Button>
      </Link>
    </div>
  )
}

type SlotEditorProps = {
  visit: VisitItem
  subscription: SubscriptionItem | null
  index: number
  onSave: () => void
  saving: boolean
  setSaving: (v: boolean) => void
  setError: (s: string | null) => void
}

function SlotEditor({ visit, subscription, index, onSave, saving, setSaving, setError }: SlotEditorProps) {
  const [date, setDate] = useState(formatDateForInput(visit.scheduled_date))
  const [start, setStart] = useState(formatTime(visit.time_slot_start))
  const [end, setEnd] = useState(formatTime(visit.time_slot_end))
  const maxSlotMinutes = getMaxSlotMinutes(subscription)
  const validEndOptions = useMemo(() => getValidEndOptions(start, maxSlotMinutes), [start, maxSlotMinutes])

  useEffect(() => {
    setDate(formatDateForInput(visit.scheduled_date))
    setStart(formatTime(visit.time_slot_start))
    setEnd(formatTime(visit.time_slot_end))
  }, [visit.scheduled_date, visit.time_slot_start, visit.time_slot_end])

  useEffect(() => {
    if (validEndOptions.length > 0 && !validEndOptions.includes(end)) {
      setEnd(validEndOptions[validEndOptions.length - 1])
    }
  }, [validEndOptions, end])

  const endOptions = validEndOptions.length > 0 ? validEndOptions : END_OPTIONS

  const handleSave = async () => {
    if (!date || !start || !end) {
      setError('Укажите дату и время')
      return
    }
    setError(null)
    setSaving(true)
    try {
      await rescheduleVisit(visit.id, {
        new_scheduled_date: date,
        new_time_slot_start: start,
        new_time_slot_end: end,
      })
      onSave()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const dateMin = subscription?.started_at ? formatDateForInput(subscription.started_at) : undefined
  const dateMax = subscription?.ends_at ? formatDateForInput(subscription.ends_at) : undefined

  return (
    <Card className="border border-cream-200 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-serif">Слот {index}</CardTitle>
        <CardDescription>
          Дата и время визита. Рабочие часы: 8:00–18:00. Макс. длительность: {maxSlotMinutes / 60} ч.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-stone-700 block mb-2">Дата</label>
            <input
              type="date"
              value={date}
              min={dateMin}
              max={dateMax}
              onChange={(e) => setDate(e.target.value)}
              className="flex h-11 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-900"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-stone-700 block mb-2">Начало</label>
            <select
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="flex h-11 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-900"
            >
              {START_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-stone-700 block mb-2">Конец</label>
            <select
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="flex h-11 w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-forest-900"
            >
              {endOptions.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-forest-900 hover:bg-forest-800 text-cream-50"
        >
          {saving ? (
            'Сохранение…'
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Сохранить
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
