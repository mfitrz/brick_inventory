import { motion } from 'framer-motion'

function Stud({ x, y, size = 14 }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <circle r={size / 2} fill="#2a0606" />
      <circle r={size / 2} fill="none" stroke="#3d0c0c" strokeWidth="1.5" />
      <circle r={size / 5} cx={-size / 7} cy={-size / 7} fill="#3a0a0a" />
    </g>
  )
}

function StudGrid({ width = 300, height = 200 }) {
  const spacing = 28
  const studs = []
  for (let row = 0; row * spacing < height + spacing; row++) {
    for (let col = 0; col * spacing < width + spacing; col++) {
      studs.push(
        <Stud key={`${row}-${col}`} x={col * spacing + 14} y={row * spacing + 14} size={16} />
      )
    }
  }
  return (
    <svg
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.55 }}
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="xMidYMid slice"
      viewBox={`0 0 ${width} ${height}`}
    >
      {studs}
    </svg>
  )
}

export default function MobileAppBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.35, ease: 'easeOut' }}
      style={{
        borderRadius: '28px',
        overflow: 'hidden',
        background: '#1a0404',
        boxShadow: '0 6px 0 #0d0202, 0 10px 32px rgba(0,0,0,0.4)',
        padding: '32px 28px',
        position: 'relative',
        border: '2px solid #2a0808',
      }}
    >
      {/* Stud texture */}
      <StudGrid width={340} height={220} />

      {/* Top brick edge line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '4px',
        background: '#2d0808',
      }} />

      {/* Content row: text left, phone right */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', position: 'relative' }}>

        {/* Left: badge + text + button */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <span style={{
            alignSelf: 'flex-start',
            background: '#cc1010',
            color: '#fff',
            fontSize: '0.6rem', fontWeight: 800,
            letterSpacing: '0.16em', textTransform: 'uppercase',
            padding: '4px 12px', borderRadius: '4px',
            boxShadow: '0 3px 0 #7a0000',
            fontFamily: "'Space Grotesk', sans-serif",
            marginBottom: '16px',
          }}>
            Mobile App
          </span>
          <h3 style={{
            margin: '0 0 8px',
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: '1.65rem', fontWeight: 900,
            color: '#fff', letterSpacing: '-0.02em', lineHeight: 1.2,
          }}>
            Scan. Add. Done.
          </h3>
          <p style={{
            margin: '0 0 20px',
            fontSize: '0.88rem', lineHeight: 1.6,
            color: 'rgba(255,255,255,0.45)',
            fontFamily: 'DM Sans, sans-serif',
          }}>
            Use your phone camera to scan any LEGO barcode and instantly add it to your vault.
          </p>
          <motion.button
            whileHover={{ scale: 1.03, y: -1 }}
            whileTap={{ scale: 0.97, y: 2 }}
            onClick={() => window.open('https://github.com/mfitrz/brick_inventory/tree/main/LegoScannerApp', '_blank')}
            style={{
              width: '100%',
              background: '#cc1010',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              padding: '14px 0',
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700, fontSize: '0.95rem',
              cursor: 'pointer',
              boxShadow: '0 4px 0 #7a0000',
              letterSpacing: '0.02em',
            }}
          >
            Check It Out →
          </motion.button>
        </div>

        {/* Right: phone icon */}
        <div style={{ flexShrink: 0, paddingTop: '2px' }}>
          <motion.svg
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            width="50" height="170" viewBox="0 0 28 48" fill="none" xmlns="http://www.w3.org/2000/svg"
          >
            <rect x="1" y="1" width="26" height="46" rx="5" fill="#1a0404" stroke="#cc1010" strokeWidth="1.8"/>
            <rect x="9" y="5" width="10" height="2.5" rx="1.25" fill="#cc1010" opacity="0.5"/>
            <rect x="3.5" y="10" width="21" height="28" rx="2" fill="#0d0202"/>
            <path d="M6 14v-2h2" stroke="#cc1010" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M20 12h2v2" stroke="#cc1010" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 34v2h-2" stroke="#cc1010" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M8 36h-2v-2" stroke="#cc1010" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="8"  y1="17" x2="8"  y2="31" stroke="#cc1010" strokeWidth="1"/>
            <line x1="10" y1="17" x2="10" y2="31" stroke="#cc1010" strokeWidth="1.8"/>
            <line x1="12" y1="17" x2="12" y2="31" stroke="#cc1010" strokeWidth="0.8"/>
            <line x1="14" y1="17" x2="14" y2="31" stroke="#cc1010" strokeWidth="2.2"/>
            <line x1="16" y1="17" x2="16" y2="31" stroke="#cc1010" strokeWidth="0.8"/>
            <line x1="18" y1="17" x2="18" y2="31" stroke="#cc1010" strokeWidth="1.6"/>
            <line x1="20" y1="17" x2="20" y2="31" stroke="#cc1010" strokeWidth="1"/>
            <motion.line
              x1="6" x2="22"
              stroke="#cc1010" strokeWidth="0.8" strokeOpacity="0.9"
              animate={{ y1: [17, 31, 17], y2: [17, 31, 17] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <rect x="10" y="42" width="8" height="2" rx="1" fill="#cc1010" opacity="0.4"/>
          </motion.svg>
        </div>

      </div>
    </motion.div>
  )
}
