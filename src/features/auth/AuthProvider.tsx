import type { FormEvent, PropsWithChildren } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import LogInIcon from 'lucide-react/dist/esm/icons/log-in.mjs'
import ShieldCheckIcon from 'lucide-react/dist/esm/icons/shield-check.mjs'

import { getCrmRuntimeConfig } from '../../app/crmConfig'
import {
  getAuthSession,
  login as requestLogin,
  logout as requestLogout,
} from '../../data/auth/authClient'
import type { AuthSession, LoginInput } from '../../data/auth/authClient'
import { AuthContext } from './authContext'
import type { AuthContextValue } from './authContext'

function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return String(error)
}

function AuthLoadingScreen() {
  return (
    <main className="auth-shell">
      <section className="auth-card auth-card--loading" aria-busy="true">
        <div className="auth-card__mark" aria-hidden="true">
          <ShieldCheckIcon size={24} strokeWidth={2.2} />
        </div>
        <p className="auth-card__eyebrow">SURF CRM</p>
        <h1>Verification de session</h1>
      </section>
    </main>
  )
}

type LoginPageProps = {
  initialError?: string
  onLogin: (input: LoginInput) => Promise<void>
}

function LoginPage({ initialError, onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState(initialError)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setErrorMessage(undefined)

    try {
      await onLogin({
        username,
        password,
      })
    } catch (error) {
      setErrorMessage(toErrorMessage(error))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-card" aria-labelledby="auth-title">
        <div className="auth-card__header">
          <div className="auth-card__mark" aria-hidden="true">
            <ShieldCheckIcon size={24} strokeWidth={2.2} />
          </div>
          <div>
            <p className="auth-card__eyebrow">SURF CRM</p>
            <h1 id="auth-title">Connexion securisee</h1>
          </div>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="form-field">
            <span>Identifiant</span>
            <input
              autoComplete="username"
              autoFocus
              name="username"
              required
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </label>

          <label className="form-field">
            <span>Mot de passe</span>
            <input
              autoComplete="current-password"
              name="password"
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {errorMessage ? (
            <p className="auth-error" role="alert">
              {errorMessage}
            </p>
          ) : null}

          <button
            className="button button--primary auth-submit"
            disabled={isSubmitting}
            type="submit"
          >
            <LogInIcon size={18} strokeWidth={2.2} aria-hidden="true" />
            <span>{isSubmitting ? 'Connexion...' : 'Se connecter'}</span>
          </button>
        </form>
      </section>
    </main>
  )
}

export function AuthProvider({ children }: PropsWithChildren) {
  const config = getCrmRuntimeConfig()
  const [session, setSession] = useState<AuthSession>({
    authEnabled: config.authEnabled,
    authenticated: !config.authEnabled,
  })
  const [isLoading, setIsLoading] = useState(config.authEnabled)
  const [loadError, setLoadError] = useState<string>()

  useEffect(() => {
    let isMounted = true

    if (!config.authEnabled) {
      return () => {
        isMounted = false
      }
    }

    getAuthSession(config.authApiUrl)
      .then((nextSession) => {
        if (!isMounted) {
          return
        }

        setSession(nextSession)
        setLoadError(undefined)
      })
      .catch((error) => {
        if (!isMounted) {
          return
        }

        setSession({
          authEnabled: true,
          authenticated: false,
        })
        setLoadError(toErrorMessage(error))
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [config.authApiUrl, config.authEnabled])

  const login = useCallback(
    async (input: LoginInput) => {
      const nextSession = await requestLogin(config.authApiUrl, input)

      if (!nextSession.authenticated) {
        throw new Error('Connexion refusee.')
      }

      setSession(nextSession)
      setLoadError(undefined)
    },
    [config.authApiUrl],
  )

  const logout = useCallback(async () => {
    const nextSession = await requestLogout(config.authApiUrl)

    setSession(nextSession)
  }, [config.authApiUrl])

  const value = useMemo<AuthContextValue>(
    () => ({
      authEnabled: session.authEnabled,
      isAuthenticated: session.authenticated,
      username: session.username,
      login,
      logout,
    }),
    [login, logout, session.authEnabled, session.authenticated, session.username],
  )

  if (isLoading) {
    return <AuthLoadingScreen />
  }

  if (!session.authenticated) {
    return (
      <AuthContext.Provider value={value}>
        <LoginPage initialError={loadError} onLogin={login} />
      </AuthContext.Provider>
    )
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
