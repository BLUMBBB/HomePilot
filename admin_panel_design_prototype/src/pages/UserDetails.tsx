import { ArrowLeft, Copy, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function UserDetails() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <Link to="/users" className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-700 transition-colors text-sm font-medium mb-6">
          <ArrowLeft size={16} />
          К списку пользователей
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mb-2">admin@homepilot.kz</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200">
                Администратор
              </span>
              <span className="inline-flex items-center gap-1.5 text-emerald-700 text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Активен
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-600 text-xs font-medium">
                <CheckCircle2 size={14} className="text-emerald-500" />
                Email подтверждён
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 bg-slate-100 px-3 py-2 rounded-lg border border-slate-200">
            <span className="text-slate-400 text-xs font-medium uppercase tracking-wider">ID</span>
            <span className="text-slate-700 text-sm font-mono">58687d85-adb4-46e6-be56-9e7998956062</span>
            <button className="text-slate-400 hover:text-slate-600 transition-colors ml-2" title="Копировать ID">
              <Copy size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Левая колонка */}
        <div className="lg:col-span-1 space-y-6">
          {/* Аккаунт */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-6">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Управление аккаунтом</h2>
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex gap-3">
              <AlertCircle size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-amber-800 text-sm leading-relaxed">
                Деактивация запрещает вход. Нельзя отключить собственную учётную запись из API.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button className="w-full px-4 py-2.5 border border-slate-200 text-slate-400 font-medium rounded-lg cursor-not-allowed bg-slate-50">
                Активировать
              </button>
              <button className="w-full px-4 py-2.5 border border-rose-200 text-rose-600 font-medium rounded-lg hover:bg-rose-50 transition-colors">
                Деактивировать
              </button>
            </div>
          </div>
        </div>

        {/* Правая колонка */}
        <div className="lg:col-span-2 space-y-6">
          {/* Подписки */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="p-5 border-b border-slate-200/60 flex justify-between items-center">
              <h2 className="text-base font-semibold text-slate-900">Подписки</h2>
              <a href="#" className="text-emerald-600 hover:text-emerald-700 text-sm font-medium transition-colors">Все подписки</a>
            </div>
            <div className="p-8 text-center text-slate-500 text-sm">
              Нет активных подписок
            </div>
          </div>

          {/* Визиты */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="p-5 border-b border-slate-200/60">
              <h2 className="text-base font-semibold text-slate-900">Последние визиты</h2>
            </div>
            <div className="p-8 text-center text-slate-500 text-sm">
              Нет истории визитов
            </div>
          </div>

          {/* Платежи */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="p-5 border-b border-slate-200/60">
              <h2 className="text-base font-semibold text-slate-900">Платежи</h2>
            </div>
            <div className="p-8 text-center text-slate-500 text-sm">
              Нет истории платежей
            </div>
          </div>

          {/* Обращения в поддержку */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="p-5 border-b border-slate-200/60">
              <h2 className="text-base font-semibold text-slate-900">Обращения в поддержку</h2>
            </div>
            <div className="p-8 text-center text-slate-500 text-sm">
              Нет открытых тикетов
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
