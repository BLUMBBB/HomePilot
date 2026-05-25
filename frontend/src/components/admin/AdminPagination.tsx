import { cn } from '@/lib/utils'

type Props = {
  offset: number
  limit: number
  total: number
  onOffsetChange: (next: number) => void
  onLimitChange?: (next: number) => void
  limitOptions?: number[]
}

export function AdminPagination({
  offset,
  limit,
  total,
  onOffsetChange,
  onLimitChange,
  limitOptions = [25, 50, 100],
}: Props) {
  const from = total === 0 ? 0 : offset + 1
  const to = Math.min(offset + limit, total)
  const canPrev = offset > 0
  const canNext = offset + limit < total

  return (
    <div className="p-4 border-t border-slate-200/60 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-slate-500">
      <div>
        Показано {from}–{to} из {total}
      </div>
      <div className="flex flex-wrap items-center gap-4">
        {onLimitChange && (
          <div className="flex items-center gap-2">
            <span>Показывать:</span>
            <select
              className="bg-white border border-slate-200 rounded-md px-2 py-1 text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm h-9"
              value={limit}
              onChange={(e) => {
                onLimitChange(Number(e.target.value))
                onOffsetChange(0)
              }}
            >
              {limitOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="flex gap-1">
          <button
            type="button"
            className={cn(
              'px-3 py-1.5 border border-slate-200 rounded-md text-sm font-medium transition-colors',
              canPrev
                ? 'text-slate-700 bg-white hover:bg-slate-50'
                : 'text-slate-400 bg-slate-50 cursor-not-allowed',
            )}
            disabled={!canPrev}
            onClick={() => onOffsetChange(Math.max(0, offset - limit))}
          >
            Пред.
          </button>
          <button
            type="button"
            className={cn(
              'px-3 py-1.5 border border-slate-200 rounded-md text-sm font-medium transition-colors',
              canNext
                ? 'text-slate-700 bg-white hover:bg-slate-50'
                : 'text-slate-400 bg-slate-50 cursor-not-allowed',
            )}
            disabled={!canNext}
            onClick={() => onOffsetChange(offset + limit)}
          >
            След.
          </button>
        </div>
      </div>
    </div>
  )
}
