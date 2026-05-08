import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useData } from '../context/DataContext'
import { fmtHours, fmtDate, isThisWeek, isThisMonth } from '../lib/dates'
import ProjectModal from '../components/ProjectModal'

function pillProps(pct) {
  if (pct >= 100) return ['pill-green', 'on track']
  if (pct >= 60)  return ['pill-amber', 'partial']
  return ['pill-red', 'behind']
}

export default function ProjectDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { projects, logs, editProject, removeProject } = useData()
  const [editing, setEditing] = useState(false)

  const project = projects.find(p => String(p.id) === id)
  const projLogs = useMemo(() => logs.filter(l => l.project_id === +id).sort((a, b) => b.logged_date.localeCompare(a.logged_date) || b.id - a.id), [logs, id])

  if (!project) return (
    <div className="empty" style={{ marginTop: 60 }}>
      Project not found. <button className="btn btn-sm" style={{ marginLeft: 10 }} onClick={() => navigate('/')}>Go home</button>
    </div>
  )

  const weekH  = +projLogs.filter(l => isThisWeek(l.logged_date)).reduce((a, l) => a + l.duration_hrs, 0).toFixed(2)
  const monthH = +projLogs.filter(l => isThisMonth(l.logged_date)).reduce((a, l) => a + l.duration_hrs, 0).toFixed(2)
  const totalH = +projLogs.reduce((a, l) => a + l.duration_hrs, 0).toFixed(2)
  const pct    = Math.min(100, Math.round(weekH / project.goal_hrs * 100))
  const [pc, pt] = pillProps(pct)

  const hasLogs    = projLogs.length > 0
  const firstEntry = projLogs.length ? projLogs[projLogs.length - 1].logged_date : null

  // Group logs by date
  const grouped = useMemo(() => {
    const g = {}
    projLogs.forEach(l => { ;(g[l.logged_date] = g[l.logged_date] || []).push(l) })
    return Object.entries(g).sort(([a], [b]) => b.localeCompare(a))
  }, [projLogs])

  async function handleDelete() {
    if (!confirm(`Delete project "${project.name}"? This cannot be undone.`)) return
    await removeProject(project.id)
    navigate('/goals')
  }

  async function handleEdit(fields) {
    await editProject(project.id, fields)
    setEditing(false)
  }

  return (
    <>
      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <button className="btn btn-sm" onClick={() => navigate(-1)} style={{ gap: 5 }}>
          ← Back
        </button>
        <span style={{ color: 'var(--text3)', fontSize: 13 }}>/</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: project.color, display: 'inline-block', flexShrink: 0 }} />
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.3px' }}>{project.name}</span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn btn-sm" onClick={() => setEditing(true)}>
            ✎ Edit
          </button>
          <div className="del-wrap">
            <button
              className={'btn btn-sm' + (hasLogs ? '' : ' btn-danger')}
              onClick={!hasLogs ? handleDelete : undefined}
              disabled={hasLogs}
              title={hasLogs ? 'Delete all time entries for this project first' : 'Delete project'}
              style={hasLogs ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
            >
              ✕ Delete
            </button>
            {hasLogs && (
              <div style={{
                position: 'absolute', bottom: 'calc(100% + 6px)', right: 0,
                background: 'var(--text)', color: 'var(--bg2)',
                fontSize: 11, padding: '5px 10px', borderRadius: 'var(--r)',
                whiteSpace: 'nowrap', pointerEvents: 'none', opacity: 0,
                transition: 'opacity 0.15s',
              }} className="tooltip">
                Delete all time entries first
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
        <div className="tile">
          <div className="tile-label">This week</div>
          <div className="tile-value">{fmtHours(weekH)}</div>
          <div className="tile-sub">of {project.goal_hrs}h goal</div>
        </div>
        <div className="tile">
          <div className="tile-label">This month</div>
          <div className="tile-value">{fmtHours(monthH)}</div>
          <div className="tile-sub">{projLogs.filter(l => isThisMonth(l.logged_date)).length} entries</div>
        </div>
        <div className="tile">
          <div className="tile-label">All time</div>
          <div className="tile-value">{fmtHours(totalH)}</div>
          <div className="tile-sub">{firstEntry ? `since ${fmtDate(firstEntry)}` : 'no entries yet'}</div>
        </div>
      </div>

      {/* ── Goal progress ── */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Weekly goal</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
            <span>{fmtHours(weekH)} / {project.goal_hrs}h</span>
            <span style={{ fontWeight: 600, fontSize: 13, color: project.color }}>{pct}%</span>
            <span className={`pill ${pc}`}>{pt}</span>
          </div>
        </div>
        <div className="track">
          <div className="fill" style={{ width: pct + '%', background: project.color }} />
        </div>
      </div>

      {/* ── Log entries ── */}
      <div className="card">
        <div className="card-title">All entries</div>
        {grouped.length === 0
          ? <div className="empty">No entries yet for this project.</div>
          : grouped.map(([date, rows]) => (
              <div key={date}>
                <div className="log-date">{fmtDate(date)}</div>
                {rows.map(l => (
                  <div key={l.id} className="log-row">
                    <span className="nav-dot" style={{ background: project.color }} />
                    <div className="log-body">
                      <div className="log-proj">{l.description || '—'}</div>
                      <div className="log-desc" style={{ fontSize: 11, color: 'var(--text3)' }}>{l.source}</div>
                    </div>
                    <div className="log-dur">{fmtHours(l.duration_hrs)}</div>
                  </div>
                ))}
              </div>
            ))
        }
      </div>

      {/* ── Edit modal ── */}
      {editing && (
        <ProjectModal
          initial={project}
          onClose={() => setEditing(false)}
          onSave={handleEdit}
        />
      )}

      <style>{`
        .delete-tooltip-wrap:hover .delete-tooltip { opacity: 1 !important; }
      `}</style>
    </>
  )
}
