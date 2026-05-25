import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Users,
  UserCog,
  CreditCard,
  Calendar,
  Headset,
  Wallet,
  FileEdit,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'
import { adminGetStats, type AdminStats } from '@/api/client'
import { adminSurface } from '@/lib/adminUi'

export function AdminOverview() {
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let c = false
    adminGetStats()
      .then((s) => {
        if (!c) setStats(s)
      })
      .catch((e) => {
        if (!c) setError(e instanceof Error ? e.message : 'Ошибка загрузки')
      })
      .finally(() => {
        if (!c) setLoading(false)
      })
    return () => {
      c = true
    }
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-500 text-sm">Загрузка…</p>
      </div>
    )
  }

  if (error) {
    return <p className="text-red-600 text-sm">{error}</p>
  }

  const primary = [
    { label: 'Клиенты', value: stats?.clients_count ?? 0, icon: Users, to: '/admin/users?role=client' },
    { label: 'Исполнители', value: stats?.executors_count ?? 0, icon: UserCog, to: '/admin/executors' },
    {
      label: 'Активные подписки',
      value: stats?.active_subscriptions_count ?? 0,
      icon: CreditCard,
      to: '/admin/subscriptions?status=active',
    },
    {
      label: 'Черновики подписок',
      value: stats?.draft_subscriptions_count ?? 0,
      icon: FileEdit,
      to: '/admin/subscriptions?status=draft',
    },
    { label: 'Визиты сегодня', value: stats?.visits_today_count ?? 0, icon: Calendar, to: '/admin/visits' },
    {
      label: 'Визиты 7 дней',
      value: stats?.visits_next_7_days_count ?? 0,
      icon: Calendar,
      to: '/admin/visits',
    },
    {
      label: 'Завершено за 7 дн.',
      value: stats?.visits_completed_last_7_days_count ?? 0,
      icon: CheckCircle2,
      to: '/admin/visits?status=completed',
    },
    {
      label: 'Открытые тикеты',
      value: stats?.open_tickets_count ?? 0,
      icon: Headset,
      to: '/admin/support?status=open',
    },
    {
      label: 'Тикеты в работе',
      value: stats?.support_in_progress_count ?? 0,
      icon: Headset,
      to: '/admin/support?status=in_progress',
    },
    {
      label: 'Платежи в ожидании',
      value: stats?.pending_payments_count ?? 0,
      icon: Wallet,
      to: '/admin/payments',
      highlight: true as const,
    },
  ]

  return (
    <div className="space-y-8 min-w-0">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">Панель управления</h1>
        <p className="text-slate-500 text-sm">Сводка и быстрые переходы к разделам</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {primary.map((stat, idx) => {
          const Icon = stat.icon
          const highlight = 'highlight' in stat && stat.highlight
          return (
            <Link key={stat.label} to={stat.to} className="block min-w-0">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className={`p-5 rounded-2xl shadow-sm border relative overflow-hidden group transition-shadow hover:shadow-md h-full ${
                  highlight ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200/60 bg-white'
                }`}
              >
                <div
                  className={`absolute top-0 right-0 p-5 opacity-5 group-hover:opacity-10 transition-opacity ${
                    highlight ? 'text-amber-600' : 'text-emerald-600'
                  }`}
                >
                  <Icon size={64} />
                </div>
                <div className="flex justify-between items-start mb-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      highlight ? 'bg-amber-100 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                    }`}
                  >
                    <Icon size={20} />
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-slate-900 font-mono tracking-tight tabular-nums">{stat.value}</div>
                  <span className="text-slate-500 text-sm font-medium mt-1 block">{stat.label}</span>
                </div>
              </motion.div>
            </Link>
          )
        })}
      </div>

      <div className={`${adminSurface} p-6`}>
        <h2 className="text-lg font-semibold text-slate-900 mb-6">Быстрые действия</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { path: '/admin/users', label: 'Все пользователи', icon: Users },
            { path: '/admin/visits', label: 'Все визиты', icon: Calendar },
            { path: '/admin/subscriptions', label: 'Все подписки', icon: CreditCard },
            { path: '/admin/support', label: 'Поддержка', icon: Headset },
            { path: '/admin/payments', label: 'Платежи', icon: Wallet },
          ].map((action) => {
            const Icon = action.icon
            return (
              <Link
                key={action.path}
                to={action.path}
                className="flex items-center justify-between p-4 rounded-xl border border-slate-200/60 hover:border-emerald-200 hover:bg-emerald-50/50 transition-colors group min-w-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon size={18} className="text-slate-400 group-hover:text-emerald-600 transition-colors shrink-0" />
                  <span className="text-sm font-medium text-slate-700 group-hover:text-emerald-800 transition-colors truncate">
                    {action.label}
                  </span>
                </div>
                <ArrowRight size={16} className="text-slate-300 group-hover:text-emerald-600 transition-colors shrink-0" />
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
