import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Clock, MapPin, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import { listExecutorVisits, type ExecutorVisitItem } from '@/api/client'

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

function formatDateShort(s: string): string {
  if (!s) return '—'
  const d = new Date(s + 'Z')
  const months = 'янв фев мар апр май июн июл авг сен окт ноя дек'.split(' ')
  return `${d.getDate()} ${months[d.getMonth()]}`
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function weekEndISO(): string {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d.toISOString().slice(0, 10)
}

function monthStartISO(): string {
  const d = new Date()
  d.setDate(1)
  return d.toISOString().slice(0, 10)
}

function monthEndISO(): string {
  const d = new Date()
  d.setMonth(d.getMonth() + 1)
  d.setDate(0)
  return d.toISOString().slice(0, 10)
}

function thirtyDaysAgoISO(): string {
  const d = new Date()
  d.setDate(d.getDate() - 30)
  return d.toISOString().slice(0, 10)
}

export function ExecutorOverview() {
  const { user } = useAuth()
  const [visits, setVisits] = useState<ExecutorVisitItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const from = thirtyDaysAgoISO()
    const monthEnd = monthEndISO()
    const weekEnd = weekEndISO()
    const to = monthEnd >= weekEnd ? monthEnd : weekEnd
    listExecutorVisits({ date_from: from, date_to: to })
      .then((list) => {
        if (!cancelled) setVisits(list ?? [])
      })
      .catch(() => {
        if (!cancelled) setVisits([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  const today = todayISO()
  const weekEnd = weekEndISO()
  const monthStart = monthStartISO()
  const monthEnd = monthEndISO()

  const upcoming = visits
    .filter((v) => v.status !== 'completed' && v.status !== 'cancelled' && v.status !== 'no_show')
    .sort(
      (a, b) =>
        new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime()
    )
  const nextVisit = upcoming[0]

  const visitsThisWeek = visits.filter((v) => {
    const d = v.scheduled_date
    return d >= today && d <= weekEnd
  })
  const visitsThisMonth = visits.filter((v) => {
    const d = v.scheduled_date
    return d >= monthStart && d <= monthEnd
  })

  const recentCompleted = visits
    .filter((v) => v.status === 'completed' || v.status === 'cancelled' || v.status === 'no_show')
    .sort((a, b) => new Date(b.scheduled_date).getTime() - new Date(a.scheduled_date).getTime())
    .slice(0, 5)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-stone-500">Загрузка…</p>
      </div>
    )
  }

  const name = user?.name || user?.email || 'Исполнитель'

  return (
    <div className="space-y-8 sm:space-y-10 min-w-0">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 sm:gap-6">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-medium text-forest-950 mb-2">
            С возвращением, {name}
          </h1>
          <p className="text-stone-500">
            {nextVisit
              ? 'Ближайший визит уже запланирован — проверьте детали.'
              : 'Здесь вы видите обзор ваших визитов.'}
          </p>
        </div>
        <Link to="/executor/visits">
          <Button className="bg-forest-900 hover:bg-forest-800 text-cream-50">
            Все визиты
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
        {/* Ближайший визит */}
        <Card className="bg-forest-900 text-cream-50 border-none shadow-xl shadow-forest-900/20 relative overflow-hidden sm:col-span-2 md:col-span-1 min-w-0">
          <div className="absolute top-0 right-0 w-32 h-32 bg-forest-800 rounded-full blur-3xl -mr-10 -mt-10" />
          <CardHeader className="pb-4 p-5 sm:p-6 relative z-10">
            <CardDescription className="text-forest-200">
              Ближайший визит
            </CardDescription>
            <CardTitle className="text-3xl font-serif">
              {nextVisit
                ? new Date(nextVisit.scheduled_date + 'Z').toDateString() === new Date().toDateString()
                  ? 'Сегодня'
                  : new Date(nextVisit.scheduled_date + 'Z').toDateString() ===
                      new Date(Date.now() + 86400000).toDateString()
                    ? 'Завтра'
                    : formatDateShort(nextVisit.scheduled_date)
                : 'Нет запланированных'}
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10 p-5 sm:p-6 pt-0 space-y-4">
            {nextVisit ? (
              <>
                <div className="flex items-center gap-2 text-forest-100">
                  <Clock className="w-4 h-4" />
                  {formatTime(nextVisit.time_slot_start)} – {formatTime(nextVisit.time_slot_end)}
                </div>
                {(nextVisit.client_name || nextVisit.cleaning_type_label) && (
                  <p className="text-sm text-forest-200">
                    {nextVisit.client_name && <span className="font-medium text-forest-100">{nextVisit.client_name}</span>}
                    {nextVisit.client_name && nextVisit.cleaning_type_label && ' · '}
                    {nextVisit.cleaning_type_label}
                  </p>
                )}
                {nextVisit.address && (
                  <div className="flex items-start gap-2 text-forest-100 text-sm">
                    <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{nextVisit.address}</span>
                  </div>
                )}
                <Link to={`/executor/visits/${nextVisit.id}`} className="block">
                  <Button variant="secondary" className="bg-white/20 hover:bg-white/30 text-cream-50 border-0">
                    Открыть
                  </Button>
                </Link>
              </>
            ) : (
              <p className="text-forest-200 text-sm">
                Новые визиты появятся здесь, когда вам будет назначено задание.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Визиты на неделю */}
        <Card className="border-cream-200 shadow-sm min-w-0">
          <CardHeader className="pb-4 p-5 sm:p-6">
            <CardDescription>Визиты на неделю</CardDescription>
            <CardTitle className="text-xl sm:text-2xl font-serif">
              {visitsThisWeek.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 sm:p-6 pt-0">
            <p className="text-sm text-stone-500 mb-4">
              Запланированные визиты на текущую неделю.
            </p>
            <Link to="/executor/visits">
              <Button variant="outline" size="sm" className="border-stone-200">
                Подробнее
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Визиты в этом месяце */}
        <Card className="border-cream-200 shadow-sm bg-cream-50/50 min-w-0">
          <CardHeader className="pb-4 p-5 sm:p-6">
            <CardDescription>Визиты в этом месяце</CardDescription>
            <CardTitle className="text-xl sm:text-2xl font-serif">
              {visitsThisMonth.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 sm:p-6 pt-0">
            <p className="text-sm text-stone-500 mb-6">
              Запланированные и выполненные визиты в текущем месяце.
            </p>
            <Link to="/executor/visits">
              <Button variant="outline" className="w-full text-xs h-10 border-stone-200">
                Все визиты
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <div className="min-w-0">
        <h2 className="text-xl sm:text-2xl font-serif text-forest-950 mb-4 sm:mb-6">Недавняя активность</h2>
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-cream-200 overflow-hidden">
          {recentCompleted.length === 0 ? (
            <div className="p-6 sm:p-8 text-center text-stone-500 text-sm sm:text-base">
              Пока нет выполненных визитов.
            </div>
          ) : (
            recentCompleted.map((visit) => (
              <Link
                key={visit.id}
                to={`/executor/visits/${visit.id}`}
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
                      {visit.cleaning_type_label ? ` • ${visit.cleaning_type_label}` : ''}
                      {visit.address ? ` • ${visit.address}` : ''}
                    </p>
                  </div>
                </div>
                <div className="text-left sm:text-right shrink-0">
                  <span
                    className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      visit.status === 'completed'
                        ? 'bg-forest-100 text-forest-800'
                        : 'bg-stone-100 text-stone-600'
                    }`}
                  >
                    {visit.status === 'completed' ? 'Выполнено' : visit.status === 'no_show' ? 'Неявка' : 'Отменён'}
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
