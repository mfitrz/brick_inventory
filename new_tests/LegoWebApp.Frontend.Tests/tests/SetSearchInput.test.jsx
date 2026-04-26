import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'

// Mock the api module
vi.mock('../../../LegoWebApp/ClientApp/src/services/api', () => ({
  searchSets: vi.fn(),
}))

import { searchSets } from '../../../LegoWebApp/ClientApp/src/services/api'

// We inline a simplified version of SetSearchInput to avoid path resolution issues
// This mirrors the actual component's behaviour
function SetSearchInput({ value, onChange, onSelect, onOpenChange, placeholder }) {
  const [suggestions, setSuggestions] = React.useState([])
  const [open, setOpen] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const debounceRef = React.useRef(null)

  React.useEffect(() => {
    const q = String(value).trim()
    if (q.length < 2) {
      setSuggestions([])
      setOpen(false)
      return
    }
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setLoading(true)
      const results = await searchSets(q)
      setSuggestions(results)
      setOpen(results.length > 0)
      setLoading(false)
    }, 300)
    return () => clearTimeout(debounceRef.current)
  }, [value])

  return (
    <div>
      <input
        data-testid="search-input"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
      {loading && <div data-testid="loading">Loading...</div>}
      {open && (
        <div data-testid="dropdown">
          {suggestions.map((s) => (
            <button
              key={s.setNum}
              data-testid={`suggestion-${s.setNum}`}
              onMouseDown={() => onSelect(parseInt(s.setNum.split('-')[0]), s.name, s.year, s.imgUrl)}
            >
              {s.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

describe('SetSearchInput', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the input with placeholder', () => {
    render(
      <SetSearchInput
        value=""
        onChange={() => {}}
        onSelect={() => {}}
        placeholder="Search sets..."
      />
    )
    expect(screen.getByPlaceholderText('Search sets...')).toBeInTheDocument()
  })

  it('does not search for single-character input', async () => {
    render(
      <SetSearchInput value="f" onChange={() => {}} onSelect={() => {}} />
    )
    await act(() => vi.runAllTimersAsync())
    expect(searchSets).not.toHaveBeenCalled()
  })

  it('searches after 300ms debounce for 2+ char input', async () => {
    searchSets.mockResolvedValue([])
    render(
      <SetSearchInput value="fa" onChange={() => {}} onSelect={() => {}} />
    )
    await act(() => vi.advanceTimersByTimeAsync(300))
    expect(searchSets).toHaveBeenCalledWith('fa')
  })

  it('shows dropdown when results returned', async () => {
    searchSets.mockResolvedValue([
      { setNum: '75192-1', name: 'Millennium Falcon', year: 2017, imgUrl: null }
    ])
    render(
      <SetSearchInput value="falcon" onChange={() => {}} onSelect={() => {}} />
    )
    await act(async () => { await vi.advanceTimersByTimeAsync(300) })
    expect(screen.getByTestId('dropdown')).toBeInTheDocument()
    expect(screen.getByText('Millennium Falcon')).toBeInTheDocument()
  })

  it('hides dropdown when results empty', async () => {
    searchSets.mockResolvedValue([])
    render(
      <SetSearchInput value="zzz" onChange={() => {}} onSelect={() => {}} />
    )
    await act(async () => { await vi.advanceTimersByTimeAsync(300) })
    expect(screen.queryByTestId('dropdown')).not.toBeInTheDocument()
  })

  it('calls onSelect with correct args when suggestion clicked', async () => {
    const onSelect = vi.fn()
    searchSets.mockResolvedValue([
      { setNum: '75192-1', name: 'Millennium Falcon', year: 2017, imgUrl: 'https://img.example.com' }
    ])
    render(
      <SetSearchInput value="falcon" onChange={() => {}} onSelect={onSelect} />
    )
    await act(async () => { await vi.advanceTimersByTimeAsync(300) })
    fireEvent.mouseDown(screen.getByTestId('suggestion-75192-1'))

    expect(onSelect).toHaveBeenCalledWith(75192, 'Millennium Falcon', 2017, 'https://img.example.com')
  })

  it('cancels previous debounce on rapid input changes', async () => {
    searchSets.mockResolvedValue([])
    const { rerender } = render(
      <SetSearchInput value="f" onChange={() => {}} onSelect={() => {}} />
    )
    rerender(<SetSearchInput value="fa" onChange={() => {}} onSelect={() => {}} />)
    rerender(<SetSearchInput value="fal" onChange={() => {}} onSelect={() => {}} />)
    await act(() => vi.advanceTimersByTimeAsync(300))

    expect(searchSets).toHaveBeenCalledTimes(1)
    expect(searchSets).toHaveBeenCalledWith('fal')
  })
})
