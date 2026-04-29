import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { avatarColor, getInitials, avatarUrl, postImageUrl, timeAgo } from '../../utils/helpers'
import api from '../../utils/api'
import toast from 'react-hot-toast'

function Avatar({ user, size = 38 }) {
  return (
    <div className="avatar" style={{ width: size, height: size, background: avatarColor(user?.name), fontSize: size * 0.37, flexShrink: 0 }}>
      {user?.avatar ? <img src={avatarUrl(user.avatar)} alt="" /> : getInitials(user?.name)}
    </div>
  )
}

function Comment({ comment, postId, onDelete, depth = 0 }) {
  const { user } = useAuth()
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [replies, setReplies] = useState(comment.replies || [])
  const [liked, setLiked] = useState(comment.is_liked)
  const [likeCount, setLikeCount] = useState(comment.likes_count || 0)
  const [submitting, setSubmitting] = useState(false)

  const likeComment = async () => {
    try {
      await api.post(`/comments/${comment.id}/like`)
      setLiked(p => !p)
      setLikeCount(p => liked ? p - 1 : p + 1)
    } catch {}
  }

  const submitReply = async (e) => {
    e.preventDefault()
    if (!replyText.trim()) return
    setSubmitting(true)
    try {
      const res = await api.post(`/posts/${postId}/comments`, { content: replyText, parent_id: comment.id })
      setReplies(p => [...p, res.data.comment])
      setReplyText('')
      setReplyOpen(false)
    } catch { toast.error('রিপ্লাই পোস্ট ব্যর্থ') }
    finally { setSubmitting(false) }
  }

  const canDelete = user?.id === comment.user?.id || user?.role === 'admin' || user?.role === 'moderator'

  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
      <Avatar user={comment.user} size={depth > 0 ? 26 : 30} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ background: 'var(--bg-hover)', borderRadius: '0 10px 10px 10px', padding: '8px 12px', border: depth > 0 ? '1px solid var(--accent-border)' : 'none' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{comment.user?.name}</div>
          <div style={{ fontSize: 14, color: 'var(--text-primary)', marginTop: 2, lineHeight: 1.5 }}>{comment.content}</div>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 4, paddingLeft: 4 }}>
          <button onClick={likeComment} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: liked ? 'var(--accent)' : 'var(--text-muted)', padding: 0 }}>
            ❤️ {likeCount > 0 ? likeCount : 'লাইক'}
          </button>
          {depth === 0 && (
            <button onClick={() => setReplyOpen(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)', padding: 0 }}>
              ↩ রিপ্লাই
            </button>
          )}
          {canDelete && (
            <button onClick={() => onDelete(comment.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--red)', padding: 0 }}>
              🗑️
            </button>
          )}
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{timeAgo(comment.created_at)}</span>
        </div>

        {replyOpen && (
          <form onSubmit={submitReply} style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <input className="input" value={replyText} onChange={e => setReplyText(e.target.value)}
              placeholder="রিপ্লাই লিখুন..." style={{ fontSize: 13, padding: '6px 10px' }} />
            <button className="btn btn-primary btn-sm" type="submit" disabled={submitting}>পাঠান</button>
          </form>
        )}

        {replies.length > 0 && (
          <div style={{ marginTop: 8, paddingLeft: 8, borderLeft: '2px solid var(--accent-border)' }}>
            {replies.map(r => (
              <Comment key={r.id} comment={r} postId={postId} onDelete={onDelete} depth={1} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function PostCard({ post, onDelete }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [liked, setLiked] = useState(post.is_liked)
  const [likeCount, setLikeCount] = useState(post.likes_count || 0)
  const [comments, setComments] = useState(post.comments || [])
  const [commentText, setCommentText] = useState('')
  const [showComments, setShowComments] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [loadingComments, setLoadingComments] = useState(false)

  const toggleLike = async () => {
    try {
      await api.post(`/posts/${post.id}/like`)
      setLiked(p => !p)
      setLikeCount(p => liked ? p - 1 : p + 1)
    } catch {}
  }

  const loadComments = async () => {
    if (showComments) { setShowComments(false); return }
    setLoadingComments(true)
    try {
      const res = await api.get(`/posts/${post.id}/comments`)
      setComments(res.data.comments)
      setShowComments(true)
    } catch {} finally { setLoadingComments(false) }
  }

  const submitComment = async (e) => {
    e.preventDefault()
    if (!commentText.trim()) return
    setSubmitting(true)
    try {
      const res = await api.post(`/posts/${post.id}/comments`, { content: commentText })
      setComments(p => [...p, res.data.comment])
      setCommentText('')
      if (!showComments) setShowComments(true)
    } catch { toast.error('মন্তব্য পোস্ট ব্যর্থ') }
    finally { setSubmitting(false) }
  }

  const deleteComment = async (cid) => {
    try {
      await api.delete(`/comments/${cid}`)
      setComments(p => p.filter(c => c.id !== cid && (!c.replies || !c.replies.find(r => r.id === cid))))
    } catch {}
  }

  const deletePost = async () => {
    if (!confirm('পোস্টটি ডিলিট করবেন?')) return
    try {
      await api.delete(`/posts/${post.id}`)
      toast.success('পোস্ট ডিলিট হয়েছে')
      onDelete?.(post.id)
    } catch { toast.error('ডিলিট ব্যর্থ') }
  }

  const reportPost = async () => {
    try {
      await api.post(`/posts/${post.id}/report`)
      toast.success('রিপোর্ট করা হয়েছে')
    } catch {}
    setMenuOpen(false)
  }

  const canDelete = user?.id === post.user?.id || user?.role === 'admin' || user?.role === 'moderator'

  return (
    <div className="card" style={{ marginBottom: 14, padding: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ cursor: 'pointer' }} onClick={() => navigate(`/profile/${post.user?.username}`)}>
          <Avatar user={post.user} size={40} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 14, cursor: 'pointer', color: 'var(--text-primary)' }}
            onClick={() => navigate(`/profile/${post.user?.username}`)}>
            {post.user?.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {timeAgo(post.created_at)} · {post.privacy === 'public' ? '🌍' : '👥'}
          </div>
        </div>
        <div style={{ position: 'relative' }}>
          <button onClick={() => setMenuOpen(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--text-muted)', padding: '0 4px' }}>⋯</button>
          {menuOpen && (
            <>
              <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 99 }} />
              <div className="dropdown" style={{ right: 0, top: 30, zIndex: 100 }}>
                {canDelete && <button className="dropdown-item danger" onClick={() => { deletePost(); setMenuOpen(false) }}>🗑️ ডিলিট</button>}
                <button className="dropdown-item" onClick={reportPost}>🚩 রিপোর্ট</button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {post.content && <p style={{ fontSize: 15, lineHeight: 1.7, marginBottom: post.image ? 12 : 0, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{post.content}</p>}

      {post.image && (
        <div style={{ margin: '10px -16px', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', overflow: 'hidden', cursor: 'pointer' }}
          onClick={() => navigate(`/post/${post.id}`)}>
          <img src={postImageUrl(post.image)} alt="" style={{ width: '100%', maxHeight: 480, objectFit: 'cover', display: 'block' }} />
        </div>
      )}

      {/* Stats */}
      {(likeCount > 0 || post.comments_count > 0) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: 13, color: 'var(--text-muted)' }}>
          {likeCount > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ background: 'var(--accent)', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>❤️</span>{likeCount}</span>}
          {post.comments_count > 0 && <span style={{ cursor: 'pointer' }} onClick={loadComments}>{post.comments_count}টি মন্তব্য</span>}
        </div>
      )}

      <hr className="divider" />

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 4 }}>
        {[
          { icon: liked ? '❤️' : '🤍', label: 'লাইক', action: toggleLike, active: liked },
          { icon: '💬', label: 'মন্তব্য', action: loadComments },
          { icon: '↗', label: 'শেয়ার', action: () => {} },
        ].map(btn => (
          <button key={btn.label} onClick={btn.action}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '8px', borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 13, color: btn.active ? 'var(--accent)' : 'var(--text-secondary)', fontFamily: 'Hind Siliguri, sans-serif', transition: 'background 0.15s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            {btn.icon} {btn.label}
          </button>
        ))}
      </div>

      {/* Comments */}
      {showComments && (
        <div style={{ marginTop: 12 }}>
          {loadingComments
            ? <div style={{ textAlign: 'center', padding: 12 }}><div className="spinner" style={{ width: 20, height: 20, borderWidth: 2, margin: '0 auto' }}></div></div>
            : comments.map(c => (
              <Comment key={c.id} comment={c} postId={post.id} onDelete={deleteComment} />
            ))}
        </div>
      )}

      {/* Comment input */}
      <form onSubmit={submitComment} style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <Avatar user={user} size={30} />
        <input className="input" value={commentText} onChange={e => setCommentText(e.target.value)}
          placeholder="মন্তব্য লিখুন..." style={{ fontSize: 13, padding: '7px 12px' }} />
        <button className="btn btn-primary btn-sm" type="submit" disabled={submitting || !commentText.trim()}>পাঠান</button>
      </form>
    </div>
  )
}
