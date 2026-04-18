import { motion } from 'framer-motion'

export default function Alert({ type, message, onClose }) {
  const isError = type === 'error'
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
        padding: '11px 16px',
        marginBottom: '14px',
        fontSize: '0.85rem',
        background: isError ? 'rgba(201,31,55,0.1)' : 'rgba(34,197,94,0.08)',
        border: `1px solid ${isError ? 'rgba(201,31,55,0.3)' : 'rgba(34,197,94,0.2)'}`,
        color: isError ? '#f07070' : '#5dca82',
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
            opacity: 0.6,
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
