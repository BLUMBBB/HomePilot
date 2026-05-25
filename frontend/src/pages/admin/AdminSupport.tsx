import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Filter, MessageSquare, Search } from 'lucide-react'
import { adminListTickets, type AdminTicketRow } from '@/api/client'
import { AdminPagination } from '@/components/admin/AdminPagination'
import { AdminTicketStatusBadge } from '@/components/admin/AdminBadges'
import {
  adminApplyFiltersBtn,
  adminInput,
  adminMutedBtn,
  adminPageDesc,
  adminPageH1,
  adminSurface,
  adminSurfaceHeader,
  adminTabActive,
  adminTabInactive,
} from '@/lib/adminUi'

export function AdminSupport() {
  const [searchParams, setSearchParams] = useSearchParams()
  const statusQ = searchParams.get('status') ?? ''
  const [searchInput, setSearchInput] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [userIdFilter, setUserIdFilter] = useState('')
  const [appliedUserId, setAppliedUserId] = useState('')
  const [rows, setRows] = useState<AdminTicketRow[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [limit, setLimit] = useState(25)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setOffset(0)
  }, [statusQ, appliedSearch, appliedUserId])

  useEffect(() => {
    let c = false
    setLoading(true)
    adminListTickets({
      status: statusQ || undefined,
      search: appliedSearch.trim() || undefined,
      user_id: appliedUserId.trim() || undefined,
      limit,
      offset,
    })
      .then((r) => {
        if (!c) {
          setRows(r.items)
          setTotal(r.total)
        }
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
  }, [statusQ, appliedSearch, appliedUserId, limit, offset])

  function applyFilters() {
    setAppliedSearch(searchInput)
    setAppliedUserId(userIdFilter)
  }

  function resetFilters() {
    setSearchInput('')
    setUserIdFilter('')
    setAppliedSearch('')
    setAppliedUserId('')
  }

  return (
    <div className="space-y-6 min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className={adminPageH1}>Поддержка</h1>
          <p className={adminPageDesc}>Обращения клиентов и тикеты</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { label: 'Все', value: '' },
            { label: 'Открытые', value: 'open' },
            { label: 'В работе', value: 'in_progress' },
            { label: 'Закрытые', value: 'closed' },
          ].map(({ label, value }) => (
            <button
              key={value || 'all'}
              type="button"
              className={statusQ === value ? adminTabActive : adminTabInactive}
              onClick={() => {
                if (value) setSearchParams({ status: value })
                else setSearchParams({})
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={`${adminSurface} p-5`}>
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-900">Поиск и фильтры</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Тема тикета (часть текста)</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="search"
                placeholder="Поиск по теме…"
                className={`${adminInput} pl-9`}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">ID пользователя</label>
            <input
              type="text"
              placeholder="UUID"
              className={adminInput}
              value={userIdFilter}
              onChange={(e) => setUserIdFilter(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mt-4">
          <button type="button" className={adminApplyFiltersBtn} onClick={applyFilters}>
            Применить фильтры
          </button>
          <button type="button" className={adminMutedBtn} onClick={resetFilters}>
            Сбросить
          </button>
        </div>
      </div>

      <div className={`${adminSurface} overflow-hidden flex flex-col`}>
        <div className={adminSurfaceHeader}>
          <h2 className="text-sm font-semibold text-slate-900">Список тикетов</h2>
        </div>
        {error && <p className="text-red-600 text-sm px-5 pt-4">{error}</p>}
        {loading ? (
          <p className="text-slate-500 text-sm px-5 py-10">Загрузка…</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-white text-slate-500 border-b border-slate-200/60">
                  <tr>
                    <th className="px-6 py-3.5 font-medium">Тема</th>
                    <th className="px-6 py-3.5 font-medium">Клиент</th>
                    <th className="px-6 py-3.5 font-medium">Визит</th>
                    <th className="px-6 py-3.5 font-medium">Статус</th>
                    <th className="px-6 py-3.5 font-medium">Обновлён</th>
                    <th className="px-6 py-3.5 font-medium text-right">Действия</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <Link
                          to={`/admin/support/${t.id}`}
                          className="text-slate-900 font-medium group-hover:text-emerald-700 transition-colors"
                        >
                          {t.subject}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900 truncate max-w-[200px]">{t.user_email ?? '—'}</div>
                        <div className="text-xs mt-0.5">
                          <Link to={`/admin/users/${t.user_id}`} className="text-slate-500 hover:text-emerald-700 transition-colors">
                            профиль
                          </Link>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {t.visit_id ? (
                          <Link to={`/admin/visits/${t.visit_id}`} className="text-xs font-mono text-emerald-700 hover:text-emerald-800">
                            открыть
                          </Link>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <AdminTicketStatusBadge status={t.status} />
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs whitespace-nowrap">
                        {new Date(t.updated_at).toLocaleString('ru-RU')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          to={`/admin/support/${t.id}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm"
                        >
                          <MessageSquare size={14} />
                          Ответить
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length === 0 && <p className="text-slate-500 text-sm px-6 py-8">Нет тикетов</p>}
            </div>
            <AdminPagination offset={offset} limit={limit} total={total} onOffsetChange={setOffset} onLimitChange={setLimit} />
          </>
        )}
      </div>
    </div>
  )
}
