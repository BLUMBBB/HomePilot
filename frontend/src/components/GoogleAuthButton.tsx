import { useEffect, useRef } from 'react'

type GoogleAuthButtonProps = {
  onCredential: (idToken: string) => Promise<void> | void
  onError: (message: string) => void
}

declare global {
  interface Window {
    google?: any
  }
}

const GOOGLE_SCRIPT_ID = 'google-gsi-script'

export function GoogleAuthButton({ onCredential, onError }: GoogleAuthButtonProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined

  useEffect(() => {
    if (!clientId || !containerRef.current) return

    const init = () => {
      if (!window.google?.accounts?.id || !containerRef.current) return
      // Не подставлять автоматически последний аккаунт, оставлять выбор пользователю.
      window.google.accounts.id.disableAutoSelect()
      window.google.accounts.id.initialize({
        client_id: clientId,
        auto_select: false,
        callback: async (response: { credential?: string }) => {
          if (!response?.credential) {
            onError('Google не вернул токен авторизации.')
            return
          }
          await onCredential(response.credential)
        },
      })
      containerRef.current.innerHTML = ''
      window.google.accounts.id.renderButton(containerRef.current, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'signin_with',
        shape: 'pill',
        width: 320,
      })
    }

    if (window.google?.accounts?.id) {
      init()
      return
    }

    let script = document.getElementById(GOOGLE_SCRIPT_ID) as HTMLScriptElement | null
    if (!script) {
      script = document.createElement('script')
      script.id = GOOGLE_SCRIPT_ID
      script.src = 'https://accounts.google.com/gsi/client'
      script.async = true
      script.defer = true
      script.onload = init
      script.onerror = () => onError('Не удалось загрузить Google Sign-In.')
      document.head.appendChild(script)
    } else {
      script.addEventListener('load', init)
    }

    return () => {
      script?.removeEventListener('load', init)
    }
  }, [clientId, onCredential, onError])

  if (!clientId) return null

  return <div className="flex justify-center" ref={containerRef} />
}
