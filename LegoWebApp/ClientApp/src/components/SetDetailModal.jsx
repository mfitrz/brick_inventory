import { motion, AnimatePresence } from 'framer-motion'

const C = {
  red:     '#cc1010',
  redDark: '#7a0000',
  heading: '#2d0808',
  subtext: '#7a5050',
  border:  '#f0dede',
  pageBg:  '#fce8e8',
  inputBg: '#fcd6d6',
  dim:     '#b08080',
}

const fmt = (v) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v)

export default function SetDetailModal({ set, onClose }) {
  if (!set) return null

  const encodedTitle = encodeURIComponent(`LEGO ${set.setNumber} ${set.name}`)
  const ebayListUrl  = `https://www.ebay.com/sl/prelist/suggest?TITLE=${encodedTitle}&CATEGORY=19006`
  const ebaySoldUrl  = `https://www.ebay.com/sch/i.html?_nkw=${encodedTitle}&LH_Sold=1&LH_Complete=1`

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(45,8,8,0.55)',
          backdropFilter: 'blur(8px)',
          zIndex: 200,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '20px',
        }}
      >
        <motion.div
          key="modal"
          initial={{ opacity: 0, scale: 0.93, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.93, y: 24 }}
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          onClick={e => e.stopPropagation()}
          style={{
            background: '#fff',
            borderRadius: '36px',
            width: '1100px',
            maxWidth: '96vw',
            maxHeight: '92vh',
            overflow: 'hidden',
            boxShadow: '0 40px 100px rgba(45,8,8,0.3)',
            display: 'flex',
            position: 'relative',
          }}
        >
          {/* ── Close button — top right of the whole modal ── */}
          <motion.button
            onClick={onClose}
            whileHover={{ scale: 1.1, background: C.red, color: '#fff', boxShadow: '0 4px 16px rgba(204,16,16,0.4)' }}
            whileTap={{ scale: 0.88 }}
            transition={{ duration: 0.13 }}
            style={{
              position: 'absolute', top: '20px', right: '20px', zIndex: 10,
              background: '#fff', border: 'none', borderRadius: '50%',
              width: '42px', height: '42px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: C.subtext, fontSize: '1.1rem',
              boxShadow: '0 2px 12px rgba(0,0,0,0.18)',
            }}
          >✕</motion.button>

          {/* ── Left: image panel ── */}
          <div style={{
            flex: '0 0 620px',
            background: '#1a0404',
            backgroundImage: 'radial-gradient(circle, #2d0808 7px, transparent 7px)',
            backgroundSize: '28px 28px',
            backgroundPosition: '14px 14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '56px 48px',
            minHeight: '600px',
          }}>
            {set.imgUrl
              ? <img
                  src={set.imgUrl}
                  alt={set.name}
                  style={{
                    width: '500px', height: '500px',
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 24px 56px rgba(0,0,0,0.7))',
                  }}
                />
              : <div style={{ width: '500px', height: '500px', borderRadius: '28px', background: '#2d0808', border: '2px solid #3d1010' }} />
            }
          </div>

          {/* ── Right: info panel ── */}
          <div style={{
            flex: 1,
            display: 'flex', flexDirection: 'column',
            padding: '52px 44px 44px',
            overflowY: 'auto',
            borderLeft: `1px solid ${C.border}`,
          }}>
            {/* Set number + name */}
            <div style={{ marginBottom: '28px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{
                  fontFamily: 'monospace', color: C.red,
                  fontSize: '1rem', fontWeight: 700, letterSpacing: '0.06em',
                }}>
                  #{set.setNumber}
                </span>
                {set.year != null && (
                  <span style={{
                    fontSize: '0.82rem', fontWeight: 700, color: C.dim,
                    background: C.pageBg, borderRadius: '8px',
                    padding: '2px 10px',
                  }}>
                    {set.year}
                  </span>
                )}
              </div>
              <h2 style={{
                margin: '8px 0 0',
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: '1.9rem', fontWeight: 900,
                color: C.heading, lineHeight: 1.15,
                letterSpacing: '-0.02em',
              }}>
                {set.name}
              </h2>
            </div>

            {/* Price badge */}
            {set.currentPrice != null && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: C.pageBg, borderRadius: '18px',
                padding: '18px 22px', marginBottom: '28px',
                border: `1px solid ${C.border}`,
              }}>
                <span style={{
                  fontSize: '0.82rem', fontWeight: 700, color: C.subtext,
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                }}>
                  eBay Market Value
                </span>
                <span style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 900, fontSize: '1.75rem', color: C.red,
                  letterSpacing: '-0.02em',
                }}>
                  {fmt(set.currentPrice)}
                </span>
              </div>
            )}

            <p style={{
              margin: '0 0 auto',
              fontSize: '0.98rem', color: C.subtext, lineHeight: 1.7,
              paddingBottom: '32px',
            }}>
              List this set directly on eBay — prices are sourced from recent sold listings so you can price competitively.
            </p>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <a
                href={ebayListUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  textAlign: 'center', textDecoration: 'none',
                  background: C.red, color: '#fff',
                  borderRadius: '18px', padding: '18px 0',
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700, fontSize: '1rem',
                  boxShadow: `0 4px 0 ${C.redDark}`,
                  letterSpacing: '0.02em',
                }}
              >
                List on eBay →
              </a>
              <a
                href={ebaySoldUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  textAlign: 'center', textDecoration: 'none',
                  background: C.pageBg, color: C.red,
                  borderRadius: '18px', padding: '16px 0',
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700, fontSize: '0.95rem',
                  border: `1px solid ${C.border}`,
                }}
              >
                View Recent Sales
              </a>
            </div>
          </div>

        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
