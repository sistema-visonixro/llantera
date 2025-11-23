import React from 'react'

type Producto = {
  id: string;
  sku?: string | undefined;
  nombre?: string;
  precio?: number;
  categoria?: string;
  exento?: boolean;
  aplica_impuesto_18?: boolean;
  aplica_impuesto_turistico?: boolean;
  stock?: number;
  imagen?: string | undefined;
}

type Props = {
  productos: Producto[]
  imageUrls: Record<string, string | null>
  agregarAlCarrito: (p: Producto) => void
  openUbicacion: (sku: string) => void
  thStyle: React.CSSProperties
  tdStyle: React.CSSProperties
  skuStyle: React.CSSProperties
}

export default function ProductTable({ productos, imageUrls, agregarAlCarrito, openUbicacion, thStyle, tdStyle, skuStyle }: Props) {
  return (
    <div style={{ maxHeight: '70vh', overflowY: 'auto', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', background: 'white' }}>
        <thead style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <tr>
            <th style={{ ...thStyle, color: 'white', padding: '14px 12px', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #0ea5e9' }}>
              <span title="Ubicación">📍</span>
            </th>
            <th style={{ ...thStyle, color: 'white', padding: '14px 12px', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #0ea5e9' }}>Imagen</th>
            <th style={{ ...thStyle, color: 'white', padding: '14px 12px', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #0ea5e9' }}>SKU</th>
            <th style={{ ...thStyle, color: 'white', padding: '14px 12px', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #0ea5e9', textAlign: 'left' }}>Producto</th>
            <th style={{ ...thStyle, color: 'white', padding: '14px 12px', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #0ea5e9' }}>Categoría</th>
            <th style={{ ...thStyle, color: 'white', padding: '14px 12px', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #0ea5e9', textAlign: 'right' }}>Precio</th>
            <th style={{ ...thStyle, color: 'white', padding: '14px 12px', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #0ea5e9', textAlign: 'center' }}>Stock</th>
            <th style={{ ...thStyle, color: 'white', padding: '14px 12px', fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', borderBottom: '2px solid #0ea5e9', textAlign: 'center' }}>Acción</th>
          </tr>
        </thead>
        <tbody>
          {productos.length === 0 ? (
            <tr>
              <td colSpan={8} style={{ textAlign: 'center', padding: 60, color: '#94a3b8', fontSize: '1rem', background: '#fafbfc' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📦</div>
                <div style={{ fontWeight: 500 }}>No se encontraron productos</div>
                <div style={{ fontSize: 14, marginTop: 8, color: '#cbd5e1' }}>Intenta ajustar los filtros de búsqueda</div>
              </td>
            </tr>
          ) : (
            productos.map((prod, idx) => (
              <tr
                key={prod.id}
                style={{
                  borderBottom: '1px solid #f1f5f9',
                  transition: 'all 0.15s ease',
                  background: idx % 2 === 0 ? 'white' : '#fafbfc'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f0f9ff'
                  e.currentTarget.style.transform = 'scale(1.005)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = idx % 2 === 0 ? 'white' : '#fafbfc'
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                <td style={{ ...tdStyle, padding: '12px', textAlign: 'center' }}>
                  <button
                    type="button"
                    onClick={() => openUbicacion(prod.sku || '')}
                    title="Ver ubicación"
                    className="btn-opaque"
                    style={{
                      padding: '6px 10px',
                      borderRadius: 8,
                      fontSize: 16,
                      background: '#f1f5f9',
                      border: '1px solid #e2e8f0',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#0ea5e9'
                      e.currentTarget.style.transform = 'scale(1.1)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#f1f5f9'
                      e.currentTarget.style.transform = 'scale(1)'
                    }}
                  >
                    🔍
                  </button>
                </td>
                <td style={{ ...tdStyle, padding: '12px', textAlign: 'center' }}>
                  {imageUrls[String(prod.id)] ? (
                    <img
                      src={encodeURI(imageUrls[String(prod.id)] as string)}
                      alt={String(prod.nombre || '')}
                      style={{
                        width: 48,
                        height: 48,
                        objectFit: 'cover',
                        borderRadius: 8,
                        border: '2px solid #e2e8f0',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = '' }}
                    />
                  ) : (prod.imagen ?
                    <img
                      src={String(prod.imagen)}
                      alt={String(prod.nombre || '')}
                      style={{
                        width: 48,
                        height: 48,
                        objectFit: 'cover',
                        borderRadius: 8,
                        border: '2px solid #e2e8f0',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = '' }}
                    /> :
                    <div style={{
                      width: 48,
                      height: 48,
                      borderRadius: 8,
                      background: '#f1f5f9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 20
                    }}>📦</div>
                  )}
                </td>
                <td style={{ ...tdStyle, padding: '12px' }}>
                  <code style={{
                    ...skuStyle,
                    background: '#f1f5f9',
                    padding: '4px 8px',
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#475569',
                    border: '1px solid #e2e8f0'
                  }}>
                    {prod.sku}
                  </code>
                </td>
                <td style={{ ...tdStyle, padding: '12px' }}>
                  <div style={{ fontWeight: 600, color: '#1e293b', fontSize: 14 }}>{prod.nombre}</div>
                </td>
                <td style={{ ...tdStyle, padding: '12px', textAlign: 'center' }}>
                  <span style={{
                    color: '#64748b',
                    fontSize: 13,
                    background: '#f8fafc',
                    padding: '4px 10px',
                    borderRadius: 6,
                    display: 'inline-block'
                  }}>
                    {prod.categoria || '-'}
                  </span>
                </td>
                <td style={{ ...tdStyle, padding: '12px', textAlign: 'right' }}>
                  <span style={{ fontWeight: 700, color: '#059669', fontSize: 15 }}>
                    L{(Number(prod.precio || 0)).toFixed(2)}
                  </span>
                </td>
                <td style={{ ...tdStyle, padding: '12px', textAlign: 'center' }}>
                  {(() => {
                    const stockNum = Number(prod.stock || 0)
                    const color = stockNum > 10 ? '#16a34a' : stockNum > 0 ? '#d97706' : '#dc2626'
                    const bgColor = stockNum > 10 ? '#f0fdf4' : stockNum > 0 ? '#fef3c7' : '#fef2f2'
                    return (
                      <span style={{
                        color,
                        fontWeight: 700,
                        fontSize: 14,
                        background: bgColor,
                        padding: '4px 12px',
                        borderRadius: 6,
                        display: 'inline-block',
                        minWidth: 40,
                        border: `1px solid ${color}20`
                      }}>
                        {stockNum}
                      </span>
                    )
                  })()}
                </td>
                <td style={{ ...tdStyle, padding: '12px', textAlign: 'center' }}>
                  {(() => {
                    const stockNum = Number(prod.stock || 0)
                    const precioNum = Number(prod.precio || 0)
                    const disabled = stockNum < 1 || precioNum <= 0
                    const label = disabled ? (stockNum < 1 ? 'Agotado' : 'Sin precio') : '+ Agregar'
                    return (
                      <button
                        onClick={() => agregarAlCarrito(prod)}
                        disabled={disabled}
                        className="btn-opaque"
                        style={{
                          padding: '8px 16px',
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 600,
                          background: disabled ? '#f1f5f9' : '#0ea5e9',
                          color: disabled ? '#94a3b8' : 'white',
                          border: disabled ? '1px solid #e2e8f0' : 'none',
                          cursor: disabled ? 'not-allowed' : 'pointer',
                          transition: 'all 0.15s ease',
                          boxShadow: disabled ? 'none' : '0 2px 4px rgba(14, 165, 233, 0.3)'
                        }}
                        title={disabled ? (stockNum < 1 ? 'No hay stock disponible' : 'El producto no tiene precio válido') : 'Agregar al carrito'}
                        onMouseEnter={(e) => {
                          if (!disabled) {
                            e.currentTarget.style.background = '#0284c7'
                            e.currentTarget.style.transform = 'translateY(-2px)'
                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(14, 165, 233, 0.4)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!disabled) {
                            e.currentTarget.style.background = '#0ea5e9'
                            e.currentTarget.style.transform = 'translateY(0)'
                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(14, 165, 233, 0.3)'
                          }
                        }}
                      >
                        {label}
                      </button>
                    )
                  })()}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
