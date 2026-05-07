import { useState } from 'react'
import { useData } from '../context/DataContext'
import { fmtHours } from '../lib/dates'
import ProjectModal from '../components/ProjectModal'

function pillProps(pct) {
  if (pct >= 100) return ['pill-green', 'on track']
  if (pct >= 60)  return ['pill-amber', 'partial']
  return ['pill-red', 'behind']
}

export default function Goals() {
  const { projects, weekLogs, editProject, removeProject, addProject, loading } = useData()
  const [editing,  setEditing]  = useState(null)
  const [adding,   setAdding]   = useState(false)
  const [toast,    setToast]    = useState('')
  const wl = weekLogs()

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 2000) }

  async function handleEdit(id, fields) {
    await editProject(id, fields)
    setEditing(null)
    showToast('Saved ✓')
  }

  async function handleDelete(id) {
    if (!confirm('Delete this project and all its logs? This cannot be undone.')) return
    await removeProject(id)
    showToast('Deleted')
  }

  if (loading) return <div className="page-spin"><span className="spin" /> Loading…</div>

  return (
    <>
      <div className="toolbar">
        <p style={{ fontSize: 13, color: 'var(--text3)' }}>Weekly targets reset every Monday.</p>
        <button className="btn btn-primary btn-sm" onClick={() => setAdding(true)}>+ New project</button>
      </div>

      {projects.length === 0
        ? <div className="empty" style={{ marginTop: 40 }}>No projects yet — add one above.</div>
        : projects.map(p => {
            const h   = +wl.filter(l => l.project_id === p.id).reduce((a, l) => a + l.duration_hrs, 0).toFixed(2)
            const pct = Math.min(100, Math.round(h / p.goal_hrs * 100))
            const [pc, pt] = pillProps(pct)
            return (
              <div key={p.id} className="goal-card">
                <div className="goal-card-header">
                  <div className="goal-name">
                    <span className="nav-dot" style={{ background: p.color, width: 10, height: 10 }} />
                    {p.name}
                  </div>
                  <div className="goal-actions">
                    <span className={`pill ${pc}`}>{pt}</span>
                    <span className="goal-hrs">{fmtHours(h)} / {p.goal_hrs}h/wk</span>
                    <button className="btn btn-xs" onClick={() => setEditing(p)}>Edit</button>
                    <button className="btn btn-xs btn-danger" onClick={() => handleDelete(p.id)}>Delete</button>
                  </div>
                </div>
                <div className="track">
                  <div className="fill" style={{ width: pct + '%', background: p.color }} />
                </div>
              </div>
            )
          })
      }

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: 'var(--green-bg)', border: '1px solid var(--green)', color: 'var(--green)', borderRadius: 'var(--r)', padding: '10px 18px', fontSize: 13, fontFamily: 'var(--mono)' }}>
          {toast}
        </div>
      )}

      {editing && <ProjectModal initial={editing} onClose={() => setEditing(null)} onSave={f => handleEdit(editing.id, f)} />}
      {adding  && <ProjectModal onClose={() => setAdding(false)} onSave={async f => { await addProject(f); setAdding(false); showToast('Created ✓') }} />}
    </>
  )
}
