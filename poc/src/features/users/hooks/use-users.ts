import { useCallback, useState } from 'react'
import { seedUsers, type User } from '../data/users'

export type UserDraft = Omit<User, 'id' | 'lastActive'>

/**
 * In-memory users store. Stands in for a real API while the backend is
 * disabled — CRUD operations mutate local React state only and reset on reload.
 */
export function useUsers() {
  const [users, setUsers] = useState<User[]>(seedUsers)

  const addUser = useCallback((draft: UserDraft) => {
    const user: User = {
      ...draft,
      id: `u-${crypto.randomUUID().slice(0, 8)}`,
      // New people have no sign-in yet.
      lastActive: null,
    }
    setUsers((prev) => [user, ...prev])
    return user
  }, [])

  const updateUser = useCallback((id: string, draft: UserDraft) => {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...draft } : u)))
  }, [])

  const deleteUser = useCallback((id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id))
  }, [])

  return { users, addUser, updateUser, deleteUser }
}
