import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Calendar as CalendarIcon, Filter } from 'lucide-react'
import { adminListVisits, adminListExecutors, type AdminVisitRow, type AdminExecutorRow } from '@/api/client'
import { AdminPagination } from '@/components/admin/AdminPagination'
import { AdminVisitStatusBadge } from '@/components/admin/AdminBadges'
import {
  adminApplyFiltersBtn,
  adminInnerSearchWrap,
  adminInput,
  adminMutedBtn,
  adminPageDesc,
  adminPageH1,
  adminSurface,
  adminTabActive,
  adminTabInactive,
  adminTableHead,
} from '@/lib/adminUi'

function fmtTime(s: string): string {
  return s?.length >= 5 ? s.slice(0, 5) : s
}

export function AdminVisits() {
  const [searchParams, setSearchParams] = useSearchParams()
  const statusQ = searchParams.get('status') ?? ''
  const subscriptionIdFromUrl = searchParams.get('subscription_id') ?? ''
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [appliedFrom, setAppliedFrom] = useState('')
  const [appliedTo, setAppliedTo] = useState('')
  const [clientSearch, setClientSearch] = useState('')
  const [appliedClient, setAppliedClient] = useState('')
  const [subscriptionId, setSubscriptionId] = useState('')
  const [appliedSubId, setAppliedSubId] = useState('')
  const [executorId, setExecutorId] = useState('')
  const [appliedExec, setAppliedExec] = useState('')
  const [executors, setExecutors] = useState<AdminExecutorRow[]>([])
  const [rows, setRows] = useState<AdminVisitRow[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [limit, setLimit] = useState(25)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    adminListExecutors().then(setExecutors).catch(() => setExecutors([]))
  }, [])

  useEffect(() => {
    if (subscriptionIdFromUrl) {
      setSubscriptionId(subscriptionIdFromUrl)
      setAppliedSubId(subscriptionIdFromUrl)
    }
  }, [subscriptionIdFromUrl])

  useEffect(() => {
    setOffset(0)
  }, [statusQ, appliedFrom, appliedTo, appliedClient, appliedSubId, appliedExec])

  useEffect(() => {
    let c = false
    setLoading(true)
    adminListVisits({
      date_from: appliedFrom || undefined,
      date_to: appliedTo || undefined,
      status: statusQ || undefined,
      client_search: appliedClient.trim() || undefined,
      subscription_id: appliedSubId.trim() || undefined,
      executor_id: appliedExec || undefined,
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
  }, [statusQ, appliedFrom, appliedTo, appliedClient, appliedSubId, appliedExec, limit, offset])

  const today = new Date().toISOString().slice(0, 10)

  function applyFilters() {
    setAppliedFrom(dateFrom)
    setAppliedTo(dateTo)
    setAppliedClient(clientSearch)
    setAppliedSubId(subscriptionId)
    setAppliedExec(executorId)
  }

  function setStatusInUrl(status: string) {
    const next = new URLSearchParams(searchParams)
    if (status) next.set('status', status)
    else next.delete('status')
    setSearchParams(next)
  }

  return (
    <div className="space-y-6 min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className={adminPageH1}>Визиты</h1>
          <p className={adminPageDesc}>Расписание и контроль выполнения работ</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { label: 'Все', value: '' },
            { label: 'Запланирован', value: 'scheduled' },
            { label: 'В работе', value: 'in_progress' },
            { label: 'Завершён', value: 'completed' },
            { label: 'Отменён', value: 'cancelled' },
          ].map(({ label, value }) => (
            <button
              key={value || 'all'}
              type="button"
              className={statusQ === value ? adminTabActive : adminTabInactive}
              onClick={() => setStatusInUrl(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={`${adminSurface} p-5`}>
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-900">Фильтры</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Дата с</label>
            <div className="relative">
              <input type="date" className={adminInput} value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              <CalendarIcon size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Дата по</label>
            <div className="relative">
              <input type="date" className={adminInput} value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              <CalendarIcon size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Исполнитель</label>
            <select className={`${adminInput} h-10`} value={executorId} onChange={(e) => setExecutorId(e.target.value)}>
              <option value="">Все исполнители</option>
              {executors.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name || e.email}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">ID подписки</label>
            <input
              type="text"
              placeholder="UUID"
              className={adminInput}
              value={subscriptionId}
              onChange={(e) => setSubscriptionId(e.target.value)}
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Клиент (email / имя)</label>
            <input
              type="search"
              placeholder="часть строки"
              className={adminInput}
              value={clientSearch}
              onChange={(e) => setClientSearch(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button type="button" className={adminApplyFiltersBtn} onClick={applyFilters}>
            Применить фильтры
          </button>
          <button
            type="button"
            className={adminTabInactive}
            onClick={() => {
              setDateFrom(today)
              setDateTo(today)
              setAppliedFrom(today)
              setAppliedTo(today)
            }}
          >
            Только сегодня
          </button>
          <button
            type="button"
            className={adminMutedBtn}
            onClick={() => {
              setDateFrom('')
              setDateTo('')
              setClientSearch('')
              setSubscriptionId('')
              setExecutorId('')
              setAppliedFrom('')
              setAppliedTo('')
              setAppliedClient('')
              setAppliedSubId('')
              setAppliedExec('')
            }}
          >
            Сбросить
          </button>
        </div>
      </div>

      <div className={`${adminSurface} overflow-hidden flex flex-col`}>
        <div className={adminInnerSearchWrap}>
          <p className="text-sm text-slate-600">Результаты поиска и постраничный просмотр</p>
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
                    <th className="px-6 py-3.5 font-medium">Дата и время</th>
                    <th className="px-6 py-3.5 font-medium">Клиент</th>
                    <th className="px-6 py-3.5 font-medium">Исполнитель</th>
                    <th className="px-6 py-3.5 font-medium">Статус</th>
                    <th className="px-6 py-3.5 font-medium">Подписка</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((v) => (
                    <tr key={v.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4">
                        <Link to={`/admin/visits/${v.id}`} className="block min-w-0 group-hover:text-emerald-700">
                          <div className="font-medium text-slate-900">{v.scheduled_date}</div>
                          <div className="text-slate-500 text-xs mt-0.5">
                            {fmtTime(v.time_slot_start)}–{fmtTime(v.time_slot_end)}
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-slate-700">{v.client_email ?? '—'}</td>
                      <td className="px-6 py-4 text-slate-700">{v.executor_name ?? '—'}</td>
                      <td className="px-6 py-4">
                        <AdminVisitStatusBadge status={v.status} />
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          to={`/admin/subscriptions/${v.subscription_id}`}
                          className="text-slate-500 font-mono text-xs hover:text-emerald-700 transition-colors"
                        >
                          {v.subscription_id.slice(0, 8)}…
                        </Link>
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
