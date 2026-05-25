import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Calendar as CalendarIcon, Filter } from 'lucide-react'
import { adminListSubscriptions, getTariffs, type AdminSubscriptionRow, type TariffItem } from '@/api/client'
import { AdminPagination } from '@/components/admin/AdminPagination'
import { AdminSubscriptionStatusBadge } from '@/components/admin/AdminBadges'
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
import { cn } from '@/lib/utils'

function TariffBadge({ code }: { code: string }) {
  const c = code.toLowerCase()
  const styles: Record<string, string> = {
    start: 'bg-blue-50 text-blue-700 border-blue-200',
    comfort: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    optimum: 'bg-purple-50 text-purple-700 border-purple-200',
    premium: 'bg-amber-50 text-amber-700 border-amber-200',
  }
  return (
    <span
      className={cn(
        'px-2.5 py-1 rounded-md text-xs font-medium border uppercase tracking-wider',
        styles[c] ?? 'bg-slate-50 text-slate-700 border-slate-200',
      )}
    >
      {code}
    </span>
  )
}

export function AdminSubscriptions() {
  const [searchParams, setSearchParams] = useSearchParams()
  const statusQ = searchParams.get('status') ?? ''
  const userIdQ = searchParams.get('user_id') ?? ''
  const [tariffs, setTariffs] = useState<TariffItem[]>([])
  const [tariffId, setTariffId] = useState('')
  const [createdFrom, setCreatedFrom] = useState('')
  const [createdTo, setCreatedTo] = useState('')
  const [appliedFrom, setAppliedFrom] = useState('')
  const [appliedTo, setAppliedTo] = useState('')
  const [appliedTariff, setAppliedTariff] = useState('')
  const [rows, setRows] = useState<AdminSubscriptionRow[]>([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [limit, setLimit] = useState(25)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getTariffs('ru').then(setTariffs).catch(() => setTariffs([]))
  }, [])

  useEffect(() => {
    setOffset(0)
  }, [statusQ, userIdQ, appliedFrom, appliedTo, appliedTariff])

  useEffect(() => {
    let c = false
    setLoading(true)
    adminListSubscriptions({
      status: statusQ || undefined,
      user_id: userIdQ || undefined,
      tariff_id: appliedTariff || undefined,
      created_from: appliedFrom || undefined,
      created_to: appliedTo || undefined,
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
  }, [statusQ, userIdQ, appliedFrom, appliedTo, appliedTariff, limit, offset])

  function applyDateFilters() {
    setAppliedFrom(createdFrom)
    setAppliedTo(createdTo)
    setAppliedTariff(tariffId)
  }

  return (
    <div className="space-y-6 min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className={adminPageH1}>Подписки</h1>
          <p className={adminPageDesc}>
            Управление тарифами и статусами подписок
            {userIdQ ? ` · пользователь ${userIdQ.slice(0, 8)}…` : ''}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Все', value: '' },
            { label: 'Активные', value: 'active' },
            { label: 'Черновики', value: 'draft' },
            { label: 'Пауза', value: 'paused' },
            { label: 'Отмена', value: 'cancelled' },
          ].map(({ label, value }) => (
            <button
              key={value || 'all'}
              type="button"
              className={statusQ === value ? adminTabActive : adminTabInactive}
              onClick={() => {
                const next = new URLSearchParams(searchParams)
                if (value) next.set('status', value)
                else next.delete('status')
                setSearchParams(next)
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
          <h2 className="text-sm font-semibold text-slate-900">Фильтры</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Тариф</label>
            <select className={`${adminInput} h-10`} value={tariffId} onChange={(e) => setTariffId(e.target.value)}>
              <option value="">Все тарифы</option>
              {tariffs.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Создано с</label>
            <div className="relative">
              <input
                type="date"
                className={adminInput}
                value={createdFrom}
                onChange={(e) => setCreatedFrom(e.target.value)}
              />
              <CalendarIcon size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Создано по</label>
            <div className="relative">
              <input
                type="date"
                className={adminInput}
                value={createdTo}
                onChange={(e) => setCreatedTo(e.target.value)}
              />
              <CalendarIcon size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div className="flex items-end">
            <button type="button" className={`${adminApplyFiltersBtn} w-full`} onClick={applyDateFilters}>
              Применить фильтры
            </button>
          </div>
        </div>
      </div>

      <div className={`${adminSurface} overflow-hidden flex flex-col`}>
        <div className={adminInnerSearchWrap}>
          <p className="text-sm text-slate-600">Список подписок и переход в карточку</p>
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
                    <th className="px-6 py-3.5 font-medium">Тариф</th>
                    <th className="px-6 py-3.5 font-medium">Исполнитель</th>
                    <th className="px-6 py-3.5 font-medium">Статус</th>
                    <th className="px-6 py-3.5 font-medium">Цена / мес</th>
                    <th className="px-6 py-3.5 font-medium">Создана</th>
                    <th className="px-6 py-3.5 font-medium">Адрес</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rows.map((s) => {
                    const id = String(s.id)
                    const created = s.created_at ? new Date(String(s.created_at)).toLocaleDateString('ru-RU') : '—'
                    const code = String(s.tariff_code || '—')
                    return (
                      <tr key={id} className="hover:bg-slate-50/80 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex flex-col min-w-0">
                            <Link
                              to={`/admin/subscriptions/${id}`}
                              className="text-slate-900 font-medium group-hover:text-emerald-700 transition-colors truncate"
                            >
                              {(s.user_name as string) || (s.user_email as string) || String(s.user_id)}
                            </Link>
                            <span className="text-slate-500 text-xs mt-0.5 truncate">{(s.user_email as string) || ''}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">{code !== '—' ? <TariffBadge code={code} /> : '—'}</td>
                        <td className="px-6 py-4 text-slate-500">{(s.executor_name as string) || '—'}</td>
                        <td className="px-6 py-4">
                          <AdminSubscriptionStatusBadge status={String(s.status)} />
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-700">
                          {s.price_month_kzt != null ? `${Number(s.price_month_kzt).toLocaleString('ru-RU')} ₸` : '—'}
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs whitespace-nowrap">{created}</td>
                        <td className="px-6 py-4 text-slate-600 text-xs truncate max-w-[200px]" title={`${s.address_street || ''} ${s.address_flat || ''}`}>
                          {String(s.address_street || '')} {String(s.address_flat || '')}
                        </td>
                      </tr>
                    )
                  })}
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
