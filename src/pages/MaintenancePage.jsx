import { useEffect, useState } from 'react'
import api from '../utils/api'
import { useTheme } from '../context/ThemeContext'

export default function MaintenancePage() {
  const [msg, setMsg] = useState('সাইটে মেইনটেন্যান্স চলছে। শীঘ্রই ফিরে আসুন।')
  const { theme, toggleTheme } = useTheme()
  useEffect(() => {
    api.get('/settings/public').then(r => { if (r.data.maintenance_message) setMsg(r.data.maintenance_message) }).catch(() => {})
  }, [])
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 14, textAlign: 'center', padding: 20 }}>
      <button onClick={toggleTheme} style={{ position: 'fixed', top: 16, right: 16, width: 36, height: 36, borderRadius: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 16 }}>{theme === 'dark' ? '☀️' : '🌙'}</button>
      <div style={{ fontSize: 72 }}>🔧</div>
      <h1 style={{ fontFamily: "'Tiro Bangla', serif", fontSize: 28, color: 'var(--accent)' }}>মেইনটেন্যান্স চলছে</h1>
      <p style={{ color: 'var(--text-secondary)', maxWidth: 400, lineHeight: 1.8 }}>{msg}</p>
      <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>— থেতরাই আড্ডাঘর</p>
    </div>
  )
}
