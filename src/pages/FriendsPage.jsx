// FriendsPage.jsx
import { useState, useEffect } from 'react'
import api from '../utils/api'
import { avatarColor, getInitials, avatarUrl, timeAgo } from '../utils/helpers'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

export function FriendsPage() {
  const [tab, setTab] = useState('friends')
  const [friends, setFriends] = useState([])
  const [requests, setRequests] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get('/friends'),
      api.get('/friends/requests'),
      api.get('/friends/suggestions'),
    ]).then(([f, r, s]) => {
      setFriends(f.data.friends)
      setRequests(r.data.requests)
      setSuggestions(s.data.suggestions)
    }).finally(() => setLoading(false))
  }, [])

  const accept = async (id) => {
    await api.post(`/friends/accept/${id}`)
    const req = requests.find(r => r.id === id)
    setRequests(p => p.filter(r => r.id !== id))
    if (req) setFriends(p => [...p, req])
  }

  const reject = async (id) => { await api.delete(`/friends/reject/${id}`); setRequests(p => p.filter(r => r.id !== id)) }

  const sendRequest = async (id) => {
    await api.post(`/friends/request/${id}`)
    setSuggestions(p => p.filter(s => s.id !== id))
    toast.success('রিকোয়েস্ট পাঠানো হয়েছে')
  }

  const Avatar = ({ user, size = 44 }) => (
    <div className="avatar" style={{ width: size, height: size, background: avatarColor(user?.name), fontSize: size * 0.38 }}>
      {user?.avatar ? <img src={avatarUrl(user.avatar)} alt="" /> : getInitials(user?.name)}
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {[['friends', `বন্ধুরা (${friends.length})`], ['requests', `রিকোয়েস্ট ${requests.length > 0 ? `(${requests.length})` : ''}`], ['suggestions', 'পরিচিতজন']].map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`btn btn-sm ${tab === k ? 'btn-primary' : 'btn-ghost'}`}>{l}</button>
        ))}
      </div>

      {loading ? <div className="page-loader"><div className="spinner"></div></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
          {(tab === 'friends' ? friends : tab === 'requests' ? requests : suggestions).map(u => (
            <div key={u.id} className="card" style={{ padding: 16, textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                <Avatar user={u} size={56} />
              </div>
              <div style={{ fontWeight: 600, fontSize: 14, cursor: 'pointer' }} onClick={() => navigate(`/profile/${u.username}`)}>{u.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10 }}>@{u.username}</div>
              {tab === 'friends' && <button className="btn btn-ghost btn-sm btn-full" onClick={() => navigate(`/profile/${u.username}`)}>প্রোফাইল দেখুন</button>}
              {tab === 'requests' && (
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => accept(u.id)}>✅ গ্রহণ</button>
                  <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => reject(u.id)}>✕</button>
                </div>
              )}
              {tab === 'suggestions' && <button className="btn btn-primary btn-sm btn-full" onClick={() => sendRequest(u.id)}>👋 বন্ধু হোন</button>}
            </div>
          ))}
          {(tab === 'friends' ? friends : tab === 'requests' ? requests : suggestions).length === 0 && (
            <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
              <div className="empty-state-icon">{tab === 'requests' ? '👋' : '👥'}</div>
              <div className="empty-state-text">{tab === 'requests' ? 'কোনো পেন্ডিং রিকোয়েস্ট নেই' : 'কেউ নেই'}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
export default FriendsPage
