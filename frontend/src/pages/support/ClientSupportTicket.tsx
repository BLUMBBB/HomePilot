import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { getSupportTicket, addSupportTicketMessage, type SupportTicketDetail } from '@/api/client'

function ticketStatusLabel(s: string): string {
  const m: Record<string, string> = {
    open: 'Открыт',
    in_progress: 'В работе',
    closed: 'Закрыт',
  }
  return m[s] ?? s
}

function authorLabel(role: string): string {
  const m: Record<string, string> = {
    client: 'Вы',
    executor: 'Вы',
    admin: 'Администратор',
    support: 'Поддержка',
  }
  return m[role] ?? role
}

function formatTs(iso: string): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })
}

type BasePath = '/dashboard' | '/executor'

export function ClientSupportTicket({ basePath }: { basePath: BasePath }) {
  const { ticketId } = useParams<{ ticketId: string }>()
  const [ticket, setTicket] = useState<SupportTicketDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!ticketId) return
    setLoading(true)
    setError(null)
    getSupportTicket(ticketId)
      .then(setTicket)
      .catch((e) => setError(e instanceof Error ? e.message : 'Не удалось загрузить'))
      .finally(() => setLoading(false))
  }, [ticketId])

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ticketId || !reply.trim()) return
    setSending(true)
    setError(null)
    try {
      await addSupportTicketMessage(ticketId, reply)
      setReply('')
      const t = await getSupportTicket(ticketId)
      setTicket(t)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка отправки')
    } finally {
      setSending(false)
    }
  }

  if (loading && !ticket) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-stone-500">Загрузка…</p>
      </div>
    )
  }

  if (error && !ticket) {
    return (
      <div className="space-y-4">
        <Link
          to={`${basePath}/support`}
          className="inline-flex items-center gap-2 text-sm text-forest-800 hover:text-forest-950"
        >
          <ArrowLeft className="w-4 h-4" />
          К списку обращений
        </Link>
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  if (!ticket) return null

  return (
    <div className="space-y-6 min-w-0">
      <Link
        to={`${basePath}/support`}
        className="inline-flex items-center gap-2 text-sm text-forest-800 hover:text-forest-950"
      >
        <ArrowLeft className="w-4 h-4" />
        К списку обращений
      </Link>

      <div>
        <h1 className="text-2xl sm:text-3xl font-serif font-medium text-forest-950 break-words">{ticket.subject}</h1>
        <div className="flex flex-wrap gap-2 mt-2 text-sm text-stone-600">
          <span className="font-medium text-forest-800 bg-forest-50 border border-forest-100 px-2 py-0.5 rounded-md">
            {ticketStatusLabel(ticket.status)}
          </span>
          <span>{formatTs(ticket.created_at)}</span>
        </div>
      </div>

      <div className="space-y-3">
        {ticket.messages.map((m) => (
          <Card
            key={m.id}
            className={
              m.author_role === 'client' || m.author_role === 'executor'
                ? 'border-forest-200 bg-forest-50/40'
                : 'border-cream-200 bg-white'
            }
          >
            <CardContent className="p-4">
              <div className="flex justify-between gap-2 text-xs text-stone-500 mb-2">
                <span className="font-medium text-stone-700">{authorLabel(m.author_role)}</span>
                <span>{formatTs(m.created_at)}</span>
              </div>
              <p className="text-stone-800 whitespace-pre-wrap break-words text-sm sm:text-base">{m.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {ticket.status !== 'closed' ? (
        <Card className="border-cream-200">
          <CardContent className="p-4 sm:p-6">
            <form onSubmit={sendReply} className="space-y-3">
              {error && <p className="text-sm text-red-600">{error}</p>}
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Ваше сообщение…"
                rows={4}
                className={cn(
                  'flex w-full rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm ring-offset-cream-50 placeholder:text-stone-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-900 focus-visible:ring-offset-2 resize-y min-h-[100px] hover:border-forest-200'
                )}
              />
              <Button type="submit" disabled={sending || !reply.trim()} className="bg-forest-900 hover:bg-forest-800 text-cream-50">
                {sending ? 'Отправка…' : 'Отправить'}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <p className="text-sm text-stone-500">Обращение закрыто. Новые сообщения отправить нельзя.</p>
      )}
    </div>
  )
}
