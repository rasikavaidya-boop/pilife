import { useState, useRef, useEffect, useMemo } from 'react'
import { useData } from '../context/DataContext'
import { today, fmtTimer, fmtHours, fmtDate, isThisWeek, isThisMonth } from '../lib/dates'

export default function Timebox() {
  const { projects, logs, addLog, removeLog } = useData()

  // ── Timer state ──────────────────────────────────────────
  const [secs,    setSecs]    = useState(0)
  const [running, setRunning] = useState(false)
  const [tProjId, setTProjId] = useState('')
  const [tDesc,   setTDesc]   = useState('')
  const ivRef = useRef(null)

  // ── Manual entry state ───────────────────────────────────
  const [mProjId, setMProjId] = useState('')
  const [mDate,   setMDate]   = useState(today())
  const [mDur,    setMDur]    = useState('')
  const [mNote,   setMNote]   = useState('')
  const [mBusy,   setMBusy]   = useState(false)
  const [mMsg,    setMMsg]    = useState('')

  // ── Log filter state ─────────────────────────────────────
  const [projFilter, setProjFilter] = useState('all')
  const [period,     setPeriod]     = useState('week')

  useEffect(() => () => clearInterval(ivRef.current), [])

  function start() {
    setRunning(true)
    ivRef.current = setInterval(() => setSecs(s => s + 1), 1000)
  }

  function stop() {
    setRunning(false)
    clearInterval(ivRef.current)
    if (secs > 0 && tProjId) {
      addLog({
        project_id:   +tProjId,
        description:  tDesc || 'Timer session',
        duration_hrs: +(secs / 3600).toFixed(2),
        logged_date:  today(),
        source:       'timer',
      }).catch(console.error)
    }
  }

  function reset() {
    stop()
    setSecs(0); setTDesc('')
  }

  async function addManual() {
    if (!mProjId || !mDur || +mDur <= 0) return
    setMBusy(true)
    try {
      await addLog({
        project_id:   +mProjId,
        description:  mNote || 'Manual entry',
        duration_hrs: +mDur,
        logged_date:  mDate || today(),
        source:       'manual',
      })
      setMDur(''); setMNote('')
      setMMsg('Added ✓')
      setTimeout(() => setMMsg(''), 1800)
    } catch (e) {
      setMMsg('Error: ' + e.message)
    } finally {
      setMBusy(false)
    }
  }

  async function del(id) {
    if (!confirm('Delete this entry?')) return
    await removeLog(id)
  }

  // ── Filtered + grouped logs ──────────────────────────────
  const filtered = useMemo(() => logs.filter(l => {
    const okP = projFilter === 'all' || l.project_id === +projFilter
    const okT = period === 'all'
      || (period === 'week'  && isThisWeek(l.logged_date))
      || (period === 'month' && isThisMonth(l.logged_date))
    return okP && okT
  }), [logs, projFilter, period])

  const grouped = useMemo(() => {
    const g = {}
    filtered.forEach(l => { ;(g[l.logged_date] = g[l.logged_date] || []).push(l) })
    return Object.entries(g).sort(([a], [b]) => b.localeCompare(a))
  }, [filtered])

  const selProj = projects.find(p => p.id === +tProjId)

  return (
    <>
      {/* ── Timer ── */}
      <div className="timer-wrap">
        <div>
          <div className={'timer-clock' + (running ? ' running' : '')}>{fmtTimer(secs)}</div>
          <div className="timer-controls">
            {!running
              ? <button className="btn btn-primary" onClick={start}>▶ Start</button>
              : <button className="btn btn-stop"    onClick={stop}>■ Stop</button>
            }
            {secs > 0 && !running && (
              <button className="btn" onClick={reset}>↺ Reset</button>
            )}
          </div>
        </div>
        <div className="timer-fields">
          <div className="field">
            <div className="field-label">Project</div>
            <div className="sel-wrap">
              <select value={tProjId} onChange={e => setTProjId(e.target.value)} disabled={running}>
                <option value="">Select a project…</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div className="field">
            <div className="field-label">What are you working on?</div>
            <input value={tDesc} onChange={e => setTDesc(e.target.value)}
              placeholder="e.g. Sprint planning, bug fix…" disabled={running} />
          </div>
          {selProj && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: selProj.color }}>
              <span className="nav-dot" style={{ background: selProj.color }} /> {selProj.name}
            </div>
          )}
        </div>
      </div>

      {/* ── Manual entry ── */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-title" style={{ marginBottom: 16 }}>Manual entry</div>
        <div className="form-grid form-grid-4" style={{ marginBottom: 12 }}>
          <div className="field">
            <div className="field-label">Project</div>
            <div className="sel-wrap">
              <select value={mProjId} onChange={e => setMProjId(e.target.value)}>
                <option value="">Select…</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          </div>
          <div className="field">
            <div className="field-label">Date</div>
            <input type="date" value={mDate} onChange={e => setMDate(e.target.value)} />
          </div>
          <div className="field">
            <div className="field-label">Duration (hrs)</div>
            <input type="number" value={mDur} onChange={e => setMDur(e.target.value)}
              placeholder="1.5" step="0.25" min="0.1" max="24" />
          </div>
          <button className="btn btn-primary" onClick={addManual} disabled={mBusy}
            style={{ height: 38, alignSelf: 'end' }}>
            {mMsg || (mBusy ? <span className="spin" /> : '+ Add')}
          </button>
        </div>
        <div className="field">
          <div className="field-label">Note (optional)</div>
          <input value={mNote} onChange={e => setMNote(e.target.value)} placeholder="Brief description…" />
        </div>
      </div>

      {/* ── Log list ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 10 }}>
        <div className="chips">
          <button className={'chip' + (projFilter === 'all' ? ' on' : '')} onClick={() => setProjFilter('all')}>All</button>
          {projects.map(p => (
            <button key={p.id} className={'chip' + (projFilter === String(p.id) ? ' on' : '')}
              onClick={() => setProjFilter(String(p.id))}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.color, display: 'inline-block', marginRight: 5, verticalAlign: 'middle' }} />
              {p.name}
            </button>
          ))}
        </div>
        <div className="chips">
          {[['week','This week'],['month','This month'],['all','All time']].map(([v, l]) => (
            <button key={v} className={'chip' + (period === v ? ' on' : '')} onClick={() => setPeriod(v)}>{l}</button>
          ))}
        </div>
      </div>

      <div className="card">
        {grouped.length === 0
          ? <div className="empty">No entries yet — start the timer or add one manually.</div>
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
