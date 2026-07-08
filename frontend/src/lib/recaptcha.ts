/**
 * Google reCAPTCHA v3 wrapper.
 * Gracefully resolves to undefined when VITE_RECAPTCHA_SITE_KEY is not set,
 * so forms work unchanged in environments without a key (dev, tests).
 */
const SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined

let scriptPromise: Promise<void> | null = null

function loadScript(): Promise<void> {
  if (scriptPromise) return scriptPromise
  scriptPromise = new Promise((resolve) => {
    const script = document.createElement('script')
    script.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => resolve()
    document.head.appendChild(script)
  })
  return scriptPromise
}

/** Resolves a fresh reCAPTCHA v3 token for the given action, or undefined if not configured/failed. */
export async function getCaptchaToken(action: string): Promise<string | undefined> {
  if (!SITE_KEY) return undefined
  try {
    await loadScript()
    const grecaptcha = window.grecaptcha
    if (!grecaptcha) return undefined
    await new Promise<void>((resolve) => grecaptcha.ready(resolve))
    return await grecaptcha.execute(SITE_KEY, { action })
  } catch {
    return undefined
  }
}
