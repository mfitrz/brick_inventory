import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { isLoggedIn, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navLink = (path, label) => (
    <Link
      to={path}
      style={{
        color: location.pathname === path ? 'var(--yellow)' : 'var(--text-muted)',
        textDecoration: 'none',
        fontSize: '0.85rem',
        fontWeight: 500,
        letterSpacing: '0.03em',
        transition: 'color 0.15s',
      }}
      onMouseEnter={e => { if (location.pathname !== path) e.target.style.color = 'var(--text)' }}
      onMouseLeave={e => { if (location.pathname !== path) e.target.style.color = 'var(--text-muted)' }}
    >
      {label}
    </Link>
  )

  return (
    <motion.nav
      initial={{ y: -56, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(12px)',
      }}
    >
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '56px' }}>

          <Link
            to="/"
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: '1.4rem',
              letterSpacing: '0.08em',
              color: 'var(--yellow)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{ fontSize: '1.2rem' }}>🧱</span>
            LEGO VAULT
          </Link>

          <div className="hidden sm:flex" style={{ alignItems: 'center', gap: '28px' }}>
            {isLoggedIn ? (
              <>
                {navLink('/', 'Collection')}
                <motion.button
                  onClick={handleLogout}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-light)',
                    color: 'var(--text-muted)',
                    borderRadius: '7px',
                    padding: '6px 16px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'DM Sans, sans-serif',
                    letterSpacing: '0.03em',
                    transition: 'border-color 0.15s, color 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--red)'; e.currentTarget.style.color = 'var(--red)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.color = 'var(--text-muted)' }}
                >
                  Logout
                </motion.button>
              </>
            ) : (
              <>
                {navLink('/login', 'Login')}
                <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                  <Link
                    to="/signup"
                    style={{
                      background: 'var(--yellow)',
                      color: '#111',
                      borderRadius: '7px',
                      padding: '7px 18px',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      textDecoration: 'none',
                      display: 'block',
                      letterSpacing: '0.03em',
                    }}
                  >
                    Sign Up
                  </Link>
                </motion.div>
              </>
            )}
          </div>

          <button
            className="sm:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '8px' }}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{
                borderTop: '1px solid var(--border)',
                padding: '14px 0',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}>
                {isLoggedIn ? (
                  <>
                    <Link to="/" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem' }} onClick={() => setMenuOpen(false)}>Collection</Link>
                    <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem', padding: 0 }}>Logout</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.9rem' }} onClick={() => setMenuOpen(false)}>Login</Link>
                    <Link to="/signup" style={{ color: 'var(--yellow)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600 }} onClick={() => setMenuOpen(false)}>Sign Up</Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  )
}
