import type { UserProfile } from '@/api/client'

/** Куда вести пользователя сразу после успешного входа. */
export function getPostLoginPath(user: UserProfile | null | undefined): string {
  const role = user?.role
  if (role === 'executor') return '/executor'
  if (role === 'admin' || role === 'support') return '/admin'
  return '/dashboard'
}
