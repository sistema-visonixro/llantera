import React from 'react'

export default function Placeholder({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div style={{ padding: 18 }}>
      <h2 style={{ marginTop: 0 }}>{title}</h2>
      <div style={{ marginTop: 8, color: '#475569' }}>{children}</div>
    </div>
  )
}
