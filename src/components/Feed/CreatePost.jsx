import { useState, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { avatarColor, getInitials, avatarUrl } from '../../utils/helpers'
import api from '../../utils/api'
import toast from 'react-hot-toast'

function Avatar({ user, size = 40 }) {
  return (
    <div className="avatar" style={{ width: size, height: size, background: avatarColor(user?.name), fontSize: size * 0.37, flexShrink: 0 }}>
      {user?.avatar ? <img src={avatarUrl(user.avatar)} alt="" /> : getInitials(user?.name)}
    </div>
  )
}

export default function CreatePost({ onCreated }) {
  const { user } = useAuth()
  const [content, setContent] = useState('')
  const [image, setImage] = useState(null)
  const [preview, setPreview] = useState(null)
  const [privacy, setPrivacy] = useState('public')
  const [loading, setLoading] = useState(false)
  const fileRef = useRef()

  const pickFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('ছবির সাইজ ৫MB এর বেশি হবে না'); return }
    setImage(file)
    setPreview(URL.createObjectURL(file))
  }

  const removeImage = () => { setImage(null); setPreview(null); fileRef.current.value = '' }

  const submit = async (e) => {
    e.preventDefault()
    if (!content.trim() && !image) { toast.error('কিছু লিখুন অথবা ছবি দিন'); return }
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('content', content)
      fd.append('privacy', privacy)
      if (image) fd.append('image', image)
      const res = await api.post('/posts', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      onCreated?.(res.data.post)
      setContent('')
      removeImage()
      toast.success('পোস্ট করা হয়েছে!')
    } catch { toast.error('পোস্ট ব্যর্থ হয়েছে') }
    finally { setLoading(false) }
  }

  return (
    <div className="card" style={{ padding: 16, marginBottom: 14 }}>
      <div style={{ display: 'flex', gap: 10 }}>
        <Avatar user={user} />
        <div style={{ flex: 1 }}>
          <textarea className="textarea"
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder={`কী মনে হচ্ছে আজকে, ${user?.name?.split(' ')[0]}?`}
            rows={3}
            style={{ minHeight: 70, borderRadius: '0 10px 10px 10px' }}
          />
          {preview && (
            <div style={{ position: 'relative', marginTop: 8, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
              <img src={preview} alt="" style={{ width: '100%', maxHeight: 240, objectFit: 'cover' }} />
              <button onClick={removeImage}
                style={{ position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', cursor: 'pointer', fontSize: 14 }}>×</button>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 10, gap: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <button type="button" onClick={() => fileRef.current.click()}
                className="btn btn-ghost btn-sm">📷 ছবি</button>
              <select value={privacy} onChange={e => setPrivacy(e.target.value)}
                className="input" style={{ padding: '5px 10px', fontSize: 12, width: 'auto' }}>
                <option value="public">🌍 পাবলিক</option>
                <option value="friends">👥 বন্ধুরা</option>
              </select>
            </div>
            <button className="btn btn-primary btn-sm" onClick={submit} disabled={loading || (!content.trim() && !image)}>
              {loading ? <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }}></span> : 'পোস্ট করুন'}
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={pickFile} />
        </div>
      </div>
    </div>
  )
}
