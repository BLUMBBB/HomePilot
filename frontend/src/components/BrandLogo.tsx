import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { BRAND_LOGO } from '@/lib/brand'

type BrandMarkProps = {
  className?: string
}

/** Марка бренда (`design/HomePilot_images/homepilot_logo.png` → `/brand/logo.png`). */
export function BrandMark({ className }: BrandMarkProps) {
  return (
    <img
      src={BRAND_LOGO}
      alt="HomePilot"
      className={cn('object-contain', className)}
      width={40}
      height={40}
      loading="eager"
      decoding="async"
    />
  )
}

type BrandLockupProps = {
  to?: string
  /** Светлый вариант для тёмного фона (футер). */
  variant?: 'default' | 'light'
  showText?: boolean
  className?: string
  textClassName?: string
  markClassName?: string
}

/** Логотип + название, ссылка на главную. */
export function BrandLockup({
  to = '/',
  variant = 'default',
  showText = true,
  className,
  textClassName,
  markClassName,
}: BrandLockupProps) {
  const light = variant === 'light'
  return (
    <Link
      to={to}
      className={cn('flex items-center gap-2 shrink-0 min-w-0', className)}
    >
      <div
        className={cn(
          'shrink-0 rounded-full p-0.5 ring-2',
          light ? 'ring-white/25 bg-white/10' : 'ring-forest-900/15 bg-forest-900/5',
        )}
      >
        <BrandMark
          className={cn(
            'h-8 w-8 sm:h-9 sm:w-9 rounded-full',
            light && 'ring-2 ring-white/20',
            markClassName,
          )}
        />
      </div>
      {showText && (
        <span
          className={cn(
            'font-serif font-bold text-lg sm:text-2xl truncate',
            light ? 'text-cream-50' : 'text-forest-900',
            textClassName,
          )}
        >
          HomePilot
        </span>
      )}
    </Link>
  )
}
