import { useState, useRef, useEffect } from 'react'
import { useData } from '../context/DataContext'
import { today, fmtTimer } from '../lib/dates'

export default function Timer() {
  const { projects, addLog } = useData()
  const [secs,      setSecs]     = useState(0)
  const [running,   setRunning]  = useState(false)
  const [tProjId,   setTProjId]  = useState('')
  const [tDesc,     setTDesc]    = useState('')
  const ivRef = useRef(null)

  const [mProjId,  setMProjId]  = useState('')
  const [mDate,    setMDate]    = useState(today())
  const [mDur,     setMDur]     = useState('')
  const [mNote,    setMNote]    = useState('')
  const [mBusy,    setMBusy]    = useState(false)
  const [mMsg,     setMMsg]     = useState('')

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
      await addLog({ project_id: +mProjId, description: mNote || 'Manual entry', duration_hrs: +mDur, logged_date: mDate || today(), source: 'manual' })
      setMDur(''); setMNote('')
      setMMsg('Added ✓')
      setTimeout(() => setMMsg(''), 1800)
    } catch (e) {
      setMMsg('Error: ' + e.message)
    } finally {
      setMBusy(false)
    }
  }

  const selProj = projects.find(p => p.id === +tProjId)

  return (
    <>
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
            <input value={tDesc} onChange={e => setTDesc(e.target.value)} placeholder="e.g. Sprint planning, bug fix…" disabled={running} />
          </div>
          {selProj && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 13, color: selProj.color }}>
              <span className="nav-dot" style={{ background: selProj.color }} /> {selProj.name}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-title" style={{ marginBottom: 18 }}>Manual entry</div>
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
            <input type="number" value={mDur} onChange={e => setMDur(e.target.value)} placeholder="1.5" step="0.25" min="0.1" max="24" />
          </div>
          <button className="btn btn-primary" onClick={addManual} disabled={mBusy} style={{ height: 38, alignSelf: 'end' }}>
            {mMsg || (mBusy ? <span className="spin" /> : '+ Add')}
          </button>
        </div>
        <div className="field">
          <div className="field-label">Note (optional)</div>
          <input value={mNote} onChange={e => setMNote(e.target.value)} placeholder="Brief description…" />
        </div>
      </div>
    </>
  )
}
