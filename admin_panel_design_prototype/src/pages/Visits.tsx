import { ChevronDown, Calendar as CalendarIcon, Search, Filter } from 'lucide-react';

const visits = [
  { date: '2026-04-09', time: '10:00–12:00', client: 'nurs@em.com', executor: 'Айгуль Сарсенова', status: 'scheduled', sub: '59dfc9c0...' },
  { date: '2026-04-08', time: '10:00–12:00', client: 'nurs@em.com', executor: 'Мадина Оспанова', status: 'scheduled', sub: '59dfc9c0...' },
  { date: '2026-04-08', time: '10:00–12:00', client: 'nurs@em.com', executor: 'Айгуль Сарсенова', status: 'scheduled', sub: '07021bf8...' },
  { date: '2026-04-07', time: '10:00–12:00', client: 'nurs@em.com', executor: 'Мадина Оспанова', status: 'scheduled', sub: '59dfc9c0...' },
  { date: '2026-04-07', time: '10:00–12:00', client: 'nurs@em.com', executor: 'Айгуль Сарсенова', status: 'scheduled', sub: '07021bf8...' },
];

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
    in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
  };
  
  const labels: Record<string, string> = {
    scheduled: 'Запланирован',
    in_progress: 'В работе',
    completed: 'Завершён',
    cancelled: 'Отменён',
  };

  return (
    <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${styles[status] || styles.scheduled}`}>
      {labels[status] || status}
    </span>
  );
};

export default function Visits() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">Визиты</h1>
          <p className="text-slate-500 text-sm">Расписание и контроль выполнения работ</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button className="px-4 py-2 bg-[#064e3b] text-white rounded-lg text-sm font-medium shadow-sm hover:bg-[#064e3b]/90 transition-colors">Все</button>
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-lg text-sm font-medium transition-colors shadow-sm">Запланирован</button>
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-lg text-sm font-medium transition-colors shadow-sm">В работе</button>
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-lg text-sm font-medium transition-colors shadow-sm">Завершён</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-900">Фильтры</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Дата с</label>
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
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Дата по</label>
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
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Исполнитель</label>
            <div className="relative">
              <select className="w-full appearance-none px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-700 shadow-sm transition-all">
                <option>Все исполнители</option>
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">ID подписки</label>
            <input 
              type="text" 
              placeholder="UUID" 
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-700 shadow-sm transition-all"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-emerald-50 text-emerald-700 font-medium rounded-lg hover:bg-emerald-100 transition-colors text-sm border border-emerald-200/50 shadow-sm">
            Применить фильтры
          </button>
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors text-sm shadow-sm">
            Только сегодня
          </button>
          <button className="px-4 py-2 text-slate-500 font-medium hover:text-slate-700 transition-colors text-sm">
            Сбросить
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-200/60 bg-slate-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Поиск по клиенту (email или имя)..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200/60">
              <tr>
                <th className="px-6 py-3.5 font-medium">Дата и время</th>
                <th className="px-6 py-3.5 font-medium">Клиент</th>
                <th className="px-6 py-3.5 font-medium">Исполнитель</th>
                <th className="px-6 py-3.5 font-medium">Статус</th>
                <th className="px-6 py-3.5 font-medium">Подписка</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visits.map((visit, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{visit.date}</div>
                    <div className="text-slate-500 text-xs mt-0.5">{visit.time}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-700">{visit.client}</td>
                  <td className="px-6 py-4 text-slate-700">{visit.executor}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={visit.status} />
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-mono text-xs">{visit.sub}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-200/60 bg-slate-50/50 flex items-center justify-between text-sm text-slate-500">
          <div>Показано 1–5 из 5</div>
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
