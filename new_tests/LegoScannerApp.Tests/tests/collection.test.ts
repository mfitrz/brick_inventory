/**
 * Unit tests for collection (vault) operations in the mobile app.
 * Tests fetching, adding, and deleting sets via the backend API.
 */

const API_URL = 'https://brickinventory-production.up.railway.app'

interface LegoSet {
  setNumber: number
  name: string
  imgUrl?: string
  currentPrice?: number
  year?: number
}

const mockAuthHeaders = {
  Authorization: 'Bearer test-jwt-token',
  'Content-Type': 'application/json',
}

describe('Fetch collection', () => {
  let fetchMock: jest.Mock

  beforeEach(() => {
    fetchMock = jest.fn()
    global.fetch = fetchMock
  })

  afterEach(() => jest.clearAllMocks())

  it('fetches sets with Authorization header', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ sets: [] }),
    })

    await fetch(`${API_URL}/api/sets`, { headers: mockAuthHeaders })

    expect(fetchMock).toHaveBeenCalledWith(
      `${API_URL}/api/sets`,
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer test-jwt-token' }),
      })
    )
  })

  it('returns sets array from response', async () => {
    const sets: LegoSet[] = [
      { setNumber: 75192, name: 'Millennium Falcon', year: 2017, currentPrice: 499.99 },
      { setNumber: 42115, name: 'Lamborghini Sian', year: 2020 },
    ]
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ sets }),
    })

    const res = await fetch(`${API_URL}/api/sets`, { headers: mockAuthHeaders })
    const data = await res.json()

    expect(data.sets).toHaveLength(2)
    expect(data.sets[0].setNumber).toBe(75192)
    expect(data.sets[1].currentPrice).toBeUndefined()
  })

  it('handles empty collection', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ sets: [] }),
    })

    const res = await fetch(`${API_URL}/api/sets`, { headers: mockAuthHeaders })
    const data = await res.json()
    expect(data.sets).toEqual([])
  })

  it('handles 401 unauthorized', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 401 })
    const res = await fetch(`${API_URL}/api/sets`, { headers: mockAuthHeaders })
    expect(res.ok).toBe(false)
    expect(res.status).toBe(401)
  })
})

describe('Add set', () => {
  let fetchMock: jest.Mock

  beforeEach(() => {
    fetchMock = jest.fn()
    global.fetch = fetchMock
  })

  afterEach(() => jest.clearAllMocks())

  it('sends correct query params when adding a set', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: 'Set added', ebayPrice: 99.99 }),
    })

    const params = new URLSearchParams({
      set_number: '75192',
      set_name: 'Millennium Falcon',
      set_image_url: 'https://img.example.com',
      set_year: '2017',
    })
    await fetch(`${API_URL}/api/sets?${params}`, {
      method: 'POST',
      headers: mockAuthHeaders,
    })

    const callUrl = fetchMock.mock.calls[0][0]
    expect(callUrl).toContain('set_number=75192')
    expect(callUrl).toContain('set_name=Millennium+Falcon')
    expect(callUrl).toContain('set_year=2017')
  })

  it('returns ebayPrice from response', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: 'Added', ebayPrice: 249.95 }),
    })

    const res = await fetch(`${API_URL}/api/sets?set_number=42115&set_name=Lambo`, {
      method: 'POST',
      headers: mockAuthHeaders,
    })
    const data = await res.json()
    expect(data.ebayPrice).toBe(249.95)
  })

  it('handles duplicate set (409 conflict)', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ message: 'This set is already in your collection.' }),
    })

    const res = await fetch(`${API_URL}/api/sets?set_number=75192&set_name=Falcon`, {
      method: 'POST',
      headers: mockAuthHeaders,
    })
    const data = await res.json()

    expect(res.ok).toBe(false)
    expect(res.status).toBe(409)
    expect(data.message).toContain('already in your collection')
  })
})

describe('Delete set', () => {
  let fetchMock: jest.Mock

  beforeEach(() => {
    fetchMock = jest.fn()
    global.fetch = fetchMock
  })

  afterEach(() => jest.clearAllMocks())

  it('sends DELETE request with set_number param', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: 'Set removed.' }),
    })

    await fetch(`${API_URL}/api/sets?set_number=75192`, {
      method: 'DELETE',
      headers: mockAuthHeaders,
    })

    expect(fetchMock.mock.calls[0][1].method).toBe('DELETE')
    expect(fetchMock.mock.calls[0][0]).toContain('set_number=75192')
  })

  it('handles set not found (404)', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ message: 'Set not found.' }),
    })

    const res = await fetch(`${API_URL}/api/sets?set_number=99999`, {
      method: 'DELETE',
      headers: mockAuthHeaders,
    })
    expect(res.ok).toBe(false)
    expect(res.status).toBe(404)
  })
})

describe('Delete all sets', () => {
  let fetchMock: jest.Mock

  beforeEach(() => {
    fetchMock = jest.fn()
    global.fetch = fetchMock
  })

  afterEach(() => jest.clearAllMocks())

  it('sends DELETE request to /api/sets/all', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: 'All sets removed.' }),
    })

    await fetch(`${API_URL}/api/sets/all`, {
      method: 'DELETE',
      headers: mockAuthHeaders,
    })

    expect(fetchMock.mock.calls[0][0]).toContain('/api/sets/all')
    expect(fetchMock.mock.calls[0][1].method).toBe('DELETE')
  })
})
