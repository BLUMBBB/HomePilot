import { Users, UserCog, CreditCard, FileText, Calendar, CheckCircle2, Headset, Wallet, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';

const stats = [
  { label: 'Клиенты', value: '5', icon: Users },
  { label: 'Исполнители', value: '3', icon: UserCog },
  { label: 'Активные подписки', value: '5', icon: CreditCard },
  { label: 'Черновики подписок', value: '1', icon: FileText },
  { label: 'Визиты сегодня', value: '0', icon: Calendar },
  { label: 'Визиты 7 дней', value: '0', icon: Calendar },
  { label: 'Завершено за 7 дн.', value: '1', icon: CheckCircle2 },
  { label: 'Открытые тикеты', value: '0', icon: Headset },
  { label: 'Тикеты в работе', value: '0', icon: Headset },
  { label: 'Платежи в ожидании', value: '9', icon: Wallet, highlight: true },
];

export default function Overview() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">Панель управления</h1>
        <p className="text-slate-500 text-sm">Сводка и быстрые переходы к разделам</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stats.map((stat, idx) => (
          <motion.div 
            key={idx} 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`bg-white p-5 rounded-2xl shadow-sm border relative overflow-hidden group transition-shadow hover:shadow-md ${stat.highlight ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200/60'}`}
          >
            <div className={`absolute top-0 right-0 p-5 opacity-5 group-hover:opacity-10 transition-opacity ${stat.highlight ? 'text-amber-600' : 'text-emerald-600'}`}>
              <stat.icon size={64} />
            </div>
            <div className="flex justify-between items-start mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.highlight ? 'bg-amber-100 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                <stat.icon size={20} />
              </div>
            </div>
            <div>
              <div className="text-3xl font-bold text-slate-900 font-mono tracking-tight">{stat.value}</div>
              <span className="text-slate-500 text-sm font-medium mt-1 block">{stat.label}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/60">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">Быстрые действия</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
            { path: '/users', label: 'Все пользователи', icon: Users },
            { path: '/visits', label: 'Все визиты', icon: Calendar },
            { path: '/subscriptions', label: 'Все подписки', icon: CreditCard },
            { path: '/support', label: 'Поддержка', icon: Headset },
            { path: '/payments', label: 'Платежи', icon: Wallet },
          ].map((action, idx) => (
            <Link 
              key={idx}
              to={action.path} 
              className="flex items-center justify-between p-4 rounded-xl border border-slate-200/60 hover:border-emerald-200 hover:bg-emerald-50/50 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <action.icon size={18} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
                <span className="text-sm font-medium text-slate-700 group-hover:text-emerald-800 transition-colors">{action.label}</span>
              </div>
              <ArrowRight size={16} className="text-slate-300 group-hover:text-emerald-600 transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
