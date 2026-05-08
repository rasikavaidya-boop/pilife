// Helpers for computing goal progress

import { weekStart, weekEnd } from './dates'

export function goalPeriodLabel(goal) {
  if (goal.period_type === 'weekly')  return 'Weekly'
  if (goal.period_type === 'monthly') return 'Monthly'
  if (goal.period_type === 'yearly')  return 'Yearly'
  if (goal.period_type === 'custom' && goal.start_date && goal.end_date)
    return `${goal.start_date} → ${goal.end_date}`
  return 'Custom'
}

export function goalDateRange(goal) {
  const now = new Date()
  const today = now.toISOString().slice(0, 10)

  if (goal.period_type === 'weekly') {
    return { start: weekStart(today), end: weekEnd(today) }
  }
  if (goal.period_type === 'monthly') {
    const y = now.getFullYear(), m = now.getMonth()
    const start = new Date(y, m, 1).toISOString().slice(0, 10)
    const end   = new Date(y, m + 1, 0).toISOString().slice(0, 10)
    return { start, end }
  }
  if (goal.period_type === 'yearly') {
    const y = now.getFullYear()
    return { start: `${y}-01-01`, end: `${y}-12-31` }
  }
  if (goal.period_type === 'custom') {
    return { start: goal.start_date, end: goal.end_date }
  }
  return { start: today, end: today }
}

export function computeGoalProgress(goal, logs) {
  const { start, end } = goalDateRange(goal)
  const logged = logs
    .filter(l => l.project_id === goal.project_id && l.logged_date >= start && l.logged_date <= end)
    .reduce((a, l) => a + l.duration_hrs, 0)
  const pct = Math.min(100, Math.round((logged / goal.target_hrs) * 100))
  return { logged: +logged.toFixed(2), pct, start, end }
}

export function pillProps(pct) {
  if (pct >= 100) return ['pill-green', 'on track']
  if (pct >= 60)  return ['pill-amber', 'partial']
  return ['pill-red', 'behind']
}