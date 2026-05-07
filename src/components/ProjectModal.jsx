import { useState } from 'react'

const COLORS = ['#7c5cbf','#1a9e6e','#c44a30','#3070c0','#b07d20','#c47a6e','#4a9e9e','#9e4a8e']

export default function ProjectModal({ onClose, onSave, initial }) {
  const [name,    setName]    = useState(initial?.name     || '')
  const [color,   setColor]   = useState(initial?.color    || COLORS[0])
  const [goal,    setGoal]    = useState(initial?.goal_hrs || 10)
  const [busy,    setBusy]    = useState(false)
  const [err,     setErr]     = useState('')

  async function save() {
    if (!name.trim()) return setErr('Name is required.')
    setBusy(true); setErr('')
    try { await onSave({ name: name.trim(), color, goal_hrs: +goal }) }
    catch (e) { setErr(e.message); setBusy(false) }
  }

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h3>{initial ? 'Edit project' : 'New project'}</h3>

        <div className="field" style={{ marginBottom: 14 }}>
          <div className="field-label">Name</div>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Client Work" autoFocus onKeyDown={e => e.key === 'Enter' && save()} />
        </div>

        <div className="field" style={{ marginBottom: 14 }}>
          <div className="field-label">Color</div>
          <div className="swatches">
            {COLORS.map(c => (
              <div key={c} className={'swatch' + (color === c ? ' on' : '')}
                style={{ background: c }} onClick={() => setColor(c)} />
            ))}
          </div>
        </div>

        <div className="field">
          <div className="field-label">Weekly goal (hours)</div>
          <input type="number" value={goal} onChange={e => setGoal(e.target.value)} min="0.5" max="80" step="0.5" />
        </div>

        {err && <div className="field-error" style={{ marginTop: 10 }}>{err}</div>}

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={busy}>
            {busy ? <><span className="spin" /> Saving…</> : initial ? 'Save changes' : 'Create project'}
          </button>
        </div>
      </div>
    </div>
  )
}
