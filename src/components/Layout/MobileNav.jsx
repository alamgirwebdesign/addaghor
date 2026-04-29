import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useState, useEffect } from 'react'
import api from '../../utils/api'

export default function MobileNav() {
  const { user } = useAuth()
  const [unreadChat,  setUnreadChat]  = useState(0)
  const [unreadNotif, setUnreadNotif] = useState(0)

  useEffect(() => {
    fetchCounts()
    const t = setInterval(fetchCounts, 3000)
    return () => clearInterval(t)
  }, [])

  const fetchCounts = async () => {
    try {
      const [n, rooms] = await Promise.all([
        api.get('/notifications/count'),
        api.get('/chat/rooms'),
      ])
      setUnreadNotif(n.data.count || 0)
      const totalUnread = (rooms.data.rooms || []).reduce((s, r) => s + (parseInt(r.unread) || 0), 0)
      setUnreadChat(totalUnread)
    } catch {}
  }

  const items = [
    { to: '/',            icon: '🏠', label: 'ফিড',       exact: true },
    { to: '/friends',     icon: '👥', label: 'বন্ধু' },
    { to: '/chat',        icon: '💬', label: 'চ্যাট',      badge: unreadChat },
    { to: '/notifications',icon: '🔔',label: 'নোটিফিকেশন', badge: unreadNotif },
    { to: `/profile/${user?.username}`, icon: null, label: 'প্রোফাইল', isProfile: true },
  ]

  return (
    <nav style={{
      display: 'none',
      position: 'fixed',
      bottom: 0, left: 0, right: 0,
      height: 58,
      background: 'var(--navbar-bg)',
      borderTop: '1px solid var(--navbar-border)',
      zIndex: 200,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }} className="mobile-bottom-nav">
      {items.map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.exact}
          style={({ isActive }) => ({
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            textDecoration: 'none',
            color: isActive ? 'var(--accent)' : 'var(--text-muted)',
            position: 'relative',
            padding: '6px 0',
            transition: 'color 0.15s',
          })}
        >
          {/* Profile avatar বা icon */}
          {item.isProfile ? (
            <div style={{
              width: 26, height: 26, borderRadius: '50%',
              background: 'var(--accent)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: 'white',
            }}>
              {user?.name?.charAt(0) || '?'}
            </div>
          ) : (
            <span style={{ fontSize: 20, lineHeight: 1 }}>{item.icon}</span>
          )}

          {/* Badge */}
          {item.badge > 0 && (
            <span style={{
              position: 'absolute', top: 4, left: '50%', transform: 'translateX(4px)',
              background: 'var(--accent)', color: 'white',
              borderRadius: '50%', width: 16, height: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, fontWeight: 700,
              border: '1.5px solid var(--navbar-bg)',
            }}>
              {item.badge > 9 ? '9+' : item.badge}
            </span>
          )}

          <span style={{ fontSize: 10, fontFamily: 'Hind Siliguri, sans-serif' }}>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
