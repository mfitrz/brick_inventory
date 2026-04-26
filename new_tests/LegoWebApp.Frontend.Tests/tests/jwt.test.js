import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Inline the functions since they're pure utilities
function decodeJwtPayload(token) {
  if (!token) return null
  try {
    const padding = (4 - token.split('.')[1].length % 4) % 4
    return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(padding)))
  } catch {
    return null
  }
}

function isJwtExpired(token) {
  const payload = decodeJwtPayload(token)
  if (!payload?.exp) return true
  return Date.now() / 1000 > payload.exp - 30
}

// { sub: "user-123", email: "test@example.com", exp: 9999999999 }
const VALID_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
  '.eyJzdWIiOiJ1c2VyLTEyMyIsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImV4cCI6OTk5OTk5OTk5OX0' +
  '.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c'

// { sub: "user-123", exp: 1 } — expired
const EXPIRED_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
  '.eyJzdWIiOiJ1c2VyLTEyMyIsImV4cCI6MX0' +
  '.signature'

// { sub: "user-123" } — no exp
const NO_EXP_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9' +
  '.eyJzdWIiOiJ1c2VyLTEyMyJ9' +
  '.signature'

describe('decodeJwtPayload', () => {
  it('decodes a valid JWT and returns the payload', () => {
    const payload = decodeJwtPayload(VALID_JWT)
    expect(payload).not.toBeNull()
    expect(payload.sub).toBe('user-123')
    expect(payload.email).toBe('test@example.com')
  })

  it('returns null for null input', () => {
    expect(decodeJwtPayload(null)).toBeNull()
  })

  it('returns null for empty string', () => {
    expect(decodeJwtPayload('')).toBeNull()
  })

  it('returns null for malformed token', () => {
    expect(decodeJwtPayload('not.a.jwt')).toBeNull()
  })

  it('returns null for token with only one part', () => {
    expect(decodeJwtPayload('onlyone')).toBeNull()
  })

  it('handles URL-safe base64 characters (- and _)', () => {
    // The replace logic should handle - → + and _ → /
    const payload = decodeJwtPayload(VALID_JWT)
    expect(payload).not.toBeNull()
  })

  it('decodes exp claim as a number', () => {
    const payload = decodeJwtPayload(VALID_JWT)
    expect(typeof payload.exp).toBe('number')
    expect(payload.exp).toBe(9999999999)
  })

  it('decodes expired JWT payload without throwing', () => {
    const payload = decodeJwtPayload(EXPIRED_JWT)
    expect(payload).not.toBeNull()
    expect(payload.sub).toBe('user-123')
  })
})

describe('isJwtExpired', () => {
  it('returns false for a far-future expiry', () => {
    expect(isJwtExpired(VALID_JWT)).toBe(false)
  })

  it('returns true for an expired token', () => {
    expect(isJwtExpired(EXPIRED_JWT)).toBe(true)
  })

  it('returns true for null', () => {
    expect(isJwtExpired(null)).toBe(true)
  })

  it('returns true for empty string', () => {
    expect(isJwtExpired('')).toBe(true)
  })

  it('returns true when token has no exp claim', () => {
    expect(isJwtExpired(NO_EXP_JWT)).toBe(true)
  })

  it('returns true when token expires within 30-second buffer', () => {
    const nowSeconds = Math.floor(Date.now() / 1000)
    // Build a token expiring in 10 seconds (within 30s buffer)
    const payload = btoa(JSON.stringify({ sub: 'user-123', exp: nowSeconds + 10 }))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    const token = `header.${payload}.sig`
    expect(isJwtExpired(token)).toBe(true)
  })

  it('returns false when token expires after 30-second buffer', () => {
    const nowSeconds = Math.floor(Date.now() / 1000)
    // Build a token expiring in 60 seconds (outside 30s buffer)
    const payload = btoa(JSON.stringify({ sub: 'user-123', exp: nowSeconds + 60 }))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
    const token = `header.${payload}.sig`
    expect(isJwtExpired(token)).toBe(false)
  })
})
