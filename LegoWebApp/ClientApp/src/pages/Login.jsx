import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { login, forgotPassword } from '../services/api'
import Alert from '../components/Alert'

const C = {
  pageBg:    '#fce8e8',
  pageDot:   '#e4b8b8',
  card:      '#ffffff',
  heading:   '#2d0808',
  subtext:   '#7a5050',
  label:     '#2d0808',
  inputBg:   '#fcd6d6',
  inputText: '#2d0808',
  red:       '#cc1010',
  redShadow: '#8b0000',
  blue:      '#1d4ed8',
  divider:   '#f0dede',
}

function PinkInput({ hasError, ...props }) {
  const [focused, setFocused] = useState(false)
  const borderColor = hasError ? C.red : focused ? C.red : 'transparent'
  const opacity = hasError && !focused ? 0.6 : 1
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      background: C.inputBg,
      borderRadius: '14px',
      border: `2px solid ${borderColor}`,
      opacity,
      transition: 'border-color 0.15s, opacity 0.15s',
    }}>
      <input
        {...props}
        className="login-input"
        onFocus={e => { setFocused(true); props.onFocus?.(e) }}
        onBlur={e => { setFocused(false); props.onBlur?.(e) }}
        style={{ flex: 1, fontSize: '1rem', fontFamily: 'DM Sans, sans-serif', color: C.inputText }}
      />
    </div>
  )
}

function FieldError({ id, message }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.p
          id={id}
          role="alert"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          style={{ margin: '6px 0 0', fontSize: '0.75rem', color: C.red, fontWeight: 600 }}
        >
          {message}
        </motion.p>
      )}
    </AnimatePresence>
  )
}

function validateEmail(v) {
  if (!v) return 'Email is required.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return 'Enter a valid email address.'
  return null
}

