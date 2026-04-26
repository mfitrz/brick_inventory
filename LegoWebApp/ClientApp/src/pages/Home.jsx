import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { useSets } from '../hooks/useSets'
import Alert from '../components/Alert'
import { TableRowsSkeleton } from '../components/Skeleton'
import SetSearchInput from '../components/SetSearchInput'
import VaultGraph from '../components/VaultGraph'
import MobileAppBanner from '../components/MobileAppBanner'
import SetDetailModal from '../components/SetDetailModal'

const C = {
  pageBg:    '#fce8e8',
  pageDot:   '#e4b8b8',
  card:      '#ffffff',
  border:    '#f0dede',
  heading:   '#2d0808',
  subtext:   '#7a5050',
  label:     '#2d0808',
  inputBg:   '#fcd6d6',
  red:       '#cc1010',
  redShadow: '#8b0000',
  redBg:     '#fef2f2',
  redBorder: '#fecaca',
  green:     '#16a34a',
  greenBg:   '#f0fdf4',
  dim:       '#b08080',
}

const fmt = (v) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)

const rowVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.96 },
  show:   { opacity: 1, y: 0,  scale: 1,    transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] } },
  exit:   { opacity: 0, scale: 0.94, transition: { duration: 0.16 } },
}
const listVariants = { show: { transition: { staggerChildren: 0.05 } } }

