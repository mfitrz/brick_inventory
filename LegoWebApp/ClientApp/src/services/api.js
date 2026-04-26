// In production (Vercel), VITE_API_BASE_URL points to the Railway backend.
// In dev, the Vite proxy handles /api so the base is empty.
const BASE = typeof __API_BASE__ !== 'undefined' ? __API_BASE__ : ''

const url = (path) => `${BASE}${path}`

// Auth — calls .NET which proxies to Supabase

export async function login(email, password) {
  const res = await fetch(url('/api/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (!res.ok) return { success: false, error: data.error || 'Login failed' }
  return { success: true, token: data.token }
}

export async function forgotPassword(email) {
  const res = await fetch(url('/api/auth/forgot-password'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  })
  const data = await res.json()
  if (!res.ok) return { success: false, error: data.error || 'Failed to send reset email.' }
  return { success: true, message: data.message }
}

export async function signUp(email, password) {
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

// Sets

const bearer = (jwt) => ({ Authorization: `Bearer ${jwt}` })

export async function getSets(jwt) {
  const res = await fetch(url('/api/sets'), { headers: bearer(jwt) })
  if (!res.ok) {
    const err = new Error('Failed to fetch sets')
    err.status = res.status
    throw err
  }
  const data = await res.json()
  return data.sets || []
}

export async function addSet(jwt, setNumber, setName, setImageURL, year) {
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

export async function deleteSet(jwt, setNumber) {
  const res = await fetch(url(`/api/sets?set_number=${setNumber}`), {
    method: 'DELETE',
    headers: bearer(jwt),
  })
  const data = await res.json().catch(() => ({}))
  return { success: res.ok, message: data.message || (res.ok ? 'Set removed' : 'Failed to delete set') }
}

export async function resetPassword(jwt) {
  const res = await fetch(url('/api/account/reset-password'), { method: 'POST', headers: bearer(jwt) })
  const data = await res.json().catch(() => ({}))
  return { success: res.ok, message: data.message || (res.ok ? 'Reset email sent.' : 'Failed to send reset email.') }
}

export async function deleteAccount(jwt) {
  const res = await fetch(url('/api/account'), { method: 'DELETE', headers: bearer(jwt) })
  const data = await res.json().catch(() => ({}))
  return { success: res.ok, message: data.message || (res.ok ? 'Account deleted.' : 'Failed to delete account.') }
}

export async function searchSets(query) {
  const res = await fetch(url(`/api/search/sets?q=${encodeURIComponent(query)}`))
  if (!res.ok) return []
  const data = await res.json()
  return data.results || []
}

export async function changeEmail(jwt, newEmail) {
  const res = await fetch(url('/api/account/change-email'), {
    method: 'POST',
    headers: { ...bearer(jwt), 'Content-Type': 'application/json' },
    body: JSON.stringify({ newEmail }),
  })
  const data = await res.json().catch(() => ({}))
  return { success: res.ok, message: data.message || (res.ok ? 'Check your inbox to confirm.' : 'Failed to update email.') }
}

export async function getVaultPredictions(jwt, sets) {
  const res = await fetch(url('/api/vault/predictions'), {
    method: 'POST',
    headers: { ...bearer(jwt), 'Content-Type': 'application/json' },
    body: JSON.stringify(sets),
  })
  if (!res.ok) return null
  return res.json().catch(() => null)
}

export async function deleteAllSets(jwt) {
  const res = await fetch(url('/api/sets/all'), {
    method: 'DELETE',
    headers: bearer(jwt),
  })
  const data = await res.json().catch(() => ({}))
  return { success: res.ok, message: data.message || (res.ok ? 'All sets deleted' : 'Failed') }
}
