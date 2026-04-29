import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../utils/api'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { user, logout } = useAuth()
  const [tab, setTab] = useState('account')
  const [form, setForm] = useState({ current_password: '', new_password: '', confirm_password: '' })
  const [loading, setLoading] = useState(false)

  const changePassword = async (e) => {
    e.preventDefault()
    if (form.new_password !== form.confirm_password) { toast.error('নতুন পাসওয়ার্ড মিলছে না'); return }
    setLoading(true)
    try {
      await api.post('/users/change-password', { current_password: form.current_password, new_password: form.new_password })
      toast.success('পাসওয়ার্ড পরিবর্তন হয়েছে')
      setForm({ current_password: '', new_password: '', confirm_password: '' })
    } catch (e) { toast.error(e.response?.data?.message || 'ব্যর্থ হয়েছে') }
    finally { setLoading(false) }
  }

  const deleteAccount = async () => {
    const confirmed = prompt('নিশ্চিত করতে "DELETE" লিখুন')
    if (confirmed !== 'DELETE') return
    try {
      await api.delete('/users/account')
      logout()
    } catch { toast.error('ব্যর্থ হয়েছে') }
  }

  return (
    <div>
      <h2 style={{ fontFamily: 'Hind Siliguri, sans-serif', fontWeight: 600, marginBottom: 16, fontSize: 18 }}>⚙️ সেটিংস</h2>
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        {[['account', 'অ্যাকাউন্ট'], ['security', 'নিরাপত্তা']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`btn btn-sm ${tab === k ? 'btn-primary' : 'btn-ghost'}`}>{l}</button>
        ))}
      </div>

      {tab === 'account' && (
        <div className="card" style={{ padding: 20, maxWidth: 480 }}>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>নাম: <strong>{user?.name}</strong></p>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 6 }}>ইমেইল: <strong>{user?.email}</strong></p>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 6 }}>ইউজারনেম: <strong>@{user?.username}</strong></p>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 6 }}>ভূমিকা: <strong>{user?.role}</strong></p>
          <hr className="divider" style={{ margin: '16px 0' }} />
          <div style={{ padding: '12px 14px', background: 'var(--red-bg)', borderRadius: 10, border: '1px solid rgba(220,38,38,0.2)' }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--red)', marginBottom: 6 }}>⚠️ বিপজ্জনক এলাকা</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>অ্যাকাউন্ট ডিলিট করলে সব ডেটা মুছে যাবে।</div>
            <button className="btn btn-danger btn-sm" onClick={deleteAccount}>অ্যাকাউন্ট ডিলিট করুন</button>
          </div>
        </div>
      )}

      {tab === 'security' && (
        <div className="card" style={{ padding: 20, maxWidth: 480 }}>
          <h3 style={{ fontFamily: 'Hind Siliguri, sans-serif', fontWeight: 600, marginBottom: 16 }}>পাসওয়ার্ড পরিবর্তন</h3>
          <form onSubmit={changePassword} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[['current_password', 'বর্তমান পাসওয়ার্ড'], ['new_password', 'নতুন পাসওয়ার্ড'], ['confirm_password', 'নতুন পাসওয়ার্ড নিশ্চিত']].map(([k, l]) => (
              <div key={k}>
                <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>{l}</label>
                <input className="input" type="password" value={form[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} required />
              </div>
            ))}
            <button className="btn btn-primary" type="submit" disabled={loading}>{loading ? 'পরিবর্তন হচ্ছে...' : 'পাসওয়ার্ড পরিবর্তন করুন'}</button>
          </form>
        </div>
      )}
    </div>
  )
}
