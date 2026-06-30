import { useState, useEffect } from 'react'
import { getTariffs, getApartmentTypes, type TariffItem, type ApartmentTypeItem } from '@/api/client'

export function useTariffs(locale = 'ru') {
  const [tariffs, setTariffs] = useState<TariffItem[]>([])
  const [apartmentTypes, setApartmentTypes] = useState<ApartmentTypeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getTariffs(locale), getApartmentTypes(locale)])
      .then(([t, a]) => {
        setTariffs(t)
        setApartmentTypes(a)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Ошибка загрузки тарифов'))
      .finally(() => setLoading(false))
  }, [locale])

  const priceForTariffAndApt = (tariffId: string, apartmentTypeId: string): number => {
    const t = tariffs.find((x) => x.id === tariffId)
    const p = t?.prices.find((x) => x.apartment_type_id === apartmentTypeId)
    return p?.price_month_kzt ?? 0
  }

  const minMaxForTariff = (tariffId: string): { min: number; max: number } => {
    const t = tariffs.find((x) => x.id === tariffId)
    if (!t?.prices?.length) return { min: 0, max: 0 }
    const nums = t.prices.map((p) => p.price_month_kzt)
    return { min: Math.min(...nums), max: Math.max(...nums) }
  }

  /** Порядок типов квартир для сетки: studio, 1room, 2room, 3room */
  const aptOrder = apartmentTypes.slice().sort((a, b) => a.code.localeCompare(b.code))

  return {
    tariffs,
    apartmentTypes,
    aptOrder,
    loading,
    error,
    priceForTariffAndApt,
    minMaxForTariff,
  }
}
