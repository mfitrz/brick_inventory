import { motion } from 'framer-motion'

export default function EbayListingBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.35, ease: 'easeOut' }}
      style={{
        borderRadius: '28px',
        overflow: 'hidden',
        background: 'linear-gradient(160deg, #0d1117 0%, #1a2332 60%, #0d1a2e 100%)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.28)',
        padding: '28px 32px',
        position: 'relative',
      }}
    >
      {/* Glow */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        backgroundImage: 'radial-gradient(circle at 90% 10%, rgba(232,187,0,0.15) 0%, transparent 55%)',
      }} />

      {/* Badge + icon row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', position: 'relative' }}>
        <span style={{
          background: 'rgba(232,187,0,0.15)',
          border: '1px solid rgba(232,187,0,0.3)',
          color: '#e8bb00',
          fontSize: '0.58rem', fontWeight: 700,
          letterSpacing: '0.14em', textTransform: 'uppercase',
          padding: '3px 10px', borderRadius: '20px',
        }}>
          eBay Listing
        </span>

        <motion.div
          animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
          transition={{ duration: 4, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut' }}
          style={{
            width: '42px', height: '42px',
            background: 'rgba(232,187,0,0.1)',
            border: '1.5px solid rgba(232,187,0,0.2)',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(232,187,0,0.8)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 12V22H4V12" />
            <path d="M22 7H2v5h20V7z" />
            <path d="M12 22V7" />
            <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
            <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
          </svg>
        </motion.div>
      </div>

      {/* Text */}
      <div style={{ position: 'relative' }}>
        <h3 style={{
          margin: '0 0 8px',
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: '1.5rem', fontWeight: 900,
          color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.2,
        }}>
          Sell your sets.
        </h3>
        <p style={{
          margin: '0 0 20px',
          fontSize: '0.85rem', lineHeight: 1.6,
          color: 'rgba(255,255,255,0.5)',
        }}>
          Click any set in your vault to view its market value and list it on eBay in seconds.
        </p>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          fontSize: '0.75rem', color: 'rgba(232,187,0,0.7)', fontWeight: 600,
          letterSpacing: '0.04em',
        }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'rgba(232,187,0,0.7)' }} />
          Prices sourced from real eBay sold listings
        </div>
      </div>
    </motion.div>
  )
}
