import React from 'react'
import ModalWrapper from './ModalWrapper'

type Props = {
  open: boolean
  onClose: () => void
  caiInfo?: { cai?: string | null; identificador?: string | null; rango_de?: string | null; rango_hasta?: string | null; fecha_vencimiento?: string | null; fecha_limite_emision?: string | null; secuencia_actual?: string | null } | null
  onRefresh?: () => Promise<void>
}

export default function DatosFacturaModal({ open, onClose, caiInfo, onRefresh }: Props) {
  const [loading, setLoading] = React.useState(false)
  return (
    <ModalWrapper open={open} onClose={onClose} width={520}>
      <div>
        <h3 style={{ marginTop: 0 }}>Datos de factura</h3>
        <div style={{ color: '#475569', marginTop: 8 }}>
          <div style={{ marginBottom: 8 }}><strong>CAI:</strong> {caiInfo?.cai ?? '-'}</div>
          <div style={{ marginBottom: 8 }}><strong>Identificador:</strong> {caiInfo?.identificador ?? '-'}</div>
          <div style={{ marginBottom: 8 }}><strong>Rango desde:</strong> {caiInfo?.rango_de ?? '-'}</div>
          <div style={{ marginBottom: 8 }}><strong>Rango hasta:</strong> {caiInfo?.rango_hasta ?? '-'}</div>
          <div style={{ marginBottom: 8 }}><strong>Fecha límite emisión:</strong> {caiInfo?.fecha_vencimiento ?? caiInfo?.fecha_limite_emision ?? '-'}</div>
          <div style={{ marginBottom: 8 }}><strong>Secuencia actual:</strong> {caiInfo?.secuencia_actual ?? '-'}</div>
        </div>

        <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn-opaque" onClick={onClose} style={{ padding: '8px 12px' }}>Cerrar</button>
          {/* Botón para reconsultar CAI desde backend */}
          <button
            className="btn-opaque"
            style={{ padding: '8px 12px' }}
            disabled={loading}
            onClick={async () => {
              if (!onRefresh) return
              try {
                setLoading(true)
                await onRefresh()
              } catch (e) {
                console.debug('Error calling onRefresh from DatosFacturaModal:', e)
              } finally {
                setLoading(false)
              }
            }}
          >{loading ? 'Actualizando...' : 'Actualizar'}</button>
        </div>
      </div>
    </ModalWrapper>
  )
}
