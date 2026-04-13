import { useContext } from 'react'
import { AuthContext } from '../contexts/AuthContext'

export function useSafeAuth() {
  try {
    const ctx = useContext(AuthContext)
    return ctx ?? { user: null }
  } catch {
    return { user: null }
  }
}
