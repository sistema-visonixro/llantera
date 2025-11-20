import React, { useState, useEffect, useRef } from 'react';
import DevolucionCaja from './DevolucionCaja'
import IngresoEfectivo from './IngresoEfectivo'
import CotizacionesGuardadas from './CotizacionesGuardadas'
import PedidosEnLinea from './PedidosEnLinea'
import CorteCajaParcial from './CorteCajaParcial'
import CorteCajaTotal from './CorteCajaTotal'
import supabase from '../lib/supabaseClient'

type Producto = {
  id: string;
  sku?: string;
  nombre?: string;
  precio?: number;
  categoria?: string;
  stock?: number;
  imagen?: string;
};

type ItemCarrito = {
  producto: Producto;
  cantidad: number;
};


export default function PuntoDeVentas({ onLogout }: { onLogout: () => void }) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev || ''; };
  }, []);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [carrito, setCarrito] = useState<ItemCarrito[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('Todas');

  const categorias = ['Todas', ...Array.from(new Set(productos.map(p => p.categoria)))]

  const productosFiltrados = productos.filter(p =>
    ((String(p.nombre || '').toLowerCase().includes(busqueda.toLowerCase())) ||
     (String(p.sku || '').toLowerCase().includes(busqueda.toLowerCase()))) &&
    (categoriaFiltro === 'Todas' || p.categoria === categoriaFiltro)
  );

  const subtotal = carrito.reduce((sum, item) => sum + (Number(item.producto.precio || 0) * item.cantidad), 0);
  const iva = subtotal * 0.15;
  const total = subtotal + iva;

  const agregarAlCarrito = (producto: Producto) => {
    if ((producto.stock ?? 0) <= 0) return;
    setCarrito(prev => {
      const existente = prev.find(i => i.producto.id === producto.id);
      if (existente) {
        return prev.map(i =>
          i.producto.id === producto.id
            ? { ...i, cantidad: i.cantidad + 1 }
            : i
        );
      }
      return [...prev, { producto, cantidad: 1 }];
    });
  };

  const actualizarCantidad = (id: any, cambio: number) => {
    setCarrito(prev =>
      prev.map(item => {
        if (String(item.producto.id) === String(id)) {
          const nuevaCant = item.cantidad + cambio;
          return nuevaCant > 0 ? { ...item, cantidad: nuevaCant } : item;
        }
        return item;
      }).filter(item => item.cantidad > 0)
    );
  };

  const eliminarDelCarrito = (id: any) => {
    setCarrito(prev => prev.filter(i => String(i.producto.id) !== String(id)));
  };

  const vaciarCarrito = () => setCarrito([]);

  const generarTicket = (tipo: 'cotizacion' | 'factura') => {
    const ticket = `
  ${tipo === 'factura' ? '=== FACTURA ===' : '=== COTIZACIÓN ==='}
  SET - Punto de Ventas
  Fecha: ${new Date().toLocaleString('es-HN')}
  ----------------------------------------
  ${carrito.map(i => `${i.producto.sku} | ${i.producto.nombre} x${i.cantidad} = L${(Number(i.producto.precio || 0) * i.cantidad).toFixed(2)}`).join('\n')}
  ----------------------------------------
  Subtotal: L${subtotal.toFixed(2)}
  ISV (15%): L${iva.toFixed(2)}
  TOTAL: L${total.toFixed(2)}
  ${tipo === 'factura' ? '\n¡Gracias por su compra!' : '\nVálida por 24 horas'}
    `.trim();
    alert(ticket);
    if (tipo === 'factura') vaciarCarrito();
  };

  const menuRef = useRef<HTMLDivElement | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [view, setView] = useState<string | null>(null);
  const [entradas, setEntradas] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedEntrada, setSelectedEntrada] = useState<any | null>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    // Cargar inventario público (dev) — contiene imágenes y coincide con entradas
    fetch('/data-base/inventario.json')
      .then(r => r.json())
      .then(data => {
        if (data && Array.isArray(data.items)) setEntradas(data.items)
        console.log('inventario cargado:', data && data.items ? data.items.length : 0)
      }).catch((err) => {
        console.warn('Error cargando inventario:', err)
      })
  }, [])

  // Load products from DB: inventario + precios + registro_de_inventario
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { data: invData, error: invErr } = await supabase.from('inventario').select('id, sku, nombre, categoria, imagen, modelo, descripcion')
        if (invErr) throw invErr
        const invRows = Array.isArray(invData) ? invData : []
        const ids = invRows.map((r: any) => String(r.id))

        // prices
        const priceMap: Record<string, number> = {}
        if (ids.length > 0) {
          const { data: prices } = await supabase.from('precios').select('producto_id, precio, created_at').in('producto_id', ids).order('created_at', { ascending: false })
          if (Array.isArray(prices)) {
            for (const p of prices) {
              const pid = String(p.producto_id)
              if (!priceMap[pid]) priceMap[pid] = Number(p.precio || 0)
            }
          }

          // stock from registro_de_inventario
          const { data: regData } = await supabase.from('registro_de_inventario').select('producto_id, cantidad, tipo_de_movimiento').in('producto_id', ids)
          const regRows = Array.isArray(regData) ? regData : []
          const stockMap: Record<string, number> = {}
          ids.forEach(id => stockMap[id] = 0)
          for (const r of regRows) {
            const pid = String((r as any).producto_id)
            const qty = Number((r as any).cantidad) || 0
            const tipo = String((r as any).tipo_de_movimiento || '').toUpperCase()
            if (tipo === 'ENTRADA') stockMap[pid] = (stockMap[pid] || 0) + qty
            else if (tipo === 'SALIDA') stockMap[pid] = (stockMap[pid] || 0) - qty
          }

          const products: Producto[] = invRows.map((r: any) => ({
            id: String(r.id),
            sku: r.sku,
            nombre: r.nombre,
            categoria: r.categoria,
            imagen: r.imagen,
            precio: priceMap[String(r.id)] ?? 0,
            stock: Number((stockMap[String(r.id)] || 0).toFixed(2))
          }))

          if (mounted) setProductos(products)
        } else {
          if (mounted) setProductos([])
        }
      } catch (e) {
        console.warn('Error cargando productos desde inventario:', e)
      }
    })()
    return () => { mounted = false }
  }, [])

  const [userName, setUserName] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)
  const [imageUrls, setImageUrls] = useState<Record<string, string | null>>({})

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user')
      if (raw) {
        const u = JSON.parse(raw)
        setUserName(u.username || u.name || null)
        setUserRole(u.role || null)
      }
    } catch (e) {
      // ignore
    }
  }, [])

  const openUbicacion = (sku: string) => {
    console.log('openUbicacion', sku, 'entradasCount', entradas.length)
    // Try to find product in loaded products (from inventario)
    let ent: any = null
    try {
      ent = productos.find(p => String(p.sku || '') === String(sku) || String(p.id) === String(sku)) || null
    } catch (e) {
      ent = null
    }

    // If we found product info, build a normalized object for modal
      if (ent) {
      const cantidad = Number((ent.stock ?? 0))
      const sel = {
        id: ent.id,
        producto: ent.nombre || '',
        sku: ent.sku || '',
        imagen: ent.imagen || null,
        descripcion: (ent as any).descripcion || '',
        ubicacion: (ent as any).ubicacion || null,
        cantidad
      }
      setSelectedEntrada(sel)
      setModalOpen(true)
      return
    }

    // Fallback: try to find in entradas JSON
    const ent2 = entradas.find(e => e.sku === sku) || null;
    console.log('entrada encontrada', ent2)
    setSelectedEntrada(ent2);
    setModalOpen(true);
  }

  // Resolve image URLs for products using storage public URL or signed URL
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const BUCKET = (import.meta.env.VITE_SUPABASE_STORAGE_BUCKET as string) || 'inventario'
        const urlMap: Record<string, string | null> = {}
        await Promise.all((productos || []).map(async (p) => {
          const raw = (p as any).imagen
          if (!raw) { urlMap[String(p.id)] = null; return }
          const src = String(raw)
          if (src.startsWith('http')) { urlMap[String(p.id)] = src; return }
          let objectPath = src
          const m = String(src).match(/\/storage\/v1\/object\/public\/([^/]+)\/(.*)/)
          if (m) objectPath = decodeURIComponent(m[2])
          try {
            const publicRes = await supabase.storage.from(BUCKET).getPublicUrl(objectPath)
            const candidate = (publicRes as any)?.data?.publicUrl || (publicRes as any)?.data?.publicURL || null
            if (candidate) { urlMap[String(p.id)] = candidate; return }
          } catch (e) {
            // continue
          }
          try {
            const signed = await supabase.storage.from(BUCKET).createSignedUrl(objectPath, 60 * 60 * 24 * 7)
            const signedUrl = (signed as any)?.data?.signedUrl ?? null
            urlMap[String(p.id)] = signedUrl
          } catch (e) {
            urlMap[String(p.id)] = null
          }
        }))
        if (mounted) setImageUrls(urlMap)
      } catch (e) {
        console.warn('Error resolviendo imágenes en PV', e)
      }
    })()
    return () => { mounted = false }
  }, [productos])
  if (view) {
    if (view === 'DevolucionCaja') return <DevolucionCaja onBack={() => setView(null)} />
    if (view === 'IngresoEfectivo') return <IngresoEfectivo onBack={() => setView(null)} />
    if (view === 'CotizacionesGuardadas') return <CotizacionesGuardadas onBack={() => setView(null)} />
    if (view === 'PedidosEnLinea') return <PedidosEnLinea onBack={() => setView(null)} />
    if (view === 'CorteCajaParcial') return <CorteCajaParcial onBack={() => setView(null)} />
    if (view === 'CorteCajaTotal') return <CorteCajaTotal onBack={() => setView(null)} />
  }

  return (
    <div style={{ minHeight: '100vh', fontFamily: 'system-ui, sans-serif', background: '#f8fafc' }}>
      {/* Header */}
      <header style={{
        background: '#1e293b', color: 'white', padding: '14px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', position: 'relative'
      }}>
        <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 600 }}>Solutecc  -  Caja</h1>
        {/* Center: show logged user role and name */}
        <div style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', textAlign: 'center', pointerEvents: 'none' }}>
          <div style={{ fontSize: '0.95rem', color: '#e2e8f0', fontWeight: 500 }}>{userName ? `${userName}` : ''}</div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{userRole ? `${userRole}` : ''}</div>
        </div>
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button
            onClick={() => setMenuOpen(v => !v)}
            aria-expanded={menuOpen}
            className="btn-opaque"
            style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            Menu ▾
          </button>

          {menuOpen && (
            <div style={{ position: 'absolute', right: 0, marginTop: 8, background: 'white', color: '#0b1724', borderRadius: 8, boxShadow: '0 8px 24px rgba(2,6,23,0.16)', minWidth: 220, zIndex: 60, overflow: 'hidden' }}>
              <button onClick={onLogout} className="btn-opaque" style={{ width: '100%', background: 'transparent', color: '#0b1724', padding: '10px 12px', textAlign: 'left' }}>Cerrar Sesión</button>
              <button onClick={() => { setMenuOpen(false); setView('DevolucionCaja') }} className="btn-opaque" style={{ width: '100%', background: 'transparent', color: '#0b1724', padding: '10px 12px', textAlign: 'left' }}>Devolución de caja</button>
              <button onClick={() => { setMenuOpen(false); setView('IngresoEfectivo') }} className="btn-opaque" style={{ width: '100%', background: 'transparent', color: '#0b1724', padding: '10px 12px', textAlign: 'left' }}>Ingreso de efectivo</button>
              <button onClick={() => { setMenuOpen(false); setView('CotizacionesGuardadas') }} className="btn-opaque" style={{ width: '100%', background: 'transparent', color: '#0b1724', padding: '10px 12px', textAlign: 'left' }}>Cotizaciones guardadas</button>
              <button onClick={() => { setMenuOpen(false); setView('PedidosEnLinea') }} className="btn-opaque" style={{ width: '100%', background: 'transparent', color: '#0b1724', padding: '10px 12px', textAlign: 'left' }}>Pedidos en línea</button>
              <button onClick={() => { setMenuOpen(false); setView('CorteCajaParcial') }} className="btn-opaque" style={{ width: '100%', background: 'transparent', color: '#0b1724', padding: '10px 12px', textAlign: 'left' }}>Corte de caja parcial</button>
              <button onClick={() => { setMenuOpen(false); setView('CorteCajaTotal') }} className="btn-opaque" style={{ width: '100%', background: 'transparent', color: '#0b1724', padding: '10px 12px', textAlign: 'left' }}>Corte de caja total</button>
            </div>
          )}
        </div>
      </header>

      <div style={{ padding: 16, maxWidth: 1600, margin: '0 auto' }}>
        {/* Buscador y Filtro */}
        <div style={{
          background: 'white', padding: 14, borderRadius: 10,
          boxShadow: '0 1px 4px rgba(0,0,0,0.05)', marginBottom: 16,
          display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center'
        }}>
          <input
            type="text"
            placeholder="Buscar por nombre o SKU..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            style={{ flex: 1, minWidth: 220, padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1' }}
          />
          <select
            value={categoriaFiltro}
            onChange={e => setCategoriaFiltro(e.target.value)}
            style={{ padding: '10px 12px', borderRadius: 8, border: '1px solid #cbd5e1', minWidth: 140 }}
          >
            {categorias.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Layout de 2 columnas: Tabla + Carrito */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 16 }}>
          
          {/* TABLA DE PRODUCTOS */}
          <div style={{
            background: 'white', borderRadius: 10, overflow: 'hidden',
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)', minHeight: '60vh'
          }}>
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
                  {productosFiltrados.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: '1rem' }}>
                        No se encontraron productos
                      </td>
                    </tr>
                  ) : (
                    productosFiltrados.map(prod => (
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
                          <button
                            onClick={() => agregarAlCarrito(prod)}
                            disabled={Number(prod.stock || 0) === 0}
                            className="btn-opaque"
                            style={{ padding: '6px 14px', borderRadius: 6, fontSize: '0.8rem' }}
                          >
                            {Number(prod.stock || 0) > 0 ? 'Agregar' : 'Agotado'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* CARRITO (AL LADO) */}
          <div style={{
            background: 'white', borderRadius: 10, padding: 16,
            boxShadow: '0 1px 4px rgba(0,0,0,0.05)', height: 'fit-content',
            position: 'sticky', top: 16, alignSelf: 'start'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Carrito ({carrito.length})</h3>
              {carrito.length > 0 && (
                <button onClick={vaciarCarrito} className="btn-opaque" style={{ background: 'transparent', color: '#2563eb', fontSize: '0.85rem', padding: '6px 8px' }}>
                  Vaciar
                </button>
              )}
            </div>

            {/* TOTALES Y BOTONES PRIMERO */}
            {carrito.length > 0 && (
              <div style={{ border: '2px solid #e2e8f0', borderRadius: 8, padding: 12, marginBottom: 16, background: '#f8fafc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 500 }}>
                  <span>Subtotal:</span>
                  <span>L{subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', fontWeight: 500 }}>
                  <span>ISV (15%):</span>
                  <span>L{iva.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 700, marginTop: 8, color: '#1e293b' }}>
                  <span>TOTAL:</span>
                  <span>L{total.toFixed(2)}</span>
                </div>

                {/* BOTONES DE ACCIÓN */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 16 }}>
                  <button onClick={() => generarTicket('cotizacion')} className="btn-opaque">Cotización</button>
                  <button onClick={() => generarTicket('factura')} className="btn-opaque">Facturar</button>
                </div>
              </div>
            )}

            {/* LISTA DE PRODUCTOS EN EL CARRITO (ABAJO) */}
            {carrito.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8', fontStyle: 'italic' }}>
                Carrito vacío
              </div>
            ) : (
              <div style={{ maxHeight: '40vh', overflowY: 'auto', borderTop: '1px solid #e2e8f0', paddingTop: 8 }}>
                {carrito.map(item => (
                  <div key={item.producto.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '8px 0', borderBottom: '1px dashed #e2e8f0'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>
                        [{item.producto.sku}] {item.producto.nombre}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        L{(Number(item.producto.precio || 0)).toFixed(2)} c/u
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button onClick={() => actualizarCantidad(item.producto.id, -1)} style={btnStyle}>−</button>
                      <span style={{ minWidth: 28, textAlign: 'center', fontWeight: 600 }}>{item.cantidad}</span>
                      <button onClick={() => actualizarCantidad(item.producto.id, 1)} style={btnStyle}>+</button>
                      <button onClick={() => eliminarDelCarrito(item.producto.id)} style={{ ...btnStyle, background: '#ef4444' }}>×</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de ubicación */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ width: 520, maxWidth: '95%', background: 'white', borderRadius: 10, padding: 18, boxShadow: '0 12px 40px rgba(2,6,23,0.3)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h3 style={{ margin: 0 }}>{selectedEntrada ? selectedEntrada.producto : 'Ubicación'}</h3>
              <button onClick={() => { setModalOpen(false); setSelectedEntrada(null) }} className="btn-opaque" style={{ padding: '6px 10px' }}>Cerrar</button>
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
      )}

    </div>
  );
}

// Estilos
const thStyle: React.CSSProperties = {
  padding: '12px 10px',
  textAlign: 'left',
  fontSize: '0.85rem',
  fontWeight: 600,
  color: '#475569',
};

const tdStyle: React.CSSProperties = {
  padding: '10px',
  fontSize: '0.9rem',
  verticalAlign: 'middle'
};

const skuStyle: React.CSSProperties = {
  fontSize: '0.75rem',
  background: '#e2e8f0',
  padding: '2px 6px',
  borderRadius: 4,
  fontFamily: 'monospace'
};

const btnStyle: React.CSSProperties = {
  width: 26, height: 26, borderRadius: 6, border: 'none',
  background: '#e2e8f0', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.9rem'
};

const actionBtn = (_bg: string): React.CSSProperties => ({
  padding: '10px',
  borderRadius: 8,
  border: 'none',
  background: '#2563eb',
  color: 'white',
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: '0.85rem',
  transition: 'all 0.2s'
});