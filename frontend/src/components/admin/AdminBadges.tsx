import { cn } from '@/lib/utils'

const roleStyles: Record<string, string> = {
  admin: 'bg-forest-100 text-forest-800 border-forest-200',
  client: 'bg-cream-100 text-stone-700 border-cream-200',
  executor: 'bg-amber-100 text-amber-700 border-amber-200',
  support: 'bg-forest-50 text-forest-700 border-forest-200',
}

const roleLabels: Record<string, string> = {
  admin: 'Админ',
  client: 'Клиент',
  executor: 'Исполнитель',
  support: 'Поддержка',
}

export function AdminRoleBadge({ role }: { role: string }) {
  const r = role.toLowerCase()
  return (
    <span
      className={cn(
        'px-2.5 py-1 rounded-md text-xs font-medium border',
        roleStyles[r] ?? 'bg-cream-100 text-stone-700 border-cream-200',
      )}
    >
      {roleLabels[r] ?? role}
    </span>
  )
}

const subStatusStyles: Record<string, string> = {
  active: 'bg-forest-100 text-forest-800 border-forest-200',
  draft: 'bg-cream-100 text-stone-700 border-cream-200',
  paused: 'bg-amber-100 text-amber-700 border-amber-200',
  cancelled: 'bg-rose-100 text-rose-700 border-rose-200',
}

const subStatusLabels: Record<string, string> = {
  active: 'Активна',
  draft: 'Черновик',
  paused: 'Пауза',
  cancelled: 'Отменена',
}

export function AdminSubscriptionStatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase()
  return (
    <span className={cn('px-2.5 py-1 rounded-md text-xs font-medium border', subStatusStyles[s] ?? subStatusStyles.draft)}>
      {subStatusLabels[s] ?? status}
    </span>
  )
}

const visitStatusStyles: Record<string, string> = {
  scheduled: 'bg-forest-50 text-forest-700 border-forest-200',
  in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
  completed: 'bg-forest-100 text-forest-800 border-forest-200',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
}

const visitStatusLabels: Record<string, string> = {
  scheduled: 'Запланирован',
  in_progress: 'В работе',
  completed: 'Завершён',
  cancelled: 'Отменён',
}

export function AdminVisitStatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase()
  return (
    <span
      className={cn(
        'px-2.5 py-1 rounded-md text-xs font-medium border',
        visitStatusStyles[s] ?? visitStatusStyles.scheduled,
      )}
    >
      {visitStatusLabels[s] ?? status}
    </span>
  )
}

const payStatusStyles: Record<string, string> = {
  completed: 'bg-forest-100 text-forest-800 border-forest-200',
  success: 'bg-forest-100 text-forest-800 border-forest-200',
  failed: 'bg-rose-50 text-rose-700 border-rose-200',
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  refunded: 'bg-cream-100 text-stone-700 border-cream-200',
}

const payStatusLabels: Record<string, string> = {
  completed: 'Успешно',
  success: 'Успешно',
  failed: 'Ошибка',
  pending: 'В обработке',
  refunded: 'Возврат',
}

export function AdminPaymentStatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase()
  return (
    <span className={cn('px-2.5 py-1 rounded-md text-xs font-medium border', payStatusStyles[s] ?? payStatusStyles.pending)}>
      {payStatusLabels[s] ?? status}
    </span>
  )
}

const ticketStatusStyles: Record<string, string> = {
  open: 'bg-rose-50 text-rose-700 border-rose-200',
  in_progress: 'bg-amber-50 text-amber-700 border-amber-200',
  resolved: 'bg-forest-100 text-forest-800 border-forest-200',
  closed: 'bg-cream-100 text-stone-700 border-cream-200',
}

const ticketStatusLabels: Record<string, string> = {
  open: 'Открыт',
  in_progress: 'В работе',
  resolved: 'Решён',
  closed: 'Закрыт',
}

export function AdminTicketStatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase()
  return (
    <span
      className={cn(
        'px-2.5 py-1 rounded-md text-xs font-medium border',
        ticketStatusStyles[s] ?? ticketStatusStyles.closed,
      )}
    >
      {ticketStatusLabels[s] ?? status}
    </span>
  )
}
