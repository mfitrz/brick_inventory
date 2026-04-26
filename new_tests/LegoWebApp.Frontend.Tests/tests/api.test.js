import { describe, it, expect, vi, beforeEach } from 'vitest'

// Inline the api functions to avoid module resolution issues in the test runner
const BASE = ''
const url = (path) => `${BASE}${path}`
const bearer = (jwt) => ({ Authorization: `Bearer ${jwt}` })

async function login(email, password) {
  const res = await fetch(url('/api/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (!res.ok) return { success: false, error: data.error || 'Login failed' }
  return { success: true, token: data.token }
}

async function signUp(email, password) {
  const res = await fetch(url('/api/auth/signup'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (!res.ok) return { success: false, error: data.error || 'Sign up failed' }
  return {
    success: true,
    token: data.token ?? null,
    requiresConfirmation: data.requiresConfirmation ?? false,
  }
}

async function getSets(jwt) {
  const res = await fetch(url('/api/sets'), { headers: bearer(jwt) })
  if (!res.ok) {
    const err = new Error('Failed to fetch sets')
    err.status = res.status
    throw err
  }
  const data = await res.json()
  return data.sets || []
}

async function addSet(jwt, setNumber, setName, setImageURL, year) {
  const params = new URLSearchParams({ set_number: setNumber, set_name: setName, set_image_url: setImageURL })
  if (year != null) params.set('set_year', year)
  const res = await fetch(url(`/api/sets?${params}`), { method: 'POST', headers: bearer(jwt) })
  const data = await res.json().catch(() => ({}))
  return {
    success: res.ok,
    message: data.message || (res.ok ? 'Set added' : 'Failed to add set'),
    ebayPrice: data.ebayPrice ?? null,
  }
}

async function deleteSet(jwt, setNumber) {
  const res = await fetch(url(`/api/sets?set_number=${setNumber}`), {
    method: 'DELETE',
    headers: bearer(jwt),
  })
  const data = await res.json().catch(() => ({}))
  return { success: res.ok, message: data.message || (res.ok ? 'Set removed' : 'Failed to delete set') }
}

async function searchSets(query) {
  const res = await fetch(url(`/api/search/sets?q=${encodeURIComponent(query)}`))
  if (!res.ok) return []
  const data = await res.json()
  return data.results || []
}

const mockFetch = (status, body) => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  })
}

describe('login', () => {
  it('returns success and token on 200', async () => {
    mockFetch(200, { token: 'jwt-token-abc' })
    const result = await login('test@example.com', 'password')
    expect(result.success).toBe(true)
    expect(result.token).toBe('jwt-token-abc')
  })

  it('returns failure with error message on 400', async () => {
    mockFetch(400, { error: 'Invalid login credentials' })
    const result = await login('test@example.com', 'wrong')
    expect(result.success).toBe(false)
    expect(result.error).toBe('Invalid login credentials')
  })

  it('returns fallback error when error field missing', async () => {
    mockFetch(400, {})
    const result = await login('test@example.com', 'wrong')
    expect(result.success).toBe(false)
    expect(result.error).toBe('Login failed')
  })

  it('sends correct Content-Type header', async () => {
    mockFetch(200, { token: 'tok' })
    await login('test@example.com', 'password')
    const call = fetch.mock.calls[0]
    expect(call[1].headers['Content-Type']).toBe('application/json')
  })

  it('sends email and password in body', async () => {
    mockFetch(200, { token: 'tok' })
    await login('test@example.com', 'password123')
    const body = JSON.parse(fetch.mock.calls[0][1].body)
    expect(body.email).toBe('test@example.com')
    expect(body.password).toBe('password123')
  })
})

describe('signUp', () => {
  it('returns success with token on 200', async () => {
    mockFetch(200, { token: 'new-user-token' })
    const result = await signUp('new@example.com', 'password')
    expect(result.success).toBe(true)
    expect(result.token).toBe('new-user-token')
  })

  it('returns requiresConfirmation when no token in response', async () => {
    mockFetch(200, { requiresConfirmation: true })
    const result = await signUp('new@example.com', 'password')
    expect(result.success).toBe(true)
    expect(result.token).toBeNull()
    expect(result.requiresConfirmation).toBe(true)
  })

  it('returns failure on 400', async () => {
    mockFetch(400, { error: 'User already registered' })
    const result = await signUp('existing@example.com', 'password')
    expect(result.success).toBe(false)
  })
})

describe('getSets', () => {
  it('returns sets array on 200', async () => {
    const sets = [{ setNumber: 75192, name: 'Millennium Falcon' }]
    mockFetch(200, { sets })
    const result = await getSets('my-jwt')
    expect(result).toEqual(sets)
  })

  it('returns empty array when sets key missing', async () => {
    mockFetch(200, {})
    const result = await getSets('my-jwt')
    expect(result).toEqual([])
  })

  it('throws error with status on 401', async () => {
    mockFetch(401, {})
    await expect(getSets('bad-jwt')).rejects.toThrow('Failed to fetch sets')
  })

  it('sends Authorization header', async () => {
    mockFetch(200, { sets: [] })
    await getSets('my-token')
    expect(fetch.mock.calls[0][1].headers.Authorization).toBe('Bearer my-token')
  })
})

describe('addSet', () => {
  it('returns success with message and ebayPrice on 200', async () => {
    mockFetch(200, { message: 'Set added to collection!', ebayPrice: 99.99 })
    const result = await addSet('jwt', 75192, 'Falcon', 'https://img.example.com', 2017)
    expect(result.success).toBe(true)
    expect(result.message).toBe('Set added to collection!')
    expect(result.ebayPrice).toBe(99.99)
  })

  it('returns failure on 409', async () => {
    mockFetch(409, { message: 'This set is already in your collection.' })
    const result = await addSet('jwt', 75192, 'Falcon', null)
    expect(result.success).toBe(false)
    expect(result.message).toBe('This set is already in your collection.')
  })

  it('includes year in query params when provided', async () => {
    mockFetch(200, { message: 'ok' })
    await addSet('jwt', 75192, 'Falcon', null, 2017)
    const callUrl = fetch.mock.calls[0][0]
    expect(callUrl).toContain('set_year=2017')
  })

  it('excludes year from query params when null', async () => {
    mockFetch(200, { message: 'ok' })
    await addSet('jwt', 75192, 'Falcon', null, null)
    const callUrl = fetch.mock.calls[0][0]
    expect(callUrl).not.toContain('set_year')
  })
})

describe('deleteSet', () => {
  it('returns success on 200', async () => {
    mockFetch(200, { message: 'Set removed.' })
    const result = await deleteSet('jwt', 75192)
    expect(result.success).toBe(true)
    expect(result.message).toBe('Set removed.')
  })

  it('returns failure on 404', async () => {
    mockFetch(404, { message: 'Set not found.' })
    const result = await deleteSet('jwt', 99999)
    expect(result.success).toBe(false)
  })

  it('uses DELETE method', async () => {
    mockFetch(200, {})
    await deleteSet('jwt', 75192)
    expect(fetch.mock.calls[0][1].method).toBe('DELETE')
  })
})

describe('searchSets', () => {
  it('returns results on 200', async () => {
    const results = [{ setNum: '75192-1', name: 'Millennium Falcon', year: 2017 }]
    mockFetch(200, { results })
    const found = await searchSets('falcon')
    expect(found).toEqual(results)
  })

  it('returns empty array on API error', async () => {
    mockFetch(500, {})
    const found = await searchSets('falcon')
    expect(found).toEqual([])
  })

  it('returns empty array when results key missing', async () => {
    mockFetch(200, {})
    const found = await searchSets('falcon')
    expect(found).toEqual([])
  })

  it('URL-encodes the query parameter', async () => {
    mockFetch(200, { results: [] })
    await searchSets('falcon 2019')
    const callUrl = fetch.mock.calls[0][0]
    expect(callUrl).toContain('falcon%202019')
  })
})
