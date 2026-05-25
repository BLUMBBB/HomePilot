import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Headset, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  listSupportTickets,
  createSupportTicket,
  listVisits,
  listExecutorVisits,
  type SupportTicketBrief,
  type VisitItem,
  type ExecutorVisitItem,
} from '@/api/client'

function ticketStatusLabel(s: string): string {
  const m: Record<string, string> = {
    open: 'Открыт',
    in_progress: 'В работе',
    closed: 'Закрыт',
  }
  return m[s] ?? s
}

function formatTs(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })
}

type BasePath = '/dashboard' | '/executor'

export function ClientSupportList({ basePath }: { basePath: BasePath }) {
  const [tickets, setTickets] = useState<SupportTicketBrief[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [visitId, setVisitId] = useState('')
  const [visits, setVisits] = useState<{ id: string; label: string }[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    listSupportTickets()
      .then(setTickets)
      .catch(() => setTickets([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    listSupportTickets()
      .then((t) => {
        if (!cancelled) setTickets(t)
      })
      .catch(() => {
        if (!cancelled) setTickets([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!showForm) return
    let cancelled = false
    const p =
      basePath === '/dashboard'
        ? listVisits().then((list: VisitItem[]) =>
            list.map((v) => ({
              id: v.id,
              label: `${v.scheduled_date} · ${v.time_slot_start?.slice(0, 5) ?? ''}`,
            }))
          )
        : listExecutorVisits().then((list: ExecutorVisitItem[]) =>
            list.map((v) => ({
              id: v.id,
              label: `${v.scheduled_date} · ${v.time_slot_start?.slice(0, 5) ?? ''}`,
            }))
          )
    p.then((opts) => {
      if (!cancelled) setVisits(opts)
    }).catch(() => {
      if (!cancelled) setVisits([])
    })
    return () => {
      cancelled = true
    }
  }, [showForm, basePath])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!subject.trim() || !message.trim()) {
      setError('Укажите тему и текст обращения')
      return
    }
    setSubmitting(true)
    try {
      await createSupportTicket({
        subject: subject.trim(),
        message: message.trim(),
        visit_id: visitId || null,
      })
      setSubject('')
      setMessage('')
      setVisitId('')
      setShowForm(false)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка')
    } finally {
      setSubmitting(false)
    }
  }

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
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-medium text-forest-950">Поддержка</h1>
          <p className="text-stone-600 text-sm mt-1">Напишите нам — ответит команда HomePilot.</p>
        </div>
        <Button
          type="button"
          variant={showForm ? 'outline' : 'default'}
          className={showForm ? '' : 'bg-forest-900 hover:bg-forest-800 text-cream-50'}
          onClick={() => {
            setShowForm((v) => !v)
            setError(null)
          }}
        >
          {showForm ? (
            'К списку'
          ) : (
            <>
              <Plus className="w-4 h-4 mr-2" />
              Новое обращение
            </>
          )}
        </Button>
      </div>

      {showForm ? (
        <Card className="border-cream-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-serif text-forest-950">Новое обращение</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4 max-w-xl">
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div>
                <label className="text-sm font-medium text-stone-700 block mb-1">Тема</label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Кратко, о чём речь"
                  className="border-cream-200"
                  maxLength={500}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700 block mb-1">Сообщение</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Опишите ситуацию"
                  rows={5}
                  className={cn(
                    'flex w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm ring-offset-cream-50 placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-900 focus-visible:ring-offset-2 disabled:opacity-50 resize-y min-h-[120px] hover:border-forest-200'
                  )}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700 block mb-1">Визит (необязательно)</label>
                <select
                  value={visitId}
                  onChange={(e) => setVisitId(e.target.value)}
                  className="w-full rounded-md border border-cream-200 bg-white px-3 py-2 text-sm text-stone-900"
                >
                  <option value="">— не привязывать —</option>
                  {visits.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.label}
                    </option>
                  ))}
                </select>
              </div>
              <Button type="submit" disabled={submitting} className="bg-forest-900 hover:bg-forest-800 text-cream-50">
                {submitting ? 'Отправка…' : 'Отправить'}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : tickets.length === 0 ? (
        <Card className="border-cream-200 shadow-sm">
          <CardContent className="p-12 text-center">
            <Headset className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-600 font-medium">Пока нет обращений</p>
            <p className="text-sm text-stone-500 mt-2 mb-6">Создайте тикет — мы ответим в этом же диалоге.</p>
            <Button className="bg-forest-900 hover:bg-forest-800 text-cream-50" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Написать в поддержку
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tickets.map((t) => (
            <Link key={t.id} to={`${basePath}/support/${t.id}`}>
              <Card className="border-cream-200 shadow-sm hover:border-forest-200 transition-colors cursor-pointer">
                <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-forest-950 truncate">{t.subject}</p>
                    <p className="text-sm text-stone-500 mt-1">{formatTs(t.created_at)}</p>
                  </div>
                  <span className="text-sm font-medium text-forest-800 bg-forest-50 border border-forest-100 px-3 py-1 rounded-full w-fit">
                    {ticketStatusLabel(t.status)}
                  </span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
