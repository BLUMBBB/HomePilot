import { useEffect } from 'react'
import { initPostHog } from '@/lib/analytics'
import { usePageTracking } from '@/hooks/usePageTracking'
import { useAnalyticsIdentify } from '@/hooks/useAnalyticsIdentify'

export function AnalyticsBoot() {
  useEffect(() => {
    initPostHog()
  }, [])
  usePageTracking()
  useAnalyticsIdentify()
  return null
}
