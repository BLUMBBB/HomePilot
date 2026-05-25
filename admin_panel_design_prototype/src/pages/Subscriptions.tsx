import { ChevronDown, Calendar as CalendarIcon, Search, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';

const subscriptions = [
  { user: 'nurs@em.com', name: 'nurs tay', tariff: 'start', executor: '—', status: 'active', price: '72 000 ₸', created: '04.04.2026', address: 'asd 12' },
  { user: 'nurs@em.com', name: 'nurs tay', tariff: 'start', executor: '—', status: 'active', price: '72 000 ₸', created: '03.04.2026', address: 'sd 12' },
  { user: 'danil@em.com', name: 'Данил Колбасенко', tariff: 'optimum', executor: '—', status: 'active', price: '132 000 ₸', created: '07.03.2026', address: 'пр Абая 123' },
  { user: 'nurs@em.com', name: 'nurs tay', tariff: 'premium', executor: '—', status: 'active', price: '331 200 ₸', created: '07.03.2026', address: 'пр Абая 77' },
  { user: 'nurs@em.com', name: 'nurs tay', tariff: 'comfort', executor: '—', status: 'active', price: '180 000 ₸', created: '07.03.2026', address: 'Улица Пушкина 12' },
  { user: 'nurs@em.com', name: 'nurs tay', tariff: 'start', executor: '—', status: 'draft', price: '72 000 ₸', created: '07.03.2026', address: 'Улица Пу 12' },
];

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    draft: 'bg-slate-100 text-slate-700 border-slate-200',
    paused: 'bg-amber-100 text-amber-700 border-amber-200',
    cancelled: 'bg-rose-100 text-rose-700 border-rose-200',
  };
  
  const labels: Record<string, string> = {
    active: 'Активна',
    draft: 'Черновик',
    paused: 'Пауза',
    cancelled: 'Отменена',
  };

  return (
    <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${styles[status] || styles.draft}`}>
      {labels[status] || status}
    </span>
  );
};

const TariffBadge = ({ tariff }: { tariff: string }) => {
  const styles: Record<string, string> = {
    start: 'bg-blue-50 text-blue-700 border-blue-200',
    comfort: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    optimum: 'bg-purple-50 text-purple-700 border-purple-200',
    premium: 'bg-amber-50 text-amber-700 border-amber-200',
  };
  
  return (
    <span className={`px-2.5 py-1 rounded-md text-xs font-medium border uppercase tracking-wider ${styles[tariff] || 'bg-slate-50 text-slate-700 border-slate-200'}`}>
      {tariff}
    </span>
  );
};

export default function Subscriptions() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">Подписки</h1>
          <p className="text-slate-500 text-sm">Управление тарифами и статусами подписок</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-[#064e3b] text-white rounded-lg text-sm font-medium shadow-sm hover:bg-[#064e3b]/90 transition-colors">Все</button>
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-lg text-sm font-medium transition-colors shadow-sm">Активные</button>
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-lg text-sm font-medium transition-colors shadow-sm">Черновики</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-900">Фильтры</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Тариф</label>
            <div className="relative">
              <select className="w-full appearance-none px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-700 shadow-sm transition-all">
                <option>Все тарифы</option>
                <option>Start</option>
                <option>Comfort</option>
                <option>Optimum</option>
                <option>Premium</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Создано с</label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="дд.мм.гггг" 
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-700 shadow-sm transition-all"
              />
              <CalendarIcon size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Создано по</label>
            <div className="relative">
              <input 
                type="text" 
                placeholder="дд.мм.гггг" 
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-700 shadow-sm transition-all"
              />
              <CalendarIcon size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div className="flex items-end">
            <button className="w-full px-4 py-2 bg-emerald-50 text-emerald-700 font-medium rounded-lg hover:bg-emerald-100 transition-colors text-sm border border-emerald-200/50 shadow-sm">
              Применить фильтры
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-200/60 bg-slate-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Поиск по пользователю или адресу..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200/60">
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
              {subscriptions.map((sub, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <Link to={`/users/${sub.user}`} className="text-slate-900 font-medium group-hover:text-emerald-700 transition-colors">
                        {sub.name}
                      </Link>
                      <span className="text-slate-500 text-xs mt-0.5">{sub.user}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <TariffBadge tariff={sub.tariff} />
                  </td>
                  <td className="px-6 py-4 text-slate-500">{sub.executor}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={sub.status} />
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">{sub.price}</td>
                  <td className="px-6 py-4 text-slate-500 text-xs">{sub.created}</td>
                  <td className="px-6 py-4 text-slate-600 text-xs truncate max-w-[200px]" title={sub.address}>{sub.address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-200/60 bg-slate-50/50 flex items-center justify-between text-sm text-slate-500">
          <div>Показано 1–6 из 6</div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span>Показывать:</span>
              <select className="bg-white border border-slate-200 rounded-md px-2 py-1 text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20">
                <option>25</option>
                <option>50</option>
                <option>100</option>
              </select>
            </div>
            <div className="flex gap-1">
              <button className="px-3 py-1.5 border border-slate-200 rounded-md text-slate-400 bg-slate-50 cursor-not-allowed">Пред.</button>
              <button className="px-3 py-1.5 border border-slate-200 rounded-md text-slate-400 bg-slate-50 cursor-not-allowed">След.</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
