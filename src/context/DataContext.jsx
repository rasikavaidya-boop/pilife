import { createContext, useContext, useEffect, useReducer, useCallback } from 'react'
import { useAuth } from './AuthContext'
import {
  getProjects, insertProject, updateProject, deleteProject,
  getLogs, insertLog, updateLog, deleteLog,
  getCategories, insertCategory, updateCategory, deleteCategory,
  getGoals, insertGoal, updateGoal, deleteGoal,
} from '../lib/supabase'
import { weekStart, weekEnd } from '../lib/dates'

const Ctx = createContext(null)

function reducer(state, action) {
  switch (action.type) {
    case 'LOADED':
      return { ...state, projects: action.projects, logs: action.logs, categories: action.categories, goals: action.goals, loading: false }
    case 'ADD_PROJECT':     return { ...state, projects: [...state.projects, action.payload] }
    case 'UPDATE_PROJECT':  return { ...state, projects: state.projects.map(p => p.id === action.payload.id ? action.payload : p) }
    case 'DELETE_PROJECT':  return { ...state, projects: state.projects.filter(p => p.id !== action.id), logs: state.logs.filter(l => l.project_id !== action.id), goals: state.goals.filter(g => g.project_id !== action.id) }
    case 'ADD_LOG':         return { ...state, logs: [action.payload, ...state.logs] }
    case 'UPDATE_LOG':      return { ...state, logs: state.logs.map(l => l.id === action.payload.id ? action.payload : l) }
    case 'DELETE_LOG':      return { ...state, logs: state.logs.filter(l => l.id !== action.id) }
    case 'ADD_CATEGORY':    return { ...state, categories: [...state.categories, action.payload] }
    case 'UPDATE_CATEGORY': return { ...state, categories: state.categories.map(c => c.id === action.payload.id ? action.payload : c) }
    case 'DELETE_CATEGORY': return { ...state, categories: state.categories.filter(c => c.id !== action.id), projects: state.projects.map(p => p.category_id === action.id ? { ...p, category_id: null } : p) }
    case 'ADD_GOAL':        return { ...state, goals: [...state.goals, action.payload] }
    case 'UPDATE_GOAL':     return { ...state, goals: state.goals.map(g => g.id === action.payload.id ? action.payload : g) }
    case 'DELETE_GOAL':     return { ...state, goals: state.goals.filter(g => g.id !== action.id) }
    default: return state
  }
}

export function DataProvider({ children }) {
  const { user } = useAuth()
  const [state, dispatch] = useReducer(reducer, { projects: [], logs: [], categories: [], goals: [], loading: true })

  const load = useCallback(async () => {
    if (!user) return
    const [projects, logs, categories, goals] = await Promise.all([
      getProjects(user.id), getLogs(user.id), getCategories(user.id), getGoals(user.id)
    ])
    dispatch({ type: 'LOADED', projects, logs, categories, goals })
  }, [user])

  useEffect(() => { load() }, [load])

  async function addProject(f)        { const p = await insertProject(user.id, f);  dispatch({ type: 'ADD_PROJECT',    payload: p }); return p }
  async function editProject(id, f)   { const p = await updateProject(id, f);       dispatch({ type: 'UPDATE_PROJECT', payload: p }); return p }
  async function removeProject(id)    { await deleteProject(id);                    dispatch({ type: 'DELETE_PROJECT', id }) }
  async function addLog(f)            { const l = await insertLog(user.id, f);      dispatch({ type: 'ADD_LOG',        payload: l }); return l }
  async function editLog(id, f)       { const l = await updateLog(id, f);           dispatch({ type: 'UPDATE_LOG',     payload: l }); return l }
  async function removeLog(id)        { await deleteLog(id);                        dispatch({ type: 'DELETE_LOG',     id }) }
  async function addCategory(f)       { const c = await insertCategory(user.id, f); dispatch({ type: 'ADD_CATEGORY',   payload: c }); return c }
  async function editCategory(id, f)  { const c = await updateCategory(id, f);      dispatch({ type: 'UPDATE_CATEGORY',payload: c }); return c }
  async function removeCategory(id)   { await deleteCategory(id);                   dispatch({ type: 'DELETE_CATEGORY',id }) }
  async function addGoal(f)           { const g = await insertGoal(user.id, f);     dispatch({ type: 'ADD_GOAL',       payload: g }); return g }
  async function editGoal(id, f)      { const g = await updateGoal(id, f);          dispatch({ type: 'UPDATE_GOAL',    payload: g }); return g }
  async function removeGoal(id)       { await deleteGoal(id);                       dispatch({ type: 'DELETE_GOAL',    id }) }

  function weekLogs() {
    const ws = weekStart(), we = weekEnd()
    return state.logs.filter(l => l.logged_date >= ws && l.logged_date <= we)
  }

  return (
    <Ctx.Provider value={{ ...state, addProject, editProject, removeProject, addLog, editLog, removeLog, addCategory, editCategory, removeCategory, addGoal, editGoal, removeGoal, weekLogs }}>
      {children}
    </Ctx.Provider>
  )
}

export const useData = () => useContext(Ctx)
