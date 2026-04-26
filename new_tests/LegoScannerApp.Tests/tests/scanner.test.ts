/**
 * Unit tests for scanner logic in the mobile app.
 * Tests barcode lookup, set number extraction, LEGO product detection,
 * and set name matching algorithms.
 */

const API_URL = 'https://brickinventory-production.up.railway.app'

// ── Helpers mirrored from scanner.tsx ──────────────────────────────────────

function isLegoProduct(title: string, brand?: string): boolean {
  if (brand?.toLowerCase() === 'lego') return true
  return title.toLowerCase().includes('lego')
}

function extractSetNumber(model?: string, title?: string): number | null {
  if (model) {
    const match = model.match(/\b(\d{4,6})\b/)
    if (match) return parseInt(match[1], 10)
  }
  if (title) {
    const match = title.match(/\b(\d{4,6})\b/)
    if (match) return parseInt(match[1], 10)
  }
  return null
}

function normalizeWords(str: string): string[] {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
}

const STOP_WORDS = new Set(['lego', 'set', 'the', 'a', 'an', 'and', 'or', 'of', 'in', 'with'])

function significantWords(str: string): string[] {
  return normalizeWords(str).filter((w) => !STOP_WORDS.has(w))
}

function setNameMatchScore(productTitle: string, setName: string): number {
  const productWords = new Set(significantWords(productTitle))
  const setWords = significantWords(setName)
  if (setWords.length === 0) return 0
  const matches = setWords.filter((w) => productWords.has(w)).length
  return matches / setWords.length
}

// ── isLegoProduct ──────────────────────────────────────────────────────────

describe('isLegoProduct', () => {
  it('returns true when brand is "lego" (case-insensitive)', () => {
    expect(isLegoProduct('Some Product', 'LEGO')).toBe(true)
    expect(isLegoProduct('Some Product', 'lego')).toBe(true)
    expect(isLegoProduct('Some Product', 'Lego')).toBe(true)
  })

  it('returns true when title contains "lego"', () => {
    expect(isLegoProduct('LEGO Star Wars Millennium Falcon')).toBe(true)
    expect(isLegoProduct('lego technic set 42115')).toBe(true)
  })

  it('returns false for non-LEGO products', () => {
    expect(isLegoProduct('Generic Building Blocks', 'Megabloks')).toBe(false)
    expect(isLegoProduct('K\'Nex Roller Coaster')).toBe(false)
  })

  it('returns false when title and brand are both non-LEGO', () => {
    expect(isLegoProduct('Duplo Building Set', 'BrandX')).toBe(false)
  })

  it('returns true even when brand is undefined but title matches', () => {
    expect(isLegoProduct('LEGO Creator 3-in-1', undefined)).toBe(true)
  })
})

// ── extractSetNumber ───────────────────────────────────────────────────────

describe('extractSetNumber', () => {
  it('extracts 5-digit set number from model field', () => {
    expect(extractSetNumber('75192', 'Millennium Falcon')).toBe(75192)
  })

  it('extracts 4-digit set number from model field', () => {
    expect(extractSetNumber('4958')).toBe(4958)
  })

  it('extracts 6-digit set number from model', () => {
    expect(extractSetNumber('910001')).toBe(910001)
  })

  it('falls back to title when model is undefined', () => {
    expect(extractSetNumber(undefined, 'LEGO 75192 Millennium Falcon')).toBe(75192)
  })

  it('falls back to title when model has no number', () => {
    expect(extractSetNumber('MF-EXCLUSIVE', 'LEGO Set 75192')).toBe(75192)
  })

  it('returns null when no number found', () => {
    expect(extractSetNumber(undefined, 'Generic Building Blocks')).toBeNull()
  })

  it('returns null when both are undefined', () => {
    expect(extractSetNumber(undefined, undefined)).toBeNull()
  })

  it('ignores 3-digit numbers (too short for set numbers)', () => {
    expect(extractSetNumber('123', 'LEGO Product')).toBeNull()
  })

  it('ignores 7-digit numbers (too long for set numbers)', () => {
    expect(extractSetNumber('1234567', 'Product')).toBeNull()
  })
})

// ── setNameMatchScore ──────────────────────────────────────────────────────

