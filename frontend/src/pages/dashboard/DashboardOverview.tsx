import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, User, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { listSubscriptions, listVisits, type SubscriptionItem, type VisitItem } from '@/api/client'

function formatTime(s: string): string {
  if (!s) return '—'
  const part = s.split(':').slice(0, 2).join(':')
  return part
}

function formatDate(s: string): string {
  if (!s) return '—'
  const d = new Date(s + 'Z')
  const months = 'янв фев мар апр май июн июл авг сен окт ноя дек'.split(' ')
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

function formatDateShort(s: string): string {
  if (!s) return '—'
  const d = new Date(s + 'Z')
  const months = 'янв фев мар апр май июн июл авг сен окт ноя дек'.split(' ')
  return `${d.getDate()} ${months[d.getMonth()]}`
}

export function DashboardOverview() {
  const { user } = useAuth()
  const [subscriptions, setSubscriptions] = useState<SubscriptionItem[]>([])
  const [visits, setVisits] = useState<VisitItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.all([listSubscriptions(), listVisits()])
      .then(([subs, list]) => {
        if (cancelled) return
        setSubscriptions(subs ?? [])
        setVisits(list ?? [])
      })
      .catch(() => {
        if (!cancelled) setSubscriptions([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const now = new Date()
  const upcoming = visits
    .filter((v) => v.status !== 'completed' && new Date(v.scheduled_date) >= now)
    .sort(
      (a, b) =>
        new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
    )
  const nextVisit = upcoming[0]
  const recentVisits = visits
    .filter((v) => v.status === 'completed')
    .sort(
      (a, b) =>
        new Date((b.completed_at || b.scheduled_date)).getTime() -
        new Date((a.completed_at || a.scheduled_date)).getTime()
    )
    .slice(0, 5)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-stone-500">Загрузка…</p>
      </div>
    )
  }

  const name = user?.name || user?.email || 'Пользователь'

  return (
    <div className="space-y-8 sm:space-y-10 min-w-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 sm:gap-6">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-medium text-forest-950 mb-2">
            С возвращением, {name}
          </h1>
          <p className="text-stone-500">
            {nextVisit
              ? 'Ближайший слот уже запланирован — вы можете заниматься своими делами.'
              : subscriptions.length > 0
                ? 'Здесь вы видите обзор подписок и визитов.'
                : 'Оформите подписку, чтобы запланировать визиты.'}
          </p>
        </div>
        <Link to="/booking">
          <Button className="bg-forest-900 hover:bg-forest-800 text-cream-50">
            {subscriptions.length > 0 ? 'Записать визит' : 'Оформить подписку'}
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
        {/* Ближайший слот */}
        <Card className="bg-forest-900 text-cream-50 border-none shadow-xl shadow-forest-900/20 relative overflow-hidden sm:col-span-2 md:col-span-1 min-w-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-forest-800 rounded-full blur-3xl -mr-10 -mt-10" />
          <CardHeader className="pb-4 p-5 sm:p-6 relative z-10">
            <CardDescription className="text-forest-200">
              Ближайший слот бытовой помощи
            </CardDescription>
            <CardTitle className="text-3xl font-serif">
              {nextVisit
                ? new Date(nextVisit.scheduled_date).toDateString() === new Date().toDateString()
                  ? 'Сегодня'
                  : new Date(nextVisit.scheduled_date).toDateString() ===
                      new Date(Date.now() + 86400000).toDateString()
                    ? 'Завтра'
                    : formatDateShort(nextVisit.scheduled_date)
                : 'Нет запланированных'}
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10 p-5 sm:p-6 pt-0">
            {nextVisit ? (
              <>
                <div className="flex items-center gap-2 text-forest-100 mb-6">
                  <Clock className="w-4 h-4" />
                  {formatTime(nextVisit.time_slot_start)} – {formatTime(nextVisit.time_slot_end)}
                </div>
                {nextVisit.executor?.name && (
                  <div className="flex items-center gap-4 bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10">
                    <div className="w-10 h-10 rounded-full bg-cream-50 flex items-center justify-center">
                      <User className="w-5 h-5 text-forest-900" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{nextVisit.executor.name}</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p className="text-forest-200 text-sm">
                {subscriptions.length > 0
                  ? 'Запланируйте визит в разделе «Мои слоты» или по кнопке выше.'
                  : 'Оформите подписку, чтобы записываться на визиты.'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Подписки */}
        <Card className="border-cream-200 shadow-sm min-w-0">
          <CardHeader className="pb-4 p-5 sm:p-6">
            <CardDescription>Подписки</CardDescription>
            <CardTitle className="text-xl sm:text-2xl font-serif">
              {subscriptions.length > 0 ? `Активны (${subscriptions.length})` : 'Нет подписок'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 sm:p-6 pt-0">
            {subscriptions.length > 0 ? (
              <>
                <p className="text-sm text-stone-500 mb-4">
                  У вас {subscriptions.length} {subscriptions.length === 1 ? 'подписка' : subscriptions.length < 5 ? 'подписки' : 'подписок'} — по одной на квартиру.
                </p>
                <Link to="/dashboard/subscription" className="inline-block mt-2">
                  <Button variant="outline" size="sm" className="border-stone-200">
                    Подробнее
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <p className="text-stone-500 text-sm mb-4">
                  Оформите подписку, чтобы пользоваться бытовой помощью по расписанию.
                </p>
                <Link to="/booking">
                  <Button className="w-full bg-forest-900 hover:bg-forest-800 text-cream-50">
                    Оформить подписку
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>

        {/* Сбережения / заглушка */}
        <Card className="border-cream-200 shadow-sm bg-cream-50/50 min-w-0">
          <CardHeader className="pb-4 p-5 sm:p-6">
            <CardDescription>Визиты в этом месяце</CardDescription>
            <CardTitle className="text-xl sm:text-2xl font-serif">
              {visits.filter((v) => {
                const d = new Date(v.scheduled_date)
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
              }).length}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 sm:p-6 pt-0">
            <p className="text-sm text-stone-500 mb-6">
              Запланированные и выполненные визиты в текущем месяце.
            </p>
            <Link to="/dashboard/visits">
              <Button variant="outline" className="w-full text-xs h-10 border-stone-200">
                Все слоты
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="min-w-0">
        <h2 className="text-xl sm:text-2xl font-serif text-forest-950 mb-4 sm:mb-6">Недавняя активность</h2>
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-cream-200 overflow-hidden">
          {recentVisits.length === 0 ? (
            <div className="p-6 sm:p-8 text-center text-stone-500 text-sm sm:text-base">
              Пока нет выполненных визитов.
            </div>
          ) : (
            recentVisits.map((visit) => (
              <Link
                key={visit.id}
                to={`/dashboard/visits/${visit.id}`}
                className="block p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-cream-50 transition-colors border-b border-cream-100 last:border-0"
              >
                <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-forest-50 flex items-center justify-center text-forest-600 shrink-0">
                    <Check className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-forest-900 text-base sm:text-lg">Визит</p>
                    <p className="text-xs sm:text-sm text-stone-500">
                      {formatDate(visit.scheduled_date)} • {formatTime(visit.time_slot_start)} –{' '}
                      {formatTime(visit.time_slot_end)}
                      {visit.executor?.name ? ` • ${visit.executor.name}` : ''}
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-forest-100 text-forest-800">
                    Выполнено
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
