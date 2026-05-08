import { useState } from 'react'
import { useData } from '../context/DataContext'
import { fmtHours } from '../lib/dates'
import { computeGoalProgress, goalPeriodLabel, pillProps } from '../lib/goals'
import ProjectModal from '../components/ProjectModal'

const PERIOD_TYPES = ['weekly', 'monthly', 'yearly', 'custom']
const PERIOD_LABELS = { weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly', custom: 'Custom range' }

function GoalModal({ initial, projects, onSave, onClose }) {
  const [projectId,  setProjectId]  = useState(initial?.project_id  || '')
  const [periodType, setPeriodType] = useState(initial?.period_type  || 'weekly')
  const [targetHrs,  setTargetHrs]  = useState(initial?.target_hrs   || 10)
  const [startDate,  setStartDate]  = useState(initial?.start_date   || '')
  const [endDate,    setEndDate]    = useState(initial?.end_date      || '')
  const [busy, setBusy] = useState(false)
  const [err,  setErr]  = useState('')

  async function save() {
    if (!projectId) return setErr('Please select a project.')
    if (!targetHrs || +targetHrs <= 0) return setErr('Please enter a target.')
    if (periodType === 'custom' && (!startDate || !endDate)) return setErr('Please set start and end dates.')
    setBusy(true); setErr('')
    try {
      await onSave({
        project_id:  +projectId,
        period_type: periodType,
        target_hrs:  +targetHrs,
        start_date:  periodType === 'custom' ? startDate : null,
        end_date:    periodType === 'custom' ? endDate   : null,
      })
      onClose()
    } catch (e) { setErr(e.message); setBusy(false) }
  }

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h3>{initial ? 'Edit goal' : 'New goal'}</h3>

        <div className="field" style={{ marginBottom: 14 }}>
          <div className="field-label">Project</div>
          <div className="sel-wrap">
            <select value={projectId} onChange={e => setProjectId(e.target.value)} disabled={!!initial}>
              <option value="">Select a project…</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
        </div>

        <div className="field" style={{ marginBottom: 14 }}>
          <div className="field-label">Period</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {PERIOD_TYPES.map(t => (
              <button key={t}
                className={'chip' + (periodType === t ? ' on' : '')}
                onClick={() => setPeriodType(t)}
                style={{ cursor: 'pointer' }}
              >
                {PERIOD_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        {periodType === 'custom' && (
          <div className="form-grid form-grid-2" style={{ marginBottom: 14 }}>
            <div className="field">
              <div className="field-label">Start date</div>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="field">
              <div className="field-label">End date</div>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
        )}

        <div className="field">
          <div className="field-label">Target (hours)</div>
          <input type="number" value={targetHrs} onChange={e => setTargetHrs(e.target.value)} min="0.5" max="9999" step="0.5" />
        </div>

        {err && <div className="field-error" style={{ marginTop: 10 }}>{err}</div>}

        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={busy}>
            {busy ? <><span className="spin" /> Saving…</> : initial ? 'Save changes' : 'Create goal'}
          </button>
        </div>
      </div>
    </div>
  )
}

function GoalRow({ goal, logs, onEdit, onDelete }) {
  const { logged, pct } = computeGoalProgress(goal, logs)
  const { start, end }  = { start: goal.start_date, end: goal.end_date }
  const [pc, pt] = pillProps(pct)
  const label = goalPeriodLabel(goal)

  return (
    <div style={{ marginBottom: 12, padding: '12px 14px', background: 'var(--bg3)', borderRadius: 'var(--r)', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 600, fontFamily: 'var(--mono)', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
          {goal.period_type === 'custom' && goal.start_date && (
            <span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{goal.start_date} → {goal.end_date}</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className={`pill ${pc}`}>{pt}</span>
          <span style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{fmtHours(logged)} / {goal.target_hrs}h</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand)', fontFamily: 'var(--mono)' }}>{pct}%</span>
          <button className="btn btn-xs" onClick={() => onEdit(goal)}>✎</button>
          <button className="btn btn-xs btn-danger" onClick={() => onDelete(goal.id)}>✕</button>
        </div>
      </div>
      <div className="track">
        <div className="fill" style={{ width: pct + '%', background: 'var(--brand)' }} />
      </div>
    </div>
  )
}

function ProjectGoals({ project, goals, logs, onAddGoal, onEditGoal, onDeleteGoal }) {
  const projGoals = goals.filter(g => g.project_id === project.id)
  return (
    <div style={{ marginBottom: 16, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--r2)', padding: '16px', boxShadow: 'var(--shadow)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: projGoals.length ? 12 : 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="nav-dot" style={{ background: project.color, width: 10, height: 10 }} />
          <span style={{ fontSize: 14, fontWeight: 600 }}>{project.name}</span>
          <span style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>{projGoals.length} goal{projGoals.length !== 1 ? 's' : ''}</span>
        </div>
        <button className="btn btn-xs btn-primary" onClick={() => onAddGoal(project.id)}>+ Add goal</button>
      </div>
      {projGoals.map(g => (
        <GoalRow key={g.id} goal={g} logs={logs} onEdit={onEditGoal} onDelete={onDeleteGoal} />
      ))}
      {projGoals.length === 0 && (
        <div style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--mono)', marginTop: 8 }}>No goals yet — add one above.</div>
      )}
    </div>
  )
}

export default function Goals() {
  const { projects, categories, logs, goals, addProject, editProject, removeProject, addGoal, editGoal, removeGoal, loading } = useData()
  const [addingProject, setAddingProject] = useState(false)
  const [editingProject, setEditingProject] = useState(null)
  const [goalModal, setGoalModal] = useState(null) // { projectId } | goal object
  const [toast, setToast] = useState('')

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 2000) }

  async function handleDeleteGoal(id) {
    if (!confirm('Delete this goal?')) return
    await removeGoal(id); showToast('Deleted')
  }

  function openAddGoal(projectId) {
    setGoalModal({ mode: 'add', projectId })
  }

  function openEditGoal(goal) {
    setGoalModal({ mode: 'edit', goal })
  }

  async function handleSaveGoal(fields) {
    if (goalModal.mode === 'add') {
      await addGoal({ ...fields, project_id: goalModal.projectId })
    } else {
      await editGoal(goalModal.goal.id, fields)
    }
    showToast('Saved ✓')
  }

  if (loading) return <div className="page-spin"><span className="spin" /> Loading…</div>

  // Group projects by category
  const categorised = categories.map(cat => ({
    cat,
    projects: projects.filter(p => p.category_id === cat.id)
  })).filter(g => g.projects.length > 0)

  const uncategorised = projects.filter(p => !p.category_id)

  return (
    <>
      <div className="toolbar">
        <p style={{ fontSize: 13, color: 'var(--text3)' }}>Set weekly, monthly, yearly or custom goals per project.</p>
        <button className="btn btn-primary btn-sm" onClick={() => setAddingProject(true)}>+ New project</button>
      </div>

      {projects.length === 0
        ? <div className="empty" style={{ marginTop: 40 }}>No projects yet — add one above.</div>
        : <>
            {categorised.map(({ cat, projects: catProjects }) => (
              <div key={cat.id} style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: cat.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{cat.name}</span>
                </div>
                {catProjects.map(p => (
                  <ProjectGoals key={p.id} project={p} goals={goals} logs={logs}
                    onAddGoal={openAddGoal} onEditGoal={openEditGoal} onDeleteGoal={handleDeleteGoal} />
                ))}
              </div>
            ))}
            {uncategorised.length > 0 && (
              <div style={{ marginBottom: 28 }}>
                {categorised.length > 0 && (
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>Other</div>
                )}
                {uncategorised.map(p => (
                  <ProjectGoals key={p.id} project={p} goals={goals} logs={logs}
                    onAddGoal={openAddGoal} onEditGoal={openEditGoal} onDeleteGoal={handleDeleteGoal} />
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

      {goalModal && (
        <GoalModal
          initial={goalModal.mode === 'edit' ? goalModal.goal : null}
          projects={projects}
          onSave={handleSaveGoal}
          onClose={() => setGoalModal(null)}
        />
      )}
      {addingProject  && <ProjectModal onClose={() => setAddingProject(false)}  onSave={async f => { await addProject(f);  setAddingProject(false);  showToast('Created ✓') }} />}
      {editingProject && <ProjectModal initial={editingProject} onClose={() => setEditingProject(null)} onSave={async f => { await editProject(editingProject.id, f); setEditingProject(null); showToast('Saved ✓') }} />}
    </>
  )
}
