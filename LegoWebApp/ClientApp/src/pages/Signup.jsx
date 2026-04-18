import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { signUp } from '../services/api'
import Alert from '../components/Alert'
import FormField from '../components/FormField'

export default function Signup() {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    setError(null)
    const result = await signUp(email, password)
    if (!result.success) {
      setError(result.error)
      setLoading(false)
      return
    }
    if (result.token) {
      login(result.token)
      navigate('/')
    } else {
      navigate('/login?message=Check your email to confirm your account.')
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
            initial={{ scale: 0.4, opacity: 0, rotate: 15 }}
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
            Start Your Vault
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
            Track every set you own
          </p>
        </div>

        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '14px',
          padding: '24px',
        }}>
          <AnimatePresence>
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
              minLength={6}
              autoComplete="new-password"
              placeholder="••••••••"
              hint="Minimum 6 characters"
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
              {loading ? 'Creating account…' : 'Create Account'}
            </motion.button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.83rem', color: 'var(--text-dim)', marginTop: '20px' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: 'var(--yellow)', textDecoration: 'none', fontWeight: 600 }}>
            Sign In
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
