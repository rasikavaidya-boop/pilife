import { useState, useRef, useEffect, useMemo } from 'react'
import { useData } from '../context/DataContext'
import { today, fmtTimer, fmtHours, fmtDate, isThisWeek, isThisMonth } from '../lib/dates'

function toHrs(h, m) {
  return (parseInt(h) || 0) + (parseInt(m) || 0) / 60
}
function hFromHrs(hrs) {
  return Math.floor(hrs)
}
function mFromHrs(hrs) {
  return Math.round((hrs - Math.floor(hrs)) * 60)
}

function Section({ title, subtitle, icon, iconBg, iconColor, children }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', boxShadow: 'var(--shadow)', overflow: 'hidden' }}>
      <button onClick={() => setOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ width: 30, height: 30, borderRadius: 8, background: iconBg, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>{icon}</span>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)', letterSpacing: '-0.2px' }}>{title}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text3)', marginTop: 1 }}>{subtitle}</div>
          </div>
        </div>
        <span style={{ fontSize: 11, color: 'var(--text3)', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', flexShrink: 0 }}>▾</span>
      </button>
      {open && (
        <div style={{ padding: '4px 16px 16px', borderTop: '1px solid var(--border)' }}>
          {children}
        </div>
      )}
    </div>
  )
}

function EditModal({ log, projects, onSave, onClose }) {
  const [projId, setProjId] = useState(String(log.project_id))
  const [date,   setDate]   = useState(log.logged_date)
  const [hrs,    setHrs]    = useState(hFromHrs(log.duration_hrs))
  const [mins,   setMins]   = useState(mFromHrs(log.duration_hrs))
  const [note,   setNote]   = useState(log.description || '')
  const [busy,   setBusy]   = useState(false)
  const [err,    setErr]    = useState('')

  async function save() {
    const dur = toHrs(hrs, mins)
    if (!projId || dur <= 0) return setErr('Please select a project and enter a duration.')
    setBusy(true); setErr('')
    try {
      await onSave(log.id, {
        project_id:   +projId,
        logged_date:  date,
        duration_hrs: +dur.toFixed(2),
        description:  note,
      })
      onClose()
    } catch (e) {
      setErr(e.message)
      setBusy(false)
    }
  }

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h3>Edit entry</h3>

        <div className="field" style={{ marginBottom: 12 }}>
          <div className="field-label">Project</div>
          <div className="sel-wrap">
            <select value={projId} onChange={e => setProjId(e.target.value)}>
              <option value="">Select…</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        <div className="field" style={{ marginBottom: 12 }}>
          <div className="field-label">Date</div>
          <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>

        <div className="field" style={{ marginBottom: 12 }}>
          <div className="field-label">Duration</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="number" value={hrs} onChange={e => setHrs(e.target.value)}
              min="0" max="23" placeholder="0"
              style={{ width: 64, textAlign: 'center', padding: '8px 6px' }} />
            <span style={{ fontSize: 13, color: 'var(--text3)' }}>h</span>
            <input type="number" value={mins} onChange={e => setMins(e.target.value)}
              min="0" max="59" placeholder="0"
              style={{ width: 64, textAlign: 'center', padding: '8px 6px' }} />
            <span style={{ fontSize: 13, color: 'var(--text3)' }}>m</span>
          </div>
        </div>

        <div className="field">
          <div className="field-label">Note</div>
          <input value={note} onChange={e => setNote(e.target.value)} placeholder="Brief description…" />
        </div>

        {err && <div className="field-error" style={{ marginTop: 10 }}>{err}</div>}

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={busy}>
            {busy ? <><span className="spin" /> Saving…</> : 'Save changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Timebox() {
  const { projects, logs, addLog, editLog, removeLog } = useData()

  const [secs,    setSecs]    = useState(0)
  const [running, setRunning] = useState(false)
  const [tProjId, setTProjId] = useState('')
  const [tDesc,   setTDesc]   = useState('')
  const ivRef = useRef(null)

  const [mProjId, setMProjId] = useState('')
  const [mDate,   setMDate]   = useState(today())
  const [mHrs,    setMHrs]    = useState('')
  const [mMins,   setMMins]   = useState('')
  const [mNote,   setMNote]   = useState('')
  const [mBusy,   setMBusy]   = useState(false)
  const [mMsg,    setMMsg]    = useState('')

  const [projFilter, setProjFilter] = useState('all')
  const [period,     setPeriod]     = useState('week')
  const [editing,    setEditing]    = useState(null)

  useEffect(() => () => clearInterval(ivRef.current), [])

  function start() {
    setRunning(true)
    ivRef.current = setInterval(() => setSecs(s => s + 1), 1000)
  }

  function stop() {
    setRunning(false)
    clearInterval(ivRef.current)
    if (secs > 0 && tProjId) {
      addLog({ project_id: +tProjId, description: tDesc || 'Timer session', duration_hrs: +(secs / 3600).toFixed(2), logged_date: today(), source: 'timer' }).catch(console.error)
    }
  }

  function reset() { stop(); setSecs(0); setTDesc('') }

  async function addManual() {
    const dur = toHrs(mHrs, mMins)
    if (!mProjId || dur <= 0) return
    setMBusy(true)
    try {
      await addLog({ project_id: +mProjId, description: mNote || 'Manual entry', duration_hrs: +dur.toFixed(2), logged_date: mDate || today(), source: 'manual' })
      setMHrs(''); setMMins(''); setMNote('')
      setMMsg('Added ✓')
      setTimeout(() => setMMsg(''), 1800)
    } catch (e) { setMMsg('Error: ' + e.message) }
    finally { setMBusy(false) }
  }

  async function del(id) {
    if (!confirm('Delete this entry?')) return
    await removeLog(id)
  }

  const filtered = useMemo(() => logs.filter(l => {
    const okP = projFilter === 'all' || l.project_id === +projFilter
    const okT = period === 'all' || (period === 'week' && isThisWeek(l.logged_date)) || (period === 'month' && isThisMonth(l.logged_date))
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
      <Section icon="⏱" title="Live timer" subtitle="Start tracking time in real-time" iconBg="rgba(26,158,110,0.1)" iconColor="var(--green)">
        <div style={{ display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap', paddingTop: 14 }}>
          <div>
            <div className={'timer-clock' + (running ? ' running' : '')} style={{ fontSize: 48 }}>{fmtTimer(secs)}</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              {!running ? <button className="btn btn-primary" onClick={start}>▶ Start</button>
                        : <button className="btn btn-stop"    onClick={stop}>■ Stop</button>}
              {secs > 0 && !running && <button className="btn" onClick={reset}>↺ Reset</button>}
            </div>
          </div>
          <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 10 }}>
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
              <input value={tDesc} onChange={e => setTDesc(e.target.value)} placeholder="e.g. Sprint planning, bug fix…" disabled={running} />
            </div>
            {selProj && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: selProj.color }}>
                <span className="nav-dot" style={{ background: selProj.color }} /> {selProj.name}
              </div>
            )}
          </div>
        </div>
      </Section>

      <Section icon="✎" title="Manual entry" subtitle="Log time you've already spent" iconBg="var(--brand-bg)" iconColor="var(--brand)">
        <div style={{ paddingTop: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
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
              <div className="field-label">Duration</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input type="number" value={mHrs} onChange={e => setMHrs(e.target.value)} placeholder="0" min="0" max="23" style={{ width: 52, textAlign: 'center', padding: '8px 6px' }} />
                <span style={{ fontSize: 12, color: 'var(--text3)', flexShrink: 0 }}>h</span>
                <input type="number" value={mMins} onChange={e => setMMins(e.target.value)} placeholder="0" min="0" max="59" style={{ width: 52, textAlign: 'center', padding: '8px 6px' }} />
                <span style={{ fontSize: 12, color: 'var(--text3)', flexShrink: 0 }}>m</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'end' }}>
            <div className="field" style={{ flex: 1 }}>
              <div className="field-label">Note (optional)</div>
              <input value={mNote} onChange={e => setMNote(e.target.value)} placeholder="Brief description…" />
            </div>
            <button className="btn btn-primary" onClick={addManual} disabled={mBusy} style={{ height: 38, flexShrink: 0 }}>
              {mMsg || (mBusy ? <span className="spin" /> : '+ Add')}
            </button>
          </div>
        </div>
      </Section>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '8px 0 10px', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Time entries</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
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
            {[['week','This week'],['month','This month'],['all','All time']].map(([v, l]) => (
              <button key={v} className={'chip' + (period === v ? ' on' : '')} onClick={() => setPeriod(v)}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        {grouped.length === 0
          ? <div className="empty">No entries yet — use the timer or add one manually above.</div>
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
                      <button className="log-del" onClick={() => setEditing(l)} title="Edit">✎</button>
                      <button className="log-del" onClick={() => del(l.id)} title="Delete">✕</button>
                    </div>
                  )
                })}
              </div>
            ))
        }
      </div>

      {editing && (
        <EditModal
          log={editing}
          projects={projects}
          onSave={editLog}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  )
}
