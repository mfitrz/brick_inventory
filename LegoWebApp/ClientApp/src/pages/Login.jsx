import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { login } from '../services/api'
import Alert from '../components/Alert'
import FormField from '../components/FormField'

export default function Login() {
  const { login: storeLogin } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const message = searchParams.get('message')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await login(email, password)
    if (result.success) {
      storeLogin(result.token)
      navigate('/')
    } else {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: 'calc(100vh - 56px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 20px',
      backgroundImage: 'radial-gradient(circle, #222 1.5px, transparent 1.5px)',
      backgroundSize: '22px 22px',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: '100%', maxWidth: '380px' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <motion.div
            initial={{ scale: 0.4, opacity: 0, rotate: -15 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 280, damping: 18 }}
            style={{ fontSize: '3rem', marginBottom: '14px', display: 'inline-block' }}
          >
            🧱
          </motion.div>
          <h1 style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '2.6rem',
            letterSpacing: '0.04em',
            color: 'var(--text)',
            margin: '0 0 6px 0',
            lineHeight: 1,
          }}>
            Welcome Back
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
            Sign in to your vault
          </p>
        </div>

        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          padding: '24px',
        }}>
          <AnimatePresence>
            {message && <Alert key="msg" type="success" message={message} />}
            {error && <Alert key="err" type="error" message={error} onClose={() => setError(null)} />}
          </AnimatePresence>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <FormField
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="you@example.com"
            />
            <FormField
              label="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
            />
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={!loading ? { scale: 1.02 } : {}}
              whileTap={!loading ? { scale: 0.98 } : {}}
              style={{
                background: loading ? 'var(--border-light)' : 'var(--yellow)',
                color: loading ? 'var(--text-muted)' : '#111',
                border: 'none',
                borderRadius: '8px',
                padding: '12px',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginTop: '4px',
                fontFamily: 'DM Sans, sans-serif',
                letterSpacing: '0.02em',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </motion.button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.83rem', color: 'var(--text-dim)', marginTop: '20px' }}>
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: 'var(--yellow)', textDecoration: 'none', fontWeight: 600 }}>
            Sign Up
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
