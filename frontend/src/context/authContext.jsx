import { createContext, useContext, useEffect, useState } from 'react'
import {
  AUTH_STORAGE_KEY,
  getStoredAuthUser,
  login as loginRequest,
  logout as logoutRequest,
  signup as signupRequest,
} from '../services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => getStoredAuthUser())
  const [isLoading, setIsLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    setIsReady(true)

    function syncAuthState(event) {
      if (event.key === AUTH_STORAGE_KEY) {
        setCurrentUser(getStoredAuthUser())
      }
    }

    window.addEventListener('storage', syncAuthState)
    return () => window.removeEventListener('storage', syncAuthState)
  }, [])

  async function login(credentials) {
    setIsLoading(true)

    try {
      const authenticatedUser = await loginRequest(credentials)
      setCurrentUser(authenticatedUser)
      return authenticatedUser
    } finally {
      setIsLoading(false)
    }
  }

  async function signup(formValues) {
    setIsLoading(true)

    try {
      const authenticatedUser = await signupRequest(formValues)
      setCurrentUser(authenticatedUser)
      return authenticatedUser
    } finally {
      setIsLoading(false)
    }
  }

  function logout() {
    logoutRequest()
    setCurrentUser(null)
  }

  const value = {
    currentUser,
    isAuthenticated: Boolean(currentUser),
    isLeader: Boolean(currentUser?.isLeader),
    isLoading,
    isReady,
    login,
    signup,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }

  return context
}
