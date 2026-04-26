import { useState, useEffect, useRef } from 'react'
import { searchSets } from '../services/api'

const C = {
  inputBg:  '#fcd6d6',
  red:      '#cc1010',
  border:   '#f0dede',
  pageBg:   '#fce8e8',
  card:     '#ffffff',
  text:     '#2d0808',
  subtext:  '#7a5050',
  dim:      '#b08080',
}

function DropdownSkeleton() {
  const widths = [140, 200, 160, 180]
  return (
    <>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: '14px',
          padding: '13px 20px', borderBottom: `1px solid ${C.border}`,
        }}>
          <div className="animate-pulse" style={{ height: '14px', width: '56px', background: C.inputBg, borderRadius: '4px', flexShrink: 0 }} />
          <div className="animate-pulse" style={{ height: '14px', width: `${widths[i]}px`, background: C.inputBg, borderRadius: '4px', animationDelay: `${i * 60}ms` }} />
          <div className="animate-pulse" style={{ height: '12px', width: '36px', background: C.inputBg, borderRadius: '4px', marginLeft: 'auto', flexShrink: 0, animationDelay: `${i * 60}ms` }} />
        </div>
      ))}
    </>
  )
}

export default function SetSearchInput({ value, onChange, onSelect, onOpenChange, placeholder, inputRef }) {
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)

  function setOpenWithCallback(val) {
    setOpen(val)
    onOpenChange?.(val)
  }
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [focused, setFocused] = useState(false)
  const debounceRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    const q = String(value).trim()
    if (q.length < 2) {
      setSuggestions([])
      setOpenWithCallback(false)
      setLoading(false)
      return
    }
    let cancelled = false
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      setOpenWithCallback(true)
      const results = await searchSets(q)
      if (!cancelled) {
        setSuggestions(results)
        setLoading(false)
        setOpenWithCallback(results.length > 0)
        setActiveIndex(-1)
      }
    }, 300)
    return () => { cancelled = true; clearTimeout(debounceRef.current) }
  }, [value])

  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target))
        setOpenWithCallback(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleSelect(set) {
    const num = parseInt(set.setNum.split('-')[0], 10)
    onSelect(num, set.name, set.year, set.imgUrl)
    setOpenWithCallback(false)
    setSuggestions([])
    setActiveIndex(-1)
  }

  function handleKeyDown(e) {
    if (!open) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault()
      handleSelect(suggestions[activeIndex])
    } else if (e.key === 'Escape') {
      setOpenWithCallback(false)
    }
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        background: focused ? '#fff' : C.inputBg,
        borderRadius: '14px',
        border: `2px solid ${focused ? C.red : '#e8c8c8'}`,
        transition: 'border-color 0.15s, background 0.15s',
        boxShadow: focused ? '0 0 0 4px rgba(204,16,16,0.08)' : 'none',
      }}>
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => { setFocused(true); suggestions.length > 0 && setOpenWithCallback(true) }}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          className="login-input"
          style={{ width: '100%', fontSize: '1.05rem', fontFamily: 'DM Sans, sans-serif', color: C.text, fontWeight: 500 }}
        />
      </div>
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          right: 0,
          minWidth: '400px',
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: '16px',
          zIndex: 200,
          overflow: 'hidden',
          boxShadow: '0 12px 40px rgba(100,0,0,0.12)',
          maxHeight: '320px',
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: `#cc1010 #fce8e8`,
        }}>
          {loading ? <DropdownSkeleton /> : suggestions.map((set, i) => {
            const numStr = set.setNum.split('-')[0]
            const isActive = i === activeIndex
            return (
              <button
                key={set.setNum}
                type="button"
                onMouseDown={e => { e.preventDefault(); handleSelect(set) }}
                onMouseEnter={() => setActiveIndex(i)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  width: '100%',
                  padding: '16px 20px',
                  background: isActive ? C.pageBg : 'none',
                  border: 'none',
                  borderBottom: `1px solid ${C.border}`,
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: C.text,
                  fontFamily: 'DM Sans, sans-serif',
                  transition: 'background 0.1s',
                }}
              >
                {set.imgUrl
                  ? <img src={set.imgUrl} alt="" style={{ width: '56px', height: '56px', objectFit: 'contain', borderRadius: '8px', flexShrink: 0, background: C.inputBg }} />
                  : <div style={{ width: '56px', height: '56px', borderRadius: '8px', background: C.inputBg, flexShrink: 0 }} />
                }
                <span style={{ fontFamily: 'monospace', color: C.red, fontSize: '1rem', minWidth: '72px', flexShrink: 0, fontWeight: 700 }}>
                  {numStr}
                </span>
                <span style={{ flex: 1, fontSize: '1.05rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                  {set.name}
                </span>
                <span style={{ fontSize: '0.9rem', color: C.subtext, flexShrink: 0 }}>
                  {set.year}
                </span>
              </button>
            )
          })}
          {!loading && (
            <div style={{
              padding: '14px 20px',
              fontSize: '0.88rem',
              fontWeight: 500,
              color: C.subtext,
              textAlign: 'center',
              borderTop: `1px solid ${C.border}`,
              background: '#fdf5f5',
            }}>
              Don't see your set? Try a set number, name, or year to narrow results
            </div>
          )}
        </div>
      )}
    </div>
  )
}
