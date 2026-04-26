import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { resetPassword, changeEmail, deleteAccount, deleteAllSets } from '../services/api'

const C = {
  pageBg:      '#fce8e8',
  card:        '#ffffff',
  border:      '#f0dede',
  heading:     '#2d0808',
  subtext:     '#5a3030',
  inputBg:     '#fcd6d6',
  red:         '#cc1010',
  redShadow:   '#8b0000',
  redBg:       '#fef2f2',
  redBorder:   '#fecaca',
  muted:       '#8a5050',
  green:       '#16a34a',
  greenBg:     '#f0fdf4',
  greenBorder: '#bbf7d0',
}

const ICONS = {
  lock:    'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4',
  box:     'M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z',
  warning: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4m0 4h.01',
  key:     'M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4',
  mail:    'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6',
  trash:   'M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2',
  user:    'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
}

const Icon = ({ d, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
)

function SectionCard({ title, danger, children }) {
  return (
    <div style={{
      background: C.card,
      border: `1px solid ${danger ? C.redBorder : C.border}`,
      borderRadius: '20px',
      boxShadow: danger
        ? '0 6px 0 #f5c0c0, 0 8px 24px rgba(100,0,0,0.08)'
        : '0 6px 0 #ddc0c0, 0 8px 24px rgba(100,0,0,0.06)',
      overflow: 'hidden',
      marginBottom: '20px',
    }}>
      <div style={{
        padding: '18px 28px',
        borderBottom: `1px solid ${danger ? C.redBorder : C.border}`,
        background: danger ? '#2a0404' : '#1a0404',
        backgroundImage: 'radial-gradient(circle, #3d0808 5px, transparent 5px)',
        backgroundSize: '20px 20px',
        backgroundPosition: '10px 10px',
        textAlign: 'center',
      }}>
        <p style={{
          margin: 0,
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '1.1rem', fontWeight: 800,
          color: '#ffffff',
          letterSpacing: '-0.01em', lineHeight: 1,
        }}>
          {title}
        </p>
      </div>
      {children}
    </div>
  )
}

function Row({ icon, label, description, action, noBorder, danger }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      gap: '24px', padding: '22px 28px',
      borderBottom: noBorder ? 'none' : `1px solid ${danger ? C.redBorder : C.border}`,
      flexWrap: 'wrap',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flex: 1, minWidth: '200px' }}>
        {icon && (
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0, marginTop: '1px',
            background: danger ? 'rgba(204,16,16,0.07)' : C.pageBg,
            border: `1px solid ${danger ? C.redBorder : C.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: danger ? C.red : C.muted,
          }}>
            <Icon d={icon} size={14} />
          </div>
        )}
        <div>
          <p style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: C.heading }}>{label}</p>
          {description && (
            <p style={{ margin: '5px 0 0', fontSize: '0.88rem', color: C.subtext, lineHeight: 1.6, maxWidth: '420px' }}>
              {description}
            </p>
          )}
        </div>
      </div>
      {action && <div style={{ flexShrink: 0 }}>{action}</div>}
    </div>
  )
}

function Btn({ children, onClick, disabled, variant = 'default' }) {
  const base = {
    borderRadius: '10px', padding: '10px 20px',
    fontSize: '0.88rem', fontWeight: 700,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: "'Space Grotesk', sans-serif",
    border: 'none', whiteSpace: 'nowrap',
    opacity: disabled ? 0.55 : 1,
  }
  const variants = {
    default: { background: C.card, color: C.heading, border: `1.5px solid #dcc8c8` },
    danger:  { background: C.redBg, color: C.red, border: `1.5px solid ${C.redBorder}` },
    primary: { background: C.red, color: '#fff', boxShadow: disabled ? 'none' : `0 4px 0 ${C.redShadow}` },
    ghost:   { background: 'transparent', color: C.subtext, border: `1.5px solid #dcc8c8` },
  }
  return (
    <motion.button
      onClick={onClick} disabled={disabled}
      whileHover={!disabled ? { y: -1 } : {}}
      whileTap={!disabled ? { y: 1 } : {}}
      style={{ ...base, ...variants[variant] }}
    >
      {children}
    </motion.button>
  )
}

function StatusLine({ message, type }) {
  if (!message) return null
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
      style={{ overflow: 'hidden' }}
    >
      <div style={{
        padding: '12px 28px',
        background: type === 'error' ? '#fef2f2' : C.greenBg,
        borderTop: `1px solid ${type === 'error' ? C.redBorder : C.greenBorder}`,
      }}>
        <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, color: type === 'error' ? C.red : C.green }}>
          {message}
        </p>
      </div>
    </motion.div>
  )
}

function PinkInput(props) {
  const [focused, setFocused] = useState(false)
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      background: C.inputBg, borderRadius: '12px',
      border: `2px solid ${focused ? C.red : 'transparent'}`,
      transition: 'border-color 0.15s',
    }}>
      <input
        {...props}
        onFocus={e => { setFocused(true); props.onFocus?.(e) }}
        onBlur={e => { setFocused(false); props.onBlur?.(e) }}
        style={{
          flex: 1, padding: '11px 14px', fontSize: '0.95rem',
          fontFamily: 'DM Sans, sans-serif', color: C.heading,
          background: 'transparent', border: 'none', outline: 'none',
          width: props.style?.width,
        }}
      />
    </div>
  )
}

