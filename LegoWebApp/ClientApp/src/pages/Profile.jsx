import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { decodeJwtPayload } from '../utils/jwt'

const C = {
  pageBg:   '#fce8e8',
  card:     '#ffffff',
  heading:  '#2d0808',
  subtext:  '#5a3030',
  red:      '#cc1010',
  redShadow:'#8b0000',
  border:   '#f0dede',
  muted:    '#8a5050',
  green:    '#22c55e',
}

const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

const ICONS = {
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
  chevron:  'M9 18l6-6-6-6',
  logout:   'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
}

function StatCell({ label, value, noBorder }) {
  return (
    <div style={{
      padding: '20px 24px',
      borderRight: noBorder ? 'none' : `1px solid ${C.border}`,
      flex: 1,
      textAlign: 'center',
    }}>
      <p style={{ margin: '0 0 4px', fontSize: '0.7rem', fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {label}
      </p>
      <p style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: C.heading, lineHeight: 1.3 }}>
        {value}
      </p>
    </div>
  )
}

function ActionRow({ icon, label, sublabel, to, onClick, danger, last }) {
  const [hovered, setHovered] = useState(false)
  const Tag = to ? Link : 'button'
  return (
    <Tag
      to={to}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: '14px',
        padding: '14px 16px',
        textDecoration: 'none',
        background: hovered ? (danger ? '#fef2f2' : C.pageBg) : 'transparent',
        borderRadius: '14px',
        border: 'none', cursor: 'pointer',
        width: '100%', textAlign: 'left',
        transition: 'background 0.15s',
        marginBottom: last ? 0 : '2px',
      }}
    >
      <div style={{
        width: '42px', height: '42px', borderRadius: '12px', flexShrink: 0,
        background: danger ? 'rgba(204,16,16,0.08)' : C.pageBg,
        border: `1px solid ${danger ? '#fecaca' : C.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: danger ? C.red : C.muted,
      }}>
        <Icon d={icon} size={18} />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: '0.98rem', fontWeight: 600, color: danger ? C.red : C.heading }}>
          {label}
        </p>
        {sublabel && (
          <p style={{ margin: '3px 0 0', fontSize: '0.84rem', color: C.subtext, lineHeight: 1.45 }}>
            {sublabel}
          </p>
        )}
      </div>
      {to && (
        <div style={{ color: C.muted, flexShrink: 0 }}>
          <Icon d={ICONS.chevron} size={18} />
        </div>
      )}
    </Tag>
  )
}

export default function Profile() {
  const { email, jwt, logout } = useAuth()
  useNavigate()

  const payload = decodeJwtPayload(jwt)
  const memberSince = payload?.iat
    ? new Date(payload.iat * 1000).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : '—'
  const provider = payload?.app_metadata?.provider ?? 'email'
  const providerLabel = provider.charAt(0).toUpperCase() + provider.slice(1)

  const [avatarSrc, setAvatarSrc] = useState(() => localStorage.getItem('profile_avatar') || null)
  const fileInputRef = useRef(null)

  function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target.result
      setAvatarSrc(dataUrl)
      localStorage.setItem('profile_avatar', dataUrl)
      window.dispatchEvent(new StorageEvent('storage', { key: 'profile_avatar', newValue: dataUrl }))
    }
    reader.readAsDataURL(file)
  }

  function handleAvatarReset() {
    localStorage.removeItem('profile_avatar')
    setAvatarSrc(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    window.dispatchEvent(new StorageEvent('storage', { key: 'profile_avatar', newValue: null }))
  }

  function handleLogout() {
    logout()
    window.location.replace('/login')
  }

  const slide = (delay = 0) => ({
    initial: { opacity: 0, y: 22 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1], delay } },
  })

  return (
    <div style={{ padding: '40px 20px 80px' }}>
      <div style={{ width: '100%', maxWidth: '600px', margin: '0 auto' }}>
        <motion.div
          {...slide(0)}
          style={{
            background: C.card,
            borderRadius: '24px',
            boxShadow: '0 8px 0 #ddc0c0, 0 16px 48px rgba(100,0,0,0.14)',
            overflow: 'hidden',
            border: `1px solid ${C.border}`,
          }}
        >

          {/* ── Hero header ── */}
          <div style={{
              background: '#1a0404',
              backgroundImage: 'radial-gradient(circle, #2d0808 6px, transparent 6px)',
              backgroundSize: '24px 24px',
              backgroundPosition: '12px 12px',
              padding: '48px 44px 44px',
              position: 'relative',
              borderBottom: '4px solid #cc1010',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', marginBottom: '22px' }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.88 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.18, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  width: '88px', height: '88px', borderRadius: '20px',
                  background: avatarSrc ? 'transparent' : '#cc1010',
                  boxShadow: '0 6px 0 #7a0000',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: '2.2rem', fontWeight: 900, color: '#fff',
                  position: 'relative',
                  border: '2px solid #e02020',
                  overflow: 'hidden',
                }}
              >
                {avatarSrc
                  ? <img src={avatarSrc} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : (
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="4"/>
                      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                    </svg>
                  )
                }
              </motion.div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                <motion.button
                  onClick={() => fileInputRef.current?.click()}
                  whileHover={{ scale: 1.04, backgroundColor: 'rgba(255,255,255,0.22)' }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '7px',
                    background: 'rgba(255,255,255,0.14)',
                    border: '1px solid rgba(255,255,255,0.28)',
                    borderRadius: '10px',
                    padding: '7px 16px',
                    fontSize: '0.78rem', fontWeight: 700,
                    letterSpacing: '0.04em', textTransform: 'uppercase',
                    color: '#fff',
                    cursor: 'pointer',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.18)',
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  Change photo
                </motion.button>

                {avatarSrc && (
                  <motion.button
                    onClick={handleAvatarReset}
                    whileHover={{ scale: 1.04, color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.25)' }}
                    whileTap={{ scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      borderRadius: '10px',
                      padding: '7px 14px',
                      fontSize: '0.78rem', fontWeight: 600,
                      letterSpacing: '0.03em',
                      color: 'rgba(255,255,255,0.75)',
                      cursor: 'pointer',
                    }}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                      <path d="M3 3v5h5"/>
                    </svg>
                    Reset to default
                  </motion.button>
                )}
              </div>
            </div>

            <motion.h1
              {...slide(0.12)}
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '1.7rem', fontWeight: 900,
                letterSpacing: '-0.02em', color: '#fff',
                margin: '0 0 6px', lineHeight: 1.1,
              }}
            >
              {email?.split('@')[0]}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ delay: 0.22, duration: 0.3 }}
              style={{ margin: 0, fontSize: '0.93rem', color: 'rgba(255,255,255,0.7)', wordBreak: 'break-all' }}
            >
              {email}
            </motion.p>
          </div>

          {/* ── Stats strip ── */}
          <motion.div
            {...slide(0.18)}
            style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, background: '#fdf5f5' }}>
            <StatCell label="Member since" value={memberSince} />
            <StatCell label="Sign-in" value={providerLabel} />
            <StatCell label="Account" value="Personal" noBorder />
          </motion.div>

          {/* ── Actions ── */}
          <motion.div
            {...slide(0.26)}
            style={{ padding: '14px 10px 10px' }}
          >
            <ActionRow
              icon={ICONS.settings}
              label="Settings"
              sublabel="Security, email and account preferences"
              to="/settings"
            />
            <div style={{ height: '1px', background: C.border, margin: '6px 6px' }} />
            <ActionRow
              icon={ICONS.logout}
              label="Sign out"
              sublabel="You'll need to sign back in to access your vault"
              onClick={handleLogout}
              danger
              last
            />
          </motion.div>

        </motion.div>
      </div>
    </div>
  )
}
