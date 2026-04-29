import { useState, useEffect } from 'react'
import api from '../utils/api'
import { avatarColor, getInitials, avatarUrl } from '../utils/helpers'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export default function FriendsPage() {
  const [tab,         setTab]         = useState('friends')
  const [friends,     setFriends]     = useState([])
  const [requests,    setRequests]    = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [error,       setError]       = useState(false)
  const navigate = useNavigate()

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    setError(false)
    try {
      // ✅ একসাথে না করে আলাদাভাবে — একটা fail করলে বাকিগুলো চলবে
      const [f, r, s] = await Promise.allSettled([
        api.get('/friends'),
        api.get('/friends/requests'),
        api.get('/friends/suggestions'),
      ])
      if (f.status === 'fulfilled') setFriends(f.value.data.friends || [])
      if (r.status === 'fulfilled') setRequests(r.value.data.requests || [])
      if (s.status === 'fulfilled') setSuggestions(s.value.data.suggestions || [])
    } catch (e) {
      setError(true)
    } finally {
      setLoading(false)  // ✅ সবসময় loading false হবে
    }
  }

  const accept = async (id) => {
    try {
      await api.post(`/friends/accept/${id}`)
      const req = requests.find(r => r.id === id)
      setRequests(p => p.filter(r => r.id !== id))
      if (req) setFriends(p => [...p, req])
      toast.success('বন্ধুত্ব গ্রহণ হয়েছে!')
    } catch { toast.error('ব্যর্থ হয়েছে') }
  }

  const reject = async (id) => {
    try {
      await api.delete(`/friends/reject/${id}`)
      setRequests(p => p.filter(r => r.id !== id))
    } catch { toast.error('ব্যর্থ হয়েছে') }
  }

  const sendRequest = async (id) => {
    try {
      await api.post(`/friends/request/${id}`)
      setSuggestions(p => p.filter(s => s.id !== id))
      toast.success('রিকোয়েস্ট পাঠানো হয়েছে')
    } catch { toast.error('ব্যর্থ হয়েছে') }
  }

  const Avatar = ({ user, size = 44 }) => (
    <div className="avatar" style={{ width: size, height: size, background: avatarColor(user?.name), fontSize: size * 0.38 }}>
      {user?.avatar ? <img src={avatarUrl(user.avatar)} alt="" /> : getInitials(user?.name)}
    </div>
  )

  const currentList = tab === 'friends' ? friends : tab === 'requests' ? requests : suggestions

  if (loading) return <div className="page-loader"><div className="spinner"></div></div>

  if (error) return (
    <div className="empty-state">
      <div className="empty-state-icon">⚠️</div>
      <div className="empty-state-text">লোড হয়নি</div>
      <button className="btn btn-primary btn-sm" style={{ marginTop: 12 }} onClick={fetchAll}>আবার চেষ্টা করুন</button>
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {[
          ['friends',     `বন্ধুরা (${friends.length})`],
          ['requests',    `রিকোয়েস্ট${requests.length > 0 ? ` (${requests.length})` : ''}`],
          ['suggestions', 'পরিচিতজন'],
        ].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)}
            className={`btn btn-sm ${tab === k ? 'btn-primary' : 'btn-ghost'}`}>
            {l}
          </button>
        ))}
      </div>

      {currentList.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">{tab === 'requests' ? '👋' : '👥'}</div>
          <div className="empty-state-text">
            {tab === 'friends' ? 'এখনো কোনো বন্ধু নেই'
              : tab === 'requests' ? 'কোনো পেন্ডিং রিকোয়েস্ট নেই'
              : 'পরিচিত কেউ নেই'}
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
          {currentList.map(u => (
            <div key={u.id} className="card" style={{ padding: 16, textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                <Avatar user={u} size={56} />
              </div>
              <div style={{ fontWeight: 600, fontSize: 14, cursor: 'pointer', marginBottom: 2 }}
                onClick={() => navigate(`/profile/${u.username}`)}>
                {u.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>@{u.username}</div>

              {tab === 'friends' && (
                <button className="btn btn-ghost btn-sm btn-full"
                  onClick={() => navigate(`/profile/${u.username}`)}>
                  প্রোফাইল দেখুন
                </button>
              )}
              {tab === 'requests' && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => accept(u.id)}>✅ গ্রহণ</button>
                  <button className="btn btn-ghost btn-sm"   style={{ flex: 1 }} onClick={() => reject(u.id)}>✕</button>
                </div>
              )}
              {tab === 'suggestions' && (
                <button className="btn btn-primary btn-sm btn-full" onClick={() => sendRequest(u.id)}>
                  👋 বন্ধু হোন
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
