import { Plus, Copy, ShieldAlert, Ban, CalendarDays } from 'lucide-react';

export default function Executors() {
  const invites = [
    { code: 'X-e3GlZsmUrt...', expires: '11.04.2026, 09:41:19', used: '—' }
  ];

  const executors = [
    { name: 'Айгуль Сарсенова', email: 'executor1@homepilot.kz', visits: '0', role: 'active', account: 'активен' },
    { name: 'Динара Касымова', email: 'executor3@homepilot.kz', visits: '0', role: 'active', account: 'активен' },
    { name: 'Мадина Оспанова', email: 'executor2@homepilot.kz', visits: '0', role: 'active', account: 'активен' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">Исполнители</h1>
          <p className="text-slate-500 text-sm">Нагрузка на 14 дней, блокировка роли и входа в аккаунт</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-[#064e3b] text-white font-medium rounded-lg hover:bg-[#064e3b]/90 transition-colors shadow-sm text-sm">
          <Plus size={18} />
          Создать приглашение
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="p-5 border-b border-slate-200/60 bg-slate-50/50">
          <h2 className="text-sm font-semibold text-slate-900">Последние приглашения</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white text-slate-500 border-b border-slate-200/60">
              <tr>
                <th className="px-6 py-3.5 font-medium">Код (начало)</th>
                <th className="px-6 py-3.5 font-medium">Истекает</th>
                <th className="px-6 py-3.5 font-medium">Использовано</th>
                <th className="px-6 py-3.5 font-medium text-right">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invites.map((inv, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4 font-mono text-slate-700">{inv.code}</td>
                  <td className="px-6 py-4 text-slate-600">{inv.expires}</td>
                  <td className="px-6 py-4 text-slate-400">{inv.used}</td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors" title="Копировать код">
                      <Copy size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
        <div className="p-5 border-b border-slate-200/60 bg-slate-50/50">
          <h2 className="text-sm font-semibold text-slate-900">Список исполнителей</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-white text-slate-500 border-b border-slate-200/60">
              <tr>
                <th className="px-6 py-3.5 font-medium">Имя / email</th>
                <th className="px-6 py-3.5 font-medium">Визитов (14 дн.)</th>
                <th className="px-6 py-3.5 font-medium">Роль</th>
                <th className="px-6 py-3.5 font-medium">Аккаунт</th>
                <th className="px-6 py-3.5 font-medium text-right">Управление</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {executors.map((exec, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{exec.name}</div>
                    <div className="text-slate-500 text-xs mt-0.5">{exec.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-700 font-medium">
                      {exec.visits}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md text-xs font-medium border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Активен
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 text-emerald-700 text-xs font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {exec.account}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm" title="Расписание визитов">
                        <CalendarDays size={14} />
                        Визиты
                      </button>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 border border-amber-200 text-amber-700 bg-amber-50 rounded-lg text-xs font-medium hover:bg-amber-100 transition-colors shadow-sm" title="Заблокировать роль">
                        <ShieldAlert size={14} />
                        Блок
                      </button>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 border border-rose-200 text-rose-700 bg-rose-50 rounded-lg text-xs font-medium hover:bg-rose-100 transition-colors shadow-sm" title="Отключить вход">
                        <Ban size={14} />
                        Вход
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
