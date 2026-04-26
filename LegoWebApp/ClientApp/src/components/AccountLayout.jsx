import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const NAV = [
  { to: '/profile', label: 'Profile' },
  { to: '/settings', label: 'Settings' },
]

export default function AccountLayout({ children }) {
  const { email } = useAuth()
  const initial = email ? email[0].toUpperCase() : '?'

  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 72px)' }}>

      {/* Sidebar */}
      <aside style={{
        width: '240px',
        flexShrink: 0,
        borderRight: '1px solid var(--border)',
        background: 'var(--surface)',
        position: 'sticky',
        top: '72px',
        height: 'calc(100vh - 72px)',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        padding: '32px 16px 24px',
        gap: '4px',
      }}>

        {/* Avatar + email */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '10px',
          padding: '0 8px 28px',
          borderBottom: '1px solid var(--border)',
          marginBottom: '12px',
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--amber-bg)',
            border: '2px solid var(--amber-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '2rem',
            color: 'var(--amber)',
            flexShrink: 0,
            letterSpacing: '0.04em',
          }}>
            {initial}
          </div>
          <p style={{
            margin: 0,
            fontSize: '0.8rem',
            fontWeight: 600,
            color: 'var(--text)',
            textAlign: 'center',
            wordBreak: 'break-all',
            lineHeight: 1.4,
          }}>
            {email}
          </p>
        </div>

        {/* Nav links */}
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {NAV.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              style={({ isActive }) => ({
                display: 'block',
                padding: '9px 14px',
                borderRadius: '9px',
                fontSize: '0.9rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--text)' : 'var(--text-muted)',
                background: isActive ? 'var(--bg)' : 'transparent',
                textDecoration: 'none',
                transition: 'background 0.12s, color 0.12s',
                border: isActive ? '1px solid var(--border)' : '1px solid transparent',
              })}
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, minWidth: 0, overflowY: 'auto' }}>
        {children}
      </main>
    </div>
  )
}
