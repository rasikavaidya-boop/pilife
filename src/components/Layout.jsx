import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useData } from '../context/DataContext'
import { signOut } from '../lib/supabase'
import ProjectModal from './ProjectModal'

function getTitle(pathname) {
  if (pathname === '/')                   return 'Dashboard'
  if (pathname === '/timebox')            return 'Timebox'
  if (pathname === '/goals')              return 'Goals'
  if (pathname === '/categories')         return 'Categories'
  if (pathname.startsWith('/projects/'))  return 'Project'
  return 'PiLife'
}

export default function Layout() {
  const { projects, categories, addProject } = useData()
  const [showAdd, setShowAdd] = useState(false)
  const navigate = useNavigate()
  const { pathname } = useLocation()

  async function handleSignOut() {
    await signOut()
    navigate('/auth')
  }

  // Group projects by category
  const categorised = categories.map(cat => ({
    cat,
    projects: projects.filter(p => p.category_id === cat.id)
  }))
  const uncategorised = projects.filter(p => !p.category_id)

  return (
    <div className="app">
      <aside className="sidebar">
        <NavLink to="/" className="logo">
          <div className="logo-mark">π</div>
          <div className="logo-name">Pi<span>Life</span></div>
        </NavLink>

        <nav className="nav">
          <div className="nav-label">Menu</div>
          <NavLink to="/"          end className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            <span className="nav-icon">⊞</span> Dashboard
          </NavLink>
          <NavLink to="/timebox"       className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            <span className="nav-icon">⏱</span> Timebox
          </NavLink>
          <NavLink to="/goals"         className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            <span className="nav-icon">◎</span> Goals
          </NavLink>
          <NavLink to="/categories"    className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}>
            <span className="nav-icon">⊛</span> Categories
          </NavLink>

          {/* Projects grouped by category */}
          <div className="nav-label">Projects</div>

          {categorised.map(({ cat, projects: catProjects }) => catProjects.length > 0 && (
            <div key={cat.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 10px 2px', fontSize: 10, fontWeight: 600, color: cat.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: cat.color, flexShrink: 0 }} />
                {cat.name}
              </div>
              {catProjects.map(p => (
                <button key={p.id} className={'nav-link' + (pathname === `/projects/${p.id}` ? ' active' : '')}
                  onClick={() => navigate(`/projects/${p.id}`)}
                  style={{ paddingLeft: 22 }}>
                  <span className="nav-dot" style={{ background: p.color }} />
                  {p.name}
                </button>
              ))}
            </div>
          ))}

          {/* Uncategorised projects */}
          {uncategorised.length > 0 && (
            <div>
              {categories.length > 0 && (
                <div style={{ padding: '5px 10px 2px', fontSize: 10, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Other
                </div>
              )}
              {uncategorised.map(p => (
                <button key={p.id} className={'nav-link' + (pathname === `/projects/${p.id}` ? ' active' : '')}
                  onClick={() => navigate(`/projects/${p.id}`)}
                  style={{ paddingLeft: categories.length > 0 ? 22 : undefined }}>
                  <span className="nav-dot" style={{ background: p.color }} />
                  {p.name}
                </button>
              ))}
            </div>
          )}

          <button className="nav-link add-proj" onClick={() => setShowAdd(true)}>
            <span className="nav-icon">+</span> New project
          </button>

          <div style={{ flex: 1 }} />
          <button className="nav-link" onClick={handleSignOut} style={{ marginTop: 4 }}>
            <span className="nav-icon">→</span> Sign out
          </button>
        </nav>
      </aside>

      <div className="main">
        <header className="topbar">
          <div className="topbar-left">
            <span className="page-title">{getTitle(pathname)}</span>
          </div>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>

      {showAdd && (
        <ProjectModal
          onClose={() => setShowAdd(false)}
          onSave={async fields => { await addProject(fields); setShowAdd(false); }}
        />
      )}
    </div>
  )
}
