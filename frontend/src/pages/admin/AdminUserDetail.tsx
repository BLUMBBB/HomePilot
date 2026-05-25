import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AlertCircle, ArrowLeft, CheckCircle2, Copy } from 'lucide-react'
import { adminGetUser, adminPatchUser, type AdminUserDetail as AdminUserDetailPayload } from '@/api/client'
import { useAuth } from '@/contexts/AuthContext'
import { AdminRoleBadge } from '@/components/admin/AdminBadges'
import { adminBackLink, adminCardTitle, adminSurface } from '@/lib/adminUi'

function fmtTime(s: string): string {
  return s?.length >= 5 ? s.slice(0, 5) : s
}

export function AdminUserDetail() {
  const { userId } = useParams<{ userId: string }>()
  const { user: authUser } = useAuth()
  const isAdmin = authUser?.role === 'admin'
  const [data, setData] = useState<AdminUserDetailPayload | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [patchMsg, setPatchMsg] = useState('')
  const [patching, setPatching] = useState(false)

  useEffect(() => {
    if (!userId) return
    let c = false
    adminGetUser(userId)
      .then((d) => {
        if (!c) setData(d)
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
  }, [userId])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-500 text-sm">Загрузка…</p>
      </div>
    )
  }
  if (error || !data) {
    return <p className="text-red-600 text-sm">{error || 'Не найдено'}</p>
  }

  const { user } = data

  async function setActive(next: boolean) {
    if (!userId || !isAdmin) return
    setPatching(true)
    setPatchMsg('')
    try {
      const u = await adminPatchUser(userId, { is_active: next })
      setData((prev) => (prev ? { ...prev, user: { ...prev.user, ...u } } : prev))
      setPatchMsg(next ? 'Аккаунт активирован' : 'Аккаунт деактивирован')
    } catch (e) {
      setPatchMsg(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setPatching(false)
    }
  }

  function copyId() {
    if (userId) void navigator.clipboard.writeText(userId)
  }

  return (
    <div className="space-y-6 min-w-0 max-w-5xl">
      <div>
        <Link to="/admin/users" className={`${adminBackLink} mb-6`}>
          <ArrowLeft size={16} />
          К списку пользователей
        </Link>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2 font-sans">{user.email}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <AdminRoleBadge role={user.role} />
              <span className="inline-flex items-center gap-1.5 text-emerald-700 text-xs font-medium">
                <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                {user.is_active ? 'Активен' : 'Неактивен'}
              </span>
              {user.email_verified_at ? (
                <span className="inline-flex items-center gap-1.5 text-slate-600 text-xs font-medium">
                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                  Email подтверждён
                </span>
              ) : (
                <span className="text-slate-500 text-xs font-medium">Email не подтверждён</span>
              )}
            </div>
            {user.name && <p className="text-slate-600 text-sm mt-2">{user.name}</p>}
          </div>

          <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-lg border border-slate-200 max-w-full min-w-0">
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider shrink-0">ID</span>
            <span className="text-slate-700 text-sm font-mono truncate min-w-0">{user.id}</span>
            <button
              type="button"
              className="text-slate-400 hover:text-slate-600 transition-colors ml-1 shrink-0"
              title="Копировать ID"
              onClick={copyId}
            >
              <Copy size={14} />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-4 text-sm">
          <Link to={`/admin/subscriptions?user_id=${user.id}`} className="text-emerald-700 hover:text-emerald-800 font-medium transition-colors">
            Все подписки пользователя
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {isAdmin && (
          <div className="lg:col-span-1 space-y-6">
            <div className={`${adminSurface} p-6`}>
              <h2 className={`${adminCardTitle} mb-4`}>Управление аккаунтом</h2>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex gap-3">
                <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <p className="text-amber-800 text-sm leading-relaxed">
                  Деактивация запрещает вход. Нельзя отключить собственную учётную запись из API.
                </p>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  disabled={patching || user.is_active}
                  onClick={() => setActive(true)}
                  className={`w-full px-4 py-2.5 border font-medium rounded-lg transition-colors ${
                    patching || user.is_active
                      ? 'border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed'
                      : 'border-slate-200 text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  Активировать
                </button>
                <button
                  type="button"
                  disabled={patching || !user.is_active}
                  onClick={() => setActive(false)}
                  className={`w-full px-4 py-2.5 border font-medium rounded-lg transition-colors ${
                    patching || !user.is_active
                      ? 'border-slate-200 text-slate-400 bg-slate-50 cursor-not-allowed'
                      : 'border-rose-200 text-rose-600 hover:bg-rose-50'
                  }`}
                >
                  Деактивировать
                </button>
              </div>
              {patchMsg && <p className="text-sm text-slate-700 mt-3">{patchMsg}</p>}
            </div>
          </div>
        )}

        <div className={`${isAdmin ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-6`}>
          <div className={`${adminSurface} overflow-hidden`}>
            <div className="p-5 border-b border-slate-200/60 flex justify-between items-center gap-3">
              <h2 className={adminCardTitle}>Подписки</h2>
              <Link to={`/admin/subscriptions?user_id=${user.id}`} className="text-emerald-600 hover:text-emerald-700 text-sm font-medium transition-colors shrink-0">
                Все подписки
              </Link>
            </div>
            <div className="p-5 overflow-x-auto">
              {data.subscriptions.length === 0 ? (
                <p className="text-center text-slate-500 text-sm py-6">Нет активных подписок</p>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-200/60 bg-slate-50/80">
                      <th className="py-2 pr-4 font-medium">ID</th>
                      <th className="py-2 pr-4 font-medium">Статус</th>
                      <th className="py-2 pr-4 font-medium">Цена / мес</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.subscriptions.map((s) => {
                      const id = String(s.id)
                      return (
                        <tr key={id} className="hover:bg-slate-50/80">
                          <td className="py-3 pr-4">
                            <Link to={`/admin/subscriptions/${id}`} className="text-emerald-700 font-medium hover:text-emerald-800 transition-colors">
                              {id.slice(0, 8)}…
                            </Link>
                          </td>
                          <td className="py-3 pr-4 text-slate-700">{String(s.status)}</td>
                          <td className="py-3 pr-4 text-slate-700">{s.price_month_kzt != null ? `${s.price_month_kzt} ₸` : '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className={`${adminSurface} overflow-hidden`}>
            <div className="p-5 border-b border-slate-200/60">
              <h2 className={adminCardTitle}>Последние визиты</h2>
            </div>
            <div className="p-5 overflow-x-auto">
              {data.visits.length === 0 ? (
                <p className="text-center text-slate-500 text-sm py-6">Нет истории визитов</p>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-200/60">
                      <th className="py-2 pr-4 font-medium">Дата</th>
                      <th className="py-2 pr-4 font-medium">Время</th>
                      <th className="py-2 pr-4 font-medium">Статус</th>
                      <th className="py-2 pr-4 font-medium">Исполнитель</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.visits.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50/80">
                        <td className="py-3 pr-4">
                          <Link to={`/admin/visits/${v.id}`} className="text-emerald-700 font-medium hover:text-emerald-800 transition-colors">
                            {v.scheduled_date}
                          </Link>
                        </td>
                        <td className="py-3 pr-4 text-slate-600">
                          {fmtTime(v.time_slot_start)}–{fmtTime(v.time_slot_end)}
                        </td>
                        <td className="py-3 pr-4 text-slate-700">{v.status}</td>
                        <td className="py-3 pr-4 text-slate-700">{v.executor_name ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className={`${adminSurface} overflow-hidden`}>
            <div className="p-5 border-b border-slate-200/60">
              <h2 className={adminCardTitle}>Платежи</h2>
            </div>
            <div className="p-5 overflow-x-auto">
              {data.payments.length === 0 ? (
                <p className="text-center text-slate-500 text-sm py-6">Нет истории платежей</p>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-200/60">
                      <th className="py-2 pr-4 font-medium">Сумма</th>
                      <th className="py-2 pr-4 font-medium">Статус</th>
                      <th className="py-2 pr-4 font-medium">Создан</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80">
                        <td className="py-3 pr-4 text-slate-900 font-medium tabular-nums">{p.amount_kzt} ₸</td>
                        <td className="py-3 pr-4 text-slate-700">{p.status}</td>
                        <td className="py-3 pr-4 text-slate-600 whitespace-nowrap">{new Date(p.created_at).toLocaleString('ru-RU')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className={`${adminSurface} overflow-hidden`}>
            <div className="p-5 border-b border-slate-200/60">
              <h2 className={adminCardTitle}>Обращения в поддержку</h2>
            </div>
            <div className="p-5 overflow-x-auto">
              {data.support_tickets.length === 0 ? (
                <p className="text-center text-slate-500 text-sm py-6">Нет открытых тикетов</p>
              ) : (
                <table className="w-full text-sm text-left">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-200/60">
                      <th className="py-2 pr-4 font-medium">Тема</th>
                      <th className="py-2 pr-4 font-medium">Статус</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.support_tickets.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/80">
                        <td className="py-3 pr-4">
                          <Link to={`/admin/support/${t.id}`} className="text-emerald-700 font-medium hover:text-emerald-800 transition-colors">
                            {t.subject}
                          </Link>
                        </td>
                        <td className="py-3 pr-4 text-slate-700">{t.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
