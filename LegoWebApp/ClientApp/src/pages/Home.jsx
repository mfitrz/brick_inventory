import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useSets } from '../hooks/useSets'
import Alert from '../components/Alert'
import { TableRowsSkeleton } from '../components/Skeleton'

const rowVariants = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, x: 16, transition: { duration: 0.18 } },
}

const listVariants = {
  show: { transition: { staggerChildren: 0.045 } },
}

export default function Home() {
  const { isLoggedIn } = useAuth()
  const navigate = useNavigate()
  const { sets, loading, error, success, setError, setSuccess, add, remove, removeAll } = useSets()
  const [setNumber, setSetNumber] = useState('')
  const [setName, setSetName] = useState('')
  const [adding, setAdding] = useState(false)
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false)

  if (!isLoggedIn) { navigate('/login'); return null }

  async function handleAdd(e) {
    e.preventDefault()
    setAdding(true)
    const ok = await add(parseInt(setNumber), setName)
    if (ok) { setSetNumber(''); setSetName('') }
    setAdding(false)
  }

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '36px 20px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
        <h1 style={{
          fontFamily: "'Bebas Neue', sans-serif",
          fontSize: '2.8rem',
          letterSpacing: '0.04em',
          color: 'var(--text)',
          margin: 0,
          lineHeight: 1,
        }}>
          My Collection
        </h1>
        <AnimatePresence mode="wait">
          {!loading && (
            <motion.span
              key={sets.length}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 22 }}
              style={{
                background: 'var(--yellow)',
                color: '#111',
                fontWeight: 700,
                fontSize: '0.7rem',
                padding: '3px 10px',
                borderRadius: '20px',
                letterSpacing: '0.05em',
                alignSelf: 'center',
              }}
            >
              {sets.length} {sets.length === 1 ? 'set' : 'sets'}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {error && <Alert key="err" type="error" message={error} onClose={() => setError(null)} />}
        {success && <Alert key="suc" type="success" message={success} onClose={() => setSuccess(null)} />}
      </AnimatePresence>

      {/* Add set form */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.32, ease: 'easeOut' }}
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          padding: '20px',
          marginBottom: '16px',
        }}
      >
        <p style={{
          fontSize: '0.68rem',
          fontWeight: 700,
          color: 'var(--text-dim)',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: '14px',
          margin: '0 0 14px 0',
        }}>
          Add a Set
        </p>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input
            type="number"
            placeholder="Set number"
            value={setNumber}
            onChange={e => setSetNumber(e.target.value)}
            required
            min={1}
            style={{ width: '148px', flex: '0 0 auto' }}
          />
          <input
            type="text"
            placeholder="Set name"
            value={setName}
            onChange={e => setSetName(e.target.value)}
            required
            style={{ flex: 1, minWidth: '160px' }}
          />
          <motion.button
            type="submit"
            disabled={adding}
            whileHover={!adding ? { scale: 1.03 } : {}}
            whileTap={!adding ? { scale: 0.97 } : {}}
            style={{
              background: adding ? 'var(--border-light)' : 'var(--yellow)',
              color: adding ? 'var(--text-muted)' : '#111',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 22px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: adding ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap',
              fontFamily: 'DM Sans, sans-serif',
              letterSpacing: '0.02em',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            {adding ? 'Adding…' : '+ Add'}
          </motion.button>
        </form>
      </motion.div>

      {/* Collection table */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16, duration: 0.32, ease: 'easeOut' }}
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              <th style={{ textAlign: 'left', padding: '11px 20px', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Set #</th>
              <th style={{ textAlign: 'left', padding: '11px 20px', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Name</th>
              <th style={{ padding: '11px 20px', width: '80px' }} />
            </tr>
          </thead>
          {loading ? (
            <TableRowsSkeleton rows={5} />
          ) : sets.length === 0 ? (
            <tbody>
              <tr>
                <td colSpan={3}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    style={{ textAlign: 'center', padding: '64px 20px', color: 'var(--text-dim)' }}
                  >
                    <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🧱</div>
                    <p style={{ fontWeight: 500, color: 'var(--text-muted)', margin: 0 }}>
                      No sets yet — add your first one above.
                    </p>
                  </motion.div>
                </td>
              </tr>
            </tbody>
          ) : (
            <motion.tbody variants={listVariants} initial="hidden" animate="show">
              <AnimatePresence>
                {sets.map(set => (
                  <motion.tr
                    key={set.setNumber}
                    variants={rowVariants}
                    exit="exit"
                    layout
                    style={{ borderBottom: '1px solid var(--border)' }}
                    whileHover={{ backgroundColor: '#242424' }}
                    transition={{ backgroundColor: { duration: 0.12 } }}
                  >
                    <td style={{ padding: '13px 20px', fontFamily: 'monospace', color: 'var(--yellow)', fontSize: '0.85rem', fontWeight: 600 }}>
                      {set.setNumber}
                    </td>
                    <td style={{ padding: '13px 20px', color: 'var(--text)', fontWeight: 500, fontSize: '0.9rem' }}>
                      {set.name}
                    </td>
                    <td style={{ padding: '13px 20px', textAlign: 'right' }}>
                      <motion.button
                        onClick={() => remove(set.setNumber)}
                        whileHover={{ scale: 1.06, color: '#f07070' }}
                        whileTap={{ scale: 0.94 }}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-dim)',
                          cursor: 'pointer',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          letterSpacing: '0.04em',
                          fontFamily: 'DM Sans, sans-serif',
                          padding: '4px 8px',
                        }}
                      >
                        Remove
                      </motion.button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </motion.tbody>
          )}
        </table>

        {!loading && sets.length > 0 && (
          <div style={{
            padding: '11px 20px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              {sets.length} {sets.length === 1 ? 'set' : 'sets'} total
            </span>
            <AnimatePresence mode="wait">
              {confirmDeleteAll ? (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8 }}
                  style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '0.8rem' }}
                >
                  <span style={{ color: 'var(--text-muted)' }}>Delete all {sets.length} sets?</span>
                  <button
                    onClick={removeAll}
                    style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', fontFamily: 'DM Sans, sans-serif' }}
                  >
                    Yes, delete
                  </button>
                  <button
                    onClick={() => setConfirmDeleteAll(false)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: '0.8rem', fontFamily: 'DM Sans, sans-serif' }}
                  >
                    Cancel
                  </button>
                </motion.div>
              ) : (
                <motion.button
                  key="trigger"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setConfirmDeleteAll(true)}
                  whileHover={{ color: 'var(--red)' }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-dim)',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    fontFamily: 'DM Sans, sans-serif',
                    letterSpacing: '0.03em',
                  }}
                >
                  Delete all
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    </div>
  )
}
