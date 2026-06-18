import { createContext, useContext } from 'react'

import type { LoginInput } from '../../data/auth/authClient'

export type AuthContextValue = {
  authEnabled: boolean
  isAuthenticated: boolean
  username?: string
  login: (input: LoginInput) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth doit etre utilise dans AuthProvider.')
  }

  return context
}
