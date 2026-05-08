import { useState } from 'react'
import { useData } from '../context/DataContext'
import { fmtHours } from '../lib/dates'
import ProjectModal from '../components/ProjectModal'

function pillProps(pct) {
  if (pct >= 100) return ['pill-green', 'on track']
  if (pct >= 60)  return ['pill-amber', 'partial']
  return ['pill-red', 'behind']
}

function ProjectCard({ p, logged, onEdit, onDelete }) {
  const pct = Math.min(100, Math.round(logged / p.goal_hrs * 100))
  const [pc, pt] = pillProps(pct)
  return (
    <div className="goal-card">
      <div className="goal-card-header">
        <div className="goal-name">
          <span className="nav-dot" style={{ background: p.color, width: 10, height: 10 }} />
          {p.name}
        </div>
        <div className="goal-actions">
          <span className={`pill ${pc}`}>{pt}</span>
          <span className="goal-hrs">{fmtHours(logged)} / {p.goal_hrs}h/wk</span>
          <button className="btn btn-xs" onClick={() => onEdit(p)}>Edit</button>
          <div className="del-wrap">
            <button
              className="btn btn-xs btn-danger"
              onClick={() => onDelete(p.id)}
              disabled={logged > 0}
              style={logged > 0 ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
            >Delete</button>
            {logged > 0 && <div className="tooltip">Delete all time entries first</div>}
          </div>
        </div>
      </div>
      <div className="track">
        <div className="fill" style={{ width: pct + '%', background: p.color }} />
      </div>
    </div>
  )
}

export default function Goals() {
  const { projects, categories, weekLogs, editProject, removeProject, addProject, loading } = useData()
  const [editing, setEditing] = useState(null)
  const [adding,  setAdding]  = useState(false)
  const [toast,   setToast]   = useState('')
  const wl = weekLogs()

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 2000) }

  function getLogged(projectId) {
    return +wl.filter(l => l.project_id === projectId).reduce((a, l) => a + l.duration_hrs, 0).toFixed(2)
  }

  async function handleEdit(id, fields) {
    await editProject(id, fields); setEditing(null); showToast('Saved ✓')
  }

  async function handleDelete(id) {
    if (!confirm('Delete this project?')) return
    await removeProject(id); showToast('Deleted')
  }

  if (loading) return <div className="page-spin"><span className="spin" /> Loading…</div>

  // Group by category
  const categorised = categories.map(cat => ({
    cat,
    projects: projects.filter(p => p.category_id === cat.id)
  })).filter(g => g.projects.length > 0)

  const uncategorised = projects.filter(p => !p.category_id)

  return (
    <>
      <div className="toolbar">
        <p style={{ fontSize: 13, color: 'var(--text3)' }}>Weekly targets reset every Monday.</p>
        <button className="btn btn-primary btn-sm" onClick={() => setAdding(true)}>+ New project</button>
      </div>

      {projects.length === 0
        ? <div className="empty" style={{ marginTop: 40 }}>No projects yet — add one above.</div>
        : <>
            {categorised.map(({ cat, projects: catProjects }) => (
              <div key={cat.id} style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: cat.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{cat.name}</span>
                </div>
                {catProjects.map(p => (
                  <ProjectCard key={p.id} p={p} logged={getLogged(p.id)}
                    onEdit={setEditing} onDelete={handleDelete} />
                ))}
              </div>
            ))}

            {uncategorised.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                {categorised.length > 0 && (
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Other</div>
                )}
                {uncategorised.map(p => (
                  <ProjectCard key={p.id} p={p} logged={getLogged(p.id)}
                    onEdit={setEditing} onDelete={handleDelete} />
                ))}
              </div>
            )}
          </>
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
