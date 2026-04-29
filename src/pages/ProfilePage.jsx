import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { avatarColor, getInitials, avatarUrl, coverUrl } from '../utils/helpers'
import PostCard from '../components/Feed/PostCard'
import api from '../utils/api'
import toast from 'react-hot-toast'

export default function ProfilePage() {
  const { username } = useParams()
  const { user: me, updateUser } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [dmLoading, setDmLoading] = useState(false)
  const isMe = profile?.username === me?.username

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get(`/users/${username}`),
      api.get(`/users/${username}/posts`)
    ]).then(([p, po]) => {
      setProfile(p.data.user)
      setPosts(po.data.posts)
    }).catch(() => toast.error('প্রোফাইল পাওয়া যায়নি'))
      .finally(() => setLoading(false))
  }, [username])

  // ✅ Direct Message — existing room খুঁজবে, না থাকলে নতুন বানাবে
  const openDM = async () => {
    setDmLoading(true)
    try {
      // existing rooms check করো
      const roomsRes = await api.get('/chat/rooms')
      const existing = roomsRes.data.rooms.find(
        r => r.type === 'direct' && r.name === profile.name
      )
      if (existing) {
        navigate(`/chat/${existing.id}`)
        return
      }
      // নতুন direct room তৈরি করো
      const res = await api.post('/chat/rooms', {
        name: profile.name,
        type: 'direct',
        member_ids: [profile.id]
      })
      navigate(`/chat/${res.data.room.id}`)
    } catch {
      toast.error('চ্যাট শুরু করা যায়নি')
    } finally {
      setDmLoading(false)
    }
  }

  const sendFriendRequest = async () => {
    try {
      await api.post(`/friends/request/${profile.id}`)
      setProfile(p => ({ ...p, friendship_status: 'pending' }))
      toast.success('ফ্রেন্ড রিকোয়েস্ট পাঠানো হয়েছে')
    } catch {}
  }

  const acceptRequest = async () => {
    try {
      await api.post(`/friends/accept/${profile.id}`)
      setProfile(p => ({ ...p, friendship_status: 'friends' }))
      toast.success('বন্ধুত্ব গ্রহণ হয়েছে!')
    } catch {}
  }

  const unfriend = async () => {
    if (!confirm('বন্ধুতা শেষ করবেন?')) return
    try {
      await api.delete(`/friends/${profile.id}`)
      setProfile(p => ({ ...p, friendship_status: null }))
    } catch {}
  }

  if (loading) return <div className="page-loader"><div className="spinner"></div></div>
  if (!profile) return (
    <div className="empty-state">
      <div className="empty-state-icon">👤</div>
      <div className="empty-state-text">প্রোফাইল পাওয়া যায়নি</div>
    </div>
  )

  return (
    <div>
      {/* COVER + PROFILE CARD */}
      <div style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 0 }}>
        <div style={{
          height: 200,
          background: profile.cover
            ? `url(/api/uploads/covers/${profile.cover}) center/cover`
            : 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)',
          position: 'relative'
        }}>
          {isMe && <UploadCoverBtn onUploaded={(url) => { setProfile(p => ({ ...p, cover: url })); updateUser({ cover: url }) }} />}
        </div>

        <div className="card" style={{ borderTopLeftRadius: 0, borderTopRightRadius: 0, padding: '0 20px 20px', borderTop: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginTop: -44, flexWrap: 'wrap' }}>
            {/* AVATAR */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div className="avatar" style={{ width: 88, height: 88, background: avatarColor(profile.name), fontSize: 32, border: '4px solid var(--bg-card)' }}>
                {profile.avatar
                  ? <img src={avatarUrl(profile.avatar)} alt="" />
                  : getInitials(profile.name)}
              </div>
              {isMe && <UploadAvatarBtn onUploaded={(url) => { setProfile(p => ({ ...p, avatar: url })); updateUser({ avatar: url }) }} />}
            </div>

            {/* NAME + BIO */}
            <div style={{ flex: 1, minWidth: 160, paddingBottom: 4, paddingTop: 48 }}>
              <h1 style={{ fontFamily: 'Hind Siliguri, sans-serif', fontWeight: 700, fontSize: 22 }}>{profile.name}</h1>
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>@{profile.username}</div>
              {profile.bio && <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>{profile.bio}</p>}
              {profile.location && (
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>📍 {profile.location}</div>
              )}
            </div>

            {/* ✅ ACTION BUTTONS */}
            <div style={{ paddingTop: 48, flexShrink: 0, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {isMe ? (
                <button className="btn btn-ghost btn-sm" onClick={() => setEditOpen(true)}>
                  ✏️ প্রোফাইল সম্পাদনা
                </button>
              ) : (
                <>
                  {/* ✅ মেসেজ বাটন — সবসময় দেখাবে */}
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={openDM}
                    disabled={dmLoading}
                    style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                  >
                    {dmLoading
                      ? <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }}></span>
                      : '💬'} মেসেজ
                  </button>

                  {/* বন্ধু বাটন */}
                  {profile.friendship_status === 'friends' ? (
                    <button className="btn btn-ghost btn-sm" onClick={unfriend}>👥 বন্ধু ✓</button>
                  ) : profile.friendship_status === 'pending' ? (
                    <button className="btn btn-ghost btn-sm" disabled>⏳ রিকোয়েস্ট পাঠানো</button>
                  ) : profile.friendship_status === 'received' ? (
                    <button className="btn btn-primary btn-sm" onClick={acceptRequest}>✅ গ্রহণ করুন</button>
                  ) : (
                    <button className="btn btn-ghost btn-sm" onClick={sendFriendRequest}>👋 বন্ধু হোন</button>
                  )}
                </>
              )}
            </div>
          </div>

          {/* STATS */}
          <div style={{ display: 'flex', gap: 24, marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 14 }}>
            {[['পোস্ট', profile.posts_count], ['বন্ধু', profile.friends_count], ['লাইক', profile.total_likes]].map(([l, v]) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>{v || 0}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* POSTS */}
      <div style={{ marginTop: 14 }}>
        <h3 style={{ fontFamily: 'Hind Siliguri, sans-serif', fontWeight: 600, marginBottom: 12, fontSize: 16 }}>
          পোস্টসমূহ
        </h3>
        {posts.length === 0
          ? <div className="empty-state"><div className="empty-state-icon">📝</div><div className="empty-state-text">কোনো পোস্ট নেই</div></div>
          : posts.map(p => (
            <PostCard key={p.id} post={p} onDelete={(id) => setPosts(prev => prev.filter(x => x.id !== id))} />
          ))
        }
      </div>

      {editOpen && (
        <EditProfileModal
          user={profile}
          onClose={() => setEditOpen(false)}
          onSaved={(u) => {
            setProfile(p => ({ ...p, ...u }))
            updateUser(u)
          }}
        />
      )}
    </div>
  )
}

