import { useState, useEffect } from 'react'
import { Link, Outlet } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Menu, X, LayoutDashboard } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { BrandLockup } from '@/components/BrandLogo'

export function Layout() {
  const { isAuthenticated, user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div className="min-h-screen flex flex-col font-sans bg-cream-50">
      <header
        className={`fixed top-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? 'bg-cream-50/90 backdrop-blur-md shadow-sm py-2 border-b border-cream-200'
            : 'bg-transparent py-4 border-b border-transparent'
        }`}
      >
        <div className="container mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
          <BrandLockup className="shrink-0 min-w-0" />

          <nav className="hidden md:flex items-center gap-10 text-sm font-medium text-stone-600">
            <Link to="/" className="hover:text-forest-900 transition-colors">
              Главная
            </Link>
            <Link to="/tariffs" className="hover:text-forest-900 transition-colors">
              Тарифы
            </Link>
            <Link to="/how-it-works" className="hover:text-forest-900 transition-colors">
              Как это работает
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link to={user?.role === 'executor' ? '/executor' : '/dashboard'}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-stone-600 gap-2"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    {user?.role === 'executor' ? 'Кабинет исполнителя' : 'Личный кабинет'}
                  </Button>
                </Link>
                <span className="text-sm text-stone-600">
                  {user?.name ?? user?.email}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-stone-600"
                  onClick={() => logout()}
                >
                  Выйти
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden sm:inline-flex text-stone-600"
                  >
                    Войти
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="bg-forest-900 text-cream-50 hover:bg-forest-800">
                    Начать
                  </Button>
                </Link>
              </>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="text-forest-900 hover:text-forest-700 focus:outline-none"
              aria-label="Меню"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-cream-50 border-t border-cream-200 overflow-hidden"
            >
              <div className="px-4 sm:px-6 pt-4 pb-8 space-y-4 shadow-lg">
                <Link
                  to="/"
                  onClick={() => setIsOpen(false)}
                  className="block py-2 text-base font-medium text-stone-600 hover:text-forest-900"
                >
                  Главная
                </Link>
                <Link
                  to="/tariffs"
                  onClick={() => setIsOpen(false)}
                  className="block py-2 text-base font-medium text-stone-600 hover:text-forest-900"
                >
                  Тарифы
                </Link>
                <Link
                  to="/how-it-works"
                  onClick={() => setIsOpen(false)}
                  className="block py-2 text-base font-medium text-stone-600 hover:text-forest-900"
                >
                  Как это работает
                </Link>
                <div className="pt-4 mt-4 border-t border-cream-200 flex flex-col gap-3">
                  {isAuthenticated ? (
                    <>
                      {user?.role !== 'executor' && (
                        <Link to="/booking" onClick={() => setIsOpen(false)}>
                          <Button
                            variant="ghost"
                            className="w-full justify-start gap-3 text-forest-900 font-medium"
                          >
                            Оформить подписку
                          </Button>
                        </Link>
                      )}
                      <Link to={user?.role === 'executor' ? '/executor' : '/dashboard'} onClick={() => setIsOpen(false)}>
                        <Button
                          variant="ghost"
                          className="w-full justify-start gap-3 text-stone-600"
                        >
                          <LayoutDashboard className="w-5 h-5" />
                          {user?.role === 'executor' ? 'Кабинет исполнителя' : 'Личный кабинет'}
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        className="w-full justify-start text-stone-600"
                        onClick={() => {
                          logout()
                          setIsOpen(false)
                        }}
                      >
                        Выйти
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link to="/login" onClick={() => setIsOpen(false)}>
                        <Button
                          variant="ghost"
                          className="w-full justify-start text-stone-600"
                        >
                          Войти
                        </Button>
                      </Link>
                      <Link to="/register" onClick={() => setIsOpen(false)}>
                        <Button className="w-full bg-forest-900 text-cream-50 hover:bg-forest-800">
                          Начать
                        </Button>
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="bg-forest-950 text-cream-100 py-12 sm:py-16 md:py-20">
        <div className="container mx-auto px-4 sm:px-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 sm:gap-10 md:gap-12">
          <div className="space-y-4 sm:space-y-6 sm:col-span-2 md:col-span-1">
            <BrandLockup variant="light" className="justify-start" />
            <p className="text-sm text-cream-200/60 leading-relaxed max-w-xs">
              Новый уровень заботы о доме в Алматы. Мы приносим чистоту отельного уровня в ваше личное пространство.
            </p>
          </div>
          <div>
            <h4 className="font-serif font-semibold mb-4 sm:mb-6 text-cream-50 text-base sm:text-lg">
              Компания
            </h4>
            <ul className="space-y-3 sm:space-y-4 text-sm text-cream-200/60">
              <li>
                <Link to="/about" className="hover:text-cream-50 transition-colors">
                  О нас
                </Link>
              </li>
              <li>
                <Link to="/careers" className="hover:text-cream-50 transition-colors">
                  Карьера
                </Link>
              </li>
              <li>
                <Link to="/legal/privacy" className="hover:text-cream-50 transition-colors">
                  Политика конфиденциальности (ПД)
                </Link>
              </li>
              <li>
                <Link to="/legal/terms" className="hover:text-cream-50 transition-colors">
                  Условия использования
                </Link>
              </li>
              <li>
                <Link to="/legal/offer" className="hover:text-cream-50 transition-colors">
                  Договор оферты
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-serif font-semibold mb-4 sm:mb-6 text-cream-50 text-base sm:text-lg">
              Услуги
            </h4>
            <ul className="space-y-4 text-sm text-cream-200/60">
              <li>
                <Link to="/tariffs" className="hover:text-cream-50 transition-colors">
                  Тарифы подписки
                </Link>
              </li>
              <li>
                <Link to="/business" className="hover:text-cream-50 transition-colors">
                  Для бизнеса
                </Link>
              </li>
              <li>
                <Link to="/cleaning-types" className="hover:text-cream-50 transition-colors">
                  Виды уборки
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-serif font-semibold mb-4 sm:mb-6 text-cream-50 text-base sm:text-lg">
              Контакты
            </h4>
            <ul className="space-y-4 text-sm text-cream-200/60">
              <li>Алматы, Казахстан</li>
              <li>+7 (777) 123-45-67</li>
              <li>hello@homepilot.kz</li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-4 sm:px-6 mt-10 sm:mt-16 pt-6 sm:pt-8 border-t border-white/10 text-center text-xs sm:text-sm text-white/20">
          © {new Date().getFullYear()} HomePilot. Сделано с любовью.
        </div>
      </footer>
    </div>
  )
}
