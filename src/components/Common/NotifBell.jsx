import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../utils/api'
import { timeAgo } from '../../utils/helpers'

export default function NotifBell() {
  const [count, setCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    fetchCount()
    const t = setInterval(fetchCount, 3000)
    return () => clearInterval(t)
  }, [])

  const fetchCount = async () => {
    try {
      const res = await api.get('/notifications/count')
      setCount(res.data.count)
    } catch {}
  }

  const fetchNotifs = async () => {
    try {
      const res = await api.get('/notifications?limit=8')
      setNotifs(res.data.notifications)
    } catch {}
  }

  const handleOpen = async () => {
    if (!open) { await fetchNotifs(); await api.post('/notifications/read-all'); setCount(0) }
    setOpen(v => !v)
  }

  const iconMap = { like: '❤️', comment: '💬', friend_request: '👥', friend_accept: '✅', mention: '@', share: '↗' }

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={handleOpen} style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--bg-hover)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        🔔
        {count > 0 && (
          <span style={{ position: 'absolute', top: 4, right: 4, width: 16, height: 16, background: 'var(--accent)', color: 'white', borderRadius: '50%', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 199 }} />
          <div className="dropdown" style={{ right: 0, top: 44, width: 300, zIndex: 200 }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 600 }}>নোটিফিকেশন</div>
            {notifs.length === 0
              ? <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>কোনো নোটিফিকেশন নেই</div>
              : notifs.map(n => (
                <button key={n.id} className="dropdown-item" style={{ display: 'flex', gap: 8, padding: '10px 14px', alignItems: 'flex-start' }}
                  onClick={() => { setOpen(false); if (n.link) navigate(n.link) }}>
                  <span style={{ fontSize: 16 }}>{iconMap[n.type] || '🔔'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.4 }}>{n.message}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{timeAgo(n.created_at)}</div>
                  </div>
                </button>
              ))}
            <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border)' }}>
              <button onClick={() => { setOpen(false); navigate('/notifications') }} style={{ fontSize: 13, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>সব দেখুন →</button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
