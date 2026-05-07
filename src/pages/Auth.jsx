import { useState } from 'react'
import { signIn, signUp } from '../lib/supabase'

export default function Auth() {
  const [mode, setMode]       = useState('signin')
  const [email, setEmail]     = useState('')
  const [pass, setPass]       = useState('')
  const [busy, setBusy]       = useState(false)
  const [banner, setBanner]   = useState(null) // { type: 'success'|'error', msg }

  async function submit(e) {
    e.preventDefault()
    if (!email || !pass) return setBanner({ type: 'error', msg: 'Please fill in all fields.' })
    setBusy(true); setBanner(null)
    try {
      if (mode === 'signup') {
        const { error } = await signUp(email, pass)
        if (error) throw error
        setBanner({ type: 'success', msg: 'Account created! Check your email to confirm, then sign in.' })
        setMode('signin')
      } else {
        const { error } = await signIn(email, pass)
        if (error) throw error
        // AuthContext will detect session change and App will redirect
      }
    } catch (err) {
      setBanner({ type: 'error', msg: err.message })
    } finally {
      setBusy(false)
    }
  }

  function toggle() {
    setMode(m => m === 'signin' ? 'signup' : 'signin')
    setBanner(null)
  }

  return (
    <div className="auth-shell">
      <div className="auth-box">
        <div className="auth-logo">
          <div className="logo-mark" style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 16 }}>π</div>
          <div className="logo-name" style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.4px' }}>Pi<span>Life</span></div>
        </div>

        <div className="auth-heading">{mode === 'signin' ? 'Welcome back' : 'Create account'}</div>
        <div className="auth-sub">{mode === 'signin' ? 'Sign in to your PiLife account.' : 'Start tracking your time across projects.'}</div>

        {banner && <div className={`auth-banner ${banner.type}`}>{banner.msg}</div>}

        <form onSubmit={submit}>
          <div className="field" style={{ marginBottom: 12 }}>
            <div className="field-label">Email</div>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoFocus />
          </div>
          <div className="field" style={{ marginBottom: 22 }}>
            <div className="field-label">Password</div>
            <input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder={mode === 'signup' ? 'Min. 6 characters' : '••••••••'} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '10px' }} disabled={busy}>
            {busy ? <><span className="spin" /> {mode === 'signin' ? 'Signing in…' : 'Creating account…'}</> : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <div className="auth-toggle">
          {mode === 'signin'
            ? <>Don't have an account? <a onClick={toggle}>Sign up</a></>
            : <>Already have an account? <a onClick={toggle}>Sign in</a></>}
        </div>
      </div>
    </div>
  )
}
