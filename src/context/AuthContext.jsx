import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const Ctx = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined) // undefined = still loading

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  return <Ctx.Provider value={{ user }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
