import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { today, fmtHours, fmtDate, isThisWeek, isThisMonth } from '../lib/dates'

export default function Logs() {
  const { projects, logs, removeLog, loading } = useData()
  const [sp] = useSearchParams()
  const [projFilter, setProjFilter] = useState(sp.get('p') || 'all')
  const [period,     setPeriod]     = useState('week')

  const filtered = useMemo(() => logs.filter(l => {
    const okP = projFilter === 'all' || l.project_id === +projFilter
    const okT = period === 'all'
      || (period === 'week'  && isThisWeek(l.logged_date))
      || (period === 'month' && isThisMonth(l.logged_date))
    return okP && okT
  }), [logs, projFilter, period])

  // Group by date
  const grouped = useMemo(() => {
    const g = {}
    filtered.forEach(l => { ;(g[l.logged_date] = g[l.logged_date] || []).push(l) })
    return Object.entries(g).sort(([a], [b]) => b.localeCompare(a))
  }, [filtered])

  async function del(id) {
    if (!confirm('Delete this entry?')) return
    await removeLog(id)
  }

  if (loading) return <div className="page-spin"><span className="spin" /> Loading…</div>

  return (
    <>
      <div className="toolbar">
        <div className="chips">
          <button className={'chip' + (projFilter === 'all' ? ' on' : '')} onClick={() => setProjFilter('all')}>All</button>
          {projects.map(p => (
            <button key={p.id} className={'chip' + (projFilter === String(p.id) ? ' on' : '')} onClick={() => setProjFilter(String(p.id))}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.color, display: 'inline-block', marginRight: 5, verticalAlign: 'middle' }} />
              {p.name}
            </button>
          ))}
        </div>
        <div className="chips">
          {[['week','This week'],['month','This month'],['all','All time']].map(([v,l]) => (
            <button key={v} className={'chip' + (period === v ? ' on' : '')} onClick={() => setPeriod(v)}>{l}</button>
          ))}
        </div>
      </div>

      <div className="card">
        {grouped.length === 0
          ? <div className="empty">No entries found.</div>
          : grouped.map(([date, rows]) => (
              <div key={date}>
                <div className="log-date">{fmtDate(date)}</div>
                {rows.map(l => {
                  const p = projects.find(p => p.id === l.project_id)
                  return (
                    <div key={l.id} className="log-row">
                      <span className="nav-dot" style={{ background: p?.color || '#888' }} />
                      <div className="log-body">
                        <div className="log-proj">{p?.name || 'Unknown'}</div>
                        <div className="log-desc">{l.description || '—'}</div>
                      </div>
                      <div className="log-dur">{fmtHours(l.duration_hrs)}</div>
                      <button className="log-del" onClick={() => del(l.id)}>✕</button>
                    </div>
                  )
                })}
              </div>
            ))
        }
      </div>
    </>
  )
}
