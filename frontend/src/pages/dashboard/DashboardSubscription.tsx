import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { listSubscriptions, getSubscription, type SubscriptionItem } from '@/api/client'

function formatTime(s: string): string {
  if (!s) return '—'
  return s.split(':').slice(0, 2).join(':')
}

function formatDate(s: string | null | undefined): string {
  if (s == null || s === '') return '—'
  const str = typeof s === 'string' ? s : String(s)
  const hasTz = str.endsWith('Z') || str.includes('+')
  const d = hasTz ? new Date(str) : new Date(str + 'Z')
  if (Number.isNaN(d.getTime())) return '—'
  const months = 'янв фев мар апр май июн июл авг сен окт ноя дек'.split(' ')
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

const DAY_NAMES: Record<number, string> = {
  1: 'Пн',
  2: 'Вт',
  3: 'Ср',
  4: 'Чт',
  5: 'Пт',
  6: 'Сб',
  7: 'Вс',
}

function addressLine(sub: SubscriptionItem): string {
  const parts = [sub.address_street, sub.address_building, sub.address_flat].filter(Boolean)
  return parts.length ? parts.join(', ') : '—'
}

function statusLabel(s: string): string {
  const map: Record<string, string> = {
    draft: 'Черновик (ожидает оплаты)',
    active: 'Активна',
    paused: 'На паузе',
    cancelled: 'Отменена',
  }
  return map[s] || s
}

export function DashboardSubscription() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<SubscriptionItem | null>(null)
  const [loading, setLoading] = useState(true)

  const loadList = () => {
    listSubscriptions()
      .then((list) => {
        setSubscriptions(list)
        if (list.length > 0 && !selectedId) setSelectedId(list[0].id)
      })
      .catch(() => setSubscriptions([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadList()
  }, [])

  useEffect(() => {
    if (!selectedId) {
      setDetail(null)
      return
    }
    setDetail(null)
    getSubscription(selectedId)
      .then(setDetail)
      .catch(() => setDetail(null))
  }, [selectedId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-stone-500">Загрузка…</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8 min-w-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-serif font-medium text-forest-950">Подписки</h1>
        <Link to="/booking">
          <Button className="bg-forest-900 hover:bg-forest-800 text-cream-50 w-full sm:w-auto">
            <Plus className="w-4 h-4 mr-2" />
            Добавить подписку
          </Button>
        </Link>
      </div>

      {subscriptions.length === 0 ? (
        <Card className="border-cream-200 shadow-sm max-w-xl min-w-0">
          <CardHeader className="p-5 sm:p-6">
            <CardTitle>Нет подписок</CardTitle>
            <CardDescription>
              Оформите подписку на квартиру, чтобы пользоваться бытовой помощью по расписанию. У вас может быть несколько подписок — по одной на каждую квартиру.
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
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {subscriptions.map((sub) => (
              <button
                key={sub.id}
                type="button"
                onClick={() => setSelectedId(sub.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  selectedId === sub.id
                    ? 'bg-forest-900 text-cream-50'
                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
              >
                {addressLine(sub)}
              </button>
            ))}
          </div>

          {detail && (
            <Card className="border-cream-200 shadow-sm max-w-2xl min-w-0">
              <CardHeader className="p-5 sm:p-6">
                <CardDescription>Подписка</CardDescription>
                <CardTitle className="text-2xl font-serif">
                  {detail.price_month_kzt != null
                    ? `${detail.price_month_kzt.toLocaleString('ru-KZ')} ₸ / мес`
                    : 'Активна'}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5 sm:space-y-6 p-5 sm:p-6 pt-0">
                <div>
                  <p className="text-sm font-medium text-stone-500 mb-1">Адрес</p>
                  <p className="text-forest-900">{addressLine(detail)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-stone-500 mb-1">Удобное время</p>
                  <p className="text-forest-900">
                    {formatTime(detail.time_slot_start)} – {formatTime(detail.time_slot_end)}
                  </p>
                </div>
                {(detail.preferred_days?.length ?? 0) > 0 && (
                  <div>
                    <p className="text-sm font-medium text-stone-500 mb-1">Предпочитаемые дни</p>
                    <p className="text-forest-900">
                      {(detail.preferred_days as number[]).map((d) => DAY_NAMES[d] ?? d).join(', ')}
                    </p>
                  </div>
                )}
                {detail.started_at && (
                  <div>
                    <p className="text-sm font-medium text-stone-500 mb-1">Начало</p>
                    <p className="text-forest-900">{formatDate(detail.started_at)}</p>
                  </div>
                )}
                {detail.ends_at && (
                  <div>
                    <p className="text-sm font-medium text-stone-500 mb-1">Действует до</p>
                    <p className="text-forest-900">{formatDate(detail.ends_at)}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-stone-500 mb-1">Статус</p>
                  <p className="text-forest-900">{statusLabel(detail.status)}</p>
                </div>
                {detail.status === 'active' && (
                  <Link to="/dashboard/slots" className="inline-block mt-6">
                    <Button variant="outline" className="border-stone-200">
                      Настроить слоты визитов
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
