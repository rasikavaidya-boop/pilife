import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// ── Auth ──────────────────────────────────────────────────
export const signUp = (email, password) =>
  supabase.auth.signUp({ email, password })

export const signIn = (email, password) =>
  supabase.auth.signInWithPassword({ email, password })

export const signOut = () =>
  supabase.auth.signOut()

// ── Projects ──────────────────────────────────────────────
export async function getProjects(userId) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', userId)
    .order('created_at')
  if (error) throw error
  return data
}

export async function insertProject(userId, { name, color, goal_hrs }) {
  const { data, error } = await supabase
    .from('projects')
    .insert({ user_id: userId, name, color, goal_hrs })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateProject(id, fields) {
  const { data, error } = await supabase
    .from('projects')
    .update(fields)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteProject(id) {
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw error
}

// ── Time logs ─────────────────────────────────────────────
export async function getLogs(userId) {
  const { data, error } = await supabase
    .from('time_logs')
    .select('*')
    .eq('user_id', userId)
    .order('logged_date', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function insertLog(userId, { project_id, description, duration_hrs, logged_date, source }) {
  const { data, error } = await supabase
    .from('time_logs')
    .insert({ user_id: userId, project_id, description, duration_hrs, logged_date, source })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteLog(id) {
  const { error } = await supabase.from('time_logs').delete().eq('id', id)
  if (error) throw error
}

export async function updateLog(id, fields) {
  const { data, error } = await supabase
    .from('time_logs')
    .update(fields)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// ── Categories ────────────────────────────────────────────
export async function getCategories(userId) {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .order('created_at')
  if (error) throw error
  return data
}

export async function insertCategory(userId, { name, color }) {
  const { data, error } = await supabase
    .from('categories')
    .insert({ user_id: userId, name, color })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateCategory(id, fields) {
  const { data, error } = await supabase
    .from('categories')
    .update(fields)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteCategory(id) {
  const { error } = await supabase.from('categories').delete().eq('id', id)
  if (error) throw error
}

// ── Goals ─────────────────────────────────────────────────
export async function getGoals(userId) {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at')
  if (error) throw error
  return data
}

export async function insertGoal(userId, { project_id, period_type, target_hrs, start_date, end_date }) {
  const { data, error } = await supabase
    .from('goals')
    .insert({ user_id: userId, project_id, period_type, target_hrs, start_date: start_date || null, end_date: end_date || null })
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateGoal(id, fields) {
  const { data, error } = await supabase
    .from('goals')
    .update(fields)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteGoal(id) {
  const { error } = await supabase.from('goals').delete().eq('id', id)
  if (error) throw error
}