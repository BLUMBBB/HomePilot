import { Link } from 'react-router-dom'
import { BrandLockup } from '@/components/BrandLogo'

type Props = {
  title: string
  updated: string
  children: React.ReactNode
}

export function LegalPageShell({ title, updated, children }: Props) {
  return (
    <div className="min-h-screen bg-cream-50 pt-24 sm:pt-28 pb-16">
      <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
        <Link to="/" className="inline-block mb-8">
          <BrandLockup className="text-xl" />
        </Link>
        <header className="mb-10 border-b border-cream-200 pb-6">
          <p className="text-xs uppercase tracking-wide text-stone-500 mb-2">Юридическая информация</p>
          <h1 className="text-3xl sm:text-4xl font-serif font-medium text-forest-950">{title}</h1>
          <p className="text-sm text-stone-500 mt-2">Актуальная редакция: {updated}</p>
        </header>
        <article className="prose-legal space-y-6 text-stone-800 text-sm sm:text-base leading-relaxed">{children}</article>
        <div className="mt-12 pt-8 border-t border-cream-200 text-center text-sm text-stone-500">
          <Link to="/" className="text-forest-800 hover:underline">
            На главную
          </Link>
        </div>
      </div>
    </div>
  )
}
