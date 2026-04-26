import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

const C = {
  bg:       '#ffffff',
  border:   '#f0dede',
  red:      '#cc1010',
  redBg:    '#fce8e8',
  heading:  '#2d0808',
  subtext:  '#7a5050',
  divider:  '#f0dede',
}

const DefaultAvatar = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
  </svg>
)

function ProfileDropdown({ email, initial, avatarSrc, onLogout, onClose, onNavigate }) {
  const item = (label, sub, onClick, danger = false) => (
    <button
      onClick={onClick}
      style={{
        width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
        gap: '1px', padding: '10px 16px', background: 'none', border: 'none',
        cursor: 'pointer', textAlign: 'left', borderRadius: '8px',
        color: danger ? C.red : C.heading, transition: 'background 0.12s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = danger ? '#fde8e8' : C.redBg }}
      onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
    >
      <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{label}</span>
      {sub && <span style={{ fontSize: '0.75rem', color: C.subtext }}>{sub}</span>}
    </button>
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.97 }}
      transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: 'absolute', top: 'calc(100% + 10px)', right: 0,
        width: '260px', background: '#fff', borderRadius: '16px',
        boxShadow: '0 12px 40px rgba(100,0,0,0.14)', border: `1px solid ${C.divider}`,
        overflow: 'hidden', zIndex: 100,
      }}
    >
      {/* Account header */}
      <div style={{
        padding: '16px', borderBottom: `1px solid ${C.divider}`,
        display: 'flex', alignItems: 'center', gap: '12px',
        background: C.redBg,
      }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '50%',
          background: C.red, display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontFamily: "'Space Grotesk', sans-serif",
          fontWeight: 800, fontSize: '1rem', color: '#fff', flexShrink: 0,
          overflow: 'hidden',
        }}>
          {avatarSrc
            ? <img src={avatarSrc} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <DefaultAvatar />
          }
        </div>
        <div style={{ overflow: 'hidden' }}>
          <p style={{ margin: 0, fontSize: '0.82rem', fontWeight: 600, color: C.heading, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {email ?? 'Account'}
          </p>
          <p style={{ margin: 0, fontSize: '0.72rem', color: C.subtext }}>Personal account</p>
        </div>
      </div>

      <div style={{ padding: '6px' }}>
        {item('My Profile', 'View and edit profile', () => { onClose(); onNavigate('/profile') })}
        {item('Settings', 'Preferences & security', () => { onClose(); onNavigate('/settings') })}
      </div>
      <div style={{ borderTop: `1px solid ${C.divider}`, padding: '6px' }}>
        {item('Sign out', null, () => { onClose(); onLogout() }, true)}
      </div>
    </motion.div>
  )
}

export default function Navbar() {
  const { isLoggedIn, email, logout } = useAuth()
  const navigate = useNavigate()
  const [profileOpen, setProfileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [avatarSrc, setAvatarSrc] = useState(() => localStorage.getItem('profile_avatar') || null)
  const profileRef = useRef(null)

  useEffect(() => {
    function onClick(e) {
      if (profileRef.current && !profileRef.current.contains(e.target))
        setProfileOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  useEffect(() => {
    function onStorage(e) {
      if (e.key === 'profile_avatar') setAvatarSrc(e.newValue)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const handleLogout = () => { logout(); window.location.replace('/login') }
  const initial = email ? email[0].toUpperCase() : '?'

  return (
    <motion.nav
      initial={{ y: -72, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: C.bg,
        borderBottom: `5px solid ${C.red}`,
        boxShadow: '0 1px 0 #f0dede',
        position: 'sticky', top: 0, zIndex: 50,
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '68px' }}>

          {/* Logo */}
          <Link to="/" style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '1.5rem', fontWeight: 800, color: C.red,
            textDecoration: 'none', letterSpacing: '-0.02em',
          }}>
            BuildaVault
          </Link>

          {/* Desktop right */}
          <div className="hidden sm:flex" style={{ alignItems: 'center', gap: '16px' }}>
            {isLoggedIn ? (
              <div ref={profileRef} style={{ position: 'relative' }}>
                <motion.button
                  onClick={() => setProfileOpen(v => !v)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Profile menu"
                  style={{
                    width: '42px', height: '42px', borderRadius: '50%',
                    background: avatarSrc ? 'transparent' : (profileOpen ? C.red : 'rgba(204,16,16,0.12)'),
                    border: `2px solid ${profileOpen ? C.red : C.border}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 800, fontSize: '0.95rem',
                    color: profileOpen ? '#fff' : C.red,
                    cursor: 'pointer', transition: 'all 0.15s',
                    overflow: 'hidden', padding: 0,
                  }}
                >
                  {avatarSrc
                    ? <img src={avatarSrc} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : <DefaultAvatar />
                  }
                </motion.button>
                <AnimatePresence>
                  {profileOpen && (
                    <ProfileDropdown
                      email={email} initial={initial} avatarSrc={avatarSrc}
                      onLogout={handleLogout}
                      onClose={() => setProfileOpen(false)}
                      onNavigate={navigate}
                    />
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <>
                <Link to="/login" style={{ color: C.subtext, textDecoration: 'none', fontSize: '0.95rem', fontWeight: 500 }}>
                  Log in
                </Link>
                <Link to="/signup" style={{
                  background: C.red, color: '#fff', borderRadius: '10px',
                  padding: '9px 20px', fontSize: '0.9rem', fontWeight: 700,
                  textDecoration: 'none', fontFamily: "'Space Grotesk', sans-serif",
                  letterSpacing: '0.03em',
                }}>
                  Sign up
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="sm:hidden"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
            style={{ background: 'none', border: 'none', color: C.subtext, cursor: 'pointer', padding: '8px' }}
          >
            <svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {menuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              }
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ borderTop: `1px solid ${C.border}`, padding: '12px 0 16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {isLoggedIn ? (
                  <>
                    {email && <p style={{ fontSize: '0.8rem', color: C.subtext, margin: '0 0 8px', padding: '0 4px' }}>{email}</p>}
                    <button onClick={() => { navigate('/profile'); setMenuOpen(false) }} style={{ background: 'none', border: 'none', color: C.heading, cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem', padding: '6px 4px', fontFamily: 'DM Sans, sans-serif' }}>My Profile</button>
                    <button onClick={() => { navigate('/settings'); setMenuOpen(false) }} style={{ background: 'none', border: 'none', color: C.heading, cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem', padding: '6px 4px', fontFamily: 'DM Sans, sans-serif' }}>Settings</button>
                    <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: C.red, cursor: 'pointer', textAlign: 'left', fontSize: '0.9rem', padding: '6px 4px', fontFamily: 'DM Sans, sans-serif' }}>Sign out</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" style={{ color: C.subtext, textDecoration: 'none', fontSize: '0.9rem', padding: '6px 4px' }} onClick={() => setMenuOpen(false)}>Log in</Link>
                    <Link to="/signup" style={{ color: C.red, textDecoration: 'none', fontSize: '0.9rem', fontWeight: 600, padding: '6px 4px' }} onClick={() => setMenuOpen(false)}>Sign up</Link>
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
