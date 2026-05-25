import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, Phone, Play, XCircle, Check, Camera, ChevronLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  getExecutorVisit,
  startExecutorVisit,
  noShowExecutorVisit,
  completeExecutorVisit,
  uploadExecutorPhoto,
  type ExecutorVisitDetail,
  type ChecklistResultItem,
} from '@/api/client'

function formatTime(s: string): string {
  if (!s) return '—'
  return s.split(':').slice(0, 2).join(':')
}

function formatDate(s: string): string {
  if (!s) return '—'
  const d = new Date(s + 'T12:00:00')
  const months = 'янв фев мар апр май июн июл авг сен окт ноя дек'.split(' ')
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

function formatDuration(mins: number | null | undefined): string {
  if (mins == null || mins <= 0) return ''
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h <= 0) return `${m} мин`
  if (m === 0) return `${h} ч`
  return `${h} ч ${m} мин`
}

function addressLine(v: ExecutorVisitDetail): string {
  const parts = [v.city_name, v.address_street, v.address_building, v.address_flat].filter(Boolean)
  return parts.length ? parts.join(', ') : (v.address || '—')
}

export function ExecutorVisitDetailPage() {
  const { visitId } = useParams<{ visitId: string }>()
  const navigate = useNavigate()
  const [visit, setVisit] = useState<ExecutorVisitDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [checklistState, setChecklistState] = useState<Record<string, { done: boolean; photoId: string | null }>>({})
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  const load = () => {
    if (!visitId) return
    setLoading(true)
    setError(null)
    getExecutorVisit(visitId)
      .then((v) => {
        setVisit(v)
        const state: Record<string, { done: boolean; photoId: string | null }> = {}
        v.checklist_items?.forEach((item) => {
          state[item.id] = { done: false, photoId: null }
        })
        setChecklistState(state)
      })
      .catch((e) => setError(e instanceof Error ? e.message : 'Ошибка загрузки'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [visitId])

  const handleStart = async () => {
    if (!visitId) return
    setActionLoading(true)
    try {
      await startExecutorVisit(visitId)
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setActionLoading(false)
    }
  }

  const handleNoShow = async () => {
    if (!visitId || !confirm('Отметить неявку клиента? Визит будет списан с пакета.')) return
    setActionLoading(true)
    try {
      await noShowExecutorVisit(visitId)
      navigate('/executor/visits')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    } finally {
      setActionLoading(false)
    }
  }

  const toggleChecklistItem = (itemId: string) => {
    setChecklistState((prev) => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        done: !prev[itemId]?.done,
      },
    }))
  }

  const handlePhotoUpload = async (itemId: string, file: File | null) => {
    if (!visitId || !file) return
    try {
      const res = await uploadExecutorPhoto(visitId, file, itemId)
      setChecklistState((prev) => ({
        ...prev,
        [itemId]: { ...prev[itemId], done: true, photoId: res.id },
      }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки фото')
    }
  }

  const handleComplete = async () => {
    if (!visitId || !visit?.checklist_items) return
    const results: ChecklistResultItem[] = visit.checklist_items.map((item) => ({
      checklist_item_id: item.id,
      done: checklistState[item.id]?.done ?? false,
      photo_id: checklistState[item.id]?.photoId || null,
    }))
    setActionLoading(true)
    try {
      await completeExecutorVisit(visitId, results)
      navigate('/executor/visits')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка завершения визита')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading || !visit) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-stone-500">{loading ? 'Загрузка…' : 'Визит не найден'}</p>
      </div>
    )
  }

  const addr = addressLine(visit)
  const mapUrl = visit.maps_url || (addr ? `https://yandex.ru/maps/?text=${encodeURIComponent(addr)}` : null)
  const cleaningTitle =
    visit.cleaning_type_label ||
    (visit.cleaning_type === 'light' ? 'Лёгкая уборка' : visit.cleaning_type ? 'Полная уборка' : 'Уборка')
  const aptLabel = visit.apartment_type_name || visit.apartment_type

  const isScheduled = visit.status === 'scheduled' || visit.status === 'rescheduled'
  const isInProgress = visit.status === 'in_progress'
  const isCompleted = visit.status === 'completed' || visit.status === 'no_show' || visit.status === 'cancelled'

  return (
    <div className="space-y-6 sm:space-y-8 min-w-0">
      <Button
        variant="ghost"
        size="sm"
        className="gap-2 -ml-2"
        onClick={() => navigate('/executor/visits')}
      >
        <ChevronLeft className="w-4 h-4" />
        Назад
      </Button>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 text-red-800 text-sm">
          {error}
        </div>
      )}

      <Card className="border-cream-200 shadow-sm">
        <CardHeader className="pb-4">
          <CardDescription>
            {formatDate(visit.scheduled_date)} • {formatTime(visit.time_slot_start)} – {formatTime(visit.time_slot_end)}
            {formatDuration(visit.duration_minutes) ? ` • ${formatDuration(visit.duration_minutes)}` : ''}
          </CardDescription>
          <CardTitle className="text-xl font-serif">
            Визит: {cleaningTitle}
            {aptLabel && ` • ${aptLabel}`}
          </CardTitle>
          {visit.client_name && (
            <p className="text-sm text-stone-600 pt-1">Клиент: {visit.client_name}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <p className="text-sm font-medium text-stone-600 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Адрес
            </p>
            <p className="text-forest-950">{addr}</p>
            {(visit.address_entrance || visit.address_floor || visit.address_doorcode) && (
              <p className="text-sm text-stone-600 mt-1">
                {visit.address_entrance && `Подъезд ${visit.address_entrance}`}
                {visit.address_entrance && visit.address_floor && ' · '}
                {visit.address_floor && `Этаж ${visit.address_floor}`}
                {(visit.address_entrance || visit.address_floor) && visit.address_doorcode && ' · '}
                {visit.address_doorcode && `Домофон ${visit.address_doorcode}`}
              </p>
            )}
            {mapUrl && (
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-forest-600 hover:underline mt-2 inline-block"
              >
                Открыть в картах →
              </a>
            )}
          </div>

          {visit.address_comment && (
            <div>
              <p className="text-sm font-medium text-stone-600 mb-1">Комментарий</p>
              <p className="text-stone-700">{visit.address_comment}</p>
            </div>
          )}

          {visit.client_phone && (
            <div>
              <p className="text-sm font-medium text-stone-600 mb-1 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Контакт клиента
              </p>
              <a
                href={`tel:${visit.client_phone.replace(/\D/g, '')}`}
                className="text-forest-600 hover:underline"
              >
                {visit.client_phone}
              </a>
            </div>
          )}

          {isScheduled && (
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Button
                className="bg-forest-900 hover:bg-forest-800 text-cream-50"
                onClick={handleStart}
                disabled={actionLoading}
              >
                <Play className="w-4 h-4 mr-2" />
                Начать визит
              </Button>
              <Button
                variant="outline"
                className="border-red-200 text-red-700 hover:bg-red-50"
                onClick={handleNoShow}
                disabled={actionLoading}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Неявка клиента
              </Button>
            </div>
          )}

          {isInProgress && visit.checklist_items && visit.checklist_items.length > 0 && (
            <div className="pt-6 border-t border-cream-200 space-y-4">
              <h3 className="font-medium text-forest-950">Чек-лист выполнения</h3>
              <p className="text-sm text-stone-500">
                Отметьте выполненные пункты. При желании приложите фото.
              </p>
              <div className="space-y-4">
                {visit.checklist_items.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-cream-200 bg-cream-50/50"
                  >
                    <label className="flex items-center gap-3 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={checklistState[item.id]?.done ?? false}
                        onChange={() => toggleChecklistItem(item.id)}
                        className="w-5 h-5 rounded border-stone-300 text-forest-600 focus:ring-forest-500"
                      />
                      <span className={checklistState[item.id]?.done ? 'line-through text-stone-500' : 'text-forest-900'}>
                        {item.title_ru}
                      </span>
                    </label>
                    <div className="flex items-center gap-2 shrink-0">
                      <input
                        ref={(el) => { fileInputRefs.current[item.id] = el }}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handlePhotoUpload(item.id, file)
                          e.target.value = ''
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="gap-2 border-stone-200"
                        onClick={() => fileInputRefs.current[item.id]?.click()}
                      >
                        <Camera className="w-4 h-4" />
                        {checklistState[item.id]?.photoId ? 'Фото загружено' : 'Фото'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button
                className="bg-forest-900 hover:bg-forest-800 text-cream-50 w-full sm:w-auto mt-4"
                onClick={handleComplete}
                disabled={actionLoading}
              >
                <Check className="w-4 h-4 mr-2" />
                Завершить визит
              </Button>
            </div>
          )}

          {isCompleted && (
            <p className="text-stone-500 text-sm py-4">
              Визит {visit.status === 'completed' ? 'выполнен' : visit.status === 'no_show' ? 'отмечена неявка' : 'отменён'}.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
