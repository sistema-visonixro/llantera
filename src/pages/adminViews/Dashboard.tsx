import React, { useEffect, useState } from 'react'

export default function DashboardView() {
  const [dashboardData, setDashboardData] = useState<any | null>(null)

  useEffect(() => {
    fetch('/data-base/dashboard-data.json')
      .then(r => r.json())
      .then(d => setDashboardData(d))
      .catch(() => setDashboardData(null))
  }, [])

  return (
    <div style={{ padding: 18 }}>
      <h2 style={{ marginTop: 0 }}>Dashboard</h2>
      <div style={{ marginTop: 8, color: '#475569' }}>
        {!dashboardData ? (
          <div>Cargando datos del dashboard...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ padding: 12, borderRadius: 8, background: '#fff' }}>
              <h3>Ventas (últimos días)</h3>
              <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(dashboardData.sales, null, 2)}</pre>
            </div>
            <div style={{ padding: 12, borderRadius: 8, background: '#fff' }}>
              <h3>Flujo de caja</h3>
              <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(dashboardData.cashflow, null, 2)}</pre>
            </div>
            <div style={{ padding: 12, borderRadius: 8, background: '#fff' }}>
              <h3>Inventario por categoría</h3>
              <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(dashboardData.inventory, null, 2)}</pre>
            </div>
            <div style={{ padding: 12, borderRadius: 8, background: '#fff' }}>
              <h3>Promedios</h3>
              <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(dashboardData.averages, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
