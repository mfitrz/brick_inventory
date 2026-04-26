import { createContext, useContext, useState } from 'react'
import { decodeJwtPayload, isJwtExpired } from '../utils/jwt'
import { clearBricks } from '../utils/bricks'

const AuthContext = createContext(null)

function loadStoredJwt() {
  const stored = localStorage.getItem('lego_jwt')
  if (!stored || isJwtExpired(stored)) {
    localStorage.removeItem('lego_jwt')
    return null
  }
  return stored
}

export function AuthProvider({ children }) {
  const [jwt, setJwt] = useState(loadStoredJwt)

  const login = (token) => {
    localStorage.setItem('lego_jwt', token)
    setJwt(token)
  }

  const logout = () => {
    localStorage.removeItem('lego_jwt')
    clearBricks()
    setJwt(null)
  }

  const email = decodeJwtPayload(jwt)?.email ?? null

  return (
    <AuthContext.Provider value={{ jwt, isLoggedIn: !!jwt, email, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
