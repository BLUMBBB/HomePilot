import { ChevronDown, Search, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';

const users = [
  { email: 'admin@homepilot.kz', name: 'Администратор', phone: '—', role: 'admin', emailConfirmed: true, status: 'активен' },
  { email: 'danil@em.com', name: 'Данил Колбасенко', phone: '—', role: 'client', emailConfirmed: true, status: 'активен' },
  { email: 'executor3@homepilot.kz', name: 'Динара Касымова', phone: '—', role: 'executor', emailConfirmed: true, status: 'активен' },
  { email: 'executor2@homepilot.kz', name: 'Мадина Оспанова', phone: '—', role: 'executor', emailConfirmed: true, status: 'активен' },
  { email: 'executor1@homepilot.kz', name: 'Айгуль Сарсенова', phone: '—', role: 'executor', emailConfirmed: true, status: 'активен' },
  { email: 'nurs@em.com', name: 'nurs tay', phone: '—', role: 'client', emailConfirmed: true, status: 'активен' },
  { email: 'gen@em.com', name: 'gen gen', phone: '—', role: 'client', emailConfirmed: true, status: 'активен' },
  { email: 'name@em.com', name: 'Tayteldiev Nursultan', phone: '—', role: 'client', emailConfirmed: true, status: 'активен' },
  { email: 'nursultantayteldiev@gmail.com', name: 'fdfd fdfd', phone: '—', role: 'client', emailConfirmed: true, status: 'активен' },
];

const RoleBadge = ({ role }: { role: string }) => {
  const styles: Record<string, string> = {
    admin: 'bg-purple-100 text-purple-700 border-purple-200',
    client: 'bg-blue-100 text-blue-700 border-blue-200',
    executor: 'bg-amber-100 text-amber-700 border-amber-200',
  };
  
  const labels: Record<string, string> = {
    admin: 'Админ',
    client: 'Клиент',
    executor: 'Исполнитель',
  };

  return (
    <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${styles[role] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
      {labels[role] || role}
    </span>
  );
};

export default function Users() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-1">Пользователи</h1>
          <p className="text-slate-500 text-sm">Управление аккаунтами и ролями</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-[#064e3b] text-white rounded-lg text-sm font-medium shadow-sm hover:bg-[#064e3b]/90 transition-colors">Все роли</button>
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-lg text-sm font-medium transition-colors shadow-sm">Клиенты</button>
          <button className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 rounded-lg text-sm font-medium transition-colors shadow-sm">Исполнители</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-200/60 bg-slate-50/50 flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative w-full max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Поиск по email или имени..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all shadow-sm"
            />
          </div>
          
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg p-1 shadow-sm">
              <button className="px-3 py-1.5 bg-slate-100 rounded-md text-slate-800 text-sm font-medium">Все</button>
              <button className="px-3 py-1.5 text-slate-600 hover:text-slate-800 text-sm font-medium transition-colors">Активные</button>
            </div>
            <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 text-sm font-medium shadow-sm transition-colors">
              <Filter size={16} className="text-slate-400" />
              Фильтры
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200/60">
              <tr>
                <th className="px-6 py-3.5 font-medium">Пользователь</th>
                <th className="px-6 py-3.5 font-medium">Телефон</th>
                <th className="px-6 py-3.5 font-medium">Роль</th>
                <th className="px-6 py-3.5 font-medium">Email подтв.</th>
                <th className="px-6 py-3.5 font-medium">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <Link to={`/users/${user.email}`} className="text-slate-900 font-medium group-hover:text-emerald-700 transition-colors">
                        {user.name}
                      </Link>
                      <span className="text-slate-500 text-xs mt-0.5">{user.email}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-mono text-xs">{user.phone}</td>
                  <td className="px-6 py-4">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-6 py-4">
                    {user.emailConfirmed ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md text-xs font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Да
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-slate-500 bg-slate-50 px-2 py-1 rounded-md text-xs font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                        Нет
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 text-emerald-700 text-xs font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {user.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-200/60 bg-slate-50/50 flex items-center justify-between text-sm text-slate-500">
          <div>Показано 1–9 из 9</div>
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
