import { useEffect } from 'react'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LayoutGroup, motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  Users,
  Calendar,
  CreditCard,
  Headset,
  LogOut,
  UserCog,
  Wallet,
  Bell,
  Search,
} from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { BrandMark } from '@/components/BrandLogo'
import { cn } from '@/lib/utils'
import { adminShellBg } from '@/lib/adminUi'

const sidebarItems = [
  { icon: LayoutDashboard, label: 'Обзор', path: '/admin' },
  { icon: Users, label: 'Пользователи', path: '/admin/users' },
  { icon: CreditCard, label: 'Подписки', path: '/admin/subscriptions' },
  { icon: Calendar, label: 'Визиты', path: '/admin/visits' },
  { icon: UserCog, label: 'Исполнители', path: '/admin/executors' },
  { icon: Headset, label: 'Поддержка', path: '/admin/support' },
  { icon: Wallet, label: 'Платежи', path: '/admin/payments' },
] as const

export function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, isAuthenticated, user } = useAuth()

  useEffect(() => {
    if (isAuthenticated === false) {
      navigate('/login', { replace: true, state: { from: location.pathname } })
      return
    }
    if (user && user.role !== 'admin' && user.role !== 'support') {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, user, navigate, location.pathname])

  if (isAuthenticated === false || !user) {
    return null
  }
  if (user.role !== 'admin' && user.role !== 'support') {
    return null
  }

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  const displayName =
    user.name?.trim() || (user.role === 'admin' ? 'Администратор' : 'Поддержка')
  const initial = (displayName[0] ?? user.email[0] ?? '?').toUpperCase()

  return (
    <div className={cn('flex min-h-screen md:h-screen font-sans text-stone-900 md:overflow-hidden', adminShellBg)}>
      <aside className="hidden md:flex w-64 bg-forest-950 text-cream-50 flex-col shadow-xl z-20 shrink-0">
        <div className="p-6">
          <Link to="/admin" className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-cream-50 rounded-lg flex items-center justify-center overflow-hidden shadow-inner ring-1 ring-forest-900/10">
              <BrandMark className="h-full w-full rounded-lg" />
            </div>
            <span className="text-xl font-bold tracking-tight">HomePilot</span>
          </Link>
          <div className="text-xs font-medium text-cream-200/80 ml-11 uppercase tracking-wider">Admin Panel</div>
        </div>

        <LayoutGroup>
          <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
            {sidebarItems.map((item) => {
              const Icon = item.icon
              const isActive =
                item.path === '/admin'
                  ? location.pathname === '/admin'
                  : location.pathname.startsWith(item.path)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
                    isActive
                      ? 'bg-forest-800 text-cream-50 font-medium shadow-sm'
                      : 'text-cream-200/80 hover:bg-forest-900 hover:text-cream-50',
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="admin-active-nav"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-cream-50 rounded-r-full"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon
                    size={18}
                    className={cn(
                      'transition-colors shrink-0',
                      isActive ? 'text-cream-50' : 'text-cream-200/60 group-hover:text-cream-50',
                    )}
                  />
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </LayoutGroup>

        <div className="p-4 space-y-1 border-t border-forest-900 bg-forest-950">
          <Link
            to="/"
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-cream-200/80 hover:bg-forest-900 hover:text-cream-50 transition-colors text-sm font-medium"
          >
            На сайт
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-cream-200/80 hover:bg-forest-900 hover:text-cream-50 transition-colors group"
          >
            <LogOut size={18} className="text-cream-200/60 group-hover:text-cream-50 shrink-0" />
            <span className="font-medium">Выйти</span>
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 md:overflow-hidden">
        <header className="h-14 sm:h-16 bg-white/80 backdrop-blur-md border-b border-cream-200 flex items-center justify-between px-4 sm:px-8 z-10 shrink-0 gap-3">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <div className="relative w-full max-w-md min-w-0 hidden sm:block">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
              <input
                type="search"
                placeholder="Поиск по системе…"
                className="w-full pl-9 pr-4 py-2 bg-cream-50 border border-transparent rounded-lg text-sm focus:bg-white focus:border-forest-700 focus:ring-2 focus:ring-forest-900/20 transition-all outline-none"
                aria-label="Поиск по системе"
              />
            </div>
            <span className="sm:hidden text-sm font-semibold text-forest-950 truncate">Админ</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <button
              type="button"
              className="relative p-2 text-stone-400 hover:text-stone-600 transition-colors rounded-full hover:bg-cream-100"
              aria-label="Уведомления"
            >
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white" />
            </button>
            <div className="w-px h-6 bg-cream-200 hidden sm:block" />
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="text-right hidden sm:block min-w-0">
                <div className="text-sm font-medium text-stone-700 truncate max-w-[160px]">{displayName}</div>
                <div className="text-xs text-stone-500 truncate max-w-[160px]">{user.email}</div>
              </div>
              <div className="w-9 h-9 rounded-full bg-forest-100 text-forest-800 flex items-center justify-center font-bold text-sm border border-forest-200 shrink-0">
                {initial}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <div className="max-w-6xl mx-auto w-full min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  )
}
