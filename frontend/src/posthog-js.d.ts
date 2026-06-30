declare module 'posthog-js' {
  interface PostHogConfig {
    api_host?: string
    capture_pageview?: boolean
    loaded?: (posthog: PostHog) => void
  }
  interface PostHog {
    init(key: string, config?: PostHogConfig): void
    capture(event: string, properties?: Record<string, unknown>): void
    identify(id: string, traits?: Record<string, unknown>): void
    reset(): void
  }
  const posthog: PostHog
  export default posthog
}
