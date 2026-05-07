import { useMemo, useEffect, useRef } from 'react'
import { Chart, ArcElement, DoughnutController, BarController, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js'
import { useData } from '../context/DataContext'
import { today, weekDays, fmtHours, fmtDayShort } from '../lib/dates'

Chart.register(ArcElement, DoughnutController, BarController, CategoryScale, LinearScale, BarElement, Tooltip)

function pillProps(pct) {
  if (pct >= 100) return ['pill-green', 'on track']
  if (pct >= 60)  return ['pill-amber', 'partial']
  return ['pill-red', 'behind']
}

export default function Dashboard() {
  const { projects, logs, loading, weekLogs } = useData()
  const pieRef = useRef(), barRef = useRef()
  const pieChart = useRef(), barChart = useRef()
  const TODAY = today()
  const days = useMemo(() => weekDays(TODAY), [TODAY])
  const wl = useMemo(() => weekLogs(), [logs])

  const todayLogs = useMemo(() => logs.filter(l => l.logged_date === TODAY), [logs, TODAY])
  const todayH    = todayLogs.reduce((a, l) => a + l.duration_hrs, 0)
  const weekH     = wl.reduce((a, l) => a + l.duration_hrs, 0)

  const byProj = useMemo(() =>
    projects.map(p => ({
      ...p,
      h: +wl.filter(l => l.project_id === p.id).reduce((a, l) => a + l.duration_hrs, 0).toFixed(2)
    })).sort((a, b) => b.h - a.h),
    [projects, wl]
  )

  const onTrack = projects.filter(p => {
    const h = wl.filter(l => l.project_id === p.id).reduce((a, l) => a + l.duration_hrs, 0)
    return h >= p.goal_hrs * 0.6
  }).length

  // Pie chart
  useEffect(() => {
    if (!pieRef.current || loading) return
    pieChart.current?.destroy()
    const data = byProj.filter(p => p.h > 0)
    if (!data.length) return
    const total = data.reduce((a, p) => a + p.h, 0)
    pieChart.current = new Chart(pieRef.current, {
      type: 'doughnut',
      data: {
        labels: data.map(p => p.name),
        datasets: [{ data: data.map(p => p.h), backgroundColor: data.map(p => p.color), borderWidth: 2, borderColor: '#fff', hoverOffset: 4 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, cutout: '63%',
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${fmtHours(ctx.raw)} · ${Math.round(ctx.raw / total * 100)}%` } } }
      }
    })
    return () => pieChart.current?.destroy()
  }, [byProj, loading])

  // Bar chart
  useEffect(() => {
    if (!barRef.current || loading) return
    barChart.current?.destroy()
    const vals = days.map(d => +logs.filter(l => l.logged_date === d).reduce((a, l) => a + l.duration_hrs, 0).toFixed(2))
    barChart.current = new Chart(barRef.current, {
      type: 'bar',
      data: {
        labels: days.map(d => fmtDayShort(d)),
        datasets: [{ data: vals, backgroundColor: days.map(d => d === TODAY ? 'var(--brand)' : 'var(--bg4)'), borderRadius: 4, borderSkipped: false }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false }, ticks: { color: 'var(--text3)', font: { family: 'JetBrains Mono', size: 11 } } },
          y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' }, ticks: { color: 'var(--text3)', font: { family: 'JetBrains Mono', size: 11 }, callback: v => v + 'h' } }
        }
      }
    })
    return () => barChart.current?.destroy()
  }, [logs, days, loading])

  if (loading) return <div className="page-spin"><span className="spin" /> Loading…</div>

  return (
    <>
      {/* Tiles */}
      <div className="tiles">
        <div className="tile">
          <div className="tile-label">Today</div>
          <div className="tile-value">{fmtHours(todayH)}</div>
          <div className="tile-sub">{todayLogs.length} {todayLogs.length === 1 ? 'entry' : 'entries'}</div>
        </div>
        <div className="tile">
          <div className="tile-label">This week</div>
          <div className="tile-value">{fmtHours(weekH)}</div>
          <div className="tile-sub">{wl.length} entries</div>
        </div>
        <div className="tile">
          <div className="tile-label">Top project</div>
          <div className="tile-value md">{byProj[0]?.name || '—'}</div>
          <div className="tile-sub">{fmtHours(byProj[0]?.h || 0)} this week</div>
        </div>
        <div className="tile">
          <div className="tile-label">Goals on track</div>
          <div className="tile-value">{onTrack}<span style={{ fontSize: 17, color: 'var(--text3)' }}> / {projects.length}</span></div>
          <div className="tile-sub">{projects.length ? Math.round(onTrack / projects.length * 100) : 0}% hit rate</div>
        </div>
      </div>

      {/* Charts */}
      <div className="chart-grid">
        <div className="card">
          <div className="card-title">This week — by project</div>
          <div style={{ position: 'relative', height: 200 }}>
            <canvas ref={pieRef} />
          </div>
          <div className="legend">
            {byProj.filter(p => p.h > 0).map(p => {
              const total = byProj.reduce((a, x) => a + x.h, 0)
              return (
                <div key={p.id} className="legend-item">
                  <span className="legend-sq" style={{ background: p.color }} />
                  {p.name} {total ? Math.round(p.h / total * 100) : 0}%
                </div>
              )
            })}
          </div>
        </div>
        <div className="card">
          <div className="card-title">Daily hours — this week</div>
          <div style={{ position: 'relative', height: 200 }}>
            <canvas ref={barRef} />
          </div>
        </div>
      </div>

      {/* Goal progress */}
      <div className="card">
        <div className="card-title">Goal progress — this week</div>
        {projects.length === 0
          ? <div className="empty">No projects yet — add one from the sidebar.</div>
          : projects.map(p => {
              const h = +wl.filter(l => l.project_id === p.id).reduce((a, l) => a + l.duration_hrs, 0).toFixed(2)
              const pct = Math.min(100, Math.round(h / p.goal_hrs * 100))
              const [pc, pt] = pillProps(pct)
              return (
                <div key={p.id} className="prog">
                  <div className="prog-row">
                    <div className="prog-name">
                      <span className="nav-dot" style={{ background: p.color }} /> {p.name}
                    </div>
                    <div className="prog-meta">
                      <span>{fmtHours(h)} / {p.goal_hrs}h</span>
                      <span className="prog-pct" style={{ color: p.color }}>{pct}%</span>
                      <span className={`pill ${pc}`}>{pt}</span>
                    </div>
                  </div>
                  <div className="track"><div className="fill" style={{ width: pct + '%', background: p.color }} /></div>
                </div>
              )
            })
        }
      </div>
    </>
  )
}
