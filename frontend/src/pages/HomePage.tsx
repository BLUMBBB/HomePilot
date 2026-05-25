import { motion } from 'framer-motion'
import { Check, Star, Shield, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTariffs } from '@/hooks/useTariffs'
import { BrandMark } from '@/components/BrandLogo'
import {
  BRAND_HOME_HERO,
  BRAND_HOME_SECONDARY_1,
  BRAND_HOME_SECONDARY_2,
} from '@/lib/brand'

/** Краткое описание тарифов для главной (по коду). */
const HOME_TARIFF_DESC: Record<string, { desc: string; features: string[] }> = {
  start: { desc: '4 слота бытовой помощи в месяц для студии или 1-комн.: уборка, мусор, закуп, простые поручения.', features: ['4 слота по 1,5–2 часа', 'Лёгкая уборка + вынос мусора', 'По желанию: закуп или мелкие дела', 'Один исполнитель и фото-отчёты'] },
  basic: { desc: '4 слота по 2–3 часа: полная уборка, быт и немного мелкого ремонта для квартиры любого размера.', features: ['4 слота по 2–3 часа', 'Полная уборка + мусор', 'Смена белья, полив цветов, закуп', 'До 1–2 простых ремонтов в месяц'] },
  optimum: { desc: '8 слотов в месяц: частая поддержка порядка и регулярное решение бытовых задач.', features: ['8 слотов по 1,5–2 часа', 'Лёгкая уборка 2 раза в неделю', 'Отдельные слоты под закуп и поручения', 'До 2 слотов под мелкий ремонт'] },
  comfort: { desc: '8 слотов по 2–3 часа для семей и больших квартир: максимум порядка и бытовой помощи.', features: ['Полная уборка + быт 2 раза в неделю', 'Регулярные закупы и уход за домом', 'До 3 слотов под мелкий ремонт', 'Приоритетная поддержка'] },
  premium: { desc: 'Домашний менеджмент под ключ: всё из Комфорт + расширенные лимиты по закупам и ремонтам.', features: ['8 слотов с приоритетом по времени', 'Больше ремонтов и поручений в рамках регламента', 'Объединение слотов в длинные визиты', 'Персональные настройки под ваш образ жизни'] },
}

