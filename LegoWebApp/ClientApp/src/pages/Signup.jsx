import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { signUp } from '../services/api'
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

function validatePassword(v) {
  if (!v) return 'Password is required.'
  if (v.length < 6) return 'Password must be at least 6 characters.'
  return null
}

export default function Signup() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const fromLogin = !!location.state?.fromLogin

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [apiError, setApiError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [exiting, setExiting] = useState(false)

  async function handleGoLogin(e) {
    e.preventDefault()
    setExiting(true)
    await new Promise(r => setTimeout(r, 320))
    navigate('/login', { state: { fromSignup: true } })
  }

  function validate(fields = { email, password }) {
    const errs = {}
    const emailErr = validateEmail(fields.email)
    if (emailErr) errs.email = emailErr
    const passErr = validatePassword(fields.password)
    if (passErr) errs.password = passErr
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
    const result = await signUp(email, password)
    if (!result.success) {
      setApiError(result.error)
      setLoading(false)
      return
    }
    if (result.token) {
      setExiting(true)
      await new Promise(r => setTimeout(r, 320))
      login(result.token)
      navigate('/', { replace: true })
    } else {
      navigate('/login?message=Check your email to confirm your account.')
    }
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
          transition={exiting ? { duration: 0.3, ease: 'easeIn' } : { duration: fromLogin ? 0.65 : 0.4, ease: [0.22, 1, 0.36, 1], delay: fromLogin ? 0 : 0.4 }}
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
              START YOUR VAULT
            </h1>
            <p style={{ color: C.subtext, fontSize: '1rem', margin: 0 }}>Create your account</p>
          </div>

          <AnimatePresence>
            {apiError && <Alert key="err" type="error" message={apiError} onClose={() => setApiError(null)} />}
          </AnimatePresence>

          <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label htmlFor="signup-email" style={{ display: 'block', margin: '0 0 9px', fontSize: '0.7rem', fontWeight: 700, color: C.label, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                Email Address
              </label>
              <PinkInput
                id="signup-email"
                type="email"
                placeholder="master.builder@vault.com"
                value={email}
                onChange={e => { setEmail(e.target.value); if (touched.email) setFieldErrors(fe => ({ ...fe, email: validateEmail(e.target.value) })) }}
                onBlur={() => handleBlur('email')}
                required
                aria-required="true"
                aria-describedby={fieldErrors.email ? 'signup-email-error' : undefined}
                aria-invalid={!!fieldErrors.email}
                hasError={!!fieldErrors.email}
                autoComplete="email"
              />
              <FieldError id="signup-email-error" message={fieldErrors.email} />
            </div>

            <div>
              <label htmlFor="signup-password" style={{ display: 'block', margin: '0 0 9px', fontSize: '0.7rem', fontWeight: 700, color: C.label, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                Password
              </label>
              <PinkInput
                id="signup-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); if (touched.password) setFieldErrors(fe => ({ ...fe, password: validatePassword(e.target.value) })) }}
                onBlur={() => handleBlur('password')}
                required
                aria-required="true"
                aria-describedby={`signup-password-hint${fieldErrors.password ? ' signup-password-error' : ''}`}
                aria-invalid={!!fieldErrors.password}
                hasError={!!fieldErrors.password}
                autoComplete="new-password"
              />
              <p id="signup-password-hint" style={{ margin: '6px 0 0', fontSize: '0.75rem', color: C.subtext }}>
                Minimum 6 characters
              </p>
              <FieldError id="signup-password-error" message={fieldErrors.password} />
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={!loading ? { scale: 1.02, y: -1 } : {}}
              whileTap={!loading ? { scale: 0.98, y: 2 } : {}}
              style={{ background: loading ? '#d07070' : C.red, color: '#fff', border: 'none', borderRadius: '14px', padding: '18px', fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: '1rem', letterSpacing: '0.06em', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '6px', boxShadow: loading ? 'none' : `0 5px 0 ${C.redShadow}`, transition: 'background 0.15s, box-shadow 0.15s' }}
            >
              {loading ? 'Creating account…' : 'CREATE ACCOUNT  →'}
            </motion.button>
          </form>

          <div style={{ margin: '32px 0 0', borderTop: `1px solid ${C.divider}` }} />
          <p style={{ margin: '24px 0 0', textAlign: 'center', fontSize: '0.95rem', color: C.subtext }}>
            Already have an account?{' '}
            <a href="#" onClick={handleGoLogin} style={{ color: C.red, textDecoration: 'none', fontWeight: 700 }}>Sign In</a>
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
