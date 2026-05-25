import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { User, ChevronLeft, Check, Image } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getVisit, fetchVisitPhotoBlobUrl, type VisitDetailItem } from '@/api/client'

function formatTime(s: string): string {
  if (!s) return '—'
  return s.split(':').slice(0, 2).join(':')
}

function formatDate(s: string): string {
  if (!s) return '—'
  const d = new Date(s + 'Z')
  const months = 'янв фев мар апр май июн июл авг сен окт ноя дек'.split(' ')
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

function VisitPhotoThumb({ visitId, filePath }: { visitId: string; filePath: string }) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    let blobUrl: string | null = null
    fetchVisitPhotoBlobUrl(visitId, filePath)
      .then((url) => {
        blobUrl = url
        setSrc(url)
      })
      .catch(() => setSrc(null))
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl)
    }
  }, [visitId, filePath])

  if (!src) {
    return (
      <div className="aspect-square bg-stone-100 rounded-xl flex items-center justify-center">
        <Image className="w-8 h-8 text-stone-400" />
      </div>
    )
  }

  return (
    <a
      href={src}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-xl overflow-hidden border border-cream-200 hover:border-forest-300 transition-colors aspect-square"
    >
      <img src={src} alt="Фото визита" className="w-full h-full object-cover" />
    </a>
  )
}

function statusLabel(s: string): string {
  const map: Record<string, string> = {
    scheduled: 'Предстоит',
    completed: 'Выполнено',
    cancelled: 'Отменён',
    no_show: 'Не явка',
    in_progress: 'В процессе',
    rescheduled: 'Перенесён',
  }
  return map[s] || s
}

export function DashboardVisitDetail() {
  const { visitId } = useParams<{ visitId: string }>()
  const navigate = useNavigate()
  const [visit, setVisit] = useState<VisitDetailItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!visitId) return
    setLoading(true)
    setError(null)
    getVisit(visitId)
      .then(setVisit)
      .catch((e) => setError(e instanceof Error ? e.message : 'Ошибка загрузки'))
      .finally(() => setLoading(false))
  }, [visitId])

  if (loading || !visitId) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-stone-500">{loading ? 'Загрузка…' : 'Визит не найден'}</p>
      </div>
    )
  }

  if (error || !visit) {
    return (
      <div className="space-y-6 min-w-0">
        <Button variant="ghost" size="sm" className="gap-2 -ml-2" onClick={() => navigate('/dashboard/visits')}>
          <ChevronLeft className="w-4 h-4" />
          Назад к списку
        </Button>
        <Card className="border-cream-200 shadow-sm">
          <CardContent className="p-12 text-center">
            <p className="text-red-600">{error ?? 'Визит не найден'}</p>
            <Link to="/dashboard/visits" className="inline-block mt-4">
              <Button variant="outline" className="border-stone-200">
                К списку визитов
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const isCompleted = visit.status === 'completed'
  const photos = visit.photos ?? []
  const checklistResults = visit.checklist_results ?? []

  return (
    <div className="space-y-6 sm:space-y-8 min-w-0">
      <Button
        variant="ghost"
        size="sm"
        className="gap-2 -ml-2"
        onClick={() => navigate('/dashboard/visits')}
      >
        <ChevronLeft className="w-4 h-4" />
        Назад к списку
      </Button>

      <Card className="border-cream-200 shadow-sm">
        <CardHeader className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <CardDescription>
                {formatDate(visit.scheduled_date)} • {formatTime(visit.time_slot_start)} – {formatTime(visit.time_slot_end)}
              </CardDescription>
              <CardTitle className="text-xl sm:text-2xl font-serif mt-1">
                Визит
              </CardTitle>
            </div>
            <span
              className={`inline-flex px-4 py-2 rounded-full text-sm font-medium shrink-0 ${
                isCompleted ? 'bg-forest-100 text-forest-800' : 'bg-stone-100 text-stone-600'
              }`}
            >
              {statusLabel(visit.status)}
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-5 sm:p-6 pt-0 space-y-6">
          {visit.executor?.name && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-forest-50 flex items-center justify-center">
                <User className="w-5 h-5 text-forest-700" />
              </div>
              <p className="text-stone-700">
                <span className="text-stone-500 text-sm">Исполнитель: </span>
                {visit.executor.name}
              </p>
            </div>
          )}

          {isCompleted && checklistResults.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-stone-700 mb-3 flex items-center gap-2">
                <Check className="w-4 h-4" />
                Выполненные пункты
              </h3>
              <ul className="space-y-2">
                {checklistResults
                  .filter((r) => r.done)
                  .map((r) => (
                    <li key={r.checklist_item_id} className="flex items-center gap-2 text-stone-700">
                      <Check className="w-4 h-4 text-forest-600 shrink-0" />
                      <span>{r.title_ru ?? r.title_kk ?? 'Пункт'}</span>
                    </li>
                  ))}
              </ul>
              {checklistResults.some((r) => !r.done) && (
                <ul className="space-y-2 mt-3 pt-3 border-t border-cream-200">
                  {checklistResults
                    .filter((r) => !r.done)
                    .map((r) => (
                      <li key={r.checklist_item_id} className="flex items-center gap-2 text-stone-400 line-through">
                        <span>{r.title_ru ?? r.title_kk ?? 'Пункт'}</span>
                      </li>
                    ))}
                </ul>
              )}
            </div>
          )}

          {isCompleted && photos.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-stone-700 mb-3 flex items-center gap-2">
                <Image className="w-4 h-4" />
                Фотографии
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {photos.map((p) => (
                  <VisitPhotoThumb key={p.id} visitId={visit.id} filePath={p.file_path} />
                ))}
              </div>
            </div>
          )}

          {isCompleted && photos.length === 0 && checklistResults.length === 0 && (
            <p className="text-stone-500 text-sm">
              Нет данных о выполненных пунктах и фотографиях.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
