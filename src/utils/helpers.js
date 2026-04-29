import { format as timeagoFormat, register } from 'timeago.js'

// ✅ বাংলা locale register করো
register('bn_BD', (number, index) => {
  return [
    ['এইমাত্র', 'এইমাত্র'],
    ['%s সেকেন্ড আগে', '%s সেকেন্ড পরে'],
    ['১ মিনিট আগে', '১ মিনিট পরে'],
    ['%s মিনিট আগে', '%s মিনিট পরে'],
    ['১ ঘণ্টা আগে', '১ ঘণ্টা পরে'],
    ['%s ঘণ্টা আগে', '%s ঘণ্টা পরে'],
    ['১ দিন আগে', '১ দিন পরে'],
    ['%s দিন আগে', '%s দিন পরে'],
    ['১ সপ্তাহ আগে', '১ সপ্তাহ পরে'],
    ['%s সপ্তাহ আগে', '%s সপ্তাহ পরে'],
    ['১ মাস আগে', '১ মাস পরে'],
    ['%s মাস আগে', '%s মাস পরে'],
    ['১ বছর আগে', '১ বছর পরে'],
    ['%s বছর আগে', '%s বছর পরে'],
  ][index]
})

// ✅ FIXED: server থেকে আসা time কে সঠিকভাবে parse করো
export const timeAgo = (dateStr) => {
  if (!dateStr) return ''
  // MySQL datetime string "2024-01-15 14:30:00" → JS Date
  // Server Dhaka time (+06:00), browser ও Dhaka — তাই direct parse
  const normalized = dateStr.replace(' ', 'T') + '+06:00'
  return timeagoFormat(new Date(normalized), 'bn_BD')
}

export const avatarColor = (name) => {
  const colors = [
    'linear-gradient(135deg,#f97316,#dc2626)',
    'linear-gradient(135deg,#3b82f6,#8b5cf6)',
    'linear-gradient(135deg,#22c55e,#14b8a6)',
    'linear-gradient(135deg,#ec4899,#be185d)',
    'linear-gradient(135deg,#14b8a6,#0f766e)',
    'linear-gradient(135deg,#8b5cf6,#6d28d9)',
    'linear-gradient(135deg,#f59e0b,#d97706)',
  ]
  const idx = (name?.charCodeAt(0) || 0) % colors.length
  return colors[idx]
}

export const getInitials = (name) => {
  if (!name) return '?'
  return name.charAt(0).toUpperCase()
}

export const avatarUrl = (path) => {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `/api/uploads/avatars/${path}`
}

export const coverUrl = (path) => {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `/api/uploads/covers/${path}`
}

export const postImageUrl = (path) => {
  if (!path) return null
  return `/api/uploads/posts/${path}`
}

export const truncate = (str, n) => str?.length > n ? str.slice(0, n) + '...' : str
