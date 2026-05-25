import { Link, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { User } from 'lucide-react'
import { BrandMark } from '@/components/BrandLogo'

export function DashboardPage() {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true })
    }
  }, [isAuthenticated, navigate])

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-cream-50 pt-24 pb-16">
      <div className="container mx-auto px-6 max-w-4xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-medium text-forest-950">
              Личный кабинет
            </h1>
            <p className="text-stone-500 mt-1">
              {user?.name ? `С возвращением, ${user.name}` : user?.email}
            </p>
          </div>
          <Link to="/">
            <Button variant="outline" className="border-stone-200">
              На главную
            </Button>
          </Link>
        </div>

        <div className="grid gap-6">
          <Card className="border-cream-200 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-forest-100 flex items-center justify-center">
                  <User className="w-6 h-6 text-forest-700" />
                </div>
                <div>
                  <CardTitle className="text-xl">Профиль</CardTitle>
                  <p className="text-sm text-stone-500">
                    {user?.email ?? '—'}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-stone-600 text-sm">
                Имя: {user?.name ?? 'не указано'}
              </p>
              <p className="text-stone-500 text-xs mt-2">
                Редактирование профиля и смена пароля будут доступны в этой версии позже.
              </p>
            </CardContent>
          </Card>

          <Card className="border-cream-200 shadow-sm bg-forest-50/30">
            <CardContent className="p-6 flex items-center gap-4">
              <BrandMark className="h-10 w-10 rounded-xl ring-2 ring-forest-900/10 shrink-0" />
              <div>
                <p className="font-medium text-forest-900">Подписка и слоты</p>
                <p className="text-sm text-stone-500">
                  Раздел «Мои слоты» и управление подпиской появятся в следующих обновлениях.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
