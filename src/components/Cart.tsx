import React from 'react'

type Producto = {
  id: string;
  sku?: string;
  nombre?: string;
  precio?: number;
}

type ItemCarrito = {
  producto: Producto;
  cantidad: number;
}

type Props = {
  carrito: ItemCarrito[]
  actualizarCantidad: (id: any, cambio: number) => void
  eliminarDelCarrito: (id: any) => void
  vaciarCarrito: () => void
  subtotal: number
  perItemTaxes: any[]
  taxRate: number
  tax18Rate: number
  taxTouristRate: number
  total: number
  openSelector: (mode: 'factura' | 'cotizacion') => void
  btnStyle: React.CSSProperties
}

export default function Cart({ carrito, actualizarCantidad, eliminarDelCarrito, vaciarCarrito, subtotal, perItemTaxes, taxRate, tax18Rate, taxTouristRate, total, openSelector, btnStyle }: Props) {
  return (
    <div style={{
      background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
      borderRadius: 16,
      padding: 20,
      boxShadow: '0 8px 24px rgba(0,0,0,0.12), 0 2px 6px rgba(0,0,0,0.08)',
      height: 'fit-content',
      position: 'sticky',
      top: 16,
      alignSelf: 'start',
      border: '1px solid #e2e8f0'
    }}>
      {/* Header del Carrito */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottom: '2px solid #e2e8f0'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24 }}>🛒</span>
          <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#1e293b' }}>
            Carrito
          </h3>
          {carrito.length > 0 && (
            <span style={{
              background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
              color: 'white',
              padding: '2px 10px',
              borderRadius: 12,
              fontSize: 13,
              fontWeight: 700
            }}>
              {carrito.length}
            </span>
          )}
        </div>
        {carrito.length > 0 && (
          <button
            onClick={vaciarCarrito}
            className="btn-opaque"
            style={{
              background: '#fef2f2',
              color: '#dc2626',
              fontSize: '0.85rem',
              padding: '6px 12px',
              borderRadius: 8,
              fontWeight: 600,
              border: '1px solid #fecaca',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#dc2626'
              e.currentTarget.style.color = 'white'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#fef2f2'
              e.currentTarget.style.color = '#dc2626'
            }}
          >
            🗑️ Vaciar
          </button>
        )}
      </div>

      {carrito.length > 0 && (
        <div style={{
          background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
          border: '2px solid #0ea5e9',
          borderRadius: 12,
          padding: 16,
          marginBottom: 16
        }}>
          {/* Total Principal */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '1.5rem',
            fontWeight: 800,
            marginBottom: 12,
            color: '#0c4a6e',
            paddingBottom: 12,
            borderBottom: '2px dashed #0ea5e9'
          }}>
            <span>TOTAL:</span>
            <span>L{total.toFixed(2)}</span>
          </div>

          {/* Subtotal */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontWeight: 600,
            fontSize: 14,
            color: '#475569',
            marginBottom: 6
          }}>
            <span>Subtotal:</span>
            <span>L{subtotal.toFixed(2)}</span>
          </div>

          {/* Impuestos */}
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>ISV ({(taxRate * 100)}%):</span>
              <strong style={{ color: '#475569' }}>L{(Number(perItemTaxes.reduce((s, it) => s + (it.isv || 0), 0))).toFixed(2)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>Impuesto 18%:</span>
              <strong style={{ color: '#475569' }}>L{(Number(perItemTaxes.reduce((s, it) => s + (it.imp18 || 0), 0))).toFixed(2)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Imp. Turístico ({(taxTouristRate * 100)}%):</span>
              <strong style={{ color: '#475569' }}>L{(Number(perItemTaxes.reduce((s, it) => s + (it.tur || 0), 0))).toFixed(2)}</strong>
            </div>
          </div>

          {/* Desglose por ítem */}
          <details style={{ marginTop: 12 }}>
            <summary style={{
              cursor: 'pointer',
              fontSize: 12,
              color: '#0284c7',
              fontWeight: 600,
              padding: '6px 0',
              userSelect: 'none'
            }}>
              📊 Ver desglose detallado
            </summary>
            <div style={{ marginTop: 8, fontSize: 11 }}>
              {perItemTaxes.map(it => (
                <div key={String(it.id)} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  padding: '6px 8px',
                  borderBottom: '1px dashed #bae6fd',
                  background: 'white',
                  borderRadius: 4,
                  marginBottom: 4
                }}>
                  <div style={{ color: '#0f172a', fontWeight: 600 }}>{it.nombre}</div>
                  <div style={{ color: '#64748b', fontSize: 10 }}>
                    ISV: L{it.isv.toFixed(2)} • 18%: L{it.imp18.toFixed(2)} • Tur: L{it.tur.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </details>

          {/* Botones de acción */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
            <button
              onClick={() => openSelector('cotizacion')}
              className="btn-opaque"
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: 'white',
                padding: '12px 16px',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 14,
                border: 'none',
                boxShadow: '0 4px 8px rgba(245, 158, 11, 0.3)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 12px rgba(245, 158, 11, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(245, 158, 11, 0.3)'
              }}
            >
              📋 Cotización
            </button>
            <button
              onClick={() => openSelector('factura')}
              className="btn-opaque"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                padding: '12px 16px',
                borderRadius: 10,
                fontWeight: 700,
                fontSize: 14,
                border: 'none',
                boxShadow: '0 4px 8px rgba(16, 185, 129, 0.3)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 6px 12px rgba(16, 185, 129, 0.4)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(16, 185, 129, 0.3)'
              }}
            >
              💰 Facturar
            </button>
          </div>
        </div>
      )}

      {/* Lista de productos */}
      {carrito.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          color: '#94a3b8',
          background: '#f8fafc',
          borderRadius: 12,
          border: '2px dashed #e2e8f0'
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🛒</div>
          <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>Carrito vacío</div>
          <div style={{ fontSize: 13 }}>Agrega productos para comenzar</div>
        </div>
      ) : (
        <div style={{
          maxHeight: '40vh',
          overflowY: 'auto',
          paddingRight: 4
        }}>
          {carrito.map((item, idx) => (
            <div
              key={item.producto.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px',
                marginBottom: 8,
                background: idx % 2 === 0 ? 'white' : '#f8fafc',
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f0f9ff'
                e.currentTarget.style.borderColor = '#0ea5e9'
                e.currentTarget.style.transform = 'scale(1.02)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = idx % 2 === 0 ? 'white' : '#f8fafc'
                e.currentTarget.style.borderColor = '#e2e8f0'
                e.currentTarget.style.transform = 'scale(1)'
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b', marginBottom: 4 }}>
                  {item.producto.nombre}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  <code style={{
                    background: '#f1f5f9',
                    padding: '2px 6px',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 600
                  }}>
                    {item.producto.sku}
                  </code>
                  <span style={{ marginLeft: 8 }}>L{(Number(item.producto.precio || 0)).toFixed(2)} c/u</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button
                  onClick={() => actualizarCantidad(item.producto.id, -1)}
                  style={{
                    ...btnStyle,
                    background: '#f1f5f9',
                    color: '#475569',
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    fontWeight: 700,
                    fontSize: 16,
                    border: '1px solid #e2e8f0'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#0ea5e9'
                    e.currentTarget.style.color = 'white'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f1f5f9'
                    e.currentTarget.style.color = '#475569'
                  }}
                >
                  −
                </button>
                <span style={{
                  minWidth: 32,
                  textAlign: 'center',
                  fontWeight: 700,
                  fontSize: 15,
                  color: '#1e293b'
                }}>
                  {item.cantidad}
                </span>
                <button
                  onClick={() => actualizarCantidad(item.producto.id, 1)}
                  style={{
                    ...btnStyle,
                    background: '#f1f5f9',
                    color: '#475569',
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    fontWeight: 700,
                    fontSize: 16,
                    border: '1px solid #e2e8f0'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#0ea5e9'
                    e.currentTarget.style.color = 'white'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#f1f5f9'
                    e.currentTarget.style.color = '#475569'
                  }}
                >
                  +
                </button>
                <button
                  onClick={() => eliminarDelCarrito(item.producto.id)}
                  style={{
                    ...btnStyle,
                    background: '#fef2f2',
                    color: '#dc2626',
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    fontWeight: 700,
                    fontSize: 18,
                    border: '1px solid #fecaca'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#dc2626'
                    e.currentTarget.style.color = 'white'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#fef2f2'
                    e.currentTarget.style.color = '#dc2626'
                  }}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
