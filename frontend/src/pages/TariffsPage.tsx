import { motion } from 'framer-motion'
import { Check, ArrowRight, Clock, Shield } from 'lucide-react'
import { BrandMark } from '@/components/BrandLogo'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTariffs } from '@/hooks/useTariffs'
import type { TariffItem } from '@/api/client'

/** Тексты карточек по коду тарифа (нет в API). */
const TARIFF_CONTENT: Record<
  string,
  { forWho: string; includes: string[]; timeNote: string }
> = {
  start: {
    forWho: 'Тот, кто хочет передать базовый бытовой минимум и протестировать сервис без больших трат: одинокий человек или пара, студия или 1-комн.',
    includes: [
      '4 слота бытовой помощи в месяц (раз в неделю) по 1,5–2 часа',
      'В каждый слот можно выбрать до 2–3 задач из списка: лёгкая уборка, вынос мусора, небольшой закуп, выгул питомца, простые поручения',
      'Один и тот же исполнитель (закрепление за вашим адресом по возможности)',
      'Фото-отчёт после каждого слота в приложении',
      'Поддержка в чате/звонком при вопросах или претензиях',
    ],
    timeNote: 'Норма времени: 1,5–2 ч для студии/1-комн. за слот.',
  },
  basic: {
    forWho: 'Семья или занятый человек с квартирой любого размера, кому нужна регулярная уборка и часть бытовых задач «под ключ».',
    includes: [
      '4 слота по 2–3 часа (раз в неделю)',
      'Полная уборка квартиры + вынос мусора',
      'Смена постельного белья, полив комнатных растений, закуп продуктов/хозтоваров по списку',
      'Закрепление исполнителя за вашим адресом',
      'Фото-отчёт после каждого слота',
      'Поддержка и гарантия: при обоснованной претензии — повторный визит или компенсация',
    ],
    timeNote: 'Студия — 2 ч, 1-комн. — 2,5 ч, 2-комн. — 3 ч, 3-комн. — 4 ч за слот.',
  },
  optimum: {
    forWho: 'Кто ценит частоту: хочется, чтобы порядок и бытовые дела держались под контролем два раза в неделю.',
    includes: [
      '8 слотов в месяц (2 раза в неделю) по 1,5–2 часа',
      'Комбинация лёгкой уборки, выноса мусора и бытовых задач (закуп, поручения)',
      'До 2 слотов в месяц можно использовать преимущественно под мелкий ремонт в рамках регламента',
      'Закрепление исполнителя, фото-отчёт после каждого слота',
      'Подписку можно поставить на паузу до 2 недель (по правилам оферты)',
    ],
    timeNote: 'От 1,5 ч (студия) до 2 ч (3-комн.) за слот.',
  },
  comfort: {
    forWho: 'Семья или большой дом, где нужен высокий уровень порядка и регулярное решение бытовых задач.',
    includes: [
      '8 слотов по 2–3 часа в месяц (2 раза в неделю)',
      'Полная уборка, вынос мусора, смена белья, полив цветов, глажка в разумном объёме',
      'Регулярные закупы и бытовые поручения',
      'Приоритетная поддержка и гарантия при претензиях',
      'Перенос бесплатен при уведомлении за 24 ч',
    ],
    timeNote: 'От 2 до 4 часов за слот в зависимости от типа квартиры.',
  },
  premium: {
    forWho: 'Кто хочет вынести на HomePilot не только уборку, но и почти весь быт: от закупов до мелкого ремонта и поручений.',
    includes: [
      'Всё из тарифа «Комфорт» (8 слотов по 2–3 часа)',
      'Расширенные лимиты по закупам и бытовым поручениям',
      'Расширенный перечень мелкого ремонта в рамках безопасных работ',
      'Возможность объединять слоты в длинные визиты для сложных задач',
      'Постоянный исполнитель, приоритетные слоты и поддержка',
    ],
    timeNote: 'Те же слоты, при необходимости отдельные длинные визиты по договорённости.',
  },
}

