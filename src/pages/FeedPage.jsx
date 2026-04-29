import { useState, useEffect, useCallback } from 'react'
import CreatePost from '../components/Feed/CreatePost'
import PostCard from '../components/Feed/PostCard'
import api from '../utils/api'
import toast from 'react-hot-toast'

export default function FeedPage() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [onlineUsers, setOnlineUsers] = useState([])
  const [stats, setStats] = useState({})

  const fetchPosts = useCallback(async (reset = false) => {
    const p = reset ? 1 : page
    if (!reset) setLoadingMore(true)
    try {
      const res = await api.get(`/posts?tab=${tab}&page=${p}&limit=10`)
      const newPosts = res.data.posts
      if (reset) { setPosts(newPosts); setPage(2) }
      else { setPosts(prev => [...prev, ...newPosts]); setPage(p + 1) }
      setHasMore(newPosts.length === 10)
    } catch {} finally { setLoading(false); setLoadingMore(false) }
  }, [tab, page])

  useEffect(() => {
    setLoading(true)
    setPosts([])
    setPage(1)
    setHasMore(true)
    const doFetch = async () => {
      try {
        const res = await api.get(`/posts?tab=${tab}&page=1&limit=10`)
        setPosts(res.data.posts)
        setPage(2)
        setHasMore(res.data.posts.length === 10)
      } catch {} finally { setLoading(false) }
    }
    doFetch()
    fetchSidebar()
  }, [tab])

  const fetchSidebar = async () => {
    // ✅ allSettled — একটা fail করলেও বাকিটা চলবে
    const [s, o] = await Promise.allSettled([
      api.get('/stats'),
      api.get('/users/online'),
    ])
    if (s.status === 'fulfilled') setStats(s.value.data || {})
    if (o.status === 'fulfilled') setOnlineUsers(o.value.data.users || [])
  }

  const onPostCreated = (post) => setPosts(prev => [post, ...prev])
  const onPostDeleted = (id) => setPosts(prev => prev.filter(p => p.id !== id))

  return (
    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
      {/* FEED */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <CreatePost onCreated={onPostCreated} />

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
          {[{ k: 'all', l: 'সবার পোস্ট' }, { k: 'friends', l: 'বন্ধুদের পোস্ট' }].map(t => (
            <button key={t.k} onClick={() => setTab(t.k)}
              className={`btn btn-sm ${tab === t.k ? 'btn-primary' : 'btn-ghost'}`}>{t.l}</button>
          ))}
        </div>

        {loading
          ? <div className="page-loader"><div className="spinner"></div></div>
          : posts.length === 0
            ? <div className="empty-state"><div className="empty-state-icon">📝</div><div className="empty-state-text">এখনো কোনো পোস্ট নেই</div></div>
            : <>
              {posts.map(p => <PostCard key={p.id} post={p} onDelete={onPostDeleted} />)}
              {hasMore && (
                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                  <button className="btn btn-ghost" onClick={() => fetchPosts(false)} disabled={loadingMore}>
                    {loadingMore ? <span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }}></span> : 'আরো পোস্ট দেখুন'}
                  </button>
                </div>
              )}
            </>
        }
      </div>

      {/* RIGHT WIDGETS */}
      <div className="hide-tablet" style={{ width: 240, flexShrink: 0 }}>
        {onlineUsers.length > 0 && (
          <div className="card" style={{ padding: 14, marginBottom: 12 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>এখন অনলাইন</div>
            {onlineUsers.slice(0, 6).map(u => (
              <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div className="avatar" style={{ width: 30, height: 30, background: `var(--accent)`, fontSize: 12 }}>
                  {u.avatar ? <img src={`/api/uploads/avatars/${u.avatar}`} alt="" /> : u.name?.charAt(0)}
                </div>
                <span style={{ fontSize: 13, flex: 1 }}>{u.name}</span>
                <div className="online-dot"></div>
              </div>
            ))}
          </div>
        )}

        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 10 }}>আড্ডার হিসাব</div>
          {[
            { l: 'মোট সদস্য', v: stats.total_users || 0, c: 'var(--accent)' },
            { l: 'আজকের পোস্ট', v: stats.today_posts || 0, c: 'var(--accent)' },
            { l: 'এখন অনলাইন', v: stats.online_count || 0, c: 'var(--green)' },
          ].map(s => (
            <div key={s.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 8 }}>
              <span style={{ color: 'var(--text-secondary)' }}>{s.l}</span>
              <span style={{ fontWeight: 700, color: s.c }}>{s.v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
