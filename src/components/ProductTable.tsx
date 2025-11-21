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
    <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead style={{ background: '#f1f5f9', position: 'sticky', top: 0, zIndex: 10 }}>
          <tr>
            <th style={thStyle}></th>
            <th style={thStyle}>Imagen</th>
            <th style={thStyle}>SKU</th>
            <th style={thStyle}>Nombre</th>
            <th style={thStyle}>Categoría</th>
            <th style={thStyle}>Precio</th>
            <th style={thStyle}>Stock</th>
            <th style={thStyle}>Acción</th>
          </tr>
        </thead>
        <tbody>
          {productos.length === 0 ? (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: '1rem' }}>
                No se encontraron productos
              </td>
            </tr>
          ) : (
            productos.map(prod => (
              <tr key={prod.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={tdStyle}>
                  <button type="button" onClick={() => openUbicacion(prod.sku || '')} title="Ver ubicación" className="btn-opaque" style={{ padding: 6, borderRadius: 6 }}>
                    🔍
                  </button>
                </td>
                <td style={tdStyle}>
                  {imageUrls[String(prod.id)] ? (
                    <img src={encodeURI(imageUrls[String(prod.id)] as string)} alt={String(prod.nombre || '')} style={{ width: 32, height: 32, objectFit: 'cover' }} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '' }} />
                  ) : (prod.imagen ? <img src={String(prod.imagen)} alt={String(prod.nombre || '')} style={{ width: 32, height: 32, objectFit: 'cover' }} onError={(e) => { (e.currentTarget as HTMLImageElement).src = '' }} /> : '')}
                </td>
                <td style={tdStyle}><code style={skuStyle}>{prod.sku}</code></td>
                <td style={tdStyle}><strong>{prod.nombre}</strong></td>
                <td style={tdStyle}><span style={{ color: '#64748b' }}>{prod.categoria}</span></td>
                <td style={tdStyle}>L{(Number(prod.precio || 0)).toFixed(2)}</td>
                <td style={tdStyle}>
                  {(() => {
                    const stockNum = Number(prod.stock || 0)
                    const color = stockNum > 10 ? '#16a34a' : stockNum > 0 ? '#d97706' : '#dc2626'
                    return <span style={{ color, fontWeight: 600 }}>{stockNum}</span>
                  })()}
                </td>
                <td style={tdStyle}>
                  {(() => {
                    const stockNum = Number(prod.stock || 0)
                    const precioNum = Number(prod.precio || 0)
                    const disabled = stockNum < 1 || precioNum <= 0
                    const label = disabled ? (stockNum < 1 ? 'Agotado' : 'Sin precio') : 'Agregar'
                    return (
                      <button
                        onClick={() => agregarAlCarrito(prod)}
                        disabled={disabled}
                        className="btn-opaque"
                        style={{ padding: '6px 14px', borderRadius: 6, fontSize: '0.8rem' }}
                        title={disabled ? (stockNum < 1 ? 'No hay stock disponible' : 'El producto no tiene precio válido') : 'Agregar al carrito'}
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
