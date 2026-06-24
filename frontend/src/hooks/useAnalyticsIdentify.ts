import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { identify, resetIdentity } from '@/lib/analytics'

export function useAnalyticsIdentify(): void {
  const { user } = useAuth()
  useEffect(() => {
    if (user) {
      identify(user.id, { email: user.email, name: user.name, role: user.role })
    } else {
      resetIdentity()
    }
  }, [user])
}
