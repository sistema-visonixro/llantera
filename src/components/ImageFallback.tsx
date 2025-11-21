import React from 'react'

type Props = {
  src?: string | null
  id?: string | number
  imageUrls?: Record<string, string | null>
  alt?: string
  style?: React.CSSProperties
  width?: number
  height?: number
}

export default function ImageFallback({ src, id, imageUrls = {}, alt = '', style, width = 32, height = 32 }: Props) {
  const resolved = (() => {
    try {
      if (id != null && imageUrls && imageUrls[String(id)]) return String(imageUrls[String(id)])
      if (!src) return null
      if (String(src).startsWith('http')) return src
      return src
    } catch (e) { return src }
  })()

  if (!resolved) return <div style={{ width, height, background: '#f1f5f9', borderRadius: 6, display: 'inline-block', ...style }} />
  return <img src={encodeURI(String(resolved))} alt={alt || ''} style={{ width, height, objectFit: 'cover', borderRadius: 6, ...style }} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '' }} />
}