export function TariffsPage() {
  const { isAuthenticated } = useAuth()
  const { tariffs, apartmentTypes, aptOrder, loading, error, minMaxForTariff } = useTariffs()
  const subscribeTo = isAuthenticated ? '/booking' : '/register'

  /** Сетка цен по типу уборки: из тарифов бэкенда (light = start + optimum, full = basic + comfort) */
  const priceGridRows = (() => {
    if (!tariffs.length || !apartmentTypes.length) return []
    const byCode = Object.fromEntries(tariffs.map((t) => [t.code, t]))
    const aptIds = aptOrder.map((a) => a.id)
    const getPrice = (t: TariffItem, aptId: string) =>
      t.prices.find((p) => p.apartment_type_id === aptId)?.price_month_kzt ?? 0
    const row = (typeLabel: string, tariff4: TariffItem | undefined, tariff8: TariffItem | undefined) => {
      const cells: number[] = []
      if (tariff4) aptIds.forEach((aptId) => cells.push(getPrice(tariff4, aptId)))
      if (tariff8) aptIds.forEach((aptId) => cells.push(getPrice(tariff8, aptId)))
      return { type: typeLabel, tariff4, tariff8, cells }
    }
    return [
      row('Лёгкая уборка', byCode['start'], byCode['optimum']),
      row('Полная уборка', byCode['basic'], byCode['comfort']),
    ].filter((r) => r.cells.some((c) => c > 0))
  })()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f9f8f4] flex items-center justify-center py-32">
        <p className="text-stone-500">Загрузка тарифов...</p>
      </div>
    )
  }
  if (error) {
    return (
      <div className="min-h-screen bg-[#f9f8f4] flex items-center justify-center py-32">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="bg-cream-50 min-h-screen pb-20">
      {/* Header Section */}
      <div className="pt-32 pb-16 text-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-forest-100 shadow-sm mb-8">
            <BrandMark className="h-5 w-5 rounded-full ring-1 ring-forest-900/15" />
            <span className="text-sm font-medium text-forest-900">Прозрачные цены в тенге</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-serif text-forest-950 mb-6">
            Тарифы бытовой подписки
          </h1>
          <p className="text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
            Вы платите фиксированную сумму в месяц и получаете слоты бытовой помощи.
            В каждом слоте — комбинация уборки и других задач по дому в рамках вашего тарифа.
          </p>
        </motion.div>
      </div>

      {/* Plans List */}
      <div className="container mx-auto px-6 max-w-6xl space-y-8">
        {tariffs.map((tariff, index) => {
          const { min: priceFrom, max: priceTo } = minMaxForTariff(tariff.id)
          const content = TARIFF_CONTENT[tariff.code] ?? { forWho: '', includes: [], timeNote: '' }
          const popular = tariff.code === 'basic'
          const typeLabel =
            tariff.visits_per_month === 4
              ? '4 слота бытовой помощи'
              : tariff.visits_per_month === 8
                ? '8 слотов бытовой помощи'
                : `${tariff.visits_per_month} слотов`
          const badges = [typeLabel, `${tariff.visits_per_month} слотов в месяц`]
          const priceRange =
            priceTo !== priceFrom
              ? `от ${priceFrom.toLocaleString('ru-KZ')} ₸ до ${priceTo.toLocaleString('ru-KZ')} ₸`
              : `${priceFrom.toLocaleString('ru-KZ')} ₸`
          return (
            <motion.div
              key={tariff.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative bg-white rounded-[2.5rem] p-8 md:p-12 border transition-all duration-300 ${
                popular
                  ? 'border-forest-500 shadow-xl shadow-forest-900/5 ring-1 ring-forest-500'
                  : 'border-stone-100 shadow-lg shadow-stone-200/50'
              }`}
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-4xl font-serif text-forest-950">{tariff.name}</h2>
                  {popular && (
                    <span className="bg-forest-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      Популярный
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl md:text-3xl font-bold text-forest-900">
                    {priceRange}
                  </div>
                  <div className="text-stone-500 text-sm">/месяц</div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-8">
                {badges.map((badge, i) => (
                  <span
                    key={i}
                    className={`px-4 py-2 rounded-full text-sm font-medium ${
                      i === 0 ? 'bg-forest-100 text-forest-800' : 'bg-cream-200 text-stone-800'
                    }`}
                  >
                    {badge}
                  </span>
                ))}
              </div>

              <div className="space-y-6 mb-8">
                <div>
                  <h4 className="font-serif text-lg text-stone-500 mb-2 uppercase tracking-wide text-xs font-bold">
                    Для кого
                  </h4>
                  <p className="text-stone-800 text-lg leading-relaxed">{content.forWho}</p>
                </div>

                <div>
                  <h4 className="font-serif text-lg text-stone-500 mb-4 uppercase tracking-wide text-xs font-bold">
                    Что входит
                  </h4>
                  <ul className="space-y-3">
                    {content.includes.map((point, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="mt-1 w-5 h-5 rounded-full bg-forest-50 text-forest-600 flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3" />
                        </div>
                        <span className="text-stone-700">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-start gap-2 text-stone-500 text-sm pt-4 border-t border-stone-100">
                  <Clock className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{content.timeNote}</span>
                </div>
              </div>

              <Link to={subscribeTo}>
                <Button className="w-auto px-8 h-12 rounded-xl text-base font-medium bg-forest-900 hover:bg-forest-800 text-white transition-all">
                  Выбрать {tariff.name} <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </motion.div>
          )
        })}
      </div>

      {/* Price Grid Section */}
      {priceGridRows.length > 0 && aptOrder.length > 0 && (
        <div className="container mx-auto px-6 max-w-6xl mt-24">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-serif text-forest-950 mb-4">Сетка цен по типу квартиры</h2>
            <p className="text-stone-600">Цены с бэкенда (тарифы и типы квартир).</p>
          </div>

          <div className="bg-white rounded-[2rem] shadow-lg border border-stone-100 overflow-hidden overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="bg-cream-50 border-b border-stone-100">
                  <th className="p-6 text-left font-serif text-forest-900">Тип уборки</th>
                  {aptOrder.map((apt) => (
                    <th key={apt.id} className="p-6 text-left font-medium text-stone-600 text-sm">
                      {apt.name}
                      <br />
                      <span className="text-stone-400">4 визита</span>
                    </th>
                  ))}
                  {aptOrder.map((apt) => (
                    <th key={`8-${apt.id}`} className="p-6 text-left font-medium text-stone-600 text-sm">
                      {apt.name}
                      <br />
                      <span className="text-stone-400">8 визитов</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {priceGridRows.map((row, i) => (
                  <tr key={i} className="hover:bg-cream-50/50 transition-colors">
                    <td className="p-6 font-medium text-forest-900">{row.type}</td>
                    {row.cells.map((cell, j) => (
                      <td key={j} className="p-6 text-stone-700">
                        {cell > 0 ? cell.toLocaleString('ru-KZ') + ' ₸' : '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Rules Section */}
      <div className="container mx-auto px-6 max-w-6xl mt-24">
        <div className="bg-forest-950 rounded-[3rem] p-8 md:p-16 text-cream-50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-forest-800 rounded-full blur-3xl -mr-20 -mt-20 opacity-50" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <Shield className="w-8 h-8 text-forest-400" />
              <h2 className="text-3xl font-serif">Правила подписки</h2>
              <p className="text-forest-200/60 text-sm ml-2">Перенос, отмена, пауза</p>
            </div>
            <div className="space-y-8">
              <div>
                <h3 className="font-serif text-xl text-forest-200 mb-2">Перенос визита</h3>
                <p className="text-white/70 leading-relaxed text-sm">
                  Бесплатно при уведомлении не менее чем за 24 часа. При переносе менее чем за 24 часа визит считается состоявшимся (или 1 бесплатный перенос в месяц с коротким уведомлением).
                </p>
              </div>
              <div>
                <h3 className="font-serif text-xl text-forest-200 mb-2">Отмена</h3>
                <p className="text-white/70 leading-relaxed text-sm">
                  Отмена клиентом менее чем за 24 часа — визит списывается с пакета, повторный выезд не переносится автоматически.
                </p>
              </div>
              <div>
                <h3 className="font-serif text-xl text-forest-200 mb-2">Пауза подписки</h3>
                <p className="text-white/70 leading-relaxed text-sm">
                  Не более 2 недель подряд и не чаще 2 раз в год. В период паузы списание с пакета не идёт.
                </p>
              </div>
              <div>
                <h3 className="font-serif text-xl text-forest-200 mb-2">Неявка</h3>
                <p className="text-white/70 leading-relaxed text-sm">
                  Если клиент не обеспечил доступ (не открыл дверь, не оставил ключ) — визит считается состоявшимся и списывается с пакета.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-6 text-center mt-24 mb-12">
        <h2 className="text-4xl font-serif text-forest-950 mb-6">Выберите подходящий тариф</h2>
        <p className="text-stone-600 max-w-2xl mx-auto mb-8">
          Укажите тип квартиры и удобное расписание — мы подберём вариант и закрепим за вами исполнителя.
        </p>
        <Link to={subscribeTo}>
          <Button className="h-14 px-10 rounded-full text-lg font-medium bg-forest-900 hover:bg-forest-800 text-white shadow-xl shadow-forest-900/20">
            {isAuthenticated ? 'Оформить подписку' : 'Перейти к бронированию'}{' '}
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </Link>
      </div>
    </div>
  )
}
