import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    if (form.password !== form.confirm) { toast.error('পাসওয়ার্ড মিলছে না'); return }
    if (form.password.length < 6) { toast.error('পাসওয়ার্ড কমপক্ষে ৬ অক্ষর হতে হবে'); return }
    setLoading(true)
    try {
      await register({ name: form.name, username: form.username, email: form.email, password: form.password })
      toast.success('রেজিস্ট্রেশন সফল!')
      navigate('/')
    } catch (err) {
      const msg = err.response?.data?.message || 'রেজিস্ট্রেশন ব্যর্থ'
      if (err.response?.data?.registration_closed) { toast.error('রেজিস্ট্রেশন এখন বন্ধ আছে'); return }
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const f = (k) => e => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <button onClick={toggleTheme} style={{ position: 'fixed', top: 16, right: 16, width: 36, height: 36, borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 16 }}>
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 54, height: 54, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, margin: '0 auto 10px' }}>আ</div>
          <h1 style={{ fontFamily: "'Tiro Bangla', serif", fontSize: 24, color: 'var(--accent)' }}>থেতরাই আড্ডাঘর</h1>
        </div>

        <div className="card" style={{ padding: 28 }}>
          <h2 style={{ fontSize: 18, marginBottom: 20, fontFamily: 'Hind Siliguri, sans-serif', fontWeight: 600 }}>নতুন অ্যাকাউন্ট</h2>
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>পুরো নাম</label>
                <input className="input" placeholder="আপনার নাম" required value={form.name} onChange={f('name')} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>ইউজারনেম</label>
                <input className="input" placeholder="username" required value={form.username} onChange={f('username')}
                  pattern="[a-zA-Z0-9_]+" title="শুধু অক্ষর, সংখ্যা ও _ ব্যবহার করুন" />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>ইমেইল</label>
              <input className="input" type="email" placeholder="email@example.com" required value={form.email} onChange={f('email')} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>পাসওয়ার্ড</label>
              <input className="input" type="password" placeholder="কমপক্ষে ৬ অক্ষর" required value={form.password} onChange={f('password')} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>পাসওয়ার্ড নিশ্চিত করুন</label>
              <input className="input" type="password" placeholder="পাসওয়ার্ড আবার দিন" required value={form.confirm} onChange={f('confirm')} />
            </div>
            <button className="btn btn-primary btn-full" type="submit" disabled={loading} style={{ marginTop: 4 }}>
              {loading ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span> : 'রেজিস্ট্রেশন করুন'}
            </button>
          </form>
          <p style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: 'var(--text-muted)' }}>
            অ্যাকাউন্ট আছে? <Link to="/login" style={{ color: 'var(--accent)' }}>লগইন করুন</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
