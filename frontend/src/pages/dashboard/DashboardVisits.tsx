import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Clock, User, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { listSubscriptions, listVisits, type VisitItem, type SubscriptionItem } from '@/api/client'

function formatTime(s: string): string {
  if (!s) return '—'
  return s.split(':').slice(0, 2).join(':')
}

function formatDate(s: string): string {
  if (!s) return '—'
  const d = new Date(s + 'Z')
  const months = 'янв фев мар апр май июн июл авг сен окт ноя дек'.split(' ')
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

function statusLabel(s: string): string {
  const map: Record<string, string> = {
    scheduled: 'Предстоит',
    completed: 'Выполнено',
    cancelled: 'Отменён',
    no_show: 'Не явка',
  }
  return map[s] || s
}

function subscriptionLabel(sub: SubscriptionItem | undefined): string {
  if (!sub) return '—'
  const parts = [sub.address_street, sub.address_building, sub.address_flat].filter(Boolean)
  return parts.length ? parts.join(', ') : 'Подписка'
}

export function DashboardVisits() {
  const [visits, setVisits] = useState<VisitItem[]>([])
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.all([listVisits(), listSubscriptions()])
      .then(([list, subs]) => {
        if (cancelled) return
        setVisits(list ?? [])
        setSubscriptions(subs ?? [])
      })
      .catch(() => {
        if (!cancelled) setSubscriptions([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-stone-500">Загрузка…</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8 min-w-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-6">
        <h1 className="text-2xl sm:text-3xl font-serif font-medium text-forest-950">Мои слоты</h1>
        <Link to="/booking">
          <Button className="bg-forest-900 hover:bg-forest-800 text-cream-50 w-full sm:w-auto">
            {subscriptions.length > 0 ? 'Записать визит' : 'Оформить подписку'}
          </Button>
        </Link>
      </div>

      <div className="grid gap-6">
        {visits.length === 0 ? (
          <Card className="border-cream-200 shadow-sm">
            <CardContent className="p-12 text-center">
              <Calendar className="w-12 h-12 text-stone-300 mx-auto mb-4" />
              <p className="text-stone-600 font-medium">Нет запланированных визитов</p>
              <p className="text-sm text-stone-500 mt-2 mb-6">
                {subscriptions.length > 0
                  ? 'Запишитесь на визит — выберите дату и время в разделе бронирования.'
                  : 'Оформите подписку, чтобы записываться на визиты.'}
              </p>
              <Link to="/booking">
                <Button className="bg-forest-900 hover:bg-forest-800 text-cream-50">
                  {subscriptions.length > 0 ? 'Записать визит' : 'Оформить подписку'}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          visits.map((visit) => {
            const isUpcoming = visit.status !== 'completed' && visit.status !== 'cancelled'
            const isCompleted = visit.status === 'completed'
            const subscription = subscriptions.find((s) => s.id === visit.subscription_id)
            return (
              <Card
                key={visit.id}
                className="border border-cream-200 shadow-sm hover:shadow-md transition-all duration-300"
              >
                <CardContent className="p-6 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <Link
                    to={`/dashboard/visits/${visit.id}`}
                    className="flex items-center gap-6 min-w-0 flex-1"
                  >
                    <div
                      className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center shrink-0 ${
                        isUpcoming ? 'bg-forest-100 text-forest-700' : 'bg-stone-100 text-stone-500'
                      }`}
                    >
                      <Calendar className="w-7 h-7 md:w-8 md:h-8" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg md:text-xl font-medium text-forest-950">
                        Визит • {formatDate(visit.scheduled_date)}
                      </h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-stone-500 mt-2">
                        {subscription && (
                          <span className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 shrink-0" /> {subscriptionLabel(subscription)}
                          </span>
                        )}
                        <span className="flex items-center gap-2">
                          <Clock className="w-4 h-4" /> {formatTime(visit.time_slot_start)} –{' '}
                          {formatTime(visit.time_slot_end)}
                        </span>
                        {visit.executor?.name && (
                          <span className="flex items-center gap-2">
                            <User className="w-4 h-4" /> {visit.executor.name}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center gap-4 shrink-0">
                    {isCompleted && (
                      <Link to={`/dashboard/visits/${visit.id}`}>
                        <Button variant="outline" size="sm" className="border-stone-200">
                          Подробнее
                        </Button>
                      </Link>
                    )}
                    <span
                      className={`inline-flex px-4 py-2 rounded-full text-sm font-medium ${
                        isUpcoming
                          ? 'bg-forest-100 text-forest-800'
                          : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {statusLabel(visit.status)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
