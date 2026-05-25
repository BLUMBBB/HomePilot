import { Search, Filter, ChevronDown, Download, Calendar as CalendarIcon } from 'lucide-react';

const payments = [
  { id: 'P-9021', user: 'nurs@em.com', name: 'nurs tay', amount: '72 000 ₸', status: 'success', date: '04.04.2026, 14:30', method: 'Карта **** 4242' },
  { id: 'P-9020', user: 'nurs@em.com', name: 'nurs tay', amount: '72 000 ₸', status: 'success', date: '03.04.2026, 09:15', method: 'Карта **** 4242' },
  { id: 'P-9019', user: 'danil@em.com', name: 'Данил Колбасенко', amount: '132 000 ₸', status: 'success', date: '07.03.2026, 11:20', method: 'Kaspi Pay' },
  { id: 'P-9018', user: 'nurs@em.com', name: 'nurs tay', amount: '331 200 ₸', status: 'failed', date: '07.03.2026, 10:05', method: 'Карта **** 1121' },
];

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    failed: 'bg-rose-50 text-rose-700 border-rose-200',
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    refunded: 'bg-slate-100 text-slate-700 border-slate-200',
  };
  
  const labels: Record<string, string> = {
    success: 'Успешно',
    failed: 'Ошибка',
    pending: 'В обработке',
    refunded: 'Возврат',
  };

  return (
    <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${styles[status] || styles.pending}`}>
      {labels[status] || status}
    </span>
  );
};

export default function Payments() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">Платежи</h1>
          <p className="text-slate-500 text-sm">История транзакций и возвраты</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button className="px-4 py-2 bg-[#064e3b] text-white rounded-lg text-sm font-medium shadow-sm hover:bg-[#064e3b]/90 transition-colors">Все</button>
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-lg text-sm font-medium transition-colors shadow-sm">Успешные</button>
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-lg text-sm font-medium transition-colors shadow-sm">Ошибки</button>
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-lg text-sm font-medium transition-colors shadow-sm">Возвраты</button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-lg text-sm font-medium transition-colors shadow-sm ml-auto">
            <Download size={16} />
            Экспорт
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={18} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-900">Фильтры</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">Поиск по пользователю</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Email или имя..." 
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-700 shadow-sm transition-all"
              />
            </div>
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
          <h2 className="text-sm font-semibold text-slate-900">Список транзакций</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white text-slate-500 border-b border-slate-200/60">
              <tr>
                <th className="px-6 py-3.5 font-medium">ID транзакции</th>
                <th className="px-6 py-3.5 font-medium">Пользователь</th>
                <th className="px-6 py-3.5 font-medium">Сумма</th>
                <th className="px-6 py-3.5 font-medium">Статус</th>
                <th className="px-6 py-3.5 font-medium">Способ оплаты</th>
                <th className="px-6 py-3.5 font-medium">Дата и время</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((payment, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4 font-mono text-slate-500 text-xs">{payment.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{payment.name}</div>
                    <div className="text-slate-500 text-xs mt-0.5">{payment.user}</div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">{payment.amount}</td>
                  <td className="px-6 py-4">
                    <StatusBadge status={payment.status} />
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-xs">{payment.method}</td>
                  <td className="px-6 py-4 text-slate-500 text-xs">{payment.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-200/60 bg-slate-50/50 flex items-center justify-between text-sm text-slate-500">
          <div>Показано 1–4 из 4</div>
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