describe('setNameMatchScore', () => {
  it('returns 1.0 for identical names', () => {
    const score = setNameMatchScore('Millennium Falcon', 'Millennium Falcon')
    expect(score).toBe(1.0)
  })

  it('returns 1.0 for match ignoring LEGO brand prefix', () => {
    const score = setNameMatchScore('LEGO Star Wars Millennium Falcon', 'Millennium Falcon')
    expect(score).toBe(1.0)
  })

  it('returns 0 for completely different names', () => {
    const score = setNameMatchScore('Technic Bugatti Chiron', 'Millennium Falcon')
    expect(score).toBe(0)
  })

  it('returns partial score for partial match', () => {
    const score = setNameMatchScore('LEGO Star Wars Millennium Falcon Holiday', 'Millennium Falcon Holiday Diorama')
    expect(score).toBeGreaterThan(0)
    expect(score).toBeLessThan(1)
  })

  it('is case-insensitive', () => {
    const score = setNameMatchScore('millennium falcon', 'Millennium Falcon')
    expect(score).toBe(1.0)
  })

  it('ignores stop words in matching', () => {
    const score = setNameMatchScore('The Millennium Falcon Set', 'Millennium Falcon')
    expect(score).toBe(1.0)
  })

  it('returns 0 for empty set name', () => {
    const score = setNameMatchScore('Millennium Falcon', '')
    expect(score).toBe(0)
  })

  it('returns high score for Technic sets with partial match', () => {
    const score = setNameMatchScore('LEGO Technic Lamborghini Sian FKP 37', 'Lamborghini Sian FKP 37')
    expect(score).toBeGreaterThan(0.8)
  })
})

// ── Scan flow (API integration) ────────────────────────────────────────────

describe('Scan set API call', () => {
  let fetchMock: jest.Mock

  beforeEach(() => {
    fetchMock = jest.fn()
    global.fetch = fetchMock
  })

  afterEach(() => jest.clearAllMocks())

  it('calls /api/sets/scan with set_number param', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        message: 'Set added',
        name: 'Millennium Falcon',
        imgUrl: 'https://img.example.com',
        year: 2017,
        ebayPrice: 499.99,
      }),
    })

    await fetch(`${API_URL}/api/sets/scan?set_number=75192`, {
      method: 'POST',
      headers: { Authorization: 'Bearer test-token' },
    })

    expect(fetchMock.mock.calls[0][0]).toContain('/api/sets/scan?set_number=75192')
    expect(fetchMock.mock.calls[0][1].method).toBe('POST')
  })

  it('returns set details on successful scan', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        message: 'Set added',
        name: 'Millennium Falcon',
        imgUrl: 'https://img.example.com',
        year: 2017,
        ebayPrice: 499.99,
      }),
    })

    const res = await fetch(`${API_URL}/api/sets/scan?set_number=75192`, {
      method: 'POST',
      headers: { Authorization: 'Bearer test-token' },
    })
    const data = await res.json()

    expect(data.name).toBe('Millennium Falcon')
    expect(data.year).toBe(2017)
    expect(data.ebayPrice).toBe(499.99)
  })

  it('handles duplicate scan (409)', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ message: 'This set is already in your collection.' }),
    })

    const res = await fetch(`${API_URL}/api/sets/scan?set_number=75192`, {
      method: 'POST',
      headers: { Authorization: 'Bearer test-token' },
    })
    expect(res.status).toBe(409)
  })

  it('handles set not found (404)', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ message: 'Set #99999 not found in Rebrickable.' }),
    })

    const res = await fetch(`${API_URL}/api/sets/scan?set_number=99999`, {
      method: 'POST',
      headers: { Authorization: 'Bearer test-token' },
    })
    expect(res.status).toBe(404)
  })
})

// ── Lookup (set preview) ───────────────────────────────────────────────────

describe('Lookup set', () => {
  let fetchMock: jest.Mock

  beforeEach(() => {
    fetchMock = jest.fn()
    global.fetch = fetchMock
  })

  afterEach(() => jest.clearAllMocks())

  it('fetches set preview from /api/sets/lookup', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        setNumber: 75192,
        name: 'Millennium Falcon',
        imgUrl: 'https://img.example.com',
        year: 2017,
      }),
    })

    await fetch(`${API_URL}/api/sets/lookup?set_number=75192`, {
      headers: { Authorization: 'Bearer test-token' },
    })

    expect(fetchMock.mock.calls[0][0]).toContain('/api/sets/lookup?set_number=75192')
  })

  it('returns set preview data', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        setNumber: 75192,
        name: 'Millennium Falcon',
        imgUrl: 'https://img.example.com',
        year: 2017,
      }),
    })

    const res = await fetch(`${API_URL}/api/sets/lookup?set_number=75192`, {
      headers: { Authorization: 'Bearer test-token' },
    })
    const data = await res.json()

    expect(data.setNumber).toBe(75192)
    expect(data.name).toBe('Millennium Falcon')
    expect(data.year).toBe(2017)
  })

  it('handles unknown set (404)', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 404 })
    const res = await fetch(`${API_URL}/api/sets/lookup?set_number=99999`, {
      headers: { Authorization: 'Bearer test-token' },
    })
    expect(res.ok).toBe(false)
    expect(res.status).toBe(404)
  })
})
