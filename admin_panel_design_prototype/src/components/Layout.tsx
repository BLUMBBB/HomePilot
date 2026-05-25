import { Link, useLocation, Outlet } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Calendar, 
  UserCog, 
  Headset, 
  Wallet,
  LogOut,
  Sparkles,
  Bell,
  Search
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { AnimatePresence, motion } from 'motion/react';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const navItems = [
  { path: '/', label: 'Обзор', icon: LayoutDashboard },
  { path: '/users', label: 'Пользователи', icon: Users },
  { path: '/subscriptions', label: 'Подписки', icon: CreditCard },
  { path: '/visits', label: 'Визиты', icon: Calendar },
  { path: '/executors', label: 'Исполнители', icon: UserCog },
  { path: '/support', label: 'Поддержка', icon: Headset },
  { path: '/payments', label: 'Платежи', icon: Wallet },
];

export default function Layout() {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-[#F7F9F8] font-sans text-slate-900 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#064e3b] text-white flex flex-col shadow-xl z-20 relative">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-emerald-400 rounded-lg flex items-center justify-center text-[#064e3b] shadow-inner">
              <Sparkles size={18} />
            </div>
            <span className="font-sans text-xl font-bold tracking-tight">HomePilot</span>
          </div>
          <div className="text-xs font-medium text-emerald-200/70 ml-11 uppercase tracking-wider">Admin Panel</div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                  isActive 
                    ? "bg-emerald-800/50 text-white font-medium shadow-sm" 
                    : "text-emerald-100/70 hover:bg-emerald-800/30 hover:text-white"
                )}
              >
                {isActive && (
                  <motion.div 
                    layoutId="active-nav" 
                    className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-400 rounded-r-full" 
                  />
                )}
                <item.icon size={18} className={cn(
                  "transition-colors",
                  isActive ? "text-emerald-400" : "text-emerald-100/50 group-hover:text-emerald-200"
                )} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 space-y-1 border-t border-emerald-800/50 bg-[#064e3b]">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-emerald-100/70 hover:bg-emerald-800/30 hover:text-white transition-colors group">
            <LogOut size={18} className="text-emerald-100/50 group-hover:text-emerald-200" />
            <span className="font-medium">Выйти</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-8 z-10 shrink-0">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Поиск по системе..." 
                className="w-full pl-9 pr-4 py-2 bg-slate-100/50 border-transparent rounded-lg text-sm focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-full hover:bg-slate-100">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="w-px h-6 bg-slate-200"></div>
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="text-right hidden md:block">
                <div className="text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">Администратор</div>
                <div className="text-xs text-slate-500">admin@homepilot.kz</div>
              </div>
              <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm border border-emerald-200">
                А
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
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
  );
}
