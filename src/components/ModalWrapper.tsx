import React from 'react'
import ZoomWrapper from './ZoomWrapper'

type Props = {
  open: boolean
  onClose?: () => void
  width?: number | string
  children?: React.ReactNode
  zIndex?: number
}

export default function ModalWrapper({ open, onClose, width = 520, children, zIndex = 9999 }: Props) {
  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex }} onClick={() => { if (onClose) onClose() }}>
      <ZoomWrapper>
        <div onClick={(e) => e.stopPropagation()} style={{ width: typeof width === 'number' ? width : width, maxWidth: '95%', background: 'white', borderRadius: 12, padding: 18, boxShadow: '0 12px 40px rgba(2,6,23,0.3)' }}>
          {children}
        </div>
      </ZoomWrapper>
    </div>
  )
}
