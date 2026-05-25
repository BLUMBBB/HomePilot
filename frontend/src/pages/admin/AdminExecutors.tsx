import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Ban, CalendarDays, Copy, Plus, ShieldAlert } from 'lucide-react'
import {
  adminCreateExecutorInvite,
  adminListExecutorInvites,
  adminListExecutors,
  adminPatchExecutor,
  type AdminExecutorInviteRow,
  type AdminExecutorRow,
} from '@/api/client'
import { useAuth } from '@/contexts/AuthContext'
import { adminPageDesc, adminPageH1, adminSurface, adminSurfaceHeader } from '@/lib/adminUi'

export function AdminExecutors() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [rows, setRows] = useState<AdminExecutorRow[]>([])
  const [invites, setInvites] = useState<AdminExecutorInviteRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [inviteInfo, setInviteInfo] = useState<{ invite_code: string; link: string } | null>(null)

  function load() {
    setLoading(true)
    Promise.all([adminListExecutors(), isAdmin ? adminListExecutorInvites(40).catch(() => []) : Promise.resolve([])])
      .then(([list, inv]) => {
        setRows(list)
        setInvites(inv as AdminExecutorInviteRow[])
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Ошибка'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- перезагрузка при смене роли не требуется в одной сессии
  }, [])

  async function toggleBlock(row: AdminExecutorRow) {
    if (!isAdmin) return
    const next = row.executor_status === 'blocked' ? 'active' : 'blocked'
    if (!confirm(next === 'blocked' ? 'Заблокировать исполнителя в зоне?' : 'Разблокировать?')) return
    try {
      await adminPatchExecutor(row.id, { executor_status: next })
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    }
  }

  async function toggleAccount(row: AdminExecutorRow) {
    if (!isAdmin) return
    const next = !row.is_active
    if (!confirm(next ? 'Разрешить вход в аккаунт?' : 'Запретить вход (деактивировать аккаунт)?')) return
    try {
      await adminPatchExecutor(row.id, { is_active: next })
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    }
  }

  async function invite() {
    if (!isAdmin) return
    setInviteInfo(null)
    setError('')
    try {
      const r = await adminCreateExecutorInvite()
      setInviteInfo({ invite_code: r.invite_code, link: r.link })
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    }
  }

  function copyCode(code: string) {
    void navigator.clipboard.writeText(code)
  }

  return (
    <div className="space-y-6 min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className={adminPageH1}>Исполнители</h1>
          <p className={adminPageDesc}>Нагрузка на 14 дней, блокировка роли и входа в аккаунт</p>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={invite}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#064e3b] text-white font-medium rounded-lg hover:bg-[#064e3b]/90 transition-colors shadow-sm text-sm"
          >
            <Plus size={18} />
            Создать приглашение
          </button>
        )}
      </div>

      {inviteInfo && (
        <div className={`${adminSurface} p-5 border-amber-200 bg-amber-50/40`}>
          <h2 className="text-sm font-semibold text-slate-900 mb-3">Новое приглашение</h2>
          <div className="text-sm space-y-2 break-all text-slate-700">
            <p>
              <span className="text-slate-500">Код:</span> <code className="font-mono bg-white/80 px-1.5 py-0.5 rounded border border-amber-200">{inviteInfo.invite_code}</code>
            </p>
            <p>
              <span className="text-slate-500">Ссылка:</span>{' '}
              <a href={inviteInfo.link} className="text-emerald-700 font-medium hover:text-emerald-800 underline">
                {inviteInfo.link}
              </a>
            </p>
          </div>
        </div>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {isAdmin && invites.length > 0 && (
        <div className={`${adminSurface} overflow-hidden`}>
          <div className={adminSurfaceHeader}>
            <h2 className="text-sm font-semibold text-slate-900">Последние приглашения</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white text-slate-500 border-b border-slate-200/60">
                <tr>
                  <th className="px-6 py-3.5 font-medium">Код (начало)</th>
                  <th className="px-6 py-3.5 font-medium">Истекает</th>
                  <th className="px-6 py-3.5 font-medium">Использовано</th>
                  <th className="px-6 py-3.5 font-medium text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invites.map((i) => (
                  <tr key={i.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-mono text-slate-700">{i.code.slice(0, 12)}…</td>
                    <td className="px-6 py-4 text-slate-600">{new Date(i.expires_at).toLocaleString('ru-RU')}</td>
                    <td className="px-6 py-4 text-slate-400">{i.used_at ? new Date(i.used_at).toLocaleString('ru-RU') : '—'}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors inline-flex"
                        title="Копировать код"
                        onClick={() => copyCode(i.code)}
                      >
                        <Copy size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className={`${adminSurface} overflow-hidden`}>
        <div className={adminSurfaceHeader}>
          <h2 className="text-sm font-semibold text-slate-900">Список исполнителей</h2>
        </div>
        {loading ? (
          <p className="text-slate-500 text-sm px-5 py-10">Загрузка…</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white text-slate-500 border-b border-slate-200/60">
                <tr>
                  <th className="px-6 py-3.5 font-medium">Имя / email</th>
                  <th className="px-6 py-3.5 font-medium">Визитов (14 дн.)</th>
                  <th className="px-6 py-3.5 font-medium">Роль</th>
                  <th className="px-6 py-3.5 font-medium">Аккаунт</th>
                  <th className="px-6 py-3.5 font-medium text-right">Управление</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900">{r.name || '—'}</div>
                      <div className="text-slate-500 text-xs mt-0.5">{r.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-medium tabular-nums">
                        {r.visits_upcoming_14d ?? 0}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {r.executor_status === 'blocked' ? (
                        <span className="inline-flex items-center gap-1.5 text-rose-700 bg-rose-50 px-2 py-1 rounded-md text-xs font-medium border border-rose-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                          Заблокирован
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md text-xs font-medium border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Активен
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 text-emerald-700 text-xs font-medium">
                        <span className={`w-1.5 h-1.5 rounded-full ${r.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                        {r.is_active ? 'активен' : 'выкл.'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 flex-wrap">
                        <Link to={`/admin/visits?executor_id=${r.id}`}>
                          <button
                            type="button"
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
                          >
                            <CalendarDays size={14} />
                            Визиты
                          </button>
                        </Link>
                        {isAdmin && (
                          <>
                            <button
                              type="button"
                              className="flex items-center gap-1.5 px-3 py-1.5 border border-amber-200 text-amber-700 bg-amber-50 rounded-lg text-xs font-medium hover:bg-amber-100 transition-colors shadow-sm"
                              onClick={() => toggleBlock(r)}
                            >
                              <ShieldAlert size={14} />
                              {r.executor_status === 'blocked' ? 'Разблок' : 'Блок'}
                            </button>
                            <button
                              type="button"
                              className="flex items-center gap-1.5 px-3 py-1.5 border border-rose-200 text-rose-700 bg-rose-50 rounded-lg text-xs font-medium hover:bg-rose-100 transition-colors shadow-sm"
                              onClick={() => toggleAccount(r)}
                            >
                              <Ban size={14} />
                              {r.is_active ? 'Выкл. вход' : 'Вкл. вход'}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rows.length === 0 && <p className="text-slate-500 text-sm px-6 py-8">Нет исполнителей</p>}
          </div>
        )}
      </div>

      {!isAdmin && <p className="text-sm text-slate-500">Приглашения и изменение статусов — только администратор.</p>}
    </div>
  )
}