export default function Login() {
  const { login: storeLogin } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const message = searchParams.get('message')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [apiError, setApiError] = useState(null)
  const [loading, setLoading] = useState(false)

  const [forgotOpen, setForgotOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotStatus, setForgotStatus] = useState(null)
  const [forgotLoading, setForgotLoading] = useState(false)

  const [exiting, setExiting] = useState(false)

  async function handleGoSignup(e) {
    e.preventDefault()
    setExiting(true)
    await new Promise(r => setTimeout(r, 320))
    navigate('/signup', { state: { fromLogin: true } })
  }

  function validate(fields = { email, password }) {
    const errs = {}
    const emailErr = validateEmail(fields.email)
    if (emailErr) errs.email = emailErr
    if (!fields.password) errs.password = 'Password is required.'
    return errs
  }

  function handleBlur(field) {
    setTouched(t => ({ ...t, [field]: true }))
    const errs = validate()
    setFieldErrors(e => ({ ...e, [field]: errs[field] ?? null }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setTouched({ email: true, password: true })
    const errs = validate()
    setFieldErrors(errs)
    if (Object.keys(errs).length) return

    setLoading(true)
    setApiError(null)
    const result = await login(email, password)
    if (result.success) {
      setExiting(true)
      await new Promise(r => setTimeout(r, 320))
      storeLogin(result.token)
      navigate('/', { replace: true })
    } else {
      setApiError(result.error)
      setLoading(false)
    }
  }

  async function handleForgot(e) {
    e.preventDefault()
    setForgotLoading(true)
    setForgotStatus(null)
    const result = await forgotPassword(forgotEmail)
    setForgotLoading(false)
    setForgotStatus({
      type: result.success ? 'success' : 'error',
      message: result.success ? result.message : result.error,
    })
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
    }}>

      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 20px 32px',
        position: 'relative',
        zIndex: 1,
      }}>
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={exiting ? { opacity: 0, y: -16 } : { opacity: 1, y: 0 }}
          transition={exiting ? { duration: 0.3, ease: 'easeIn' } : { duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
          style={{
            width: '100%',
            maxWidth: '600px',
            background: C.card,
            borderRadius: '36px',
            padding: '64px 56px 56px',
            boxShadow: '0 20px 64px rgba(100,0,0,0.16)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <p style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '2rem', color: C.red, letterSpacing: '-0.02em', margin: '0 0 16px' }}>
              BuildaVault
            </p>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: '2.8rem', fontWeight: 900, letterSpacing: '-0.01em', color: C.heading, margin: '0 0 10px', lineHeight: 1.1 }}>
              WELCOME BACK
            </h1>
            <p style={{ color: C.subtext, fontSize: '1rem', margin: 0 }}>Sign in to your vault</p>
          </div>

          <AnimatePresence>
            {message && <Alert key="msg" type="success" message={message} />}
            {apiError && <Alert key="err" type="error" message={apiError} onClose={() => setApiError(null)} />}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {forgotOpen ? (
              <motion.div
                key="forgot"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
              >
                <p style={{ margin: '0 0 14px', fontSize: '0.85rem', color: C.subtext }}>
                  Enter your email and we'll send a reset link.
                </p>
                <form onSubmit={handleForgot} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label htmlFor="forgot-email" style={{ display: 'block', margin: '0 0 9px', fontSize: '0.7rem', fontWeight: 700, color: C.label, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                      Email Address
                    </label>
                    <PinkInput
                      id="forgot-email"
                      type="email"
                      placeholder="master.builder@vault.com"
                      value={forgotEmail}
                      onChange={e => setForgotEmail(e.target.value)}
                      required
                      aria-required="true"
                      autoComplete="email"
                    />
                  </div>
                  {forgotStatus && (
                    <p style={{ margin: 0, fontSize: '0.85rem', color: forgotStatus.type === 'success' ? '#2e7d32' : C.red }}>
                      {forgotStatus.message}
                    </p>
                  )}
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <motion.button
                      type="submit" disabled={forgotLoading}
                      whileHover={!forgotLoading ? { scale: 1.02 } : {}}
                      whileTap={!forgotLoading ? { scale: 0.98 } : {}}
                      style={{ flex: 1, background: C.red, color: '#fff', border: 'none', borderRadius: '14px', padding: '14px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.9rem', cursor: forgotLoading ? 'not-allowed' : 'pointer', boxShadow: forgotLoading ? 'none' : `0 4px 0 ${C.redShadow}`, transition: 'background 0.15s' }}
                    >
                      {forgotLoading ? 'Sending…' : 'Send Reset Link'}
                    </motion.button>
                    <button
                      type="button"
                      onClick={() => { setForgotOpen(false); setForgotStatus(null); setForgotEmail('') }}
                      style={{ background: 'transparent', border: `2px solid ${C.divider}`, borderRadius: '14px', padding: '14px 18px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '0.9rem', color: C.subtext, cursor: 'pointer' }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : (
              <motion.form
                key="login"
                onSubmit={handleSubmit}
                noValidate
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}
              >
                <div>
                  <label htmlFor="login-email" style={{ display: 'block', margin: '0 0 9px', fontSize: '0.7rem', fontWeight: 700, color: C.label, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                    Email Address
                  </label>
                  <PinkInput
                    id="login-email"
                    type="email"
                    placeholder="master.builder@vault.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); if (touched.email) setFieldErrors(fe => ({ ...fe, email: validateEmail(e.target.value) })) }}
                    onBlur={() => handleBlur('email')}
                    required
                    aria-required="true"
                    aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
                    aria-invalid={!!fieldErrors.email}
                    hasError={!!fieldErrors.email}
                    autoComplete="email"
                  />
                  <FieldError id="login-email-error" message={fieldErrors.email} />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '9px' }}>
                    <label htmlFor="login-password" style={{ margin: 0, fontSize: '0.7rem', fontWeight: 700, color: C.label, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => setForgotOpen(true)}
                      style={{ background: 'none', border: 'none', padding: 0, fontSize: '0.82rem', fontWeight: 600, color: C.blue, cursor: 'pointer' }}
                    >
                      Forgot?
                    </button>
                  </div>
                  <PinkInput
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={e => { setPassword(e.target.value); if (touched.password) setFieldErrors(fe => ({ ...fe, password: e.target.value ? null : 'Password is required.' })) }}
                    onBlur={() => handleBlur('password')}
                    required
                    aria-required="true"
                    aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
                    aria-invalid={!!fieldErrors.password}
                    hasError={!!fieldErrors.password}
                    autoComplete="current-password"
                  />
                  <FieldError id="login-password-error" message={fieldErrors.password} />
                </div>

                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={!loading ? { scale: 1.02, y: -1 } : {}}
                  whileTap={!loading ? { scale: 0.98, y: 2 } : {}}
                  style={{ background: loading ? '#d07070' : C.red, color: '#fff', border: 'none', borderRadius: '14px', padding: '18px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1rem', letterSpacing: '0.06em', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '6px', boxShadow: loading ? 'none' : `0 5px 0 ${C.redShadow}`, transition: 'background 0.15s, box-shadow 0.15s' }}
                >
                  {loading ? 'Signing in…' : 'SIGN IN  →'}
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>

          <div style={{ margin: '32px 0 0', borderTop: `1px solid ${C.divider}` }} />
          <p style={{ margin: '24px 0 0', textAlign: 'center', fontSize: '0.95rem', color: C.subtext }}>
            Don't have an account?{' '}
            <a href="#" onClick={handleGoSignup} style={{ color: C.red, textDecoration: 'none', fontWeight: 700 }}>
              Sign Up
            </a>
          </p>
        </motion.div>
      </div>

      <footer style={{ background: '#f5cece', borderTop: `1px solid #e8b8b8`, padding: '18px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
        <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 800, fontSize: '1rem', color: C.red, letterSpacing: '-0.01em' }}>BuildaVault</span>
        <span style={{ fontSize: '0.8rem', color: C.subtext }}>© 2024 BuildaVault. Built brick by brick.</span>
      </footer>
    </div>
  )
}
