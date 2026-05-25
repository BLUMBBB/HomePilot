import { motion } from 'framer-motion'
import { Calendar, UserCheck, Bell, CheckCircle, Camera, MessageCircle, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

const steps = [
  {
    num: '01',
    icon: Calendar,
    title: 'Выберите тариф и квартиру',
    desc: 'Выберите уровень бытовой подписки (Старт, Базовый, Оптимум, Комфорт или Премиум), укажите тип квартиры — студия, 1-, 2- или 3-комнатная — и удобные дни и временное окно для слотов бытовой помощи.',
    subtext: 'Цена зависит от типа квартиры и количества слотов в месяц. Всё прозрачно: фикс за месяц подписки в тенге.',
  },
  {
    num: '02',
    icon: UserCheck,
    title: 'Мы назначаем исполнителя',
    desc: 'Мы закрепляем за вами исполнителя и фиксируем расписание слотов в календаре в приложении. Один и тот же человек будет приезжать к вам — так мы обеспечиваем предсказуемое качество и меньше времени на дорогу.',
    subtext: 'Закрепление за адресом — стандарт HomePilot. Вы всегда знаете, кто приедет.',
  },
  {
    num: '03',
    icon: Bell,
    title: 'В день слота — напоминание',
    desc: 'В день слота вы получаете напоминание. Нужно обеспечить доступ в квартиру: вы дома, ключ консьержу или код домофона — как договоритесь заранее.',
    subtext: 'Исполнитель приезжает в согласованное окно (например, 10:00–12:00).',
  },
  {
    num: '04',
    icon: CheckCircle,
    title: 'Исполнитель приезжает и закрывает задачи',
    desc: 'Исполнитель выполняет задачи по чек-листу в пределах нормы времени слота для вашего типа квартиры: уборка, вынос мусора, закуп, выгул, простые ремонты и поручения — в зависимости от выбранного тарифа и ваших приоритетов.',
    subtext: 'Нормы времени: от 1,5 ч (минимальный слот) до 4 ч (для больших квартир в старших тарифах). Никаких «растягиваний» — всё по чек-листу и в рамках договорённого времени.',
  },
  {
    num: '05',
    icon: Camera,
    title: 'Фото-отчёт в приложении',
    desc: 'После каждого слота в приложении появляется фото-отчёт. Вы видите результат и можете быть спокойны. Если что-то не так — пишите в поддержку; при подтверждённой претензии мы делаем повторный визит или компенсацию.',
    subtext: 'Гарантия качества — часть каждого тарифа.',
  },
  {
    num: '06',
    icon: MessageCircle,
    title: 'Поддержка и продление',
    desc: 'Поддержка в чате или по звонку при любых вопросах. Оплата подписки списывается ежемесячно. Перенос слота — бесплатно при уведомлении за 24 часа. При необходимости можно поставить подписку на паузу (по правилам оферты).',
    subtext: 'Отмена подписки — в любое время, доступ до конца оплаченного периода.',
  },
]

const guarantees = [
  { title: 'Один исполнитель', desc: 'Закрепление за вашим адресом для стабильного качества' },
  { title: 'Чек-лист и норма', desc: 'Прозрачный объём работ, без перерасхода времени' },
  { title: 'Фото-отчёт', desc: 'Вы всегда видите результат после каждого визита' },
  { title: 'Гарантия', desc: 'Повторный визит или компенсация при претензии' },
]

export function HowItWorksPage() {
  const { isAuthenticated } = useAuth()
  const subscribeTo = isAuthenticated ? '/booking' : '/register'

  return (
    <div className="bg-cream-50 min-h-screen pb-20">
      {/* Header Section */}
      <div className="pt-32 pb-20 text-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-forest-100 shadow-sm mb-8">
            <span className="flex h-2 w-2 rounded-full bg-forest-600" />
            <span className="text-sm font-medium text-forest-900">Простой и прозрачный процесс</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-serif text-forest-950 mb-6">
            Как это работает
          </h1>
          <p className="text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
            От выбора тарифа до фото-отчёта после уборки — всё через приложение.
            Без скрытых условий и лишних звонков.
          </p>
        </motion.div>
      </div>

      {/* Steps List */}
      <div className="container mx-auto px-6 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon
            return (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="bg-white rounded-[2.5rem] p-8 border border-stone-100 shadow-lg shadow-stone-200/50 hover:shadow-xl hover:shadow-forest-900/5 transition-all duration-300 flex flex-col h-full group"
              >
                <div className="flex items-center justify-between mb-8">
                  <span className="text-6xl font-serif text-forest-200 font-bold leading-none group-hover:text-forest-300 transition-colors select-none">
                    {step.num}
                  </span>
                  <div className="w-16 h-16 rounded-2xl bg-forest-50 text-forest-600 flex items-center justify-center group-hover:bg-forest-900 group-hover:text-cream-50 transition-colors duration-300">
                    <Icon className="w-8 h-8" />
                  </div>
                </div>

                <div className="flex-1">
                  <h3 className="text-2xl font-serif text-forest-950 mb-4 min-h-[3rem]">{step.title}</h3>
                  <p className="text-stone-600 leading-relaxed mb-6 text-base">
                    {step.desc}
                  </p>
                </div>

                <div className="mt-auto pt-6 border-t border-stone-100">
                  <div className="bg-cream-50 rounded-xl p-4 border border-cream-100">
                    <p className="text-sm text-stone-500 italic flex gap-2 items-start">
                      <span className="text-forest-400 font-serif text-lg leading-none mt-0.5">i</span>
                      <span>{step.subtext}</span>
                    </p>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Guarantee Section */}
      <div className="container mx-auto px-6 max-w-7xl mt-32">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-serif text-forest-950 mb-4">Что мы гарантируем</h2>
          <p className="text-stone-600">На каждом этапе мы заботимся о предсказуемости и качестве сервиса.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {guarantees.map((item, i) => (
            <div
              key={i}
              className="bg-white p-8 rounded-[2rem] border border-stone-100 flex flex-col items-center text-center gap-4 hover:-translate-y-1 transition-transform duration-300"
            >
              <div className="w-14 h-14 rounded-full bg-forest-50 text-forest-600 flex items-center justify-center shrink-0 mb-2">
                <CheckCircle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="font-serif text-xl text-forest-950 mb-2">{item.title}</h3>
                <p className="text-stone-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary / CTA */}
      <div className="container mx-auto px-6 mt-32 mb-12">
        <div className="bg-forest-950 rounded-[3rem] p-8 md:p-20 text-center text-cream-50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5" />

          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-serif mb-8">Кратко: шесть шагов к свободе от быта</h2>

            <div className="flex flex-wrap justify-center gap-4 mb-12 text-sm font-medium">
              {[
                'Тариф и адрес',
                'Назначение исполнителя',
                'Напоминание в день слота',
                'Задачи по чек-листу',
                'Фото-отчёт',
                'Поддержка и продление',
              ].map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="px-4 py-2 rounded-full bg-white/10 border border-white/10 backdrop-blur-sm">
                    {step}
                  </span>
                  {i < 5 && <ArrowRight className="w-4 h-4 text-forest-400 hidden md:block" />}
                </div>
              ))}
            </div>

            <h3 className="text-3xl font-serif mb-8">Готовы начать?</h3>
            <p className="text-cream-200/80 mb-10 text-lg">
              Выберите тариф, укажите адрес и удобное время — мы сделаем остальное.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={subscribeTo}>
                <Button className="h-14 px-10 rounded-full text-lg font-medium bg-forest-500 hover:bg-forest-400 text-white shadow-lg shadow-forest-500/20 border-none">
                  Заказать уборку <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/tariffs">
                <Button
                  variant="outline"
                  className="h-14 px-10 rounded-full text-lg font-medium border-white/20 text-white hover:bg-white/10 hover:text-white"
                >
                  Смотреть тарифы
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
