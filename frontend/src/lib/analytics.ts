/**
 * PostHog analytics wrapper.
 * Gracefully no-ops when VITE_POSTHOG_KEY is not set.
 */
const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined
const POSTHOG_HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? 'https://eu.i.posthog.com'

type PostHogInstance = {
  capture: (event: string, properties?: Record<string, unknown>) => void
  identify: (id: string, traits?: Record<string, unknown>) => void
  reset: () => void
}

let _ph: PostHogInstance | null = null

export function initPostHog(): void {
  if (!POSTHOG_KEY) return
  import('posthog-js').then(({ default: posthog }) => {
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      capture_pageview: false,
      loaded: (ph) => {
        _ph = ph as unknown as PostHogInstance
      },
    })
  })
}

export function capture(event: string, properties?: Record<string, unknown>): void {
  _ph?.capture(event, properties)
}

export function identify(userId: string, traits?: Record<string, unknown>): void {
  _ph?.identify(userId, traits)
}

export function resetIdentity(): void {
  _ph?.reset()
}

export function capturePageView(path: string): void {
  _ph?.capture('$pageview', { $current_url: window.location.href, path })
}
