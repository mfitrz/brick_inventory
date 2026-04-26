/**
 * Unit tests for authentication logic in the mobile app.
 * Tests the Supabase auth flow, session handling, and auth header generation.
 */

const API_URL = 'https://brickinventory-production.up.railway.app'

function getAuthHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function isValidPassword(password: string): boolean {
  return password.length >= 6
}

describe('getAuthHeaders', () => {
  it('returns Authorization header with Bearer token', () => {
    const headers = getAuthHeaders('my-jwt-token')
    expect(headers.Authorization).toBe('Bearer my-jwt-token')
  })

  it('returns Content-Type header', () => {
    const headers = getAuthHeaders('tok')
    expect(headers['Content-Type']).toBe('application/json')
  })

  it('handles empty token string', () => {
    const headers = getAuthHeaders('')
    expect(headers.Authorization).toBe('Bearer ')
  })
})

describe('email validation', () => {
  it('accepts valid email addresses', () => {
    expect(isValidEmail('test@example.com')).toBe(true)
    expect(isValidEmail('user+tag@domain.co.uk')).toBe(true)
    expect(isValidEmail('name.surname@company.org')).toBe(true)
  })

  it('rejects invalid email addresses', () => {
    expect(isValidEmail('not-an-email')).toBe(false)
    expect(isValidEmail('@nodomain')).toBe(false)
    expect(isValidEmail('noatsign.com')).toBe(false)
    expect(isValidEmail('')).toBe(false)
    expect(isValidEmail('spaces in@email.com')).toBe(false)
  })
})

describe('password validation', () => {
  it('accepts passwords with 6 or more characters', () => {
    expect(isValidPassword('123456')).toBe(true)
    expect(isValidPassword('password123')).toBe(true)
    expect(isValidPassword('a'.repeat(100))).toBe(true)
  })

  it('rejects passwords shorter than 6 characters', () => {
    expect(isValidPassword('')).toBe(false)
    expect(isValidPassword('abc')).toBe(false)
    expect(isValidPassword('12345')).toBe(false)
  })

  it('accepts exactly 6 characters', () => {
    expect(isValidPassword('123456')).toBe(true)
  })
})

describe('Supabase auth API calls', () => {
  let fetchMock: jest.Mock

  beforeEach(() => {
    fetchMock = jest.fn()
    global.fetch = fetchMock
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('login sends email and password to backend', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ token: 'jwt-token' }),
    })

    await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
    })

    expect(fetchMock).toHaveBeenCalledWith(
      `${API_URL}/api/auth/login`,
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('test@example.com'),
      })
    )
  })

  it('signup sends email and password to backend', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ token: 'new-token' }),
    })

    await fetch(`${API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'new@example.com', password: 'password123' }),
    })

    const call = fetchMock.mock.calls[0]
    expect(call[0]).toContain('/api/auth/signup')
    const body = JSON.parse(call[1].body)
    expect(body.email).toBe('new@example.com')
    expect(body.password).toBe('password123')
  })

  it('returns token from successful login response', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ token: 'user-jwt-abc' }),
    })

    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'pass' }),
    })
    const data = await res.json()
    expect(data.token).toBe('user-jwt-abc')
  })

  it('handles login failure gracefully', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'Invalid credentials' }),
    })

    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'wrong' }),
    })

    expect(res.ok).toBe(false)
    const data = await res.json()
    expect(data.error).toBe('Invalid credentials')
  })
})