function ExpandPanel({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22, ease: 'easeInOut' }}
      style={{ overflow: 'hidden' }}
    >
      {children}
    </motion.div>
  )
}

export default function Settings() {
  const { jwt, email, logout } = useAuth()
  const navigate = useNavigate()
  const initial = email ? email[0].toUpperCase() : '?'

  const [resetLoading, setResetLoading] = useState(false)
  const [resetStatus, setResetStatus] = useState(null)

  const [emailOpen, setEmailOpen] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [emailLoading, setEmailLoading] = useState(false)
  const [emailStatus, setEmailStatus] = useState(null)

  const [deleteAllConfirm, setDeleteAllConfirm] = useState(false)
  const [deleteAllLoading, setDeleteAllLoading] = useState(false)
  const [deleteAllStatus, setDeleteAllStatus] = useState(null)

  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false)
  const [deleteAccountInput, setDeleteAccountInput] = useState('')
  const [deleteAccountLoading, setDeleteAccountLoading] = useState(false)
  const [deleteAccountStatus, setDeleteAccountStatus] = useState(null)

  async function handleResetPassword() {
    setResetLoading(true); setResetStatus(null)
    const result = await resetPassword(jwt)
    setResetStatus({ message: result.message, type: result.success ? 'success' : 'error' })
    setResetLoading(false)
  }

  async function handleChangeEmail() {
    if (!newEmail.trim() || newEmail.trim() === email) return
    setEmailLoading(true); setEmailStatus(null)
    const result = await changeEmail(jwt, newEmail.trim())
    setEmailStatus({ message: result.message, type: result.success ? 'success' : 'error' })
    if (result.success) { setEmailOpen(false); setNewEmail('') }
    setEmailLoading(false)
  }

  async function handleDeleteAllSets() {
    setDeleteAllLoading(true)
    const result = await deleteAllSets(jwt)
    setDeleteAllStatus({ message: result.success ? 'All sets removed from your collection.' : result.message, type: result.success ? 'success' : 'error' })
    setDeleteAllLoading(false); setDeleteAllConfirm(false)
  }

  async function handleDeleteAccount() {
    if (deleteAccountInput !== 'DELETE') return
    setDeleteAccountLoading(true); setDeleteAccountStatus(null)
    const result = await deleteAccount(jwt)
    if (result.success) { logout(); navigate('/login') }
    else { setDeleteAccountStatus({ message: result.message, type: 'error' }); setDeleteAccountLoading(false) }
  }

  const isNewEmailValid = newEmail.trim().length > 0 && newEmail.trim() !== email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)

  const container = {
    animate: { transition: { staggerChildren: 0.09, delayChildren: 0.04 } },
  }
  const item = {
    initial: { opacity: 0, y: 28 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
  }

  return (
    <div style={{ padding: '32px 20px 80px' }}>
      <motion.div
        variants={container}
        initial="initial"
        animate="animate"
        style={{ width: '100%', maxWidth: '680px', margin: '0 auto' }}
      >

        {/* ── Page heading ── */}
        <motion.div variants={item}>
        <div style={{
          marginBottom: '24px',
          background: '#1a0404',
          backgroundImage: 'radial-gradient(circle, #2d0808 5px, transparent 5px)',
          backgroundSize: '20px 20px',
          backgroundPosition: '10px 10px',
          borderRadius: '20px',
          padding: '28px 32px',
          boxShadow: '0 6px 0 #0d0202, 0 10px 32px rgba(0,0,0,0.3)',
          border: '1px solid #2d0808',
          textAlign: 'center',
        }}>
          <h1 style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '2.4rem', fontWeight: 900,
            letterSpacing: '-0.03em', color: '#fff',
            margin: 0, lineHeight: 1,
          }}>
            SETTINGS
          </h1>
        </div>
        </motion.div>

        {/* ── Security ── */}
        <motion.div variants={item}>
        <SectionCard title="Security" description="Manage your login credentials">

          <Row
            icon={ICONS.key}
            label="Password"
            description="Send a one-time reset link to your inbox. The link expires after 1 hour."
            action={
              <Btn onClick={handleResetPassword} disabled={resetLoading}>
                {resetLoading ? 'Sending…' : 'Send reset link'}
              </Btn>
            }
            noBorder={!resetStatus?.message && !emailOpen}
          />
          <AnimatePresence>
            {resetStatus && <StatusLine message={resetStatus.message} type={resetStatus.type} />}
          </AnimatePresence>

          <Row
            icon={ICONS.mail}
            label="Email address"
            description={
              emailStatus?.type === 'success'
                ? emailStatus.message
                : `Current: ${email ?? '—'}. A confirmation link will be sent to your new address.`
            }
            action={!emailOpen
              ? <Btn onClick={() => { setEmailOpen(true); setEmailStatus(null) }}>Change email</Btn>
              : <Btn variant="ghost" onClick={() => { setEmailOpen(false); setNewEmail(''); setEmailStatus(null) }}>Cancel</Btn>
            }
            noBorder={!emailOpen}
          />
          <AnimatePresence>
            {emailOpen && (
              <ExpandPanel>
                <div style={{ padding: '20px 28px 24px', borderTop: `1px solid ${C.border}`, background: '#fdf5f5' }}>
                  <p style={{ margin: '0 0 14px', fontSize: '0.9rem', color: C.subtext, lineHeight: 1.65 }}>
                    Enter your new email. The change won't take effect until you verify it.
                  </p>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    <PinkInput
                      type="email" placeholder="New email address" value={newEmail}
                      onChange={e => { setNewEmail(e.target.value); setEmailStatus(null) }}
                      onKeyDown={e => e.key === 'Enter' && isNewEmailValid && !emailLoading && handleChangeEmail()}
                      autoComplete="email" style={{ width: '260px' }}
                    />
                    <Btn variant="primary" onClick={handleChangeEmail} disabled={!isNewEmailValid || emailLoading}>
                      {emailLoading ? 'Sending…' : 'Send confirmation'}
                    </Btn>
                  </div>
                  {emailStatus && (
                    <p style={{ margin: '10px 0 0', fontSize: '0.875rem', fontWeight: 600, color: emailStatus.type === 'error' ? C.red : C.green }}>
                      {emailStatus.message}
                    </p>
                  )}
                </div>
              </ExpandPanel>
            )}
          </AnimatePresence>
        </SectionCard>
        </motion.div>

        {/* ── Collection ── */}
        <motion.div variants={item}>
        <SectionCard title="Collection" description="Actions that affect your saved LEGO sets">
          <Row
            icon={ICONS.trash}
            label="Delete all sets"
            description="Permanently remove every set from your collection. This cannot be undone."
            action={!deleteAllConfirm
              ? <Btn variant="danger" onClick={() => setDeleteAllConfirm(true)}>Delete all sets</Btn>
              : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.88rem', color: C.subtext, fontWeight: 600, whiteSpace: 'nowrap' }}>Are you sure?</span>
                  <Btn variant="ghost" onClick={() => { setDeleteAllConfirm(false); setDeleteAllStatus(null) }}>No</Btn>
                  <Btn variant="danger" onClick={handleDeleteAllSets} disabled={deleteAllLoading}>
                    {deleteAllLoading ? 'Deleting…' : 'Yes, delete'}
                  </Btn>
                </div>
              )
            }
            noBorder={!deleteAllStatus}
          />
          <AnimatePresence>
            {deleteAllStatus && <StatusLine message={deleteAllStatus.message} type={deleteAllStatus.type} />}
          </AnimatePresence>
        </SectionCard>
        </motion.div>

        {/* ── Danger zone ── */}
        <motion.div variants={item}>
        <SectionCard title="Danger Zone" description="Permanent, irreversible actions — proceed with caution" danger>
          <Row
            icon={ICONS.user}
            label="Delete account"
            description="Permanently delete your account and all data, including your entire LEGO collection."
            action={!deleteAccountOpen
              ? <Btn variant="danger" onClick={() => setDeleteAccountOpen(true)}>Delete account</Btn>
              : <Btn variant="ghost" onClick={() => { setDeleteAccountOpen(false); setDeleteAccountInput(''); setDeleteAccountStatus(null) }}>Cancel</Btn>
            }
            noBorder={!deleteAccountOpen}
            danger
          />
          <AnimatePresence>
            {deleteAccountOpen && (
              <ExpandPanel>
                <div style={{ padding: '20px 28px 24px', borderTop: `1px solid ${C.redBorder}`, background: '#fdf5f5' }}>
                  <p style={{ margin: '0 0 14px', fontSize: '0.9rem', color: C.subtext, lineHeight: 1.65 }}>
                    This will permanently delete your account and all your LEGO sets. Type{' '}
                    <strong style={{ color: C.red, fontFamily: 'monospace', letterSpacing: '0.05em' }}>DELETE</strong>{' '}
                    to confirm.
                  </p>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                    <PinkInput
                      type="text" placeholder="Type DELETE to confirm"
                      value={deleteAccountInput}
                      onChange={e => { setDeleteAccountInput(e.target.value); setDeleteAccountStatus(null) }}
                      autoComplete="off" spellCheck="false"
                      style={{ width: '220px' }}
                    />
                    <Btn
                      variant="danger"
                      onClick={handleDeleteAccount}
                      disabled={deleteAccountInput !== 'DELETE' || deleteAccountLoading}
                    >
                      {deleteAccountLoading ? 'Deleting…' : 'Confirm deletion'}
                    </Btn>
                  </div>
                  {deleteAccountStatus && (
                    <p style={{ margin: '10px 0 0', fontSize: '0.875rem', fontWeight: 600, color: C.red }}>
                      {deleteAccountStatus.message}
                    </p>
                  )}
                </div>
              </ExpandPanel>
            )}
          </AnimatePresence>
        </SectionCard>
        </motion.div>

      </motion.div>
    </div>
  )
}
