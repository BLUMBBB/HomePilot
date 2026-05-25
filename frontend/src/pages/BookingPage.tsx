import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, ChevronRight, ChevronLeft, MapPin, Calendar, CreditCard, Home } from 'lucide-react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { useAuth } from '@/contexts/AuthContext'
import {
  getCities,
  getTariffs,
  getApartmentTypes,
  createSubscription,
  createPaymentIntent,
  submitCard,
  confirmPayment,
  type CityItem,
  type TariffItem,
  type ApartmentTypeItem,
} from '@/api/client'

const steps = [
  { id: 1, title: 'Тариф', icon: Home },
  { id: 2, title: 'Адрес', icon: MapPin },
  { id: 3, title: 'Время слотов', icon: Calendar },
  { id: 4, title: 'Оплата', icon: CreditCard },
]

function timeToSlot(t: string): string {
  return t + ':00'
}

export function BookingPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [cities, setCities] = useState<CityItem[]>([])
  const [tariffs, setTariffs] = useState<TariffItem[]>([])
  const [apartmentTypes, setApartmentTypes] = useState<ApartmentTypeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [currentStep, setCurrentStep] = useState(1)
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [cardSubmitted, setCardSubmitted] = useState(false)
  const [confirmCode, setConfirmCode] = useState('')
  const [cardData, setCardData] = useState({
    number: '',
    expMonth: '',
    expYear: '',
    cvc: '',
    name: '',
  })

  const [formData, setFormData] = useState({
    tariff_id: '',
    apartment_type_id: '',
    city_id: '',
    address_street: '',
    address_building: '',
    address_flat: '',
    address_entrance: '',
    address_floor: '',
    address_doorcode: '',
    address_comment: '',
    preferred_days: [] as number[],
    time_slot_start: '10:00',
    time_slot_end: '12:00',
    premium_linen: false,
    premium_plants: false,
    premium_ironing: false,
    accept_offer: false,
  })

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true })
      return
    }
    Promise.all([getCities(), getTariffs(), getApartmentTypes()])
      .then(([c, t, a]) => {
        setCities(c)
        setTariffs(t)
        setApartmentTypes(a)
        if (t.length && !formData.tariff_id) setFormData((prev) => ({ ...prev, tariff_id: t[0].id }))
        if (a.length && !formData.apartment_type_id) setFormData((prev) => ({ ...prev, apartment_type_id: a[0].id }))
        if (c.length && !formData.city_id) setFormData((prev) => ({ ...prev, city_id: c[0].id }))
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Ошибка загрузки'))
      .finally(() => setLoading(false))
  }, [isAuthenticated, navigate])

  const updateFormData = <K extends keyof typeof formData>(field: K, value: (typeof formData)[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  const selectedTariff = tariffs.find((t) => t.id === formData.tariff_id)
  const selectedApt = apartmentTypes.find((a) => a.id === formData.apartment_type_id)
  const price =
    selectedTariff?.prices.find((p) => p.apartment_type_id === formData.apartment_type_id)?.price_month_kzt ?? 0

  const cardNumberDigits = cardData.number.replace(/\D/g, '')
  const isCardFormValid =
    cardNumberDigits.length >= 13 &&
    cardNumberDigits.length <= 19 &&
    /^(0[1-9]|1[0-2])$/.test(cardData.expMonth.replace(/\D/g, '').padStart(2, '0').slice(-2)) &&
    /^\d{2}$/.test(cardData.expYear.replace(/\D/g, '').slice(-2)) &&
    cardData.cvc.length >= 3 &&
    cardData.cvc.length <= 4 &&
    /^\d+$/.test(cardData.cvc)

  const isStepComplete =
    currentStep === 1
      ? !!(formData.tariff_id && formData.apartment_type_id)
      : currentStep === 2
        ? !!(
            formData.city_id &&
            formData.address_street?.trim() &&
            formData.address_building?.trim() &&
            formData.address_flat?.trim()
          )
        : currentStep === 3
          ? formData.accept_offer
          : currentStep === 4 && paymentId
            ? cardSubmitted
              ? confirmCode.trim().length === 6
              : isCardFormValid
            : true

  const goToPaymentStep = async () => {
    if (
      !formData.tariff_id ||
      !formData.apartment_type_id ||
      !formData.city_id ||
      !formData.address_street?.trim() ||
      !formData.address_building?.trim() ||
      !formData.address_flat?.trim() ||
      !formData.accept_offer
    ) {
      setError('Заполните все обязательные поля и примите оферту.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const sub = await createSubscription({
        tariff_id: formData.tariff_id,
        apartment_type_id: formData.apartment_type_id,
        city_id: formData.city_id,
        address_street: formData.address_street.trim(),
        address_building: formData.address_building.trim(),
        address_flat: formData.address_flat.trim(),
        address_entrance: formData.address_entrance || null,
        address_floor: formData.address_floor || null,
        address_doorcode: formData.address_doorcode || null,
        address_comment: formData.address_comment || null,
        preferred_days: formData.preferred_days.length ? formData.preferred_days : [1, 2, 3, 4, 5],
        time_slot_start: timeToSlot(formData.time_slot_start || '10:00'),
        time_slot_end: timeToSlot(formData.time_slot_end || '13:00'),
        premium_linen: formData.premium_linen,
        premium_plants: formData.premium_plants,
        premium_ironing: formData.premium_ironing,
        accept_offer: true,
      })
      const origin = typeof window !== 'undefined' ? window.location.origin : ''
      const intent = await createPaymentIntent(sub.id, {
        return_url: origin ? `${origin}/dashboard/slots?payment=success` : undefined,
        cancel_url: origin ? `${origin}/booking` : undefined,
      })
      if (intent.provider === 'stripe' && intent.redirect_url) {
        window.location.assign(intent.redirect_url)
        return
      }
      setPaymentId(intent.payment_id)
      setCurrentStep(4)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка создания подписки')
    } finally {
      setSubmitting(false)
    }
  }

  const handleNext = () => {
    if (currentStep === 3) {
      goToPaymentStep()
      return
    }
    if (currentStep < steps.length && currentStep !== 3) setCurrentStep((s) => s + 1)
  }

  const handleBack = () => {
    if (currentStep > 1) {
      if (currentStep === 4) {
        setCardSubmitted(false)
        setConfirmCode('')
      }
      setCurrentStep((s) => s - 1)
    }
  }

  const handleSubmitCard = async () => {
    if (!paymentId || !isCardFormValid) return
    setSubmitting(true)
    setError(null)
    try {
      await submitCard({
        payment_id: paymentId,
        card_number: cardNumberDigits,
        exp_month: cardData.expMonth.replace(/\D/g, '').padStart(2, '0').slice(-2),
        exp_year: cardData.expYear.replace(/\D/g, '').slice(-2),
        cvc: cardData.cvc,
        cardholder_name: cardData.name.trim(),
      })
      setCardSubmitted(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка оплаты картой')
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirmPayment = async () => {
    if (!paymentId || confirmCode.trim().length !== 6) {
      setError('Введите 6-значный код подтверждения.')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      await confirmPayment(paymentId, confirmCode)
      navigate('/dashboard/slots', { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка подтверждения оплаты')
    } finally {
      setSubmitting(false)
    }
  }

  if (!isAuthenticated) return null
  if (loading) {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center">
        <p className="text-stone-500">Загрузка...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cream-50 py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 overflow-x-hidden">
      <div className="max-w-4xl mx-auto w-full min-w-0">
        <div className="mb-8 sm:mb-12">
          <div className="flex items-center justify-between relative max-w-2xl mx-auto gap-1 sm:gap-2">
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-stone-200 -z-10" />
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-forest-900 -z-10 transition-all duration-500"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            />
            {steps.map((step) => {
              const Icon = step.icon
              const isActive = step.id === currentStep
              const isCompleted = step.id < currentStep
              return (
                <div key={step.id} className="flex flex-col items-center gap-2 sm:gap-3 bg-cream-50 px-2 sm:px-4 min-w-0 flex-1">
                  <div
                    className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 shrink-0 ${
                      isActive || isCompleted
                        ? 'bg-forest-900 border-forest-900 text-cream-50'
                        : 'bg-white border-stone-200 text-stone-400'
                    }`}
                  >
                    {isCompleted ? <Check className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                  </div>
                  <span className={`text-[10px] sm:text-xs font-medium uppercase tracking-wider text-center ${isActive ? 'text-forest-900' : 'text-stone-400'}`}>
                    {step.title}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        <Card className="border-none shadow-2xl shadow-forest-900/5 overflow-hidden bg-white rounded-2xl sm:rounded-[2.5rem]">
          <div className="grid md:grid-cols-[1fr_300px]">
            <div className="p-5 sm:p-6 md:p-8 lg:p-12 min-w-0">
              <div className="mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-forest-950 mb-2">{steps[currentStep - 1].title}</h2>
                <p className="text-stone-500">
                  {currentStep === 4 && paymentId && !cardSubmitted
                    ? 'Введите данные карты для имитации оплаты. После нажатия «Оплатить» придёт код подтверждения.'
                    : currentStep === 4 && paymentId && cardSubmitted
                      ? 'Введите 6-значный код подтверждения списания.'
                      : currentStep === 4
                        ? 'После нажатия «Перейти к оплате» откроется форма ввода карты.'
                        : 'Заполните детали ниже. Мы создадим подписку с регулярными слотами бытовой помощи.'}
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-sm">{error}</div>
              )}

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
                  className="min-h-[300px]"
                >
                  {currentStep === 1 && (
                    <div className="grid gap-4">
                      {tariffs.map((tariff) => {
                        const aptPrice = tariff.prices.find((p) => p.apartment_type_id === formData.apartment_type_id)
                        const tariffPrice = aptPrice?.price_month_kzt ?? 0
                        return (
                          <div
                            key={tariff.id}
                            onClick={() => updateFormData('tariff_id', tariff.id)}
                            className={`cursor-pointer rounded-2xl border-2 p-6 transition-all flex items-center justify-between group ${
                              formData.tariff_id === tariff.id
                                ? 'border-forest-900 bg-forest-50/50'
                                : 'border-stone-100 bg-white hover:border-forest-200'
                            }`}
                          >
                            <div>
                              <h3 className="font-serif font-semibold text-lg text-forest-950">{tariff.name}</h3>
                              <p className="text-sm text-stone-500">
                                {tariff.visits_per_month} слотов в месяц · {tariff.cleaning_type === 'full' ? 'Полная уборка' : 'Лёгкая уборка'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-xl font-bold text-forest-900">{tariffPrice.toLocaleString('ru-KZ')} ₸</p>
                              {formData.tariff_id === tariff.id && <p className="text-xs text-forest-600 font-medium">Выбрано</p>}
                            </div>
                          </div>
                        )
                      })}
                      <div className="mt-4">
                        <label className="text-sm font-medium text-stone-700 block mb-2">Тип квартиры</label>
                        <div className="flex flex-wrap gap-2">
                          {apartmentTypes.map((apt) => (
                            <button
                              key={apt.id}
                              type="button"
                              onClick={() => updateFormData('apartment_type_id', apt.id)}
                              className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                                formData.apartment_type_id === apt.id
                                  ? 'bg-forest-900 text-white border-forest-900'
                                  : 'bg-white border-stone-200 hover:border-forest-300 text-stone-700'
                              }`}
                            >
                              {apt.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {currentStep === 2 && (
                    <div className="space-y-6 max-w-md">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-stone-700">Город</label>
                        <select
                          value={formData.city_id}
                          onChange={(e) => updateFormData('city_id', e.target.value)}
                          className="flex h-12 w-full rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-900"
                        >
                          {cities.map((c) => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-stone-700">Улица</label>
                          <Input
                            className="h-12 rounded-xl border-stone-200"
                            placeholder="пр. Абая"
                            value={formData.address_street}
                            onChange={(e) => updateFormData('address_street', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-stone-700">Дом</label>
                          <Input
                            className="h-12 rounded-xl border-stone-200"
                            placeholder="123"
                            value={formData.address_building}
                            onChange={(e) => updateFormData('address_building', e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-stone-700">Квартира</label>
                          <Input
                            className="h-12 rounded-xl border-stone-200"
                            placeholder="45"
                            value={formData.address_flat}
                            onChange={(e) => updateFormData('address_flat', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-stone-700">Подъезд</label>
                          <Input
                            className="h-12 rounded-xl border-stone-200"
                            placeholder="1"
                            value={formData.address_entrance}
                            onChange={(e) => updateFormData('address_entrance', e.target.value)}
                            inputMode="numeric"
                            autoComplete="off"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-stone-700">Этаж</label>
                          <Input
                            className="h-12 rounded-xl border-stone-200"
                            placeholder="4"
                            value={formData.address_floor}
                            onChange={(e) => updateFormData('address_floor', e.target.value)}
                            inputMode="numeric"
                            autoComplete="off"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-stone-700">Код домофона (необязательно)</label>
                        <Input
                          className="h-12 rounded-xl border-stone-200"
                          placeholder="1234#"
                          value={formData.address_doorcode}
                          onChange={(e) => updateFormData('address_doorcode', e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {currentStep === 3 && (
                    <div className="space-y-8 max-w-md">
                      <p className="text-stone-600">
                        После оплаты вы перейдёте в личный кабинет, где укажете <strong>дату и время для каждого визита</strong> по вашей подписке (по одному слоту на каждый визит в месяц).
                      </p>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.accept_offer}
                          onChange={(e) => updateFormData('accept_offer', e.target.checked)}
                          className="rounded border-stone-300 text-forest-900 focus:ring-forest-900"
                        />
                        <span className="text-sm text-stone-700">
                          Принимаю{' '}
                          <Link
                            to="/legal/offer"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-forest-900 font-medium underline underline-offset-2 hover:text-forest-800"
                            onClick={(e) => e.stopPropagation()}
                          >
                            условия оферты подписки
                          </Link>
                        </span>
                      </label>
                    </div>
                  )}

                  {currentStep === 4 && paymentId && !cardSubmitted && (
                    <div className="max-w-md space-y-5">
                      <p className="text-stone-600 text-sm">Введите данные карты для имитации оплаты. Данные нигде не сохраняются.</p>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-stone-700">Номер карты</label>
                        <Input
                          className="h-12 rounded-xl border-stone-200 font-mono tracking-wider"
                          placeholder="0000 0000 0000 0000"
                          maxLength={19}
                          value={(cardData.number.match(/.{1,4}/g) || []).join(' ')}
                          onChange={(e) => setCardData((prev) => ({ ...prev, number: e.target.value.replace(/\D/g, '').slice(0, 19) }))}
                          inputMode="numeric"
                          autoComplete="cc-number"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-stone-700">Срок (ММ/ГГ)</label>
                          <div className="flex gap-2">
                            <Input
                              className="h-12 rounded-xl border-stone-200 w-20"
                              placeholder="MM"
                              maxLength={2}
                              value={cardData.expMonth}
                              onChange={(e) => setCardData((prev) => ({ ...prev, expMonth: e.target.value.replace(/\D/g, '').slice(0, 2) }))}
                              inputMode="numeric"
                              autoComplete="cc-exp-month"
                            />
                            <Input
                              className="h-12 rounded-xl border-stone-200 w-20"
                              placeholder="ГГ"
                              maxLength={2}
                              value={cardData.expYear}
                              onChange={(e) => setCardData((prev) => ({ ...prev, expYear: e.target.value.replace(/\D/g, '').slice(0, 2) }))}
                              inputMode="numeric"
                              autoComplete="cc-exp-year"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-stone-700">CVV/CVC</label>
                          <Input
                            className="h-12 rounded-xl border-stone-200 w-24"
                            placeholder="123"
                            maxLength={4}
                            value={cardData.cvc}
                            onChange={(e) => setCardData((prev) => ({ ...prev, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                            inputMode="numeric"
                            autoComplete="cc-csc"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-stone-700">Имя на карте (необязательно)</label>
                        <Input
                          className="h-12 rounded-xl border-stone-200"
                          placeholder="IVAN IVANOV"
                          value={cardData.name}
                          onChange={(e) => setCardData((prev) => ({ ...prev, name: e.target.value }))}
                          autoComplete="cc-name"
                        />
                      </div>
                    </div>
                  )}

                  {currentStep === 4 && paymentId && cardSubmitted && (
                    <div className="max-w-md space-y-6">
                      <p className="text-stone-600 text-sm">
                        Код подтверждения списания отправлен (проверьте приложение банка или SMS). Введите 6 цифр ниже.
                      </p>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-stone-700">Код подтверждения (6 цифр)</label>
                        <Input
                          className="h-14 rounded-xl border-stone-200 text-lg tracking-widest font-mono"
                          placeholder="000000"
                          maxLength={6}
                          value={confirmCode}
                          onChange={(e) => setConfirmCode(e.target.value.replace(/\D/g, ''))}
                        />
                      </div>
                    </div>
                  )}

                  {currentStep === 4 && !paymentId && (
                    <p className="text-stone-500">Нажмите «Перейти к оплате», чтобы создать подписку и перейти к вводу данных карты.</p>
                  )}
                </motion.div>
              </AnimatePresence>

              <div className="flex flex-col-reverse sm:flex-row justify-between gap-4 mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-stone-100">
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  disabled={currentStep === 1 || submitting}
                  className="text-stone-500 hover:text-forest-900"
                >
                  <ChevronLeft className="w-4 h-4 mr-2" />
                  Назад
                </Button>
                {currentStep === 4 && paymentId && cardSubmitted ? (
                  <Button
                    onClick={handleConfirmPayment}
                    disabled={submitting || !isStepComplete}
                    className="bg-forest-900 hover:bg-forest-800 text-cream-50 px-8"
                  >
                    Подтвердить оплату
                  </Button>
                ) : currentStep === 4 && paymentId && !cardSubmitted ? (
                  <Button
                    onClick={handleSubmitCard}
                    disabled={submitting || !isCardFormValid}
                    className="bg-forest-900 hover:bg-forest-800 text-cream-50 px-8"
                  >
                    {submitting ? 'Проверка карты...' : 'Оплатить'}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : currentStep === 3 ? (
                  <Button
                    onClick={handleNext}
                    disabled={submitting || !isStepComplete}
                    className="bg-forest-900 hover:bg-forest-800 text-cream-50 px-8"
                  >
                    {submitting ? 'Создание подписки...' : 'Перейти к оплате'}
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleNext}
                    disabled={!isStepComplete}
                    className="bg-forest-900 hover:bg-forest-800 text-cream-50 px-8"
                  >
                    Далее
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </div>

            <div className="bg-cream-100 p-6 sm:p-8 md:p-12 border-l border-cream-200 hidden md:block min-w-0">
              <h3 className="font-serif font-bold text-lg sm:text-xl text-forest-950 mb-4 sm:mb-6">Ваш заказ</h3>
              <div className="space-y-6">
                <div>
                  <p className="text-xs uppercase tracking-wider text-stone-500 mb-1">Тариф</p>
                  <p className="font-medium text-forest-900 text-lg">{selectedTariff?.name ?? '—'}</p>
                  <p className="text-sm text-stone-500">{selectedApt?.name}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-stone-500 mb-1">Дни и время слотов</p>
                  <p className="font-medium text-forest-900 text-sm">
                    Укажете в личном кабинете после оплаты
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-stone-500 mb-1">Адрес</p>
                  <p className="font-medium text-forest-900 truncate">{formData.address_street || 'Не указан'}</p>
                </div>
                <div className="pt-6 border-t border-cream-200">
                  <div className="flex justify-between items-end">
                    <span className="font-serif text-lg text-forest-950">Итого</span>
                    <span className="text-2xl font-bold text-forest-900">{price.toLocaleString('ru-KZ')} ₸</span>
                  </div>
                  <p className="text-xs text-stone-500 mt-2">В месяц</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
