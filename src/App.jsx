import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import Layout from './components/Layout'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Timebox from './pages/Timebox'
import Goals from './pages/Goals'
import Categories from './pages/Categories'
import ProjectDetail from './pages/ProjectDetail'

function Private({ children }) {
  const { user } = useAuth()
  if (user === undefined) return <div className="page-spin"><span className="spin" /> Loading…</div>
  if (!user) return <Navigate to="/auth" replace />
  return <DataProvider>{children}</DataProvider>
}

function PublicOnly({ children }) {
  const { user } = useAuth()
  if (user === undefined) return <div className="page-spin"><span className="spin" /> Loading…</div>
  if (user) return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/auth" element={<PublicOnly><Auth /></PublicOnly>} />
      <Route path="/" element={<Private><Layout /></Private>}>
        <Route index               element={<Dashboard />} />
        <Route path="timebox"      element={<Timebox />} />
        <Route path="goals"        element={<Goals />} />
        <Route path="categories"   element={<Categories />} />
        <Route path="projects/:id" element={<ProjectDetail />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
