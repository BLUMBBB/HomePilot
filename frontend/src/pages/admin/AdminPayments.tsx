import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar as CalendarIcon, Filter } from 'lucide-react'
import { adminListPayments, type AdminPaymentRow } from '@/api/client'
import { AdminPagination } from '@/components/admin/AdminPagination'
import { AdminPaymentStatusBadge } from '@/components/admin/AdminBadges'
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

export function AdminPayments() {
  const [status, setStatus] = useState('')
  const [appliedStatus, setAppliedStatus] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [appliedFrom, setAppliedFrom] = useState('')
  const [appliedTo, setAppliedTo] = useState('')
  const [rows, setRows] = useState<AdminPaymentRow[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [limit, setLimit] = useState(25)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setOffset(0)
  }, [appliedStatus, appliedFrom, appliedTo])

  useEffect(() => {
    let c = false
    setLoading(true)
    adminListPayments({
      status: appliedStatus || undefined,
      date_from: appliedFrom || undefined,
      date_to: appliedTo || undefined,
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
  }, [appliedStatus, appliedFrom, appliedTo, limit, offset])

  const sumOnPage = rows.reduce((a, p) => a + (p.status === 'completed' ? p.amount_kzt : 0), 0)

  function applyQuick(next: string) {
    setStatus(next)
    setAppliedStatus(next)
    setOffset(0)
  }

  function applyPanel() {
    setAppliedStatus(status)
    setAppliedFrom(dateFrom)
    setAppliedTo(dateTo)
  }

  function resetPanel() {
    setStatus('')
    setDateFrom('')
    setDateTo('')
    setAppliedStatus('')
    setAppliedFrom('')
    setAppliedTo('')
  }

  return (
    <div className="space-y-6 min-w-0">
      <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
        <div>
          <h1 className={adminPageH1}>Платежи</h1>
          <p className={adminPageDesc}>История транзакций и возвраты</p>
        </div>
        <div className="flex gap-2 flex-wrap w-full lg:justify-end">
          {[
            { label: 'Все', value: '' },
            { label: 'Успешные', value: 'completed' },
            { label: 'Ошибки', value: 'failed' },
            { label: 'В обработке', value: 'pending' },
            { label: 'Возвраты', value: 'refunded' },
          ].map(({ label, value }) => (
            <button
              key={value || 'all'}
              type="button"
              className={appliedStatus === value ? adminTabActive : adminTabInactive}
              onClick={() => applyQuick(value)}
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Статус (точный)</label>
            <select className={`${adminInput} h-10`} value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Все</option>
              <option value="pending">pending</option>
              <option value="completed">completed</option>
              <option value="failed">failed</option>
              <option value="refunded">refunded</option>
            </select>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mt-4">
          <button type="button" className={adminApplyFiltersBtn} onClick={applyPanel}>
            Применить фильтры
          </button>
          <button type="button" className={adminMutedBtn} onClick={resetPanel}>
            Сбросить
          </button>
        </div>
      </div>

      <div className={`${adminSurface} overflow-hidden flex flex-col`}>
        <div className={adminSurfaceHeader}>
          <h2 className="text-sm font-semibold text-slate-900">Список транзакций</h2>
        </div>
        {error && <p className="text-red-600 text-sm px-5 pt-4">{error}</p>}
        {loading ? (
          <p className="text-slate-500 text-sm px-5 py-10">Загрузка…</p>
        ) : (
          <>
            <p className="text-sm text-slate-600 px-5 pt-4">
              На странице завершённых на сумму: <strong className="tabular-nums">{sumOnPage.toLocaleString('ru-RU')} ₸</strong>{' '}
              <span className="text-slate-400">(только completed в текущей выборке)</span>
            </p>
            <div className="overflow-x-auto px-5 pb-2">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-white text-slate-500 border-b border-slate-200/60">
                  <tr>
                    <th className="px-4 py-3 font-medium">Сумма</th>
                    <th className="px-4 py-3 font-medium">Статус</th>
                    <th className="px-4 py-3 font-medium">Пользователь</th>
                    <th className="px-4 py-3 font-medium">Подписка</th>
                    <th className="px-4 py-3 font-medium">Создан</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-900 tabular-nums">
                        {p.amount_kzt.toLocaleString('ru-RU')} ₸
                      </td>
                      <td className="px-4 py-3">
                        <AdminPaymentStatusBadge status={p.status} />
                      </td>
                      <td className="px-4 py-3">
                        <Link to={`/admin/users/${p.user_id}`} className="text-emerald-700 font-medium hover:text-emerald-800 transition-colors">
                          открыть
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        {p.subscription_id ? (
                          <Link
                            to={`/admin/subscriptions/${p.subscription_id}`}
                            className="text-xs font-mono text-slate-600 hover:text-emerald-700 transition-colors"
                          >
                            {p.subscription_id.slice(0, 8)}…
                          </Link>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                        {new Date(p.created_at).toLocaleString('ru-RU')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {rows.length === 0 && <p className="text-slate-500 text-sm py-8">Нет платежей</p>}
            </div>
            <AdminPagination offset={offset} limit={limit} total={total} onOffsetChange={setOffset} onLimitChange={setLimit} />
          </>
        )}
      </div>
    </div>
  )
}
