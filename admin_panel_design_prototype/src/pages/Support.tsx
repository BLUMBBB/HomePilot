import { Search, Filter, MessageSquare, ChevronDown } from 'lucide-react';

const tickets = [
  { id: 'T-1029', user: 'nurs@em.com', name: 'nurs tay', subject: 'Проблема с оплатой', status: 'open', priority: 'high', date: '11.04.2026' },
  { id: 'T-1028', user: 'danil@em.com', name: 'Данил Колбасенко', subject: 'Вопрос по тарифу', status: 'in_progress', priority: 'medium', date: '10.04.2026' },
  { id: 'T-1027', user: 'nurs@em.com', name: 'nurs tay', subject: 'Не пришел мастер', status: 'resolved', priority: 'high', date: '08.04.2026' },
];

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    open: 'bg-rose-50 text-rose-700 border-rose-200',
    in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
    resolved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    closed: 'bg-slate-100 text-slate-700 border-slate-200',
  };
  
  const labels: Record<string, string> = {
    open: 'Открыт',
    in_progress: 'В работе',
    resolved: 'Решён',
    closed: 'Закрыт',
  };

  return (
    <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${styles[status] || styles.closed}`}>
      {labels[status] || status}
    </span>
  );
};

const PriorityBadge = ({ priority }: { priority: string }) => {
  const styles: Record<string, string> = {
    high: 'text-rose-600',
    medium: 'text-amber-600',
    low: 'text-emerald-600',
  };
  
  const labels: Record<string, string> = {
    high: 'Высокий',
    medium: 'Средний',
    low: 'Низкий',
  };

  return (
    <span className={`flex items-center gap-1.5 text-xs font-medium ${styles[priority] || 'text-slate-600'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${priority === 'high' ? 'bg-rose-500' : priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
      {labels[priority] || priority}
    </span>
  );
};

export default function Support() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">Поддержка</h1>
          <p className="text-slate-500 text-sm">Обращения клиентов и тикеты</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button className="px-4 py-2 bg-[#064e3b] text-white rounded-lg text-sm font-medium shadow-sm hover:bg-[#064e3b]/90 transition-colors">Все</button>
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-lg text-sm font-medium transition-colors shadow-sm">Открытые</button>
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-lg text-sm font-medium transition-colors shadow-sm">В работе</button>
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-lg text-sm font-medium transition-colors shadow-sm">Решённые</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-900">Поиск и фильтры</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Тема тикета (часть текста)</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Поиск по теме..." 
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-700 shadow-sm transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5">ID пользователя</label>
            <input 
              type="text" 
              placeholder="UUID" 
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-700 shadow-sm transition-all"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <button className="px-4 py-2 bg-emerald-50 text-emerald-700 font-medium rounded-lg hover:bg-emerald-100 transition-colors text-sm border border-emerald-200/50 shadow-sm">
            Применить фильтры
          </button>
          <button className="px-4 py-2 text-slate-500 font-medium hover:text-slate-700 transition-colors text-sm">
            Сбросить
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-200/60 bg-slate-50/50">
          <h2 className="text-sm font-semibold text-slate-900">Список тикетов</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white text-slate-500 border-b border-slate-200/60">
              <tr>
                <th className="px-6 py-3.5 font-medium">ID</th>
                <th className="px-6 py-3.5 font-medium">Пользователь</th>
                <th className="px-6 py-3.5 font-medium">Тема</th>
                <th className="px-6 py-3.5 font-medium">Статус</th>
                <th className="px-6 py-3.5 font-medium">Приоритет</th>
                <th className="px-6 py-3.5 font-medium">Дата</th>
                <th className="px-6 py-3.5 font-medium text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tickets.map((ticket, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4 font-mono text-slate-500 text-xs">{ticket.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{ticket.name}</div>
                    <div className="text-slate-500 text-xs mt-0.5">{ticket.user}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-700 font-medium">{ticket.subject}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="px-6 py-4">
                    <PriorityBadge priority={ticket.priority} />
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs">{ticket.date}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm ml-auto" title="Открыть диалог">
                      <MessageSquare size={14} />
                      Ответить
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-200/60 bg-slate-50/50 flex items-center justify-between text-sm text-slate-500">
          <div>Показано 1–3 из 3</div>
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
