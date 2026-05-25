import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { adminGetTicket, adminPatchTicket, adminReplyTicket, type AdminTicketDetail as AdminTicketPayload } from '@/api/client'
import { AdminTicketStatusBadge } from '@/components/admin/AdminBadges'
import { adminBackLink, adminCardTitle, adminSurface } from '@/lib/adminUi'

export function AdminTicketDetail() {
  const { ticketId } = useParams<{ ticketId: string }>()
  const [ticket, setTicket] = useState<AdminTicketPayload | null>(null)
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (!ticketId) return
    let c = false
    setLoading(true)
    adminGetTicket(ticketId)
      .then((t) => {
        if (!c) setTicket(t)
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
  }, [ticketId])

  async function sendReply() {
    if (!ticketId || !reply.trim()) return
    setSending(true)
    setError('')
    setMsg('')
    try {
      await adminReplyTicket(ticketId, reply.trim())
      setReply('')
      setMsg('Сообщение отправлено')
      const t = await adminGetTicket(ticketId)
      setTicket(t)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setSending(false)
    }
  }

  async function setStatus(status: string) {
    if (!ticketId) return
    setError('')
    try {
      await adminPatchTicket(ticketId, status)
      const t = await adminGetTicket(ticketId)
      setTicket(t)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-500 text-sm">Загрузка…</p>
      </div>
    )
  }
  if (error && !ticket) {
    return <p className="text-red-600 text-sm">{error}</p>
  }
  if (!ticket) {
    return null
  }

  return (
    <div className="space-y-6 min-w-0 max-w-3xl">
      <div>
        <Link to="/admin/support" className={adminBackLink}>
          <ArrowLeft size={16} />
          К списку тикетов
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-4 mb-2 font-sans">{ticket.subject}</h1>
        <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
          <span>{ticket.user_email}</span>
          <AdminTicketStatusBadge status={ticket.status} />
        </div>
        <div className="flex flex-wrap gap-4 text-sm mt-4">
          <Link to={`/admin/users/${ticket.user_id}`} className="text-emerald-700 font-medium hover:text-emerald-800 transition-colors">
            Профиль клиента
          </Link>
          {ticket.visit_id && (
            <Link to={`/admin/visits/${ticket.visit_id}`} className="text-emerald-700 font-medium hover:text-emerald-800 transition-colors">
              Связанный визит
            </Link>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['open', 'in_progress', 'closed'] as const).map((st) => (
          <button
            key={st}
            type="button"
            className={
              ticket.status === st
                ? 'px-4 py-2 bg-[#064e3b] text-white rounded-lg text-sm font-medium shadow-sm'
                : 'px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium shadow-sm transition-colors'
            }
            onClick={() => setStatus(st)}
          >
            {st}
          </button>
        ))}
      </div>

      <div className={`${adminSurface} overflow-hidden`}>
        <div className="p-5 border-b border-slate-200/60 bg-slate-50/50">
          <h2 className={adminCardTitle}>Переписка</h2>
        </div>
        <div className="p-6 space-y-4">
          {ticket.messages.map((m) => (
            <div key={m.id} className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
              <p className="text-xs text-slate-500 mb-1.5">
                {m.author_role} · {new Date(m.created_at).toLocaleString('ru-RU')}
              </p>
              <p className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed">{m.body}</p>
            </div>
          ))}
        </div>
      </div>

      <div className={`${adminSurface} p-6`}>
        <h2 className={`${adminCardTitle} mb-4`}>Ответ</h2>
        <div className="space-y-3">
          <textarea
            className="w-full min-h-[140px] rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            placeholder="Текст ответа клиенту…"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
          />
          {error && <p className="text-red-600 text-sm">{error}</p>}
          {msg && <p className="text-emerald-700 text-sm font-medium">{msg}</p>}
          <Button type="button" onClick={sendReply} disabled={sending} className="rounded-lg bg-[#064e3b] hover:bg-[#064e3b]/90 text-white h-11 px-6 shadow-sm">
            {sending ? 'Отправка…' : 'Отправить ответ'}
          </Button>
        </div>
      </div>
    </div>
  )
}
