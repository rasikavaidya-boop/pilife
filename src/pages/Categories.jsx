import { useState } from 'react'
import { useData } from '../context/DataContext'

const COLORS = ['#7c5cbf','#1a9e6e','#c44a30','#3070c0','#b07d20','#c47a6e','#4a9e9e','#9e4a8e']

function CategoryModal({ initial, onSave, onClose }) {
  const [name,  setName]  = useState(initial?.name  || '')
  const [color, setColor] = useState(initial?.color || COLORS[0])
  const [busy,  setBusy]  = useState(false)
  const [err,   setErr]   = useState('')

  async function save() {
    if (!name.trim()) return setErr('Name is required.')
    setBusy(true); setErr('')
    try { await onSave({ name: name.trim(), color }); onClose() }
    catch (e) { setErr(e.message); setBusy(false) }
  }

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h3>{initial ? 'Edit category' : 'New category'}</h3>
        <div className="field" style={{ marginBottom: 14 }}>
          <div className="field-label">Name</div>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Health" autoFocus onKeyDown={e => e.key === 'Enter' && save()} />
        </div>
        <div className="field">
          <div className="field-label">Color</div>
          <div className="swatches">
            {COLORS.map(c => (
              <div key={c} className={'swatch' + (color === c ? ' on' : '')} style={{ background: c }} onClick={() => setColor(c)} />
            ))}
          </div>
        </div>
        {err && <div className="field-error" style={{ marginTop: 10 }}>{err}</div>}
        <div className="modal-footer">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={busy}>
            {busy ? <><span className="spin" /> Saving…</> : initial ? 'Save changes' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Categories() {
  const { categories, projects, addCategory, editCategory, removeCategory } = useData()
  const [adding,  setAdding]  = useState(false)
  const [editing, setEditing] = useState(null)
  const [toast,   setToast]   = useState('')

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 2000) }

  async function handleDelete(cat) {
    const projCount = projects.filter(p => p.category_id === cat.id).length
    if (projCount > 0) {
      alert(`"${cat.name}" has ${projCount} project${projCount > 1 ? 's' : ''} assigned to it. Reassign or remove them first.`)
      return
    }
    if (!confirm(`Delete category "${cat.name}"?`)) return
    await removeCategory(cat.id)
    showToast('Deleted')
  }

  return (
    <>
      <div className="toolbar">
        <p style={{ fontSize: 13, color: 'var(--text3)' }}>
          Group your projects by category.
        </p>
        <button className="btn btn-primary btn-sm" onClick={() => setAdding(true)}>+ New category</button>
      </div>

      {categories.length === 0
        ? <div className="empty" style={{ marginTop: 40 }}>No categories yet — add one above.</div>
        : categories.map(cat => {
            const catProjects = projects.filter(p => p.category_id === cat.id)
            const hasProjects = catProjects.length > 0
            return (
              <div key={cat.id} className="card" style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 12, height: 12, borderRadius: '50%', background: cat.color, display: 'inline-block', flexShrink: 0 }} />
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{cat.name}</span>
                    <span style={{ fontSize: 12, color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
                      {catProjects.length} project{catProjects.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <button className="btn btn-xs" onClick={() => setEditing(cat)}>✎ Edit</button>
                    <div className="del-wrap">
                      <button
                        className="btn btn-xs"
                        onClick={() => handleDelete(cat)}
                        disabled={hasProjects}
                        style={hasProjects ? {
                          opacity: 0.4, cursor: 'not-allowed',
                          borderColor: 'var(--red)', color: 'var(--red)',
                          background: 'var(--red-bg)'
                        } : {
                          borderColor: 'var(--red)', color: 'var(--red)',
                          background: 'var(--red-bg)'
                        }}
                      >
                        ✕ Delete
                      </button>
                      {hasProjects && (
                        <div className="tooltip">Reassign all projects first</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Projects in this category */}
                {catProjects.length > 0 && (
                  <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {catProjects.map(p => (
                      <span key={p.id} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '3px 10px', borderRadius: 99,
                        background: 'var(--bg3)', border: '1px solid var(--border)',
                        fontSize: 12, color: 'var(--text2)'
                      }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
                        {p.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )
          })
      }

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: 'var(--green-bg)', border: '1px solid var(--green)', color: 'var(--green)', borderRadius: 'var(--r)', padding: '10px 18px', fontSize: 13, fontFamily: 'var(--mono)' }}>
          {toast}
        </div>
      )}

      {adding  && <CategoryModal onClose={() => setAdding(false)}  onSave={addCategory} />}
      {editing && <CategoryModal initial={editing} onClose={() => setEditing(null)} onSave={f => editCategory(editing.id, f)} />}
    </>
  )
}
