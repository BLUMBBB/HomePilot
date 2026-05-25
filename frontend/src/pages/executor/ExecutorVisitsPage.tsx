import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Calendar,
  MapPin,
  Phone,
  RefreshCw,
  Shirt,
  Flower2,
  Sparkles,
  LayoutGrid,
  Table2,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { listExecutorVisits, type ExecutorVisitItem } from '@/api/client'

function toISODateLocal(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatTime(s: string): string {
  if (!s) return '—'
  return s.split(':').slice(0, 2).join(':')
}

function formatDate(s: string): string {
  if (!s) return '—'
  const d = new Date(s + 'T12:00:00')
  const months = 'янв фев мар апр май июн июл авг сен окт ноя дек'.split(' ')
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

function weekdayShort(iso: string): string {
  const d = new Date(iso + 'T12:00:00')
  const w = 'вс пн вт ср чт пт сб'.split(' ')
  return w[d.getDay()] ?? ''
}

function statusLabel(s: string): string {
  const map: Record<string, string> = {
    scheduled: 'Запланирован',
    in_progress: 'В процессе',
    completed: 'Выполнен',
    cancelled: 'Отменён',
    no_show: 'Неявка',
    rescheduled: 'Перенесён',
  }
  return map[s] || s
}

function formatDuration(mins: number | null | undefined): string {
  if (mins == null || mins <= 0) return '—'
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h <= 0) return `${m} мин`
  if (m === 0) return `${h} ч`
  return `${h} ч ${m} мин`
}

function mondayThisWeek(): string {
  const d = new Date()
  const dow = d.getDay()
  const offset = dow === 0 ? -6 : 1 - dow
  const m = new Date(d)
  m.setDate(d.getDate() + offset)
  return toISODateLocal(m)
}

function sundayThisWeek(): string {
  const mon = new Date(mondayThisWeek() + 'T12:00:00')
  mon.setDate(mon.getDate() + 6)
  return toISODateLocal(mon)
}

function monthStartISO(): string {
  const d = new Date()
  return toISODateLocal(new Date(d.getFullYear(), d.getMonth(), 1))
}

function monthEndISO(): string {
  const d = new Date()
  return toISODateLocal(new Date(d.getFullYear(), d.getMonth() + 1, 0))
}

type Period = 'today' | 'week' | 'month'
type StatusTab = 'all' | 'active' | 'done'

function ExecutorVisitRow({ visit, dim }: { visit: ExecutorVisitItem; dim?: boolean }) {
  const maps = visit.maps_url
  const tel = visit.client_phone?.replace(/\D/g, '')
  return (
    <Link to={`/executor/visits/${visit.id}`}>
      <Card
        className={`border-cream-200 shadow-sm hover:shadow-md transition-all hover:border-forest-200 ${dim ? 'opacity-85' : ''}`}
      >
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-semibold text-forest-950">
                  {formatTime(visit.time_slot_start)} – {formatTime(visit.time_slot_end)}
                </span>
                <span className="text-stone-400">·</span>
                <span className="text-stone-600">{formatDuration(visit.duration_minutes ?? null)}</span>
                {visit.cleaning_type_label && (
                  <>
                    <span className="text-stone-400">·</span>
                    <span className="rounded-full bg-forest-50 text-forest-800 px-2 py-0.5 text-xs font-medium">
                      {visit.cleaning_type_label}
                    </span>
                  </>
                )}
                {visit.apartment_type_name && (
                  <span className="rounded-full bg-stone-100 text-stone-700 px-2 py-0.5 text-xs">{visit.apartment_type_name}</span>
                )}
              </div>
              {(visit.client_name || visit.client_phone) && (
                <p className="text-sm text-forest-900">
                  {visit.client_name && <span className="font-medium">{visit.client_name}</span>}
                  {visit.client_name && visit.client_phone && ' · '}
                  {visit.client_phone && <span className="text-stone-600">{visit.client_phone}</span>}
                </p>
              )}
              {visit.city_name && (
                <p className="text-xs uppercase tracking-wide text-stone-500">{visit.city_name}</p>
              )}
              {visit.address && (
                <p className="text-sm text-stone-600 flex items-start gap-2">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{visit.address}</span>
                </p>
              )}
              <div className="flex flex-wrap gap-2 pt-1">
                {visit.premium_linen && (
                  <span className="inline-flex items-center gap-1 text-xs text-stone-600 bg-cream-100 px-2 py-1 rounded-lg">
                    <Shirt className="w-3.5 h-3.5" /> бельё
                  </span>
                )}
                {visit.premium_plants && (
                  <span className="inline-flex items-center gap-1 text-xs text-stone-600 bg-cream-100 px-2 py-1 rounded-lg">
                    <Flower2 className="w-3.5 h-3.5" /> растения
                  </span>
                )}
                {visit.premium_ironing && (
                  <span className="inline-flex items-center gap-1 text-xs text-stone-600 bg-cream-100 px-2 py-1 rounded-lg">
                    <Sparkles className="w-3.5 h-3.5" /> глажка
                  </span>
                )}
                {(visit.address_entrance || visit.address_floor || visit.address_doorcode) && (
                  <span className="text-xs text-stone-500">
                    {visit.address_entrance && `подъезд ${visit.address_entrance}`}
                    {visit.address_entrance && visit.address_floor && ' · '}
                    {visit.address_floor && `эт. ${visit.address_floor}`}
                    {(visit.address_entrance || visit.address_floor) && visit.address_doorcode && ' · '}
                    {visit.address_doorcode && `домофон ${visit.address_doorcode}`}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 items-stretch sm:items-end">
              <span
                className={`inline-flex justify-center px-3 py-1 rounded-full text-xs font-medium ${
                  visit.status === 'in_progress' ? 'bg-amber-100 text-amber-800' : 'bg-forest-100 text-forest-800'
                }`}
              >
                {statusLabel(visit.status)}
              </span>
              <div className="flex flex-wrap gap-2">
                {tel && (
                  <a
                    href={`tel:${tel}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center justify-center gap-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-forest-900 hover:bg-cream-50"
                  >
                    <Phone className="w-4 h-4" />
                    Звонок
                  </a>
                )}
                {maps && (
                  <a
                    href={maps}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center justify-center gap-1 rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-forest-900 hover:bg-cream-50"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Карта
                  </a>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export function ExecutorVisitsPage() {
  const [visits, setVisits] = useState<ExecutorVisitItem[]>([])
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<Period>('week')
  const [statusTab, setStatusTab] = useState<StatusTab>('all')
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')

  const range = useMemo(() => {
    const today = toISODateLocal(new Date())
    if (period === 'today') return { from: today, to: today }
    if (period === 'week') return { from: mondayThisWeek(), to: sundayThisWeek() }
    return { from: monthStartISO(), to: monthEndISO() }
  }, [period])

  const statusQuery = useMemo(() => {
    if (statusTab === 'active') return 'scheduled,in_progress,rescheduled'
    if (statusTab === 'done') return 'completed,cancelled,no_show'
    return undefined
  }, [statusTab])

  const load = useCallback(() => {
    setLoading(true)
    listExecutorVisits({
      date_from: range.from,
      date_to: range.to,
      status: statusQuery,
    })
      .then((list) => setVisits(list ?? []))
      .catch(() => setVisits([]))
      .finally(() => setLoading(false))
  }, [range.from, range.to, statusQuery])

  useEffect(() => {
    load()
  }, [load])

  const weekStripDays = useMemo(() => {
    const start = new Date(mondayThisWeek() + 'T12:00:00')
    const days: string[] = []
    for (let i = 0; i < 7; i++) {
      const x = new Date(start)
      x.setDate(start.getDate() + i)
      days.push(toISODateLocal(x))
    }
    return days
  }, [period])

  const countsByDay = useMemo(() => {
    const m: Record<string, number> = {}
    for (const v of visits) {
      m[v.scheduled_date] = (m[v.scheduled_date] || 0) + 1
    }
    return m
  }, [visits])

  const filtered = useMemo(() => {
    let list = visits
    if (selectedDay) list = list.filter((v) => v.scheduled_date === selectedDay)
    return list
  }, [visits, selectedDay])

  const upcoming = filtered.filter((v) => v.status !== 'completed' && v.status !== 'cancelled' && v.status !== 'no_show')
  const past = filtered.filter((v) => v.status === 'completed' || v.status === 'cancelled' || v.status === 'no_show')

  const groupedUpcoming = useMemo(() => {
    const m = new Map<string, ExecutorVisitItem[]>()
    for (const v of upcoming) {
      if (!m.has(v.scheduled_date)) m.set(v.scheduled_date, [])
      m.get(v.scheduled_date)!.push(v)
    }
    for (const arr of m.values()) {
      arr.sort((a, b) => a.time_slot_start.localeCompare(b.time_slot_start))
    }
    return [...m.entries()].sort(([a], [b]) => a.localeCompare(b))
  }, [upcoming])

  const groupedPast = useMemo(() => {
    const m = new Map<string, ExecutorVisitItem[]>()
    for (const v of past) {
      if (!m.has(v.scheduled_date)) m.set(v.scheduled_date, [])
      m.get(v.scheduled_date)!.push(v)
    }
    for (const arr of m.values()) {
      arr.sort((a, b) => b.time_slot_start.localeCompare(a.time_slot_start))
    }
    return [...m.entries()].sort(([a], [b]) => b.localeCompare(a))
  }, [past])

  if (loading && visits.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-stone-500">Загрузка…</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8 min-w-0">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-medium text-forest-950">Расписание визитов</h1>
          <p className="text-sm text-stone-500 mt-1 max-w-xl">
            Слоты с контекстом заказа: тип уборки, длительность, город, опции, быстрый звонок и маршрут.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => load()}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Обновить
          </Button>
          <div className="flex rounded-xl border border-stone-200 p-0.5 bg-cream-50/80">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 ${viewMode === 'cards' ? 'bg-white shadow text-forest-900' : 'text-stone-600'}`}
            >
              <LayoutGrid className="w-4 h-4" /> Карточки
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1 ${viewMode === 'table' ? 'bg-white shadow text-forest-900' : 'text-stone-600'}`}
            >
              <Table2 className="w-4 h-4" /> Таблица
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['today', 'week', 'month'] as const).map((p) => (
          <Button
            key={p}
            variant={period === p ? 'default' : 'outline'}
            size="sm"
            className={period === p ? 'bg-forest-900' : ''}
            onClick={() => {
              setPeriod(p)
              setSelectedDay(null)
            }}
          >
            {p === 'today' ? 'Сегодня' : p === 'week' ? 'Неделя' : 'Месяц'}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {(
          [
            { id: 'all' as const, label: 'Все статусы' },
            { id: 'active' as const, label: 'Активные' },
            { id: 'done' as const, label: 'Завершённые' },
          ] as const
        ).map((t) => (
          <Button
            key={t.id}
            variant={statusTab === t.id ? 'secondary' : 'ghost'}
            size="sm"
            className={statusTab === t.id ? 'bg-forest-100 text-forest-900' : 'text-stone-600'}
            onClick={() => setStatusTab(t.id)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {period === 'week' && (
        <div className="overflow-x-auto pb-1 -mx-1 px-1">
          <div className="flex gap-2 min-w-max">
            <button
              type="button"
              onClick={() => setSelectedDay(null)}
              className={`shrink-0 rounded-2xl border px-3 py-2 text-left min-w-[4.5rem] ${selectedDay === null ? 'border-forest-900 bg-forest-50' : 'border-cream-200 bg-white'}`}
            >
              <div className="text-xs text-stone-500">Все дни</div>
              <div className="text-lg font-semibold text-forest-900">{visits.length}</div>
            </button>
            {weekStripDays.map((day) => {
              const n = countsByDay[day] || 0
              const sel = selectedDay === day
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(sel ? null : day)}
                  className={`shrink-0 rounded-2xl border px-3 py-2 text-left min-w-[4.5rem] ${sel ? 'border-forest-900 bg-forest-50' : 'border-cream-200 bg-white'}`}
                >
                  <div className="text-xs text-stone-500">{weekdayShort(day)}</div>
                  <div className="text-xs text-stone-400">{day.slice(8, 10)}.{day.slice(5, 7)}</div>
                  <div className="text-lg font-semibold text-forest-900">{n}</div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <Card className="border-cream-200 shadow-sm">
          <CardContent className="p-12 text-center">
            <Calendar className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-600 font-medium">Нет визитов</p>
            <p className="text-sm text-stone-500 mt-2">Измените период, фильтр статуса или день недели.</p>
          </CardContent>
        </Card>
      ) : viewMode === 'table' ? (
        <div className="overflow-x-auto rounded-2xl border border-cream-200 bg-white shadow-sm">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b border-cream-200 text-left text-stone-500">
                <th className="p-3 font-medium">Дата</th>
                <th className="p-3 font-medium">Время</th>
                <th className="p-3 font-medium">Клиент</th>
                <th className="p-3 font-medium">Тип</th>
                <th className="p-3 font-medium">Адрес</th>
                <th className="p-3 font-medium">Статус</th>
                <th className="p-3 font-medium w-28" />
              </tr>
            </thead>
            <tbody>
              {[...upcoming, ...past].sort((a, b) => {
                const da = a.scheduled_date.localeCompare(b.scheduled_date)
                if (da !== 0) return da
                return a.time_slot_start.localeCompare(b.time_slot_start)
              }).map((visit) => (
                <tr key={visit.id} className="border-b border-cream-100 hover:bg-cream-50/50">
                  <td className="p-3 whitespace-nowrap">
                    <div>{formatDate(visit.scheduled_date)}</div>
                    <div className="text-xs text-stone-500">{weekdayShort(visit.scheduled_date)}</div>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    {formatTime(visit.time_slot_start)}–{formatTime(visit.time_slot_end)}
                    <div className="text-xs text-stone-500">{formatDuration(visit.duration_minutes ?? null)}</div>
                  </td>
                  <td className="p-3">
                    <div className="font-medium text-forest-900">{visit.client_name || '—'}</div>
                    <div className="text-xs text-stone-500">{visit.client_phone || ''}</div>
                  </td>
                  <td className="p-3">
                    <div>{visit.cleaning_type_label || '—'}</div>
                    <div className="text-xs text-stone-500">{visit.apartment_type_name || ''}</div>
                  </td>
                  <td className="p-3 max-w-[220px]">
                    <div className="truncate text-stone-700" title={visit.address || ''}>
                      {visit.city_name && <span className="text-xs text-stone-500 block">{visit.city_name}</span>}
                      {visit.address || '—'}
                    </div>
                  </td>
                  <td className="p-3">{statusLabel(visit.status)}</td>
                  <td className="p-3">
                    <Link
                      to={`/executor/visits/${visit.id}`}
                      className="text-forest-700 font-medium hover:underline"
                    >
                      Открыть
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-10">
          {groupedUpcoming.length > 0 && (
            <div>
              <h2 className="text-lg font-medium text-forest-900 mb-4">Предстоящие</h2>
              <div className="space-y-8">
                {groupedUpcoming.map(([day, items]) => (
                  <div key={day}>
                    <div className="sticky top-0 z-10 -mx-1 px-1 py-2 mb-3 bg-cream-50/95 backdrop-blur border-b border-cream-200">
                      <p className="text-sm font-semibold text-forest-900">
                        {weekdayShort(day)} · {formatDate(day)}
                        <span className="text-stone-500 font-normal ml-2">({items.length})</span>
                      </p>
                    </div>
                    <div className="grid gap-3">
                      {items.map((v) => (
                        <ExecutorVisitRow key={v.id} visit={v} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {groupedPast.length > 0 && (
            <div>
              <h2 className="text-lg font-medium text-stone-600 mb-4">Архив</h2>
              <div className="space-y-8">
                {groupedPast.map(([day, items]) => (
                  <div key={day}>
                    <div className="sticky top-0 z-10 -mx-1 px-1 py-2 mb-3 bg-stone-50/95 backdrop-blur border-b border-stone-200">
                      <p className="text-sm font-semibold text-stone-800">
                        {weekdayShort(day)} · {formatDate(day)}
                      </p>
                    </div>
                    <div className="grid gap-3">
                      {items.map((v) => (
                        <ExecutorVisitRow key={v.id} visit={v} dim />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
