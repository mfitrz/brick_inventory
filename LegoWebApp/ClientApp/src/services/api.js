// Auth — calls .NET which proxies to Supabase

export async function login(email, password) {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  const data = await res.json()
  if (!res.ok) return { success: false, error: data.error || 'Login failed' }
  return { success: true, token: data.token }
}

export async function signUp(email, password) {
  const res = await fetch('/api/auth/signup', {
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

// Sets — calls .NET which proxies to FastAPI

const bearer = (jwt) => ({ Authorization: `Bearer ${jwt}` })

export async function getSets(jwt) {
  const res = await fetch('/api/sets', { headers: bearer(jwt) })
  if (!res.ok) throw new Error('Failed to fetch sets')
  const data = await res.json()
  return data.sets || []
}

export async function addSet(jwt, setNumber, setName) {
  const res = await fetch(
    `/api/sets?set_number=${setNumber}&set_name=${encodeURIComponent(setName)}`,
    { method: 'POST', headers: bearer(jwt) }
  )
  const data = await res.json().catch(() => ({}))
  return { success: res.ok, message: data.message || (res.ok ? 'Set added' : 'Failed to add set') }
}

export async function deleteSet(jwt, setNumber) {
  const res = await fetch(`/api/sets?set_number=${setNumber}`, {
    method: 'DELETE',
    headers: bearer(jwt),
  })
  const data = await res.json().catch(() => ({}))
  return { success: res.ok, message: data.message || (res.ok ? 'Set removed' : 'Failed to delete set') }
}

export async function deleteAllSets(jwt) {
  const res = await fetch('/api/sets/all', {
    method: 'DELETE',
    headers: bearer(jwt),
  })
  const data = await res.json().catch(() => ({}))
  return { success: res.ok, message: data.message || (res.ok ? 'All sets deleted' : 'Failed') }
}
