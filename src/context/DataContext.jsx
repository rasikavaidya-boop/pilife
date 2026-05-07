import { createContext, useContext, useEffect, useReducer, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { getProjects, insertProject, updateProject, deleteProject, getLogs, insertLog, updateLog, deleteLog } from '../lib/supabase'
import { weekStart, weekEnd } from '../lib/dates'

const Ctx = createContext(null)

function reducer(state, action) {
  switch (action.type) {
    case 'LOADED':
      return { ...state, projects: action.projects, logs: action.logs, loading: false }
    case 'ADD_PROJECT':
      return { ...state, projects: [...state.projects, action.payload] }
    case 'UPDATE_PROJECT':
      return { ...state, projects: state.projects.map(p => p.id === action.payload.id ? action.payload : p) }
    case 'DELETE_PROJECT':
      return { ...state, projects: state.projects.filter(p => p.id !== action.id), logs: state.logs.filter(l => l.project_id !== action.id) }
    case 'ADD_LOG':
      return { ...state, logs: [action.payload, ...state.logs] }
    case 'UPDATE_LOG':
      return { ...state, logs: state.logs.map(l => l.id === action.payload.id ? action.payload : l) }
    case 'DELETE_LOG':
      return { ...state, logs: state.logs.filter(l => l.id !== action.id) }
    default: return state
  }
}

export function DataProvider({ children }) {
  const { user } = useAuth()
  const [state, dispatch] = useReducer(reducer, { projects: [], logs: [], loading: true })

  const load = useCallback(async () => {
    if (!user) return
    const [projects, logs] = await Promise.all([getProjects(user.id), getLogs(user.id)])
    dispatch({ type: 'LOADED', projects, logs })
  }, [user])

  useEffect(() => { load() }, [load])

  async function addProject(fields) {
    const p = await insertProject(user.id, fields)
    dispatch({ type: 'ADD_PROJECT', payload: p })
    return p
  }

  async function editProject(id, fields) {
    const p = await updateProject(id, fields)
    dispatch({ type: 'UPDATE_PROJECT', payload: p })
    return p
  }

  async function removeProject(id) {
    await deleteProject(id)
    dispatch({ type: 'DELETE_PROJECT', id })
  }

  async function addLog(fields) {
    const l = await insertLog(user.id, fields)
    dispatch({ type: 'ADD_LOG', payload: l })
    return l
  }

  async function editLog(id, fields) {
    const l = await updateLog(id, fields)
    dispatch({ type: 'UPDATE_LOG', payload: l })
    return l
  }

  async function removeLog(id) {
    await deleteLog(id)
    dispatch({ type: 'DELETE_LOG', id })
  }

  function weekLogs() {
    const ws = weekStart(), we = weekEnd()
    return state.logs.filter(l => l.logged_date >= ws && l.logged_date <= we)
  }

  return (
    <Ctx.Provider value={{ ...state, addProject, editProject, removeProject, addLog, editLog, removeLog, weekLogs }}>
      {children}
    </Ctx.Provider>
  )
}

export const useData = () => useContext(Ctx)
