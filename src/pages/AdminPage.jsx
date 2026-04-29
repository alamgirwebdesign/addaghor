import { useState, useEffect } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { timeAgo } from '../utils/helpers'

const tabs = [
  { k: 'dashboard', l: '📊 ড্যাশবোর্ড' },
  { k: 'users', l: '👥 ইউজার' },
  { k: 'posts', l: '📝 পোস্ট' },
  { k: 'reports', l: '🚩 রিপোর্ট' },
  { k: 'settings', l: '⚙️ সেটিংস' },
]

export default function AdminPage() {
  const [tab, setTab] = useState('dashboard')

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <span style={{ fontSize: 22 }}>🛡️</span>
        <h1 style={{ fontFamily: 'Hind Siliguri, sans-serif', fontWeight: 700, fontSize: 22 }}>অ্যাডমিন প্যানেল</h1>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button key={t.k} onClick={() => setTab(t.k)} className={`btn btn-sm ${tab === t.k ? 'btn-primary' : 'btn-ghost'}`}>{t.l}</button>
        ))}
      </div>

      {tab === 'dashboard' && <AdminDashboard />}
      {tab === 'users' && <AdminUsers />}
      {tab === 'posts' && <AdminPosts />}
      {tab === 'reports' && <AdminReports />}
      {tab === 'settings' && <AdminSettings />}
    </div>
  )
}

function AdminDashboard() {
  const [stats, setStats] = useState(null)
  useEffect(() => { api.get('/admin/stats').then(r => setStats(r.data)).catch(() => {}) }, [])
  if (!stats) return <div className="page-loader"><div className="spinner"></div></div>
  const cards = [
    { l: 'মোট ইউজার', v: stats.total_users, icon: '👤', c: '#3b82f6' },
    { l: 'মোট পোস্ট', v: stats.total_posts, icon: '📝', c: '#22c55e' },
    { l: 'আজকের পোস্ট', v: stats.today_posts, icon: '📅', c: '#f97316' },
    { l: 'মোট মেসেজ', v: stats.total_messages, icon: '💬', c: '#8b5cf6' },
    { l: 'ব্যান হওয়া', v: stats.banned_users, icon: '🚫', c: '#ef4444' },
    { l: 'পেন্ডিং রিপোর্ট', v: stats.pending_reports, icon: '🚩', c: '#f59e0b' },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
      {cards.map(c => (
        <div key={c.l} className="card" style={{ padding: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 28, marginBottom: 6 }}>{c.icon}</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: c.c }}>{c.v || 0}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{c.l}</div>
        </div>
      ))}
    </div>
  )
}

