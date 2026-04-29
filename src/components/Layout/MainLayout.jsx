import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { avatarUrl, avatarColor, getInitials } from '../../utils/helpers'
import NotifBell from '../Common/NotifBell'
import styles from './MainLayout.module.css'
import MobileNav from './MobileNav'

export default function MainLayout() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)
  const menuRef = useRef()

  useEffect(() => {
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const doLogout = () => { logout(); navigate('/login') }

  const navItems = [
    { to: '/', icon: '🏠', label: 'নিউজফিড', exact: true },
    { to: `/profile/${user?.username}`, icon: '👤', label: 'প্রোফাইল' },
    { to: '/friends', icon: '👥', label: 'বন্ধুরা' },
    { to: '/chat', icon: '💬', label: 'চ্যাট' },
    { to: '/notifications', icon: '🔔', label: 'নোটিফিকেশন' },
  ]

  // Sidebar এ location অথবা bio দেখাবে — hardcoded নয়
  const sidebarSubtitle = user?.location || user?.bio || '@' + user?.username

  return (
    <div className={styles.appShell}>
      {/* NAVBAR */}
      <nav className={styles.navbar}>
        <button className={styles.hamburger} onClick={() => setMobileNav(v => !v)}>☰</button>
        <NavLink to="/" className={styles.logo}>
          <span className={styles.logoDot}></span>
          থেতরাই আড্ডাঘর
        </NavLink>

        <div className={styles.navSearch}>
          <input className="input" placeholder="🔍  খুঁজুন..." style={{ padding: '7px 12px', fontSize: '13px' }} />
        </div>

        <div className={styles.navRight}>
          <NotifBell />
          <button className={styles.themeBtn} onClick={toggleTheme} title="থিম পরিবর্তন">
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          <div className={styles.avatarWrap} ref={menuRef}>
            <div className={styles.navAvatar} onClick={() => setMenuOpen(v => !v)}
              style={{ background: avatarColor(user?.name) }}>
              {user?.avatar
                ? <img src={avatarUrl(user.avatar)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : getInitials(user?.name)}
            </div>
            {menuOpen && (
              <div className="dropdown" style={{ right: 0, top: '44px', minWidth: '180px' }}>
                <button className="dropdown-item" onClick={() => { navigate(`/profile/${user?.username}`); setMenuOpen(false) }}>
                  👤 প্রোফাইল
                </button>
                <button className="dropdown-item" onClick={() => { navigate('/settings'); setMenuOpen(false) }}>
                  ⚙️ সেটিংস
                </button>
                {user?.role === 'admin' && (
                  <button className="dropdown-item" onClick={() => { navigate('/admin'); setMenuOpen(false) }}>
                    🛡️ অ্যাডমিন প্যানেল
                  </button>
                )}
                <hr className="divider" style={{ margin: '4px 0' }} />
                <button className="dropdown-item danger" onClick={doLogout}>🚪 লগআউট</button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <div className={styles.body}>
        {/* LEFT SIDEBAR */}
        <aside className={`${styles.sidebar} ${mobileNav ? styles.sidebarOpen : ''}`}>
          <div className={styles.profileMini}>
            <div className={styles.profileCover} />
            <div className={styles.profileMiniAv} style={{ background: avatarColor(user?.name) }}>
              {user?.avatar
                ? <img src={avatarUrl(user.avatar)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : getInitials(user?.name)}
            </div>
            <div className={styles.profileMiniBody}>
              <div className={styles.profileMiniName}>{user?.name}</div>
              {/* ✅ user এর actual location/bio দেখাবে */}
              <div className={styles.profileMiniBio}>{sidebarSubtitle}</div>
            </div>
          </div>

          <nav className={styles.sideNav}>
            {navItems.map(item => (
              <NavLink key={item.to} to={item.to} end={item.exact}
                className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                onClick={() => setMobileNav(false)}>
                <span className={styles.navIcon}>{item.icon}</span>
                {item.label}
              </NavLink>
            ))}
            {user?.role === 'admin' && (
              <NavLink to="/admin"
                className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                onClick={() => setMobileNav(false)}>
                <span className={styles.navIcon}>🛡️</span>
                অ্যাডমিন প্যানেল
              </NavLink>
            )}
            <button className={`${styles.navItem} ${styles.navLogout}`} onClick={doLogout}>
              <span className={styles.navIcon}>🚪</span>
              লগআউট
            </button>
          </nav>
        </aside>
        {mobileNav && <div className={styles.overlay} onClick={() => setMobileNav(false)} />}

        {/* MAIN CONTENT */}
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
      {/* ✅ মোবাইল bottom navbar */}
      <MobileNav />
    </div>
  )
}
