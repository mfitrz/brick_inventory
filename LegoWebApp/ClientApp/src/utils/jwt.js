export function decodeJwtPayload(token) {
  if (!token) return null
  try {
    const padding = (4 - token.split('.')[1].length % 4) % 4
    return JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(padding)))
  } catch {
    return null
  }
}

export function isJwtExpired(token) {
  const payload = decodeJwtPayload(token)
  if (!payload?.exp) return true
  // Add a 30-second buffer so we don't use a token that expires mid-request
  return Date.now() / 1000 > payload.exp - 30
}
