import { useEffect } from 'react'
import { motion } from 'framer-motion'

export default function Alert({ type, message, onClose }) {
  const isError = type === 'error'

  useEffect(() => {
    const timer = setTimeout(onClose, isError ? 6000 : 4000)
    return () => clearTimeout(timer)
  }, [message, onClose, isError])

  return (
    <motion.div
      role="alert"
      initial={{ opacity: 0, x: 16, scale: 0.97 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 16, scale: 0.97 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: '8px',
        padding: '12px 16px',
        marginBottom: '14px',
        fontSize: '0.9rem',
        background: isError ? 'var(--red-bg)' : 'var(--green-bg)',
        border: `1px solid ${isError ? 'var(--red-border)' : 'var(--green-border)'}`,
        color: isError ? 'var(--red)' : 'var(--green)',
      }}
    >
      <span>{message}</span>
      {onClose && (
        <button
          onClick={onClose}
          aria-label="Dismiss"
          style={{
            background: 'none',
            border: 'none',
            color: 'inherit',
            cursor: 'pointer',
            marginLeft: '12px',
            opacity: 0.5,
            fontSize: '1.1rem',
            lineHeight: 1,
            padding: '0 2px',
          }}
        >
          &times;
        </button>
      )}
    </motion.div>
  )
}