function SetCard({ set, onRemove, onClick }) {
  return (
    <motion.div
      variants={rowVariants}
      exit="exit"
      layout
      onClick={onClick}
      whileHover={{ y: -5, boxShadow: '0 6px 0 #c0a0a0, 0 18px 40px rgba(100,0,0,0.16)', outline: '2px solid #d4a8a8' }}
      whileTap={{ scale: 0.97 }}
      style={{
        background: '#fff',
        borderRadius: '20px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        boxShadow: '0 6px 0 #ddc0c0, 0 8px 20px rgba(0,0,0,0.08)',
        outline: '2px solid transparent',
        position: 'relative',
      }}
    >
      {/* Remove X — only reacts to its own hover */}
      <motion.button
        onClick={e => { e.stopPropagation(); onRemove() }}
        whileHover={{ scale: 1.12, background: C.red, color: '#fff', boxShadow: '0 4px 14px rgba(204,16,16,0.4)' }}
        whileTap={{ scale: 0.88 }}
        transition={{ duration: 0.13 }}
        style={{
          position: 'absolute', top: '10px', right: '10px', zIndex: 2,
          background: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(4px)',
          border: '1px solid rgba(255,255,255,0.2)', borderRadius: '50%',
          width: '30px', height: '30px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem',
        }}
      >✕</motion.button>

      {/* Image — dark stud surface */}
      <div style={{
        background: '#1a0404',
        backgroundImage: 'radial-gradient(circle, #2d0808 5px, transparent 5px)',
        backgroundSize: '20px 20px',
        backgroundPosition: '10px 10px',
        padding: '24px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '160px',
      }}>
        {set.imgUrl
          ? <img
              src={set.imgUrl} alt={set.name}
              style={{ width: '120px', height: '120px', objectFit: 'contain', filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.5))' }}
            />
          : <div style={{ width: '96px', height: '96px', borderRadius: '12px', background: '#2d0808', border: '1px solid #3d1010' }} />
        }
      </div>

      {/* Info */}
      <div style={{ padding: '14px 16px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'monospace', color: C.red, fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.05em' }}>
            #{set.setNumber}
          </span>
          {set.year != null && (
            <span style={{ fontSize: '0.78rem', color: C.dim, fontWeight: 600 }}>{set.year}</span>
          )}
        </div>
        <span style={{ color: C.heading, fontWeight: 600, fontSize: '1rem', lineHeight: 1.35, flex: 1, textAlign: 'center' }}>
          {set.name}
        </span>
        {set.currentPrice != null && (
          <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center' }}>
            <span style={{
              display: 'inline-block',
              background: C.pageBg, borderRadius: '8px',
              padding: '4px 10px',
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700, fontSize: '0.88rem', color: C.red,
            }}>
              {fmt(set.currentPrice)}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function AddCard({ onClick }) {
  return (
    <motion.div
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.03, y: -1 }}
      whileTap={{ scale: 0.97, y: 2 }}
      style={{
        background: C.red,
        borderRadius: '14px',
        width: '52px', height: '52px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: `0 4px 0 ${C.redShadow}`,
        alignSelf: 'center',
        justifySelf: 'center',
        userSelect: 'none',
      }}
    >
      <span style={{ fontSize: '1.4rem', color: '#fff', fontWeight: 300, lineHeight: 1 }}>+</span>
    </motion.div>
  )
}

export default function Home() {
  const { isLoggedIn, jwt } = useAuth()
  const navigate = useNavigate()
  const { sets, loading, error, success, setError, setSuccess, add, remove, removeAll } = useSets()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState(null)
  const [adding, setAdding] = useState(false)
  const [addedOk, setAddedOk] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [detailSet, setDetailSet] = useState(null)
  const [sortBy, setSortBy] = useState('number')
  const searchInputRef = useRef(null)

  if (!isLoggedIn) { navigate('/login'); return null }

  async function handleAdd(e) {
    e.preventDefault()
    if (!selected) return
    setAdding(true)
    const { success: ok } = await add(selected.number, selected.name, selected.imgUrl, selected.year)
    setAdding(false)
    if (ok) {
      setAddedOk(true)
      setTimeout(() => { setAddedOk(false); setSelected(null) }, 1200)
    }
  }

  function handleSelect(num, name, year, imgUrl) {
    setSelected({ number: num, name, year, imgUrl })
    setQuery('')
  }

  return (
    <div style={{ padding: '24px 40px 40px' }}>
      <SetDetailModal set={detailSet} onClose={() => setDetailSet(null)} />
      <div style={{
        maxWidth: '1600px',
        margin: '0 auto',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '24px',
        alignItems: 'flex-start',
      }}>

        {/* Left: YOUR VAULT card */}
        <div style={{ flex: '1 1 560px', minWidth: 0 }}>
          <div style={{
            position: 'relative',
            background: C.card,
            borderRadius: '36px',
            padding: '52px 48px 48px',
            boxShadow: '0 6px 0 #ddc0c0, 0 8px 40px rgba(0,0,0,0.08)',
          }}>

            {/* Header */}
            <div style={{ marginBottom: '32px', textAlign: 'center' }}>
              <h1 style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '3.5rem', fontWeight: 900,
                letterSpacing: '-0.03em', color: C.heading,
                margin: 0, lineHeight: 1.15,
              }}>
                YOUR VAULT
              </h1>
              <p style={{ margin: '8px 0 0', fontSize: '1rem', color: C.subtext }}>Track and manage your LEGO sets</p>
            </div>

            {/* Add set */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08, duration: 0.32, ease: 'easeOut' }}
            >
              <form onSubmit={handleAdd}>
                <AnimatePresence mode="wait">
                  {selected ? (
                    <motion.div
                      key="selected"
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}
                      style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}
                    >
                      <div style={{
                        flex: 1, display: 'flex', alignItems: 'center', gap: '16px',
                        background: C.pageBg, border: `1px solid ${C.border}`,
                        borderRadius: '14px', padding: '10px 18px', minWidth: '260px',
                      }}>
                        {selected.imgUrl && (
                          <img src={selected.imgUrl} alt={selected.name}
                            style={{ width: '52px', height: '52px', objectFit: 'contain', borderRadius: '6px', background: '#fcd6d6', flexShrink: 0 }} />
                        )}
                        <span style={{ fontFamily: 'monospace', color: C.red, fontSize: '1rem', fontWeight: 700, flexShrink: 0 }}>
                          {selected.number}
                        </span>
                        <span style={{ color: C.heading, fontSize: '1rem', fontWeight: 500, flex: 1 }}>
                          {selected.name}
                        </span>
                        {selected.year && (
                          <span style={{ color: C.subtext, fontSize: '0.95rem', flexShrink: 0 }}>{selected.year}</span>
                        )}
                        <motion.button
                          type="button" onClick={() => setSelected(null)}
                          whileHover={{ scale: 1.12, background: C.red, color: '#fff', boxShadow: '0 4px 12px rgba(204,16,16,0.45)' }}
                          whileTap={{ scale: 0.88 }}
                          transition={{ duration: 0.13 }}
                          style={{
                            background: '#fecaca', border: 'none', borderRadius: '50%',
                            width: '36px', height: '36px', flexShrink: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', color: C.red, fontSize: '0.95rem', fontWeight: 700,
                            boxShadow: '0 1px 4px rgba(204,16,16,0.2)',
                          }}
                        >✕</motion.button>
                      </div>
                      <motion.button
                        type="submit" disabled={adding || addedOk}
                        whileHover={!adding && !addedOk ? { scale: 1.03, y: -1 } : {}}
                        whileTap={!adding && !addedOk ? { scale: 0.97, y: 2 } : {}}
                        animate={{ background: addedOk ? C.green : adding ? '#d07070' : C.red }}
                        transition={{ background: { duration: 0.2 } }}
                        style={{
                          color: '#fff', border: 'none', borderRadius: '14px',
                          padding: '14px 32px',
                          fontFamily: "'Space Grotesk', sans-serif",
                          fontWeight: 700, fontSize: '0.95rem',
                          cursor: adding || addedOk ? 'not-allowed' : 'pointer',
                          boxShadow: adding || addedOk ? 'none' : `0 4px 0 ${C.redShadow}`,
                          whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '8px',
                        }}
                      >
                        {addedOk ? (
                          <><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l3.5 3.5L13 4.5" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg> Added!</>
                        ) : adding ? 'Adding…' : '+ Add Set'}
                      </motion.button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="search"
                      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}
                    >
                      <SetSearchInput
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onSelect={handleSelect}
                        onOpenChange={setDropdownOpen}
                        placeholder="Search by set number, name, or year…"
                        inputRef={searchInputRef}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
              <AnimatePresence>
                {error && <div key="err" style={{ marginTop: '12px' }}><Alert type="error" message={error} onClose={() => setError(null)} /></div>}
              </AnimatePresence>
            </motion.div>

            {/* Collection */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16, duration: 0.32, ease: 'easeOut' }}
              style={{
                marginTop: '32px',
                pointerEvents: dropdownOpen ? 'none' : 'auto',
                filter: dropdownOpen ? 'blur(3px)' : 'none',
                opacity: dropdownOpen ? 0.45 : 1,
                transition: 'filter 0.2s ease, opacity 0.2s ease',
              }}
            >
              {/* Sort controls */}
              {!loading && sets.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.1em', marginRight: '2px' }}>
                    Sort
                  </span>
                  {[
                    { key: 'number', label: 'Set #' },
                    { key: 'name',   label: 'Name' },
                    { key: 'price',  label: 'Price' },
                    { key: 'year',   label: 'Year' },
                  ].map(({ key, label }) => (
                    <motion.button
                      key={key}
                      onClick={() => setSortBy(key)}
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.95 }}
                      style={{
                        border: 'none', cursor: 'pointer', borderRadius: '20px',
                        padding: '5px 14px',
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontWeight: 600, fontSize: '0.8rem',
                        background: sortBy === key ? C.red : C.pageBg,
                        color: sortBy === key ? '#fff' : C.subtext,
                        boxShadow: sortBy === key ? `0 2px 0 ${C.redShadow}` : 'none',
                        transition: 'background 0.15s, color 0.15s, box-shadow 0.15s',
                      }}
                    >
                      {label}
                    </motion.button>
                  ))}
                  <motion.span
                    key={sets.length}
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                    style={{
                      marginLeft: 'auto',
                      background: C.red, color: '#fff',
                      fontFamily: "'Space Grotesk', sans-serif",
                      fontWeight: 700, fontSize: '0.8rem',
                      padding: '4px 12px', borderRadius: '20px',
                      letterSpacing: '0.03em',
                    }}
                  >
                    {sets.length} {sets.length === 1 ? 'set' : 'sets'}
                  </motion.span>
                </div>
              )}

              {loading ? (
                <div style={{ padding: '12px 0' }}>
                  <TableRowsSkeleton rows={5} />
                </div>
              ) : sets.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.94 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                  style={{
                    textAlign: 'center', padding: '72px 20px',
                    background: C.pageBg, borderRadius: '24px',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px',
                  }}
                >
                  <p style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: '1.1rem', fontWeight: 700,
                    color: C.subtext, margin: 0,
                  }}>
                    No sets yet — add your first one above.
                  </p>
                  <AddCard onClick={() => {
                    searchInputRef.current?.focus()
                    searchInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  }} />
                </motion.div>
              ) : (
                <motion.div
                  variants={listVariants} initial="hidden" animate="show"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(188px, 1fr))',
                    gap: '16px',
                  }}
                >
                  <AnimatePresence>
                    {[...sets].sort((a, b) => {
                      if (sortBy === 'name')   return a.name.localeCompare(b.name)
                      if (sortBy === 'number') return String(a.setNumber).localeCompare(String(b.setNumber), undefined, { numeric: true })
                      if (sortBy === 'price')  return (b.currentPrice ?? -1) - (a.currentPrice ?? -1)
                      if (sortBy === 'year')   return (b.year ?? 0) - (a.year ?? 0)
                      return 0
                    }).map(set => (
                      <SetCard
                        key={set.setNumber}
                        set={set}
                        onRemove={() => remove(set.setNumber)}
                        onClick={() => setDetailSet(set)}
                      />
                    ))}
                  </AnimatePresence>
                  <AddCard onClick={() => {
                    searchInputRef.current?.focus()
                    searchInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                  }} />
                </motion.div>
              )}
            </motion.div>

          </div>
        </div>

        {/* Right column: VaultGraph + banners */}
        <div style={{
          flex: '1 1 340px',
          maxWidth: '460px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          position: 'sticky',
          top: '24px',
          alignSelf: 'flex-start',
        }}>
          <VaultGraph sets={sets} jwt={jwt} />
          <MobileAppBanner />
        </div>

      </div>
    </div>
  )
}
