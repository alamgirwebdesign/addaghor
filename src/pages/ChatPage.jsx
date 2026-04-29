import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Pusher from 'pusher-js'
import { useAuth } from '../context/AuthContext'
import { avatarColor, getInitials, avatarUrl, timeAgo } from '../utils/helpers'
import api from '../utils/api'
import toast from 'react-hot-toast'

const PUSHER_KEY     = import.meta.env.VITE_PUSHER_KEY     || ''
const PUSHER_CLUSTER = import.meta.env.VITE_PUSHER_CLUSTER || 'ap2'

function Avatar({ user, size = 36 }) {
  return (
    <div className="avatar" style={{ width: size, height: size, background: avatarColor(user?.name), fontSize: size * 0.38, flexShrink: 0 }}>
      {user?.avatar ? <img src={avatarUrl(user.avatar)} alt="" /> : getInitials(user?.name)}
    </div>
  )
}

export default function ChatPage() {
  const { id: roomId } = useParams()
  const { user }       = useAuth()
  const navigate       = useNavigate()

  const [rooms,        setRooms]        = useState([])
  const [messages,     setMessages]     = useState([])
  const [text,         setText]         = useState('')
  const [loadingRooms, setLoadingRooms] = useState(true)
  const [loadingMsgs,  setLoadingMsgs]  = useState(false)
  const [sending,      setSending]      = useState(false)
  const [showNewGroup, setShowNewGroup] = useState(false)
  const [connected,    setConnected]    = useState(false)
  const [roomMenu,     setRoomMenu]     = useState(false)

  const messagesEnd  = useRef()
  const pusherRef    = useRef(null)
  const channelRef   = useRef(null)
  const userRef      = useRef(user)
  const roomIdRef    = useRef(roomId)  // ✅ latest roomId ref

  useEffect(() => { userRef.current  = user   }, [user])
  useEffect(() => { roomIdRef.current = roomId }, [roomId])

  const isMobile    = window.innerWidth < 700
  const showRoomList= !isMobile || !roomId
  const showChat    = !isMobile || !!roomId
  const currentRoom = rooms.find(r => r.id == roomId)

  /* ── Message handler (stable ref) ──────────────── */
  const onNewMessage = useCallback((data) => {
    const incoming = data.message
    const me = userRef.current
    setMessages(prev => {
      if (incoming.user_id === me?.id) {
        if (prev.some(m => m.id === incoming.id && !m._temp)) return prev
        const hasTmp = prev.some(m => m._temp && m.content === incoming.content)
        if (hasTmp) return prev.map(m => (m._temp && m.content === incoming.content) ? incoming : m)
        return prev
      }
      if (prev.some(m => m.id === incoming.id)) return prev
      return [...prev, incoming]
    })
    setTimeout(() => messagesEnd.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }, [])

  /* ── Subscribe helper ───────────────────────────── */
  const subscribeToRoom = useCallback((rid) => {
    if (!pusherRef.current || !rid) return
    // পুরোনো channel unsubscribe
    if (channelRef.current) {
      pusherRef.current.unsubscribe(channelRef.current.name)
      channelRef.current = null
    }
    const ch = pusherRef.current.subscribe(`chat-room-${rid}`)
    ch.bind('new-message', onNewMessage)
    channelRef.current = ch
  }, [onNewMessage])

  /* ── Pusher init — connected হলে তারপর subscribe ── */
  useEffect(() => {
    if (!PUSHER_KEY) return

    const pusher = new Pusher(PUSHER_KEY, { cluster: PUSHER_CLUSTER, forceTLS: true })
    pusherRef.current = pusher

    pusher.connection.bind('connected', () => {
      setConnected(true)
      // ✅ connected হওয়ার পরে subscribe করো
      if (roomIdRef.current) subscribeToRoom(roomIdRef.current)
    })
    pusher.connection.bind('disconnected', () => setConnected(false))
    pusher.connection.bind('unavailable',  () => setConnected(false))

    return () => {
      channelRef.current?.unbind_all()
      pusher.disconnect()
    }
  }, [subscribeToRoom])

  /* ── Room change ────────────────────────────────── */
  useEffect(() => {
    if (!roomId) return
    // Pusher already connected হলে সাথে সাথে subscribe
    if (pusherRef.current?.connection.state === 'connected') {
      subscribeToRoom(roomId)
    }
    // (নয়তো connected event এ subscribe হবে)
    fetchMessages()
    api.post(`/chat/rooms/${roomId}/read`).catch(() => {})
    setRoomMenu(false)
  }, [roomId, subscribeToRoom])

  /* ── Auto scroll ────────────────────────────────── */
  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  /* ── Fetch ──────────────────────────────────────── */
  useEffect(() => { fetchRooms() }, [])

  const fetchRooms = async () => {
    setLoadingRooms(true)
    try { const r = await api.get('/chat/rooms'); setRooms(r.data.rooms) }
    catch {} finally { setLoadingRooms(false) }
  }

  const fetchMessages = async () => {
    if (!roomId) return
    setLoadingMsgs(true)
    try { const r = await api.get(`/chat/rooms/${roomId}/messages`); setMessages(r.data.messages) }
    catch {} finally { setLoadingMsgs(false) }
  }

  /* ── Send ───────────────────────────────────────── */
  const sendMessage = async (e) => {
    e.preventDefault()
    const content = text.trim()
    if (!content || !roomId || sending) return
    setText('')
    setSending(true)
    const tempMsg = {
      id: `tmp_${Date.now()}`, content, room_id: parseInt(roomId),
      user_id: user.id, is_read: false, _temp: true,
      created_at: new Date().toISOString(),
      user: { id: user.id, name: user.name, username: user.username, avatar: user.avatar },
    }
    setMessages(prev => [...prev, tempMsg])
    try {
      await api.post(`/chat/rooms/${roomId}/messages`, { content })
    } catch {
      setMessages(prev => prev.filter(m => !m._temp))
      setText(content)
      toast.error('মেসেজ পাঠানো যায়নি')
    } finally { setSending(false) }
  }

  /* ── Delete room ────────────────────────────────── */
  const deleteRoom = async () => {
    const isCreator = currentRoom?.type === 'group' && currentRoom?.created_by == user?.id
    if (!confirm(isCreator ? 'গ্রুপটি সম্পূর্ণ ডিলিট হবে?' : 'চ্যাট ডিলিট করবেন?')) return
    try {
      await api.delete(`/chat/rooms/${roomId}`)
      setRooms(prev => prev.filter(r => r.id != roomId))
      navigate('/chat')
      toast.success('ডিলিট হয়েছে')
    } catch { toast.error('ডিলিট ব্যর্থ') }
    setRoomMenu(false)
  }

  const handleRoomClick = (id) => {
    navigate(`/chat/${id}`)
    setRooms(prev => prev.map(r => r.id == id ? { ...r, unread: 0 } : r))
  }

  /* ══════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════ */
  return (
    <div style={{
      display: 'flex',
      height: isMobile ? 'calc(100dvh - 56px)' : 'calc(100vh - 80px)',
      border: '1px solid var(--border)',
      borderRadius: isMobile ? 0 : 14,
      overflow: 'hidden',
      background: 'var(--bg-card)',
      margin: isMobile ? '-16px -12px' : 0,
    }}>

      {/* ══ ROOM LIST ══ */}
      {showRoomList && (
        <div style={{ width: isMobile ? '100%' : 260, borderRight: isMobile ? 'none' : '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--bg-card)', flexShrink: 0 }}>
          <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 700, fontSize: 16 }}>💬 চ্যাট</span>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: connected ? 'var(--green)' : 'var(--red)', display: 'inline-block' }} />
            </div>
            <button className="btn btn-primary btn-sm" onClick={() => setShowNewGroup(true)}>+ গ্রুপ</button>
          </div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {loadingRooms
              ? <div className="page-loader" style={{ minHeight: 120 }}><div className="spinner"></div></div>
              : rooms.length === 0
                ? <div style={{ textAlign: 'center', padding: '32px 16px', color: 'var(--text-muted)', fontSize: 13 }}>
                    <div style={{ fontSize: 36, marginBottom: 8 }}>💬</div>
                    কোনো চ্যাট নেই<br />
                    <span style={{ fontSize: 12 }}>বন্ধুর প্রোফাইলে গিয়ে মেসেজ করুন</span>
                  </div>
                : rooms.map(room => (
                  <div key={room.id} onClick={() => handleRoomClick(room.id)}
                    style={{ display: 'flex', gap: 10, padding: '11px 14px', cursor: 'pointer', background: room.id == roomId ? 'var(--accent-bg)' : 'transparent', borderLeft: room.id == roomId ? '3px solid var(--accent)' : '3px solid transparent', transition: 'background 0.15s' }}>
                    <div className="avatar" style={{ width: 42, height: 42, background: avatarColor(room.name), fontSize: 16, flexShrink: 0 }}>
                      {room.type === 'group' ? '👥' : (room.avatar ? <img src={avatarUrl(room.avatar)} alt="" /> : getInitials(room.name))}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, fontSize: 14, color: room.id == roomId ? 'var(--accent)' : 'var(--text-primary)' }}>{room.name}</span>
                        {room.unread > 0 && (
                          <span style={{ background: 'var(--accent)', color: 'white', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>
                            {room.unread > 9 ? '9+' : room.unread}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>
                        {room.last_message || 'মেসেজ নেই'}
                      </div>
                    </div>
                  </div>
                ))
            }
          </div>
        </div>
      )}

      {/* ══ CHAT AREA ══ */}
      {showChat && roomId && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg-primary)' }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-card)' }}>
            {isMobile && (
              <button onClick={() => navigate('/chat')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-secondary)', padding: '0 4px' }}>←</button>
            )}
            <div className="avatar" style={{ width: 34, height: 34, background: avatarColor(currentRoom?.name), fontSize: 13 }}>
              {currentRoom?.type === 'group' ? '👥' : (currentRoom?.avatar ? <img src={avatarUrl(currentRoom.avatar)} alt="" /> : getInitials(currentRoom?.name))}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{currentRoom?.name}</div>
              <div style={{ fontSize: 11, color: connected ? 'var(--green)' : 'var(--text-muted)' }}>
                {connected ? '● অনলাইন' : '● সংযোগ হচ্ছে...'}
              </div>
            </div>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <button onClick={() => setRoomMenu(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: 'var(--text-muted)', padding: '0 6px', lineHeight: 1 }}>⋯</button>
              {roomMenu && (
                <>
                  <div onClick={() => setRoomMenu(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
                  <div className="dropdown" style={{ right: 0, top: 36, zIndex: 100, minWidth: 180 }}>
                    <button className="dropdown-item danger" onClick={deleteRoom}>
                      🗑️ {currentRoom?.type === 'group' && currentRoom?.created_by == user?.id ? 'গ্রুপ ডিলিট করুন' : 'চ্যাট ডিলিট করুন'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {loadingMsgs
              ? <div className="page-loader"><div className="spinner"></div></div>
              : messages.length === 0
                ? <div className="empty-state" style={{ padding: '32px 0' }}><div className="empty-state-icon">👋</div><div className="empty-state-text">কথা শুরু করুন!</div></div>
                : messages.map((m, i) => {
                    const isMe   = m.user_id === user?.id
                    const prev   = messages[i - 1]
                    const showAv = !isMe && (!prev || prev.user_id !== m.user_id)
                    return (
                      <div key={m.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', gap: 6, alignItems: 'flex-end', marginBottom: 2 }}>
                        {!isMe && <div style={{ width: 28, flexShrink: 0 }}>{showAv && <Avatar user={m.user} size={28} />}</div>}
                        <div style={{ maxWidth: '70%' }}>
                          {showAv && !isMe && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2, paddingLeft: 4 }}>{m.user?.name}</div>}
                          <div style={{ background: isMe ? 'var(--accent)' : 'var(--bg-card)', color: isMe ? 'white' : 'var(--text-primary)', padding: '9px 13px', borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px', fontSize: 14, lineHeight: 1.5, wordBreak: 'break-word', border: isMe ? 'none' : '1px solid var(--border)', opacity: m._temp ? 0.6 : 1 }}>
                            {m.content}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, textAlign: isMe ? 'right' : 'left', display: 'flex', gap: 4, justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                            <span>{timeAgo(m.created_at)}</span>
                            {isMe && <span style={{ color: m.is_read ? 'var(--blue)' : 'var(--text-muted)' }}>{m.is_read ? '✓✓' : '✓'}</span>}
                            {m._temp && <span>⏳</span>}
                          </div>
                        </div>
                      </div>
                    )
                  })
            }
            <div ref={messagesEnd} />
          </div>

          <form onSubmit={sendMessage} style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, background: 'var(--bg-card)' }}>
            <input className="input" value={text} onChange={e => setText(e.target.value)} placeholder="মেসেজ লিখুন..." style={{ flex: 1, borderRadius: 20, padding: '8px 14px' }} autoComplete="off" />
            <button className="btn btn-primary" type="submit" disabled={!text.trim() || sending} style={{ borderRadius: '50%', width: 40, height: 40, padding: 0, flexShrink: 0, fontSize: 18 }}>
              {sending ? '⏳' : '➤'}
            </button>
          </form>
        </div>
      )}

      {showChat && !roomId && !isMobile && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', gap: 12 }}>
          <span style={{ fontSize: 52 }}>💬</span>
          <p style={{ fontSize: 15 }}>একটি চ্যাট সিলেক্ট করুন</p>
        </div>
      )}

      {showNewGroup && (
        <NewGroupModal
          onClose={() => setShowNewGroup(false)}
          onCreated={(room) => { setRooms(p => [room, ...p]); navigate(`/chat/${room.id}`); setShowNewGroup(false) }}
        />
      )}
    </div>
  )
}

