import React, { useEffect, useState } from 'react'

type Props = {
  active?: boolean
  children: React.ReactNode
  style?: React.CSSProperties
  className?: string
}

export default function ZoomWrapper({ active = true, children, style, className }: Props) {
  const [entered, setEntered] = useState(false)

  useEffect(() => {
    let raf = 0
    if (active) {
      setEntered(false)
      raf = requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)))
    } else {
      setEntered(false)
    }
    return () => { if (raf) cancelAnimationFrame(raf) }
  }, [active])

  const base: React.CSSProperties = {
    transform: entered ? 'scale(1)' : 'scale(0.96)',
    opacity: entered ? 1 : 0,
    transition: 'transform 200ms cubic-bezier(.2,.8,.2,1), opacity 180ms ease',
    transformOrigin: 'center center',
    display: 'block',
    width: '100%'
  }

  return (
    <div className={className} style={{ ...base, ...style }} aria-hidden={!active}>
      {children}
    </div>
  )
}
