import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { capturePageView } from '@/lib/analytics'

export function usePageTracking(): void {
  const location = useLocation()
  useEffect(() => {
    capturePageView(location.pathname)
  }, [location.pathname])
}