export function HomePage() {
  const { isAuthenticated } = useAuth()
  const { tariffs, loading: tariffsLoading, minMaxForTariff } = useTariffs()
  const subscribeTo = isAuthenticated ? '/booking' : '/register'
  return (
    <div className="flex flex-col gap-16 sm:gap-24 md:gap-32 pb-20 sm:pb-32 bg-cream-50 overflow-x-hidden">
      {/* Hero */}
      <section className="relative pt-24 sm:pt-28 md:pt-32 pb-12 sm:pb-20 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto space-y-5 sm:space-y-6 md:space-y-8 mb-12 sm:mb-16 md:mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center rounded-full border border-forest-900/10 bg-white px-4 py-1.5 text-sm font-medium text-forest-900 shadow-sm"
            >
              <span className="flex h-2 w-2 rounded-full bg-forest-600 mr-2" />
              Улучшаем дома в Алматы
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-serif font-medium tracking-tight text-forest-950 leading-[0.95] px-1"
            >
              Подписка <br />
              <span className="italic text-forest-800">на бытовую жизнь.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-base sm:text-lg md:text-xl text-stone-600 max-w-xl leading-relaxed font-light px-2"
            >
              Единая подписка, которая закрывает рутину дома: уборка, вынос мусора, закуп продуктов, выгул животных и мелкие дела. Вы живёте, мы разбираемся с бытом.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 pt-2 sm:pt-4 w-full sm:w-auto"
            >
              <Link to={subscribeTo} className="w-full sm:w-auto max-w-xs sm:max-w-none mx-auto sm:mx-0">
                <Button size="lg" className="w-full sm:w-auto text-base sm:text-lg h-12 sm:h-14 px-8 sm:px-10 bg-forest-900 hover:bg-forest-800 text-cream-50 rounded-full">
                  Оформить подписку на быт
                </Button>
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative h-[240px] sm:h-[320px] md:h-[420px] lg:h-[520px] xl:h-[600px] w-full rounded-2xl sm:rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-2xl shadow-forest-900/10"
          >
            <img
              src={BRAND_HOME_HERO}
              alt="Уютный дом — HomePilot"
              className="object-cover w-full h-full"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 md:bottom-12 md:left-12 md:right-12 flex flex-col sm:flex-row justify-end gap-3 sm:justify-between sm:items-end text-white">
              <div className="hidden md:block">
                <p className="text-sm font-medium uppercase tracking-widest opacity-80 mb-2">Доступность</p>
                <p className="text-xl md:text-2xl font-serif">Ограниченное количество мест</p>
              </div>
              <div className="flex items-center gap-3 sm:gap-4 bg-white/10 backdrop-blur-md p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/20 w-full sm:w-auto min-w-0">
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <BrandMark className="h-9 w-9 sm:h-10 sm:w-10 rounded-full border-2 border-white shadow-md" />
                  <div className="hidden sm:flex h-9 w-9 sm:h-10 sm:w-10 rounded-full border-2 border-white bg-forest-900/40 items-center justify-center text-[10px] sm:text-xs font-semibold text-white">
                    2k+
                  </div>
                </div>
                <div className="text-left min-w-0">
                  <div className="flex items-center gap-0.5 sm:gap-1 text-yellow-300">
                    <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current shrink-0" />
                    <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current shrink-0" />
                    <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current shrink-0" />
                    <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current shrink-0" />
                    <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current shrink-0" />
                  </div>
                  <p className="text-xs sm:text-sm font-medium truncate">Нам доверяют 2,000+ семей</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="container mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 md:gap-16 lg:gap-20 items-center">
          <div className="space-y-6 md:space-y-8 min-w-0">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif text-forest-950 leading-tight">
              Мы не просто убираем. <br />
              <span className="italic text-forest-700">Мы берём быт на себя.</span>
            </h2>
            <p className="text-base sm:text-lg text-stone-600 leading-relaxed">
              Наша философия проста: ваш дом должен быть источником энергии, а не списка дел. Мы переосмыслили сервис: вместо «разовой уборки» — подписка на бытовые задачи с понятными слотами и чек-листами.
            </p>
            <div className="space-y-4 md:space-y-6 pt-2 md:pt-4">
              {[
                { title: 'Проверенные мастера', desc: 'Наши исполнители проходят отбор и обучение: от уборки до бытовых поручений.' },
                { title: 'Все бытовые задачи в одном месте', desc: 'Уборка, мусор, закуп, выгул, мелкий ремонт и поручения — в рамках одной подписки и расписания.' },
                { title: 'Возвращённое время', desc: 'Сэкономьте 15+ часов в месяц на быте и посвятите их семье, работе или отдыху.' },
              ].map((item, i) => (
                <div key={i} className="flex gap-4 md:gap-6 items-start group min-w-0">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-forest-900/20 flex items-center justify-center text-forest-900 group-hover:bg-forest-900 group-hover:text-cream-50 transition-colors shrink-0">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-lg sm:text-xl font-serif font-medium text-forest-950 mb-1 sm:mb-2">{item.title}</h3>
                    <p className="text-sm sm:text-base text-stone-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative min-w-0">
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6">
              <div className="space-y-3 sm:space-y-4 md:space-y-6 mt-6 sm:mt-8 md:mt-12">
                <img
                  src={BRAND_HOME_SECONDARY_1}
                  className="rounded-xl sm:rounded-2xl md:rounded-[2rem] w-full aspect-[3/4] object-cover shadow-lg"
                  alt="Бытовая помощь HomePilot"
                />
                <div className="bg-forest-900 p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl md:rounded-[2rem] text-cream-50">
                  <p className="font-serif text-2xl sm:text-3xl mb-1 sm:mb-2">4.9/5</p>
                  <p className="text-xs sm:text-sm opacity-80">Средний рейтинг на основе 5,000 уборок</p>
                </div>
              </div>
              <div className="space-y-3 sm:space-y-4 md:space-y-6">
                <div className="bg-cream-200 p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl md:rounded-[2rem] text-forest-900">
                  <Shield className="w-6 h-6 sm:w-8 sm:h-8 mb-2 sm:mb-4" />
                  <p className="font-serif text-base sm:text-lg md:text-xl">100% Гарантия качества</p>
                </div>
                <img
                  src={BRAND_HOME_SECONDARY_2}
                  className="rounded-xl sm:rounded-2xl md:rounded-[2rem] w-full aspect-[3/4] object-cover shadow-lg"
                  alt="Подписка на уборку и быт"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="bg-forest-950 py-16 sm:py-24 md:py-32 text-cream-50 rounded-2xl sm:rounded-[2rem] md:rounded-[3rem] mx-2 sm:mx-4">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16 md:mb-20">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif mb-4 sm:mb-6 px-2">Уровни бытовой подписки</h2>
            <p className="text-cream-200/60 text-sm sm:text-base md:text-lg px-2">Фиксированная цена за месяц, слоты бытовой помощи и понятный состав задач. Никаких скрытых комиссий.</p>
            <Link to="/tariffs" className="inline-block mt-4 text-sm font-medium text-forest-300 hover:text-cream-50 transition-colors underline underline-offset-4">
              Подробнее о тарифах и сетке цен →
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6 max-w-7xl mx-auto">
            {tariffsLoading ? (
              <div className="col-span-full text-center py-12 text-cream-200">Загрузка тарифов...</div>
            ) : (
              tariffs.map((tariff) => {
                const { min: priceMin } = minMaxForTariff(tariff.id)
                const priceStr = priceMin > 0 ? `${priceMin.toLocaleString('ru-KZ')} ₸` : '—'
                const content = HOME_TARIFF_DESC[tariff.code] ?? { desc: '', features: [] }
                const popular = tariff.code === 'basic'
                return (
                  <div
                    key={tariff.id}
                    className={`relative p-5 sm:p-6 md:p-8 rounded-2xl sm:rounded-[2rem] md:rounded-[2.5rem] flex flex-col transition-transform hover:-translate-y-2 duration-300 min-w-0 ${popular ? 'bg-cream-50 text-forest-950' : 'bg-white/5 border border-white/10 text-cream-50'}`}
                  >
                    {popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-forest-500 text-white px-3 py-1 rounded-full text-xs sm:text-sm font-medium tracking-wide uppercase">
                        Популярный
                      </div>
                    )}
                    <div className="mb-5 sm:mb-6 md:mb-8 min-w-0">
                      <h3 className="font-serif text-xl sm:text-2xl mb-1 sm:mb-2">{tariff.name}</h3>
                      <div className="flex items-baseline gap-1 flex-wrap">
                        <span className="text-2xl sm:text-3xl md:text-4xl font-bold break-words">{tariff.prices?.length ? `от ${priceStr}` : '—'}</span>
                        <span className={`text-xs sm:text-sm ${popular ? 'text-stone-500' : 'text-white/40'}`}>/мес</span>
                      </div>
                      <p className={`mt-3 sm:mt-4 text-xs sm:text-sm ${popular ? 'text-stone-500' : 'text-white/60'}`}>{content.desc}</p>
                    </div>
                    <ul className="space-y-2 sm:space-y-3 md:space-y-4 mb-5 sm:mb-6 md:mb-8 flex-1 min-w-0">
                      {content.features.map((f, j) => (
                        <li key={j} className="flex items-start gap-2 sm:gap-3">
                          <Check className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 mt-0.5 ${popular ? 'text-forest-600' : 'text-forest-400'}`} />
                          <span className={`text-xs sm:text-sm ${popular ? 'text-stone-700' : 'text-white/80'}`}>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Link to={subscribeTo} className="w-full min-w-0">
                      <Button className={`w-full h-12 sm:h-14 rounded-xl sm:rounded-2xl text-sm sm:text-base ${popular ? 'bg-forest-900 text-cream-50 hover:bg-forest-800' : 'bg-white/10 text-white hover:bg-white/20 border-0'}`}>
                        Выбрать {tariff.name}
                      </Button>
                    </Link>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 sm:px-6 text-center pb-12 sm:pb-16">
        <div className="max-w-3xl mx-auto space-y-5 sm:space-y-6 md:space-y-8">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif text-forest-950 px-2">Готовы снять с себя быт?</h2>
          <p className="text-base sm:text-lg md:text-xl text-stone-600 px-2">Присоединяйтесь к подписке HomePilot: мы возьмём на себя уборку, закупы, вынос мусора и мелкие дела по дому.</p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
            <Link to={subscribeTo} className="w-full sm:w-auto max-w-xs sm:max-w-none">
              <Button size="lg" className="w-full sm:w-auto h-14 sm:h-16 px-8 sm:px-12 text-base sm:text-lg rounded-full bg-forest-900 hover:bg-forest-800 text-cream-50 shadow-xl shadow-forest-900/20">
                Начать путешествие <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5 inline" />
              </Button>
            </Link>
            <Link to="/how-it-works" className="text-stone-600 hover:text-forest-900 font-medium transition-colors text-sm sm:text-base">
              Как это работает →
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