/* ─── UPLOAD AVATAR ─────────────────────────────── */
function UploadAvatarBtn({ onUploaded }) {
  const ref = useRef()
  const upload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const fd = new FormData()
    fd.append('avatar', file)
    try {
      const res = await api.post('/users/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      onUploaded(res.data.avatar)
      toast.success('প্রোফাইল ছবি আপডেট হয়েছে')
    } catch { toast.error('আপলোড ব্যর্থ') }
  }
  return (
    <>
      <button
        onClick={() => ref.current.click()}
        style={{ position: 'absolute', bottom: 2, right: 2, width: 26, height: 26, borderRadius: '50%', background: 'var(--accent)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >📷</button>
      <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={upload} />
    </>
  )
}

/* ─── UPLOAD COVER ──────────────────────────────── */
function UploadCoverBtn({ onUploaded }) {
  const ref = useRef()
  const upload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    const fd = new FormData()
    fd.append('cover', file)
    try {
      const res = await api.post('/users/cover', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      onUploaded(res.data.cover)
      toast.success('কভার ফটো আপডেট হয়েছে')
    } catch { toast.error('আপলোড ব্যর্থ') }
  }
  return (
    <>
      <button
        onClick={() => ref.current.click()}
        style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.55)', color: 'white', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13, backdropFilter: 'blur(4px)' }}
      >📷 কভার পরিবর্তন</button>
      <input ref={ref} type="file" accept="image/*" style={{ display: 'none' }} onChange={upload} />
    </>
  )
}

/* ─── EDIT PROFILE MODAL ────────────────────────── */
function EditProfileModal({ user, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: user.name || '',
    bio: user.bio || '',
    location: user.location || ''
  })
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.put('/users/profile', form)
      onSaved(res.data.user)
      toast.success('প্রোফাইল আপডেট হয়েছে')
      onClose()
    } catch { toast.error('আপডেট ব্যর্থ') }
    finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-title">প্রোফাইল সম্পাদনা</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 5 }}>পুরো নাম</label>
              <input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="আপনার নাম" required />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 5 }}>বায়ো</label>
              <textarea className="textarea" value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} placeholder="নিজের সম্পর্কে কিছু লিখুন..." rows={3} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 5 }}>লোকেশন</label>
              <input className="input" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="যেমন: থেতরাই, শরীয়তপুর" />
            </div>
            <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
              {loading ? 'সংরক্ষণ হচ্ছে...' : '💾 সংরক্ষণ করুন'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
