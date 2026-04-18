import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function NotFound() {
  return (
    <div style={{
      minHeight: 'calc(100vh - 56px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      padding: '32px 20px',
    }}>
      <div>
        <motion.div
          animate={{ rotate: [0, -12, 12, -8, 8, 0] }}
          transition={{ duration: 0.7, delay: 0.2, ease: 'easeInOut' }}
          style={{ fontSize: '4.5rem', marginBottom: '8px', display: 'inline-block' }}
        >
          🧱
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.35 }}
          style={{
            fontFamily: "'Bebas Neue', sans-serif",
            fontSize: '8rem',
            color: 'var(--yellow)',
            margin: '0 0 4px 0',
            lineHeight: 1,
            letterSpacing: '0.04em',
          }}
        >
          404
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          style={{ color: 'var(--text-muted)', marginBottom: '28px', fontSize: '0.95rem' }}
        >
          This page got lost in the LEGO bin.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.3 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{ display: 'inline-block' }}
        >
          <Link
            to="/"
            style={{
              background: 'var(--yellow)',
              color: '#111',
              textDecoration: 'none',
              borderRadius: '8px',
              padding: '12px 30px',
              fontWeight: 700,
              fontSize: '0.9rem',
              display: 'inline-block',
              letterSpacing: '0.03em',
            }}
          >
            Go Home
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
