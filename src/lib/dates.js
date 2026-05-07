export const today = () => new Date().toISOString().slice(0, 10)

export function weekStart(d = today()) {
  const dt = new Date(d + 'T12:00:00')
  dt.setDate(dt.getDate() - ((dt.getDay() + 6) % 7))
  return dt.toISOString().slice(0, 10)
}

export function weekEnd(d = today()) {
  const ws = new Date(weekStart(d) + 'T12:00:00')
  ws.setDate(ws.getDate() + 6)
  return ws.toISOString().slice(0, 10)
}

export function weekDays(d = today()) {
  const ws = new Date(weekStart(d) + 'T12:00:00')
  return Array.from({ length: 7 }, (_, i) => {
    const x = new Date(ws)
    x.setDate(ws.getDate() + i)
    return x.toISOString().slice(0, 10)
  })
}

export function isThisWeek(d) {
  return d >= weekStart() && d <= weekEnd()
}

export function isThisMonth(d) {
  return d.startsWith(today().slice(0, 7))
}

export function fmtHours(h) {
  const hh = Math.floor(h)
  const mm = Math.round((h - hh) * 60)
  return mm > 0 ? `${hh}h ${mm}m` : `${hh}h`
}

export function fmtTimer(s) {
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60]
    .map(x => String(x).padStart(2, '0'))
    .join(':')
}

export function fmtDate(d) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'short', day: 'numeric',
  })
}

export function fmtDayShort(d) {
  return new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' }).slice(0, 2)
}
