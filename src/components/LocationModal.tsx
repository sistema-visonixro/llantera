import React from 'react'

type Props = {
  open: boolean
  selectedEntrada: any
  onClose: () => void
  imageUrls: Record<string, string | null>
}

export default function LocationModal({ open, selectedEntrada, onClose, imageUrls }: Props) {
  if (!open) return null
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <div style={{ width: 520, maxWidth: '95%', background: 'white', borderRadius: 10, padding: 18, boxShadow: '0 12px 40px rgba(2,6,23,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <h3 style={{ margin: 0 }}>{selectedEntrada ? selectedEntrada.producto : 'Ubicación'}</h3>
          <button onClick={onClose} className="btn-opaque" style={{ padding: '6px 10px' }}>Cerrar</button>
        </div>

        {selectedEntrada ? (
          <div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              {(() => {
                const imgSrc = selectedEntrada.id ? (imageUrls[String(selectedEntrada.id)] ?? selectedEntrada.imagen) : selectedEntrada.imagen
                return imgSrc ? (
                  <img src={encodeURI(String(imgSrc))} alt={selectedEntrada.producto} style={{ width: 320, height: 200, objectFit: 'cover', borderRadius: 8, flexShrink: 0 }} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '' }} />
                ) : (
                  <div style={{ width: 320, height: 200, background: '#f1f5f9', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Sin imagen</div>
                )
              })()}
              <div style={{ flex: 1 }}>
                <p style={{ margin: '6px 0' }}><strong>SKU:</strong> {selectedEntrada.sku}</p>
                <p style={{ margin: '6px 0' }}><strong>Descripción:</strong> {selectedEntrada.descripcion}</p>
                <div style={{ marginTop: 8, padding: 8, borderRadius: 8, background: '#f8fafc' }}>
                  <p style={{ margin: 0 }}><strong>Sección:</strong> {selectedEntrada.ubicacion?.seccion}</p>
                  <p style={{ margin: 0 }}><strong>Bloque:</strong> {selectedEntrada.ubicacion?.bloque}</p>
                  <p style={{ margin: 0 }}><strong>Estante:</strong> {selectedEntrada.ubicacion?.estante}</p>
                </div>
                <p style={{ marginTop: 8, color: '#6b7280' }}><small>Cantidad: {selectedEntrada.cantidad}</small></p>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <p>No se encontró información de ubicación para este artículo.</p>
          </div>
        )}
      </div>
    </div>
  )
}
