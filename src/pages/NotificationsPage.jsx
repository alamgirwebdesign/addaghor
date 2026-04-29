import { useState, useEffect } from 'react'
import api from '../utils/api'
import { timeAgo } from '../utils/helpers'
import { useNavigate } from 'react-router-dom'

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const iconMap = { like: '❤️', comment: '💬', friend_request: '👥', friend_accept: '✅', mention: '📣', share: '↗' }

  useEffect(() => {
    api.get('/notifications?limit=50').then(r => setNotifs(r.data.notifications)).finally(() => setLoading(false))
    api.post('/notifications/read-all')
  }, [])

  return (
    <div>
      <h2 style={{ fontFamily: 'Hind Siliguri, sans-serif', fontWeight: 600, marginBottom: 14, fontSize: 18 }}>🔔 নোটিফিকেশন</h2>
      {loading ? <div className="page-loader"><div className="spinner"></div></div>
        : notifs.length === 0 ? <div className="empty-state"><div className="empty-state-icon">🔔</div><div className="empty-state-text">কোনো নোটিফিকেশন নেই</div></div>
          : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {notifs.map(n => (
                <div key={n.id} className="card" style={{ padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'center', cursor: n.link ? 'pointer' : 'default', opacity: n.is_read ? 0.7 : 1 }}
                  onClick={() => n.link && navigate(n.link)}>
                  <span style={{ fontSize: 20 }}>{iconMap[n.type] || '🔔'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14 }}>{n.message}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{timeAgo(n.created_at)}</div>
                  </div>
                  {!n.is_read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0 }}></div>}
                </div>
              ))}
            </div>
          )}
    </div>
  )
}
