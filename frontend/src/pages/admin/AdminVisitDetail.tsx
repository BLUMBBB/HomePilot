import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  adminAssignExecutor,
  adminListExecutors,
  adminPatchVisit,
  adminUnassignVisitExecutor,
  fetchVisitPhotoBlobUrl,
  getVisit,
  type AdminExecutorRow,
  type VisitDetailItem,
} from '@/api/client'
import { useAuth } from '@/contexts/AuthContext'
import { adminBackLink, adminCardTitle, adminSurface } from '@/lib/adminUi'

export function AdminVisitDetail() {
  const { visitId } = useParams<{ visitId: string }>()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [visit, setVisit] = useState<VisitDetailItem | null>(null)
  const [executors, setExecutors] = useState<AdminExecutorRow[]>([])
  const [executorPick, setExecutorPick] = useState('')
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({})
  const [newDate, setNewDate] = useState('')
  const [newStart, setNewStart] = useState('')
  const [newEnd, setNewEnd] = useState('')
  const [msg, setMsg] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!visitId) return
    let c = false
    Promise.all([getVisit(visitId), adminListExecutors()])
      .then(([v, ex]) => {
        if (c) return
        setVisit(v)
        setExecutors(ex)
        setExecutorPick(v.executor_id || '')
        setNewDate(v.scheduled_date)
        setNewStart(v.time_slot_start?.slice(0, 5) || '')
        setNewEnd(v.time_slot_end?.slice(0, 5) || '')
      })
      .catch((e) => {
        if (!c) setError(e instanceof Error ? e.message : 'Ошибка')
      })
      .finally(() => {
        if (!c) setLoading(false)
      })
    return () => {
      c = true
    }
  }, [visitId])

  useEffect(() => {
    if (!visitId || !visit?.photos?.length) {
      setPhotoUrls({})
      return
    }
    setPhotoUrls({})
    const created: string[] = []
    let cancelled = false
    ;(async () => {
      for (const p of visit.photos) {
        try {
          const u = await fetchVisitPhotoBlobUrl(visitId, p.file_path)
          created.push(u)
          if (!cancelled) setPhotoUrls((prev) => ({ ...prev, [p.id]: u }))
        } catch {
          /* skip */
        }
      }
    })()
    return () => {
      cancelled = true
      created.forEach((u) => URL.revokeObjectURL(u))
    }
  }, [visitId, visit?.photos])

  async function assign() {
    if (!visitId || !executorPick) return
    setError('')
    setMsg('')
    try {
      await adminAssignExecutor(visitId, executorPick)
      setMsg('Исполнитель назначен')
      const v = await getVisit(visitId)
      setVisit(v)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    }
  }

  async function unassign() {
    if (!visitId || !confirm('Снять исполнителя с визита?')) return
    setError('')
    setMsg('')
    try {
      await adminUnassignVisitExecutor(visitId)
      setMsg('Исполнитель снят')
      setExecutorPick('')
      setVisit(await getVisit(visitId))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    }
  }

  async function cancelVisit() {
    if (!visitId || !confirm('Отменить визит?')) return
    setError('')
    setMsg('')
    try {
      await adminPatchVisit(visitId, { status: 'cancelled' })
      setMsg('Визит отменён')
      setVisit(await getVisit(visitId))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    }
  }

  async function reschedule() {
    if (!visitId || !newDate || !newStart || !newEnd) return
    setError('')
    setMsg('')
    try {
      await adminPatchVisit(visitId, {
        new_scheduled_date: newDate,
        new_time_slot_start: newStart,
        new_time_slot_end: newEnd,
      })
      setMsg('Визит перенесён')
      setVisit(await getVisit(visitId))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-slate-500 text-sm">Загрузка…</p>
      </div>
    )
  }
  if (error && !visit) {
    return <p className="text-red-600 text-sm">{error}</p>
  }
  if (!visit) {
    return null
  }

  return (
    <div className="space-y-6 min-w-0 max-w-3xl">
      <div>
        <Link to="/admin/visits" className={adminBackLink}>
          <ArrowLeft size={16} />
          К списку визитов
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-4 mb-1 font-sans">Визит</h1>
        <p className="text-slate-500 text-sm font-mono break-all">{visitId}</p>
        <div className="flex flex-wrap gap-4 text-sm mt-4">
          <Link to={`/admin/subscriptions/${visit.subscription_id}`} className="text-emerald-700 font-medium hover:text-emerald-800 transition-colors">
            Открыть подписку
          </Link>
          <Link to={`/admin/visits?subscription_id=${visit.subscription_id}`} className="text-emerald-700 font-medium hover:text-emerald-800 transition-colors">
            Все визиты подписки
          </Link>
        </div>
      </div>

      <div className={`${adminSurface} p-6`}>
        <h2 className={`${adminCardTitle} mb-4`}>Статус</h2>
        <div className="text-sm text-slate-700 space-y-1.5">
          <p>
            <span className="text-slate-500">Дата:</span> {visit.scheduled_date}
          </p>
          <p>
            <span className="text-slate-500">Время:</span> {visit.time_slot_start?.slice(0, 5)}–{visit.time_slot_end?.slice(0, 5)}
          </p>
          <p>
            <span className="text-slate-500">Статус:</span> {visit.status}
          </p>
          {visit.executor && (
            <p>
              <span className="text-slate-500">Исполнитель:</span> {visit.executor.name}
            </p>
          )}
        </div>
      </div>

      {visit.photos?.length > 0 && (
        <div className={`${adminSurface} p-6`}>
          <h2 className={`${adminCardTitle} mb-4`}>Фото</h2>
          <div className="flex flex-wrap gap-3">
            {visit.photos.map((p) =>
              photoUrls[p.id] ? (
                <a key={p.id} href={photoUrls[p.id]} target="_blank" rel="noreferrer" className="block">
                  <img src={photoUrls[p.id]} alt="" className="h-24 w-24 object-cover rounded-xl border border-slate-200 shadow-sm" />
                </a>
              ) : (
                <span key={p.id} className="text-xs text-slate-400">
                  {p.file_path}
                </span>
              ),
            )}
          </div>
        </div>
      )}

      {isAdmin && (
        <>
          <div className={`${adminSurface} p-6`}>
            <h2 className={`${adminCardTitle} mb-4`}>Назначить исполнителя</h2>
            <div className="space-y-3">
              <select
                className="w-full max-w-md h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                value={executorPick}
                onChange={(e) => setExecutorPick(e.target.value)}
              >
                <option value="">— выберите —</option>
                {executors.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.name || e.email}
                  </option>
                ))}
              </select>
              <div className="flex flex-wrap gap-2">
                <Button type="button" onClick={assign} className="rounded-lg bg-[#064e3b] hover:bg-[#064e3b]/90 text-white h-10 px-5 shadow-sm">
                  Назначить
                </Button>
                <Button type="button" variant="outline" onClick={unassign} className="rounded-lg border-slate-200 h-10">
                  Снять исполнителя
                </Button>
              </div>
            </div>
          </div>

          <div className={`${adminSurface} p-6`}>
            <h2 className={`${adminCardTitle} mb-4`}>Перенос (админ)</h2>
            <div className="space-y-3 max-w-md">
              <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="rounded-lg border-slate-200" />
              <div className="flex gap-2">
                <Input type="time" value={newStart} onChange={(e) => setNewStart(e.target.value)} className="rounded-lg border-slate-200" />
                <Input type="time" value={newEnd} onChange={(e) => setNewEnd(e.target.value)} className="rounded-lg border-slate-200" />
              </div>
              <Button type="button" onClick={reschedule} className="rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 h-10">
                Перенести
              </Button>
            </div>
          </div>

          <div className={`${adminSurface} p-6 border-rose-100 bg-rose-50/30`}>
            <h2 className={`${adminCardTitle} text-rose-900 mb-4`}>Опасная зона</h2>
            <Button type="button" variant="outline" className="rounded-lg border-rose-200 text-rose-800 hover:bg-rose-50 h-10" onClick={cancelVisit}>
              Отменить визит
            </Button>
          </div>
        </>
      )}

      {!isAdmin && (
        <p className="text-sm text-slate-500">
          Назначение и перенос визита доступны только администратору. Просмотр открыт для поддержки.
        </p>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}
      {msg && <p className="text-emerald-700 text-sm font-medium">{msg}</p>}
    </div>
  )
}
