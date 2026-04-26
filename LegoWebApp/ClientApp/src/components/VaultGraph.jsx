import { useState, useEffect, useRef } from 'react'
import {
  ResponsiveContainer, ComposedChart, Area, Line,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'
import { getVaultPredictions } from '../services/api'
import { decodeJwtPayload } from '../utils/jwt'

const C = {
  red:     '#cc1010',
  heading: '#2d0808',
  subtext: '#7a5050',
  border:  '#f0dede',
  pageBg:  '#fce8e8',
  dim:     '#b08080',
}

const fmt = (v) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)

const yFmt = (v) => v >= 1000 ? `$${(v / 1000).toFixed(1)}k` : `$${Math.round(v)}`

// Cache key = sorted set numbers only — changes on add/delete, not on price fluctuation
function buildSetsKey(sets) {
  return [...sets].sort((a, b) => a.setNumber - b.setNumber).map(s => s.setNumber).join(',')
}

function cacheStorageKey(userId) {
  return `vault_predictions_${userId}`
}

function readCache(userId) {
  try {
    const raw = localStorage.getItem(cacheStorageKey(userId))
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeCache(userId, setsKey, predictions) {
  try {
    localStorage.setItem(cacheStorageKey(userId), JSON.stringify({ setsKey, predictions }))
  } catch {}
}

function CustomTooltip({ active, payload, label, currentYear }) {
  if (!active || !payload?.length) return null
  const val = payload.find(p => p.value != null)?.value
  if (val == null) return null
  return (
    <div style={{
      background: '#fff', border: `1.5px solid ${C.border}`,
      borderRadius: '12px', padding: '10px 16px',
      boxShadow: '0 4px 20px rgba(100,0,0,0.1)',
    }}>
      <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        {label === currentYear ? 'Current Value' : `Predicted ${label}`}
      </p>
      <p style={{ margin: '2px 0 0', fontFamily: "'Space Grotesk', sans-serif", fontSize: '1.1rem', fontWeight: 700, color: C.heading }}>
        {fmt(val)}
      </p>
    </div>
  )
}

export default function VaultGraph({ sets, jwt }) {
  const [predictions, setPredictions] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const fetchedKeyRef = useRef(null)

  const pricedSets = sets.filter(s => s.currentPrice != null && s.currentPrice > 0)
  const unpricedCount = sets.length - pricedSets.length
  const currentTotal = pricedSets.reduce((sum, s) => sum + s.currentPrice, 0)
  const currentYear = new Date().getFullYear()

  useEffect(() => {
    if (sets.length === 0) return

    const setsKey = buildSetsKey(sets)

    // Skip if this render is for the same collection we already fetched
    if (fetchedKeyRef.current === setsKey) return
    fetchedKeyRef.current = setsKey

    const userId = decodeJwtPayload(jwt)?.sub
    if (!userId) return

    // Serve from cache if the collection hasn't changed
    const cached = readCache(userId)
    if (cached?.setsKey === setsKey) {
      setPredictions(cached.predictions)
      setError(false)
      return
    }

    // Collection changed — fetch fresh prediction and update cache
    fetchPredictions(setsKey, userId)
  }, [sets])

  async function fetchPredictions(setsKey, userId) {
    setLoading(true)
    setError(false)
    const result = await getVaultPredictions(jwt, sets.map(s => ({
      setNumber: s.setNumber,
      name: s.name,
      currentPrice: s.currentPrice ?? 0,
    })))
    if (result) {
      setPredictions(result)
      writeCache(userId, setsKey, result)
    } else {
      setError(true)
    }
    setLoading(false)
  }

  const chartData = predictions
    ? [
        { year: currentYear, current: currentTotal, predicted: currentTotal },
        ...predictions.predictions.map(p => ({ year: p.year, predicted: p.totalValue })),
      ]
    : [{ year: currentYear, current: currentTotal }]

  if (sets.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.28 }}
        style={{
          padding: '40px 32px',
          background: '#ffffff',
          borderRadius: '28px',
          boxShadow: '0 6px 0 #ddc0c0, 0 8px 32px rgba(0,0,0,0.07)',
          textAlign: 'center',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px',
        }}
      >
        <p style={{ margin: 0, fontFamily: "'Space Grotesk', sans-serif", fontSize: '1rem', fontWeight: 700, color: C.heading }}>
          Your vault is empty
        </p>
        <p style={{ margin: 0, fontSize: '0.85rem', color: C.subtext, lineHeight: 1.6, maxWidth: '240px' }}>
          Add your first LEGO set to start tracking your vault value over time.
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.3 }}
      style={{
        padding: '28px 32px',
        background: '#ffffff',
        borderRadius: '28px',
        boxShadow: '0 6px 0 #ddc0c0, 0 8px 32px rgba(0,0,0,0.07)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <p style={{ margin: '0 0 2px', fontSize: '0.72rem', fontWeight: 700, color: C.dim, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Vault Value
          </p>
          <p style={{ margin: 0, fontFamily: "'Space Grotesk', sans-serif", fontSize: '2.4rem', fontWeight: 900, color: C.heading, letterSpacing: '-0.03em' }}>
            {fmt(currentTotal)}
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '5px', paddingTop: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '16px', height: '2.5px', background: C.red, borderRadius: '2px' }} />
            <span style={{ fontSize: '0.8rem', color: C.subtext }}>Current</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <svg width="16" height="4" viewBox="0 0 16 4"><line x1="0" y1="2" x2="16" y2="2" stroke={C.red} strokeWidth="2" strokeDasharray="4 2" strokeOpacity="0.5"/></svg>
            <span style={{ fontSize: '0.8rem', color: C.subtext }}>Value Prediction</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div style={{ position: 'relative', userSelect: 'none', WebkitUserSelect: 'none', pointerEvents: 'none' }}>
        <ResponsiveContainer width="100%" aspect={1}>
          <ComposedChart data={chartData} margin={{ top: 28, right: 24, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="predGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={C.red} stopOpacity={0.12} />
                <stop offset="95%" stopColor={C.red} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 13, fill: C.dim }} axisLine={{ stroke: C.border, strokeWidth: 1.5 }} tickLine={false} />
            <YAxis
              domain={[0, 'auto']}
              tickFormatter={yFmt}
              tick={{ fontSize: 12, fill: C.dim }}
              axisLine={false} tickLine={false} width={42}
            />
            <Tooltip content={<CustomTooltip currentYear={currentYear} />} />
            <Area
              type="monotone" dataKey="predicted"
              stroke={C.red} strokeWidth={2} strokeDasharray="6 3" strokeOpacity={0.55}
              fill="url(#predGrad)" dot={false}
              activeDot={{ r: 4, fill: C.red, opacity: 0.6 }}
              connectNulls
            />
            <Line
              type="monotone" dataKey="current"
              stroke={C.red} strokeWidth={3}
              dot={{ fill: C.red, r: 5, strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, fill: C.red }}
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>

        {/* Loading overlay */}
        <AnimatePresence>
          {loading && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{
                position: 'absolute', inset: 0,
                background: 'rgba(255,255,255,0.75)',
                borderRadius: '8px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <p style={{ margin: 0, fontSize: '0.78rem', color: C.dim }}>Generating value prediction…</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
        <AnimatePresence>
          {error && !loading && (
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              style={{ margin: 0, fontSize: '0.78rem', color: C.dim }}
            >
              Value prediction unavailable
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
