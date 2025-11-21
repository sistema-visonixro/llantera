import React from 'react'
import ModalWrapper from './ModalWrapper'

type Props = {
  open: boolean
  onClose: () => void
  caiInfo?: { cai?: string | null; rango_de?: string | null; rango_hasta?: string | null; fecha_vencimiento?: string | null; fecha_limite_emision?: string | null; secuencia_actual?: number | string | null } | null
}

export default function DatosFacturaModal({ open, onClose, caiInfo }: Props) {
  return (
    <ModalWrapper open={open} onClose={onClose} width={520}>
      <div>
        <h3 style={{ marginTop: 0 }}>Datos de factura</h3>
        <div style={{ color: '#475569', marginTop: 8 }}>
          <div style={{ marginBottom: 8 }}><strong>CAI:</strong> {caiInfo?.cai ?? '-'}</div>
          <div style={{ marginBottom: 8 }}><strong>Rango desde:</strong> {caiInfo?.rango_de ?? '-'}</div>
          <div style={{ marginBottom: 8 }}><strong>Rango hasta:</strong> {caiInfo?.rango_hasta ?? '-'}</div>
          <div style={{ marginBottom: 8 }}><strong>Fecha límite emisión:</strong> {caiInfo?.fecha_vencimiento ?? caiInfo?.fecha_limite_emision ?? '-'}</div>
          <div style={{ marginBottom: 8 }}><strong>Secuencia actual:</strong> {caiInfo?.secuencia_actual ?? '-'}</div>
        </div>

        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn-opaque" onClick={onClose} style={{ padding: '8px 12px' }}>Cerrar</button>
        </div>
      </div>
    </ModalWrapper>
  )
}
