import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Filter, Search } from 'lucide-react'
import { adminListUsers, type AdminUserRow } from '@/api/client'
import { AdminPagination } from '@/components/admin/AdminPagination'
import { AdminRoleBadge } from '@/components/admin/AdminBadges'
import {
  adminApplyFiltersBtn,
  adminInnerSearchWrap,
  adminInput,
  adminPageDesc,
  adminPageH1,
  adminSurface,
  adminTabActive,
  adminTabInactive,
  adminTableHead,
} from '@/lib/adminUi'

export function AdminUsers() {
  const [searchParams, setSearchParams] = useSearchParams()
  const roleQ = searchParams.get('role') ?? ''
  const [searchInput, setSearchInput] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<'all' | 'yes' | 'no'>('all')
  const [sort, setSort] = useState('created_desc')
  const [rows, setRows] = useState<AdminUserRow[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [limit, setLimit] = useState(25)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setOffset(0)
  }, [roleQ, appliedSearch, activeFilter, sort])

  useEffect(() => {
    let c = false
    setLoading(true)
    adminListUsers({
      role: roleQ || undefined,
      search: appliedSearch.trim() || undefined,
      is_active: activeFilter === 'all' ? undefined : activeFilter === 'yes',
      sort,
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
  }, [roleQ, appliedSearch, activeFilter, sort, limit, offset])

  return (
    <div className="space-y-6 min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className={adminPageH1}>Пользователи</h1>
          <p className={adminPageDesc}>Управление аккаунтами и ролями</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Все роли', value: '' },
            { label: 'Клиенты', value: 'client' },
            { label: 'Исполнители', value: 'executor' },
          ].map(({ label, value }) => (
            <button
              key={value || 'all'}
              type="button"
              className={roleQ === value ? adminTabActive : adminTabInactive}
              onClick={() => {
                if (value) setSearchParams({ role: value })
                else setSearchParams({})
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={`${adminSurface} overflow-hidden flex flex-col`}>
        <div className={adminInnerSearchWrap}>
          <div className="relative w-full max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="search"
              placeholder="Поиск по email или имени…"
              className={`${adminInput} pl-10`}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setAppliedSearch(searchInput)
              }}
            />
          </div>
          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1 shadow-sm w-fit">
              {(
                [
                  { k: 'all' as const, label: 'Все' },
                  { k: 'yes' as const, label: 'Активные' },
                  { k: 'no' as const, label: 'Выключены' },
                ] as const
              ).map(({ k, label }) => (
                <button
                  key={k}
                  type="button"
                  className={
                    activeFilter === k
                      ? 'px-3 py-1.5 bg-slate-100 rounded-md text-slate-800 text-sm font-medium'
                      : 'px-3 py-1.5 text-slate-600 hover:text-slate-800 text-sm font-medium transition-colors'
                  }
                  onClick={() => setActiveFilter(k)}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Filter size={16} className="text-slate-400 hidden sm:block" />
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Сортировка</span>
              <select
                className={`${adminInput} w-auto min-w-[160px] h-10 py-0`}
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="created_desc">Новые сверху</option>
                <option value="created_asc">Старые сверху</option>
                <option value="email_asc">Email A→Я</option>
              </select>
            </div>
            <button type="button" className={adminApplyFiltersBtn} onClick={() => setAppliedSearch(searchInput)}>
              Найти
            </button>
          </div>
        </div>

        {error && <p className="text-red-600 text-sm px-5 pt-4">{error}</p>}
        {loading ? (
          <p className="text-slate-500 text-sm px-5 py-10">Загрузка…</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className={adminTableHead}>
                  <tr>
                    <th className="px-6 py-3.5 font-medium">Пользователь</th>
                    <th className="px-6 py-3.5 font-medium">Телефон</th>
                    <th className="px-6 py-3.5 font-medium">Роль</th>
                    <th className="px-6 py-3.5 font-medium">Email подтв.</th>
                    <th className="px-6 py-3.5 font-medium">Статус</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex flex-col min-w-0">
                          <Link
                            to={`/admin/users/${u.id}`}
                            className="text-slate-900 font-medium group-hover:text-emerald-700 transition-colors truncate"
                          >
                            {u.name ?? u.email}
                          </Link>
                          <span className="text-slate-500 text-xs mt-0.5 truncate">{u.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-mono text-xs">{u.phone ?? '—'}</td>
                      <td className="px-6 py-4">
                        <AdminRoleBadge role={u.role} />
                      </td>
                      <td className="px-6 py-4">
                        {u.email_verified_at ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md text-xs font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Да
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-slate-500 bg-slate-50 px-2 py-1 rounded-md text-xs font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                            Нет
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 text-xs font-medium">
                          <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                          {u.is_active ? 'активен' : 'выкл.'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length === 0 && <p className="text-slate-500 text-sm px-6 py-8">Нет записей</p>}
            </div>
            <AdminPagination offset={offset} limit={limit} total={total} onOffsetChange={setOffset} onLimitChange={setLimit} />
          </>
        )}
      </div>
    </div>
  )
}
