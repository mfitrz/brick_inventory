import { motion } from 'framer-motion'

export const G = 100  // stud grid pitch in px

export const COLORS = [
  '#c62828', '#1565c0', '#ffd600', '#2e7d32',
  '#6a1b9a', '#00838f', '#37474f', '#558b2f',
  '#1976d2', '#f9a825', '#ad1457',
]

const SIZES = [[1,1],[1,1],[2,1],[1,2],[2,2],[2,2],[3,1],[1,3],[4,1],[2,3],[3,2]]

export function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

function _luma(hex) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16)
  return 0.299*r + 0.587*g + 0.114*b
}

export function generateBricks() {
  const COLS = 42, ROWS = 24
  const grid = Array.from({ length: ROWS }, () => new Uint8Array(COLS))
  const bricks = []
  const pick = arr => arr[Math.floor(Math.random() * arr.length)]
  const deck = shuffle([...COLORS])
  let deckIdx = 0
  const nextColor = () => {
    if (deckIdx >= deck.length) { shuffle(deck); deckIdx = 0 }
    return deck[deckIdx++]
  }
  for (let attempt = 0; attempt < 350 && bricks.length < 130; attempt++) {
    const [w, h] = pick(SIZES)
    const c = Math.floor(Math.random() * (COLS - w))
    const r = Math.floor(Math.random() * (ROWS - h))
    let fits = true
    outer: for (let dr = 0; dr < h; dr++)
      for (let dc = 0; dc < w; dc++)
        if (grid[r+dr][c+dc]) { fits = false; break outer }
    if (fits) {
      const color = nextColor()
      const delay = r * 0.04 + Math.random() * 0.2
      bricks.push({ id: bricks.length, c, r, w, h, color, delay })
      for (let dr = 0; dr < h; dr++)
        for (let dc = 0; dc < w; dc++)
          grid[r+dr][c+dc] = 1
    }
  }
  return bricks
}

// Persist bricks across pages so the pattern stays consistent in a session
export function getOrGenerateBricks() {
  try {
    const stored = sessionStorage.getItem('lego_bricks')
    if (stored) return JSON.parse(stored)
  } catch {}
  const bricks = generateBricks()
  saveBricks(bricks)
  return bricks
}

export function saveBricks(bricks) {
  try { sessionStorage.setItem('lego_bricks', JSON.stringify(bricks)) } catch {}
}

export function clearBricks() {
  try { sessionStorage.removeItem('lego_bricks') } catch {}
}

function BrickSVG({ w, h, color }) {
  const pad = 4, rx = 12, sr = 18
  const bw = w * G - 2*pad, bh = h * G - 2*pad
  const sc = _luma(color) > 140 ? 'rgba(0,0,0,0.22)' : 'rgba(255,255,255,0.45)'
  const studs = []
  for (let row = 0; row < h; row++)
    for (let col = 0; col < w; col++)
      studs.push(
        <circle key={`${row}-${col}`} cx={col*G+G/2} cy={row*G+G/2}
          r={sr} fill="none" stroke={sc} strokeWidth="2.5" />
      )
  return (
    <svg width={w*G} height={h*G} style={{ display: 'block' }}>
      <rect x={pad+3} y={pad+4} width={bw} height={bh} rx={rx} fill="rgba(0,0,0,0.15)" />
      <rect x={pad} y={pad} width={bw} height={bh} rx={rx} fill={color} />
      {studs}
    </svg>
  )
}

export function BricksLayer({ bricks, animated = true, blur = false }) {
  return (
    <motion.div
      initial={{ filter: 'blur(0px)', opacity: 1 }}
      animate={{
        filter: blur ? 'blur(3px)' : 'blur(0px)',
        opacity: blur ? 0.65 : 1,
      }}
      transition={{ duration: 0.55, ease: 'easeOut' }}
      style={{
        position: 'fixed', inset: 0,
        overflow: 'hidden', pointerEvents: 'none', zIndex: 0,
      }}
    >
      {/* Dot grid lives here so it's fixed and blurs with the bricks */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle, #e4b8b8 20px, transparent 21px)',
        backgroundSize: `${G}px ${G}px`,
      }} />
      {bricks.map(brick => (
        <motion.div
          key={brick.id}
          style={{
            position: 'absolute',
            left: brick.c * G,
            top: brick.r * G,
            width: brick.w * G,
            height: brick.h * G,
          }}
          initial={{ y: animated ? -2600 : 0 }}
          animate={{ y: animated ? [-2600, 10, 0] : 0 }}
          transition={animated ? {
            duration: 0.55,
            times: [0, 0.82, 1],
            delay: brick.delay,
            ease: ['easeIn', 'easeOut'],
          } : { duration: 0 }}
        >
          <BrickSVG w={brick.w} h={brick.h} color={brick.color} />
        </motion.div>
      ))}
    </motion.div>
  )
}
