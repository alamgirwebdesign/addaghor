import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import PostCard from '../components/Feed/PostCard'
import api from '../utils/api'

export default function PostDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/posts/${id}`).then(r => setPost(r.data.post)).catch(() => navigate('/')).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="page-loader"><div className="spinner"></div></div>
  if (!post) return null

  return (
    <div>
      <button onClick={() => navigate(-1)} className="btn btn-ghost btn-sm" style={{ marginBottom: 14 }}>← ফিরে যান</button>
      <PostCard post={post} onDelete={() => navigate('/')} />
    </div>
  )
}
