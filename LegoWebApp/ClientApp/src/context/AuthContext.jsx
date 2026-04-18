import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [jwt, setJwt] = useState(() => localStorage.getItem('lego_jwt'))

  const login = (token) => {
    localStorage.setItem('lego_jwt', token)
    setJwt(token)
  }

  const logout = () => {
    localStorage.removeItem('lego_jwt')
    setJwt(null)
  }

  return (
    <AuthContext.Provider value={{ jwt, isLoggedIn: !!jwt, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