function AdminUsers() {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.get(`/admin/users?search=${search}`).then(r => setUsers(r.data.users)).finally(() => setLoading(false))
  }, [search])

  const banUser = async (id, ban) => {
    try {
      await api.post(`/admin/users/${id}/${ban ? 'ban' : 'unban'}`)
      setUsers(p => p.map(u => u.id === id ? { ...u, is_banned: ban } : u))
      toast.success(ban ? 'ইউজার ব্যান হয়েছে' : 'ব্যান তুলে নেওয়া হয়েছে')
    } catch { toast.error('ব্যর্থ হয়েছে') }
  }

  const changeRole = async (id, role) => {
    try {
      await api.post(`/admin/users/${id}/role`, { role })
      setUsers(p => p.map(u => u.id === id ? { ...u, role } : u))
      toast.success('রোল পরিবর্তন হয়েছে')
    } catch {}
  }

  return (
    <div>
      <input className="input" placeholder="🔍 ইউজার খুঁজুন..." value={search} onChange={e => setSearch(e.target.value)} style={{ marginBottom: 14 }} />
      {loading ? <div className="page-loader"><div className="spinner"></div></div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {users.map(u => (
            <div key={u.id} className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>@{u.username}</span></div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{u.email} · যোগ দিয়েছেন {timeAgo(u.created_at)}</div>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <span className={`badge ${u.is_banned ? 'badge-red' : 'badge-green'}`}>{u.is_banned ? 'ব্যান' : 'সক্রিয়'}</span>
                <span className="badge badge-blue">{u.role}</span>
                <select value={u.role} onChange={e => changeRole(u.id, e.target.value)} className="input" style={{ padding: '4px 8px', fontSize: 12, width: 'auto' }}>
                  <option value="user">user</option>
                  <option value="moderator">moderator</option>
                  <option value="admin">admin</option>
                </select>
                <button className={`btn btn-sm ${u.is_banned ? 'btn-secondary' : 'btn-danger'}`} onClick={() => banUser(u.id, !u.is_banned)}>
                  {u.is_banned ? '✅ আনব্যান' : '🚫 ব্যান'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function AdminPosts() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { api.get('/admin/posts').then(r => setPosts(r.data.posts)).finally(() => setLoading(false)) }, [])
  const del = async (id) => {
    if (!confirm('পোস্ট ডিলিট করবেন?')) return
    try { await api.delete(`/admin/posts/${id}`); setPosts(p => p.filter(x => x.id !== id)); toast.success('ডিলিট হয়েছে') } catch {}
  }
  return loading ? <div className="page-loader"><div className="spinner"></div></div> : (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {posts.map(p => (
        <div key={p.id} className="card" style={{ padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{p.user?.name}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.content || '[ছবি পোস্ট]'}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{timeAgo(p.created_at)} · ❤️ {p.likes_count} · 💬 {p.comments_count}</div>
          </div>
          <button className="btn btn-danger btn-sm" onClick={() => del(p.id)}>🗑️ ডিলিট</button>
        </div>
      ))}
    </div>
  )
}

function AdminReports() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  useEffect(() => { api.get('/admin/reports').then(r => setReports(r.data.reports)).finally(() => setLoading(false)) }, [])
  const resolve = async (id) => {
    try { await api.post(`/admin/reports/${id}/resolve`); setReports(p => p.filter(r => r.id !== id)); toast.success('রিজলভ হয়েছে') } catch {}
  }
  return loading ? <div className="page-loader"><div className="spinner"></div></div> : reports.length === 0 ? (
    <div className="empty-state"><div className="empty-state-icon">✅</div><div className="empty-state-text">কোনো রিপোর্ট নেই</div></div>
  ) : (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {reports.map(r => (
        <div key={r.id} className="card" style={{ padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>🚩 {r.reporter?.name} → {r.post?.user?.name} এর পোস্ট</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{r.reason}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>পোস্ট: "{r.post?.content?.slice(0, 60)}..."</div>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => resolve(r.id)}>✅ রিজলভ</button>
        </div>
      ))}
    </div>
  )
}

function AdminSettings() {
  const [settings, setSettings] = useState({ maintenance_mode: false, registration_open: true, site_name: 'থেতরাই আড্ডাঘর', maintenance_message: 'সাইটে মেইনটেন্যান্স চলছে। শীঘ্রই ফিরে আসুন।' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => { api.get('/admin/settings').then(r => setSettings(s => ({ ...s, ...r.data }))).finally(() => setLoading(false)) }, [])

  const save = async () => {
    setSaving(true)
    try { await api.post('/admin/settings', settings); toast.success('সেটিংস সংরক্ষিত হয়েছে') }
    catch { toast.error('সংরক্ষণ ব্যর্থ') } finally { setSaving(false) }
  }

  if (loading) return <div className="page-loader"><div className="spinner"></div></div>

  return (
    <div className="card" style={{ padding: 20, maxWidth: 540 }}>
      <h3 style={{ fontFamily: 'Hind Siliguri, sans-serif', fontWeight: 600, marginBottom: 20 }}>সাইট সেটিংস</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 5 }}>সাইটের নাম</label>
          <input className="input" value={settings.site_name} onChange={e => setSettings(p => ({ ...p, site_name: e.target.value }))} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--bg-hover)', borderRadius: 10 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>🔧 মেইনটেন্যান্স মোড</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>চালু করলে লগইন পেজ বাদে সব বন্ধ হবে</div>
          </div>
          <label style={{ cursor: 'pointer', position: 'relative', display: 'inline-block', width: 44, height: 24 }}>
            <input type="checkbox" checked={settings.maintenance_mode} onChange={e => setSettings(p => ({ ...p, maintenance_mode: e.target.checked }))} style={{ opacity: 0, width: 0, height: 0 }} />
            <span style={{ position: 'absolute', inset: 0, background: settings.maintenance_mode ? 'var(--accent)' : 'var(--border-strong)', borderRadius: 99, transition: '0.2s', cursor: 'pointer' }}>
              <span style={{ position: 'absolute', height: 18, width: 18, bottom: 3, left: settings.maintenance_mode ? 23 : 3, background: 'white', borderRadius: '50%', transition: '0.2s' }}></span>
            </span>
          </label>
        </div>

        {settings.maintenance_mode && (
          <div>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 5 }}>মেইনটেন্যান্স বার্তা</label>
            <textarea className="textarea" value={settings.maintenance_message} onChange={e => setSettings(p => ({ ...p, maintenance_message: e.target.value }))} rows={2} />
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: 'var(--bg-hover)', borderRadius: 10 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>📝 রেজিস্ট্রেশন</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>নতুন অ্যাকাউন্ট তৈরি করা যাবে কিনা</div>
          </div>
          <label style={{ cursor: 'pointer', position: 'relative', display: 'inline-block', width: 44, height: 24 }}>
            <input type="checkbox" checked={settings.registration_open} onChange={e => setSettings(p => ({ ...p, registration_open: e.target.checked }))} style={{ opacity: 0, width: 0, height: 0 }} />
            <span style={{ position: 'absolute', inset: 0, background: settings.registration_open ? 'var(--green)' : 'var(--border-strong)', borderRadius: 99, transition: '0.2s', cursor: 'pointer' }}>
              <span style={{ position: 'absolute', height: 18, width: 18, bottom: 3, left: settings.registration_open ? 23 : 3, background: 'white', borderRadius: '50%', transition: '0.2s' }}></span>
            </span>
          </label>
        </div>

        <button className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? 'সংরক্ষণ হচ্ছে...' : '💾 সংরক্ষণ করুন'}
        </button>
      </div>
    </div>
  )
}
