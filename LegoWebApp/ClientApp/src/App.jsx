import { lazy, Suspense, useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import { HomePageSkeleton, AuthPageSkeleton } from './components/Skeleton'
import { getOrGenerateBricks, BricksLayer } from './utils/bricks'

const Home     = lazy(() => import('./pages/Home'))
const Login    = lazy(() => import('./pages/Login'))
const Signup   = lazy(() => import('./pages/Signup'))
const Profile  = lazy(() => import('./pages/Profile'))
const Settings = lazy(() => import('./pages/Settings'))
const NotFound = lazy(() => import('./pages/NotFound'))

function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth()
  return isLoggedIn ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { isLoggedIn } = useAuth()
  return isLoggedIn ? <Navigate to="/" replace /> : children
}

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.55, ease: 'easeOut' } },
  exit:    { opacity: 0, transition: { duration: 0.2 } },
}

const authExit = { opacity: 0, transition: { duration: 0.3 } }

function AppRoutes() {
  const location = useLocation()
  const isAuthPage = ['/login', '/signup'].includes(location.pathname)
  const [bricks] = useState(() => getOrGenerateBricks())
  const [brickAnimKey, setBrickAnimKey] = useState(0)

  useEffect(() => {
    if (location.pathname === '/login' && location.state?.fromSignup)
      setBrickAnimKey(k => k + 1)
  }, [location])

  const routeContent = (
    <AnimatePresence mode="sync">
      <motion.div
        key={isAuthPage ? 'auth' : location.pathname}
        variants={isAuthPage ? {} : pageVariants}
        initial={isAuthPage ? false : 'initial'}
        animate={isAuthPage ? {} : 'animate'}
        exit={isAuthPage ? authExit : 'exit'}
        style={{ position: 'relative', zIndex: 1 }}
      >
        <Routes location={location}>
          <Route path="/" element={
            <ProtectedRoute>
              <Suspense fallback={<HomePageSkeleton />}><Home /></Suspense>
            </ProtectedRoute>
          } />
          <Route path="/login" element={
            <PublicRoute><Suspense fallback={<AuthPageSkeleton />}><Login /></Suspense></PublicRoute>
          } />
          <Route path="/signup" element={
            <PublicRoute><Suspense fallback={<AuthPageSkeleton />}><Signup /></Suspense></PublicRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Suspense fallback={<HomePageSkeleton />}><Profile /></Suspense>
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Suspense fallback={<HomePageSkeleton />}><Settings /></Suspense>
            </ProtectedRoute>
          } />
          <Route path="*" element={
            <Suspense fallback={null}><NotFound /></Suspense>
          } />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )

  return (
    <>
      <BricksLayer key={brickAnimKey} bricks={bricks} animated={true} blur={!isAuthPage} />
      {isAuthPage ? (
        routeContent
      ) : (
        <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 1 }}>
          <Navbar />
          <div className="page-scroll" style={{ flex: 1, overflowY: 'auto' }}>
            {routeContent}
          </div>
        </div>
      )}
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
