import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { getSets, addSet, deleteSet, deleteAllSets } from '../services/api'

export function useSets() {
  const { jwt, logout } = useAuth()
  const [sets, setSets] = useState([])
  const [loading, setLoading] = useState(!!jwt)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  useEffect(() => {
    if (jwt) load()
    else setLoading(false)
  }, [jwt])

  async function load() {
    setLoading(true)
    try {
      setSets(await getSets(jwt))
    } catch (err) {
      if (err?.status === 401) {
        logout()
      } else {
        setError('Failed to load your collection.')
      }
    } finally {
      setLoading(false)
    }
  }

  async function add(setNumber, setName, setImageURL, year) {
    const result = await addSet(jwt, setNumber, setName, setImageURL, year)
    if (result.success) {
      setSuccess(result.message)
      await load()
    } else {
      setError(result.message)
    }
    return { success: result.success, ebayPrice: result.ebayPrice }
  }

  async function remove(setNumber) {
    const result = await deleteSet(jwt, setNumber)
    if (result.success) {
      setSuccess(result.message)
      setSets(prev => prev.filter(s => s.setNumber !== setNumber))
    } else {
      setError(result.message)
    }
  }

  async function removeAll() {
    const result = await deleteAllSets(jwt)
    if (result.success) {
      setSuccess(result.message)
      setSets([])
    } else {
      setError(result.message)
    }
  }

  return { sets, loading, error, success, setError, setSuccess, add, remove, removeAll }
}