function NewGroupModal({ onClose, onCreated }) {
  const [name, setName] = useState('')
  const [users, setUsers] = useState([])
  const [selected, setSelected] = useState([])
  const [loading, setLoading] = useState(false)
  useEffect(() => { api.get('/users/friends').then(r => setUsers(r.data.friends)).catch(() => {}) }, [])
  const submit = async (e) => {
    e.preventDefault()
    if (!name.trim() || !selected.length) { toast.error('নাম দিন এবং কমপক্ষে ১ জন যোগ করুন'); return }
    setLoading(true)
    try { const r = await api.post('/chat/rooms', { name, type: 'group', member_ids: selected }); onCreated(r.data.room); toast.success('গ্রুপ তৈরি হয়েছে!') }
    catch { toast.error('ব্যর্থ') } finally { setLoading(false) }
  }
  const toggle = (id) => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header"><span className="modal-title">নতুন গ্রুপ চ্যাট</span><button className="modal-close" onClick={onClose}>×</button></div>
        <div className="modal-body">
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div><label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 5 }}>গ্রুপের নাম</label><input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="গ্রুপ নাম" required /></div>
            <div>
              <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8 }}>সদস্য ({selected.length} জন)</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 220, overflowY: 'auto' }}>
                {users.map(u => (
                  <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '8px 10px', borderRadius: 8, background: selected.includes(u.id) ? 'var(--accent-bg)' : 'transparent', border: `1px solid ${selected.includes(u.id) ? 'var(--accent-border)' : 'transparent'}` }}>
                    <input type="checkbox" checked={selected.includes(u.id)} onChange={() => toggle(u.id)} style={{ accentColor: 'var(--accent)' }} />
                    <div className="avatar" style={{ width: 30, height: 30, background: avatarColor(u.name), fontSize: 12 }}>{getInitials(u.name)}</div>
                    <span style={{ fontSize: 14 }}>{u.name}</span>
                  </label>
                ))}
              </div>
            </div>
            <button className="btn btn-primary btn-full" type="submit" disabled={loading}>{loading ? 'তৈরি হচ্ছে...' : '✅ গ্রুপ তৈরি করুন'}</button>
          </form>
        </div>
      </div>
    </div>
  )
}
