import { useEffect, useState } from 'react'
import { User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { getMe, updateMe, changePassword, type UserProfile } from '@/api/client'
import { setAuthTokens } from '@/api/client'
import { useAuth } from '@/contexts/AuthContext'

export function ExecutorProfile() {
  const { user, setUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordSaving, setPasswordSaving] = useState(false)

  useEffect(() => {
    getMe()
      .then((user: UserProfile) => {
        const full = (user.name ?? '').trim()
        const space = full.indexOf(' ')
        if (space >= 0) {
          setFirstName(full.slice(0, space))
          setLastName(full.slice(space + 1))
        } else {
          setFirstName(full)
          setLastName('')
        }
        setPhone(user.phone ?? '')
      })
      .catch(() => setProfileError('Не удалось загрузить профиль'))
      .finally(() => setLoading(false))
  }, [])

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileError(null)
    setProfileSuccess(null)
    setProfileSaving(true)
    try {
      const name = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ') || null
      const user = await updateMe({
        name,
        phone: phone.trim() || null,
      })
      const token = localStorage.getItem('hp_access_token')
      const refreshToken = localStorage.getItem('hp_refresh_token')
      if (token && refreshToken) {
        setAuthTokens(token, refreshToken, user)
      }
      setUser?.(user)
      setProfileSuccess('Профиль обновлён')
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : 'Ошибка сохранения')
    } finally {
      setProfileSaving(false)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(null)
    if (newPassword !== confirmPassword) {
      setPasswordError('Пароли не совпадают')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('Пароль должен быть не менее 8 символов')
      return
    }
    setPasswordSaving(true)
    try {
      await changePassword(currentPassword, newPassword)
      setPasswordSuccess('Пароль изменён')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Ошибка смены пароля')
    } finally {
      setPasswordSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-stone-500">Загрузка…</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 sm:space-y-8 min-w-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-serif font-medium text-forest-950 mb-2">Профиль</h1>
        <p className="text-stone-500">
          Управление персональными данными и настройками учётной записи
        </p>
      </div>

      <Card className="border-cream-200 shadow-sm max-w-2xl min-w-0">
        <CardHeader className="p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-forest-100 flex items-center justify-center shrink-0">
              <User className="w-6 h-6 text-forest-700" />
            </div>
            <div>
              <CardTitle className="text-xl">Личные данные</CardTitle>
              <CardDescription>Имя, фамилия и контактный телефон</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5 sm:p-6 pt-0">
          <form onSubmit={handleProfileSubmit} className="space-y-6">
            {profileError && (
              <p className="text-sm text-red-600">{profileError}</p>
            )}
            {profileSuccess && (
              <p className="text-sm text-forest-700">{profileSuccess}</p>
            )}
            <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-2">
                <label htmlFor="executor-profile-first-name" className="text-sm font-medium text-stone-700">
                  Имя
                </label>
                <Input
                  id="executor-profile-first-name"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Иван"
                  className="h-11 rounded-xl border-stone-200"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="executor-profile-last-name" className="text-sm font-medium text-stone-700">
                  Фамилия
                </label>
                <Input
                  id="executor-profile-last-name"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Иванов"
                  className="h-11 rounded-xl border-stone-200"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label htmlFor="executor-profile-phone" className="text-sm font-medium text-stone-700">
                  Телефон
                </label>
                <Input
                  id="executor-profile-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 777 123 45 67"
                  className="h-11 rounded-xl border-stone-200"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-stone-700">Email</label>
              <p className="text-stone-600 text-sm">
                {user?.email ?? '—'}
              </p>
              <p className="text-xs text-stone-400">Email нельзя изменить</p>
            </div>
            <Button
              type="submit"
              disabled={profileSaving}
              className="bg-forest-900 hover:bg-forest-800 text-cream-50 h-11 rounded-xl px-6"
            >
              {profileSaving ? 'Сохранение…' : 'Сохранить'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-cream-200 shadow-sm max-w-2xl min-w-0">
        <CardHeader className="p-5 sm:p-6">
          <CardTitle className="text-xl">Смена пароля</CardTitle>
          <CardDescription>
            Введите текущий пароль и новый пароль (не менее 8 символов)
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 sm:p-6 pt-0">
          <form onSubmit={handlePasswordSubmit} className="space-y-5 max-w-md">
            {passwordError && (
              <p className="text-sm text-red-600">{passwordError}</p>
            )}
            {passwordSuccess && (
              <p className="text-sm text-forest-700">{passwordSuccess}</p>
            )}
            <div className="space-y-2">
              <label htmlFor="executor-current-password" className="text-sm font-medium text-stone-700">
                Текущий пароль
              </label>
              <Input
                id="executor-current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="h-11 rounded-xl border-stone-200"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="executor-new-password" className="text-sm font-medium text-stone-700">
                Новый пароль
              </label>
              <Input
                id="executor-new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Не менее 8 символов"
                className="h-11 rounded-xl border-stone-200"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="executor-confirm-password" className="text-sm font-medium text-stone-700">
                Подтвердите новый пароль
              </label>
              <Input
                id="executor-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="h-11 rounded-xl border-stone-200"
              />
            </div>
            <Button
              type="submit"
              disabled={passwordSaving}
              className="bg-forest-900 hover:bg-forest-800 text-cream-50 h-11 rounded-xl px-6"
            >
              {passwordSaving ? 'Сохранение…' : 'Изменить пароль'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
