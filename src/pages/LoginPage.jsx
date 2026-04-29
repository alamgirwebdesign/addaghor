import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import toast from 'react-hot-toast'
import api from '../utils/api'

export default function LoginPage() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [maintenance, setMaintenance] = useState(false)
  const { login } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      toast.success(`স্বাগতম, ${user.name}!`)
      navigate('/')
    } catch (err) {
      const msg = err.response?.data?.message || 'লগইন ব্যর্থ হয়েছে'
      if (err.response?.data?.maintenance) { navigate('/maintenance'); return }
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <button onClick={toggleTheme} style={{ position: 'fixed', top: 16, right: 16, width: 36, height: 36, borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 16 }}>
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 12px' }}>আ</div>
          <h1 style={{ fontFamily: "'Tiro Bangla', serif", fontSize: 26, color: 'var(--accent)', marginBottom: 4 }}>থেতরাই আড্ডাঘর</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>আমাদের নিজস্ব আড্ডার জায়গা</p>
        </div>

        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 18, marginBottom: 20, fontFamily: 'Hind Siliguri, sans-serif', fontWeight: 600 }}>লগইন করুন</h2>
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 5 }}>ইমেইল</label>
              <input className="input" type="email" placeholder="আপনার ইমেইল" required
                value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 5 }}>পাসওয়ার্ড</label>
              <input className="input" type="password" placeholder="পাসওয়ার্ড" required
                value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} />
            </div>
            <button className="btn btn-primary btn-full" type="submit" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span> : 'লগইন'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: 16, fontSize: 13, color: 'var(--text-muted)' }}>
            অ্যাকাউন্ট নেই? <Link to="/register" style={{ color: 'var(--accent)' }}>রেজিস্ট্রেশন করুন</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
