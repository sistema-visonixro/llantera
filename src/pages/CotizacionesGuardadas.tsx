import React from 'react'

export default function CotizacionesGuardadas({ onBack }: { onBack: () => void }) {
  return (
    <div style={{ padding: 20, maxWidth: 900, margin: '24px auto' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0 }}>Cotizaciones Guardadas</h2>
        <button onClick={onBack} className="btn-opaque" style={{ padding: '8px 12px' }}>Volver</button>
      </header>

      <section style={{ background: 'white', padding: 16, borderRadius: 8, boxShadow: '0 1px 6px rgba(2,6,23,0.06)' }}>
        <p>Listado de cotizaciones previamente guardadas. Placeholder para ver/editar/cargar cotizaciones.</p>
        <p style={{ color: '#6b7280' }}>Se puede conectar a almacenamiento local o API para persistencia.</p>
      </section>
    </div>
  )
}
