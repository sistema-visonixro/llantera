import React, { useState, useEffect, useRef } from 'react';
import DevolucionCaja from './DevolucionCaja'
import IngresoEfectivo from './IngresoEfectivo'
import CotizacionesGuardadas from './CotizacionesGuardadas'
import PedidosEnLinea from './PedidosEnLinea'
import CorteCajaParcial from './CorteCajaParcial'
import CorteCajaTotal from './CorteCajaTotal'
import supabase from '../lib/supabaseClient'
import ClienteSearchModal from '../components/ClienteSearchModal'

type Producto = {
  id: string;
  sku?: string;
  nombre?: string;
  precio?: number;
  categoria?: string;
  exento?: boolean;
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
  const [taxRate, setTaxRate] = useState<number>(0.15) // default 15%

  const categorias = ['Todas', ...Array.from(new Set(productos.map(p => p.categoria)))]

  const productosFiltrados = productos.filter(p =>
    ((String(p.nombre || '').toLowerCase().includes(busqueda.toLowerCase())) ||
     (String(p.sku || '').toLowerCase().includes(busqueda.toLowerCase()))) &&
    (categoriaFiltro === 'Todas' || p.categoria === categoriaFiltro)
  );

  const subtotal = carrito.reduce((sum, item) => sum + (Number(item.producto.precio || 0) * item.cantidad), 0);
  const taxableSubtotal = carrito.reduce((sum, item) => sum + ((item.producto.exento ? 0 : (Number(item.producto.precio || 0) * item.cantidad))), 0);
  const iva = taxableSubtotal * taxRate;
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
  ISV (${(taxRate*100).toFixed(2)}%): L${iva.toFixed(2)}
  TOTAL: L${total.toFixed(2)}
  ${tipo === 'factura' ? '\n¡Gracias por su compra!' : '\nVálida por 24 horas'}
    `.trim();
    alert(ticket);
    if (tipo === 'factura') vaciarCarrito();
  };

  // Facturación: modal de selección y generación de factura HTML
  const [facturarModalOpen, setFacturarModalOpen] = useState(false)
  const [printingMode, setPrintingMode] = useState<'factura'|'cotizacion'>('factura')
  const [clienteNormalModalOpen, setClienteNormalModalOpen] = useState(false)
  const [clienteSearchOpen, setClienteSearchOpen] = useState(false)
  const [clienteNombre, setClienteNombre] = useState('')
  const [clienteRTN, setClienteRTN] = useState('')
    const clienteNombreRef = useRef<HTMLInputElement | null>(null);
    const clienteNombreInputRef = useRef<HTMLInputElement | null>(null);
  const [clienteTipo, setClienteTipo] = useState<'final'|'normal'|'juridico'>('final')
  const [clienteTelefono, setClienteTelefono] = useState('')
  const [clienteCorreo, setClienteCorreo] = useState('')
  const [clienteExonerado, setClienteExonerado] = useState<boolean>(false)
  const [createClienteModalOpen, setCreateClienteModalOpen] = useState(false)

  // Autocomplete RTN -> nombre: intenta traer nombre desde `clientenatural` o `clientejuridico` según `clienteTipo`
  const handleRTNChange = async (val: string) => {
    setClienteRTN(val)
    if (!val || String(val).trim() === '') {
      setClienteNombre('')
      return
    }
    try {
      if (clienteTipo === 'juridico') {
        console.debug('handleRTNChange: buscando cliente juridico para RTN=', val)
        const { data, error } = await supabase.from('clientes').select('id,nombre,telefono,correo_electronico,exonerado').eq('rtn', val).eq('tipo_cliente','juridico').maybeSingle()
        console.debug('handleRTNChange: supabase response', { data, error })
        if (!error && data && (data as any).nombre) {
          setClienteNombre((data as any).nombre || '')
          setClienteTelefono((data as any).telefono || '')
          setClienteCorreo((data as any).correo_electronico || '')
          setClienteExonerado(Boolean((data as any).exonerado))
          setTimeout(() => { try { clienteNombreInputRef.current?.focus() } catch (e) {} }, 50)
          return
        } else {
          setClienteNombre('')
          setClienteTelefono('')
          setClienteCorreo('')
          setClienteExonerado(false)
          return
        }
      }
      const tableName = 'clientenatural'
      console.debug('handleRTNChange: buscando clientenatural para RTN=', val)
      const { data, error } = await supabase.from(tableName).select('nombre').eq('rtn', val).maybeSingle()
      console.debug('handleRTNChange: supabase response clientenatural', { data, error })
      if (!error && data && (data as any).nombre) {
        setClienteNombre((data as any).nombre || '')
        // mover foco al nombre para permitir edición si el usuario quiere
        setTimeout(() => { try { clienteNombreInputRef.current?.focus() } catch (e) {} }, 50)
      } else {
        // no existe, limpiar nombre para nuevo registro
        setClienteNombre('')
      }
    } catch (e) {
      console.warn('Error buscando cliente por RTN:', e)
    }
  }

  const openSelector = (mode: 'factura'|'cotizacion') => {
    setPrintingMode(mode)
    setFacturarModalOpen(true)
  }

  const buildProductosTabla = () => {
    return carrito.map(i => {
      const desc = `${i.producto.nombre || ''}`
      const cant = Number(i.cantidad || 0)
      const precio = Number(i.producto.precio || 0).toFixed(2)
      const total = (cant * Number(i.producto.precio || 0)).toFixed(2)
      return `<tr><td>${desc}</td><td style="text-align:center">${cant}</td><td style="text-align:right">L ${precio}</td><td style="text-align:right">L ${total}</td></tr>`
    }).join('\n')
  }

  const generateFacturaHTML = (opts: { cliente?: string, rtn?: string, factura?: string, CAI?: string }, tipo: 'factura'|'cotizacion' = 'factura') => {
    const cliente = opts.cliente || (tipo === 'factura' ? 'Consumidor Final' : 'Cotización Cliente')
    const rtn = opts.rtn || (tipo === 'factura' ? 'C/F' : 'C/F')
    const factura = opts.factura || String(Math.floor(Math.random() * 900000) + 100000)
    const Ahora = new Date().toLocaleString()
    const subtotal = subtotalCalc()
    const impuesto = (taxableSubtotalCalc() * taxRate)
    const ft = subtotal + impuesto
    const tabla = buildProductosTabla()
    const titulo = tipo === 'factura' ? 'FACTURA' : 'COTIZACIÓN'
    const footerNote = tipo === 'factura' ? '' : '<div style="margin-top:12px;text-align:center;color:#475569">Válida por 24 horas desde la fecha de emisión.</div>'

    const htmlOutput = `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${titulo}</title><style>
    body{font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#000;margin:20px}
    .factura{max-width:800px;margin:0 auto}
    .header{display:flex;justify-content:space-between;align-items:center}
    .header img{width:180px;height:auto}
    table{width:100%;border-collapse:collapse;margin-top:10px}
    th,td{border:1px solid #000;padding:6px;text-align:left}
    th{background:#eee}
    .right{text-align:right}
    </style></head><body><div class="factura"><div class="header"><div>
    <h2>Solutecc - Punto de Ventas</h2>
    <div>RTN: 00000000000000</div>
    </div><div><h3>${titulo}</h3><div>No: ${factura}</div><div>Fecha: ${Ahora}</div></div></div>
    <hr/>
    <div><strong>Cliente:</strong> ${cliente}</div>
    <div><strong>RTN:</strong> ${rtn}</div>
    <table><thead><tr><th>Descripción</th><th>Cant</th><th>Precio</th><th>Total</th></tr></thead><tbody>
    ${tabla}
    </tbody></table>
    <div style="margin-top:8px;text-align:right"><div>SubTotal: L ${subtotal.toFixed(2)}</div><div>ISV (${(taxRate*100).toFixed(2)}%): L ${impuesto.toFixed(2)}</div><h3>Total: L ${ft.toFixed(2)}</h3></div>
    ${footerNote}
    <div style="margin-top:20px;text-align:center"><small>Gracias por su preferencia</small></div>
    </div><script>window.onload=function(){window.print();setTimeout(()=>window.close(),800);}</script></body></html>`

    return htmlOutput
  }

  const subtotalCalc = () => carrito.reduce((s, it) => s + (Number(it.producto.precio || 0) * it.cantidad), 0)
  const taxableSubtotalCalc = () => carrito.reduce((s, it) => s + ((it.producto.exento ? 0 : (Number(it.producto.precio || 0) * it.cantidad))), 0)

  const doFacturaClienteFinal = () => {
    const html = generateFacturaHTML({ cliente: 'Consumidor Final', rtn: 'C/F' }, printingMode)
    const w = window.open('', '_blank')
    if (w) {
      w.document.open()
      w.document.write(html)
      w.document.close()
    } else {
      const newWin = window.open('about:blank')
      if (newWin) { newWin.document.open(); newWin.document.write(html); newWin.document.close() }
    }
    if (printingMode === 'factura') vaciarCarrito()
    setFacturarModalOpen(false)
  }

  const doFacturaClienteNormal = () => {
    setClienteTipo('normal')
    setClienteNombre('')
    setClienteRTN('')
    setClienteNormalModalOpen(true)
    setFacturarModalOpen(false)
  }

  const doFacturaClienteJuridico = () => {
    setClienteTipo('juridico')
    setClienteNombre('')
    setClienteRTN('')
    setClienteNormalModalOpen(true)
    setFacturarModalOpen(false)
  }

    useEffect(() => {
      if (clienteNormalModalOpen) {
        setTimeout(() => {
          try { clienteNombreRef.current?.focus() } catch (e) { }
        }, 80)
      }
    }, [clienteNormalModalOpen])

  const submitClienteNormal = async () => {
    // guardar/actualizar cliente en la tabla `clientenatural`
    try {
      if (clienteRTN && clienteNombre) {
        const payload = { rtn: clienteRTN, nombre: clienteNombre }
        const { error } = await supabase.from('clientenatural').upsert(payload, { onConflict: 'rtn' })
        if (error) console.warn('Error guardando clientenatural:', error)
      }
    } catch (e) {
      console.warn('Error upsert clientenatural:', e)
    }

    // guardar/actualizar cliente en la tabla correspondiente según tipo
    try {
      if (clienteRTN && clienteNombre) {
        if (clienteTipo === 'juridico') {
          // buscar si existe cliente con ese RTN y tipo juridico
          const { data: found, error: findErr } = await supabase.from('clientes').select('id').eq('rtn', clienteRTN).eq('tipo_cliente', 'juridico').maybeSingle()
          if (findErr) console.warn('Error buscando cliente juridico:', findErr)
          if (found && (found as any).id) {
            // actualizar por id
            const { error: updErr } = await supabase.from('clientes').update({ nombre: clienteNombre, telefono: clienteTelefono || null, correo_electronico: clienteCorreo || null, exonerado: clienteExonerado }).eq('id', (found as any).id)
            if (updErr) console.warn('Error actualizando cliente juridico:', updErr)
          } else {
            // insertar nuevo cliente con tipo_cliente = 'juridico'
            const { error: insErr } = await supabase.from('clientes').insert([{ nombre: clienteNombre, rtn: clienteRTN, telefono: clienteTelefono || null, correo_electronico: clienteCorreo || null, tipo_cliente: 'juridico', exonerado: clienteExonerado }])
            if (insErr) console.warn('Error insertando cliente juridico:', insErr)
          }
        } else {
          // natural: usar clientenatural table (como antes)
          const payload = { rtn: clienteRTN, nombre: clienteNombre }
          const { error } = await supabase.from('clientenatural').upsert(payload, { onConflict: 'rtn' })
          if (error) console.warn('Error guardando clientenatural:', error)
        }
      }
    } catch (e) {
      console.warn('Error upsert cliente:', e)
    }

    const html = generateFacturaHTML({ cliente: clienteNombre || 'Cliente', rtn: clienteRTN || '' }, printingMode)
    const w = window.open('', '_blank')
    if (w) { w.document.open(); w.document.write(html); w.document.close() }
    if (printingMode === 'factura') vaciarCarrito()
    setClienteNormalModalOpen(false)
  }

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
        const { data: invData, error: invErr } = await supabase.from('inventario').select('id, sku, nombre, categoria, imagen, modelo, descripcion, exento')
        if (invErr) throw invErr
        const invRows = Array.isArray(invData) ? invData : []
        const ids = invRows.map((r: any) => String(r.id))

        if (ids.length === 0) {
          if (mounted) setProductos([])
          return
        }

        // prices: fetch all price rows and build a map, avoids type-mismatch on .in()
        const priceMap: Record<string, number> = {}
        try {
          const { data: prices, error: pricesErr } = await supabase.from('precios').select('producto_id, precio').order('id', { ascending: false })
          if (pricesErr) throw pricesErr
          console.debug('PV: precios total rows', Array.isArray(prices) ? prices.length : 0)
          if (Array.isArray(prices)) {
            // build map but only keep first (latest) price per producto_id
            for (const p of prices) {
              const pid = String((p as any).producto_id)
              if (!priceMap[pid]) priceMap[pid] = Number((p as any).precio || 0)
            }
          }
        } catch (e) {
          console.warn('Error cargando precios en PV:', e)
        }

        // stock from registro_de_inventario
        let stockMap: Record<string, number> = {}
        try {
          const { data: regData, error: regErr } = await supabase.from('registro_de_inventario').select('producto_id, cantidad, tipo_de_movimiento').in('producto_id', ids)
          if (regErr) throw regErr
          const regRows = Array.isArray(regData) ? regData : []
          stockMap = {}
          ids.forEach(id => stockMap[id] = 0)
          for (const r of regRows) {
            const pid = String((r as any).producto_id)
            const qty = Number((r as any).cantidad) || 0
            const tipo = String((r as any).tipo_de_movimiento || '').toUpperCase()
            if (tipo === 'ENTRADA') stockMap[pid] = (stockMap[pid] || 0) + qty
            else if (tipo === 'SALIDA') stockMap[pid] = (stockMap[pid] || 0) - qty
          }
        } catch (e) {
          console.warn('Error cargando registro_de_inventario en PV:', e)
          // initialize zero stock map to avoid crashes
          stockMap = {}
          ids.forEach(id => stockMap[id] = 0)
        }

        console.debug('PV: priceMap sample', Object.keys(priceMap).slice(0,5).map(k=>[k, priceMap[k]]))
        const products: Producto[] = invRows.map((r: any) => ({
          id: String(r.id),
          sku: r.sku,
          nombre: r.nombre,
          categoria: r.categoria,
          imagen: r.imagen,
          precio: (priceMap[String(r.id)] !== undefined ? priceMap[String(r.id)] : (r.precio !== undefined ? Number(r.precio) : 0)),
          exento: (r.exento === true || String(r.exento) === 'true' || Number(r.exento) === 1) || false,
          stock: Number((stockMap[String(r.id)] || 0).toFixed(2))
        }))

        if (mounted) setProductos(products)
      } catch (e) {
        console.warn('Error cargando productos desde inventario:', e)
        if (mounted) setProductos([])
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

  // Load tax rate from DB (table `impuesto`, first row). Normalize to decimal (e.g. 15 -> 0.15)
  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { data, error } = await supabase
          .from('impuesto')
          .select('valor,porcentaje,tasa')
          .order('id', { ascending: true })
          .limit(1)
          .maybeSingle()
        if (error) throw error
        if (!data) return
        // prefer fields in order: valor, porcentaje, tasa
        const rawVal = (data as any).valor ?? (data as any).porcentaje ?? (data as any).tasa
        if (rawVal !== undefined && rawVal !== null) {
          let num = Number(rawVal)
          if (!Number.isNaN(num)) {
            if (num > 1) num = num / 100 // convert percent like 15 -> 0.15
            if (mounted) setTaxRate(num)
          }
        }
      } catch (e) {
        console.warn('Error cargando impuesto en PV:', e)
      }
    })()
    return () => { mounted = false }
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
                  <span>ISV ({(taxRate*100).toFixed(2)}%):</span>
                  <span>L{iva.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 700, marginTop: 8, color: '#1e293b' }}>
                  <span>TOTAL:</span>
                  <span>L{total.toFixed(2)}</span>
                </div>

                {/* BOTONES DE ACCIÓN */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 16 }}>
                  <button onClick={() => openSelector('cotizacion')} className="btn-opaque">Cotización</button>
                  <button onClick={() => openSelector('factura')} className="btn-opaque">Facturar</button>
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

      {/* Modal de selección para facturar */}
      {facturarModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ width: 640, maxWidth: '95%', background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 18px 50px rgba(2,6,23,0.35)', display: 'flex', gap: 16, alignItems: 'stretch' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h3 style={{ margin: 0 }}>Seleccionar tipo de cliente</h3>
                <button onClick={() => setFacturarModalOpen(false)} className="btn-opaque" style={{ padding: '6px 10px' }}>Cerrar</button>
              </div>

              <p style={{ color: '#475569', marginTop: 6 }}>Elige si la factura será para Cliente Final o para un Cliente registrado. Cliente Final genera una factura inmediata lista para imprimir. Cliente Normal permite ingresar datos del cliente.</p>

              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <div onClick={doFacturaClienteFinal} role="button" tabIndex={0} style={{ flex: 1, borderRadius: 10, padding: 14, cursor: 'pointer', boxShadow: '0 6px 18px rgba(2,6,23,0.08)', border: '1px solid #e6edf3', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 28 }}>👤</div>
                  <div style={{ fontWeight: 700 }}>Cliente Final</div>
                  <div style={{ color: '#64748b', fontSize: 13 }}>Factura para consumidor final. No requiere RTN.</div>
                  <div style={{ marginTop: 8, color: '#0f172a', fontWeight: 700 }}>&nbsp;</div>
                </div>
                <div onClick={doFacturaClienteNormal} role="button" tabIndex={0} style={{ flex: 1, borderRadius: 10, padding: 14, cursor: 'pointer', boxShadow: '0 6px 18px rgba(2,6,23,0.08)', border: '1px solid #e6edf3', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 28 }}>🏷️</div>
                  <div style={{ fontWeight: 700 }}>Cliente Normal</div>
                  <div style={{ color: '#64748b', fontSize: 13 }}>Ingresar nombre y número de identificación (RTN) para la factura.</div>
                  <div style={{ marginTop: 8, color: '#0f172a', fontWeight: 700 }}>&nbsp;</div>
                </div>

                <div onClick={doFacturaClienteJuridico} role="button" tabIndex={0} style={{ flex: 1, borderRadius: 10, padding: 14, cursor: 'pointer', boxShadow: '0 6px 18px rgba(2,6,23,0.08)', border: '1px solid #e6edf3', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ fontSize: 28 }}>🏢</div>
                  <div style={{ fontWeight: 700 }}>Cliente Jurídico</div>
                  <div style={{ color: '#64748b', fontSize: 13 }}>Ingresar razón social y número de identificación (RTN) para la factura.</div>
                  <div style={{ marginTop: 8, color: '#0f172a', fontWeight: 700 }}>&nbsp;</div>
                </div>
              </div>
            </div>

            <div style={{ width: 220, borderLeft: '1px dashed #e6edf3', paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontWeight: 700 }}>Resumen</div>
              <div style={{ color: '#475569' }}>Items: <strong>{carrito.length}</strong></div>
              <div style={{ color: '#475569' }}>SubTotal: <strong>L {subtotalCalc().toFixed(2)}</strong></div>
              <div style={{ color: '#475569' }}>ISV ({(taxRate*100).toFixed(2)}%): <strong>L {(taxableSubtotalCalc()*taxRate).toFixed(2)}</strong></div>
              <div style={{ marginTop: 8, fontSize: 18, fontWeight: 800 }}>Total: L {(subtotalCalc() + (taxableSubtotalCalc()*taxRate)).toFixed(2)}</div>
              <div style={{ marginTop: 12, fontSize: 12, color: '#94a3b8' }}>Seleccione una opción para continuar.</div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para capturar cliente normal */}
      {clienteNormalModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ width: 600, maxWidth: '95%', background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 18px 50px rgba(2,6,23,0.35)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h3 style={{ margin: 0 }}>{clienteTipo === 'juridico' ? 'Datos del Cliente (Jurídico)' : 'Datos del Cliente'}</h3>
                <button onClick={() => setClienteNormalModalOpen(false)} className="btn-opaque" style={{ padding: '6px 10px' }}>Cerrar</button>
              </div>

            <p style={{ color: '#475569', marginTop: 6 }}>{clienteTipo === 'juridico' ? 'Ingrese número de identificación (RTN) y razón social del cliente jurídico. Estos datos se incluirán en la factura.' : 'Ingrese número de identificación (RTN) y nombre completo del cliente. Estos datos se incluirán en la factura.'}</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, color: '#334155' }}>RTN o Identificación</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input ref={clienteNombreRef} value={clienteRTN} onChange={e => { handleRTNChange(e.target.value) }} placeholder="00000000000000" style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  <button onClick={() => setClienteSearchOpen(true)} className="btn-opaque" style={{ padding: '8px 10px' }}>Buscar</button>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, color: '#334155' }}>{clienteTipo === 'juridico' ? 'Razón social' : 'Nombre completo'}</label>
                <input ref={clienteNombreInputRef} value={clienteNombre} onChange={e => setClienteNombre(e.target.value)} placeholder={clienteTipo === 'juridico' ? 'Razón social de la empresa' : 'Nombre del cliente'} style={{ padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }} />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
                    <ClienteSearchModal open={clienteSearchOpen} onClose={() => setClienteSearchOpen(false)} onSelect={(c: any) => {
                      // llenar campos con cliente seleccionado
                      setClienteRTN(c.rtn || '')
                      setClienteNombre(c.nombre || '')
                      setClienteTelefono(c.telefono || '')
                      setClienteCorreo(c.correo_electronico || '')
                      setClienteExonerado(Boolean(c.exonerado))
                      setClienteTipo('juridico')
                    }} />
              <button onClick={() => setClienteNormalModalOpen(false)} className="btn-opaque" style={{ background: 'transparent', color: '#111' }}>Cancelar</button>
              <button onClick={() => setCreateClienteModalOpen(true)} className="btn-opaque" style={{ background: 'transparent', color: '#0b5cff' }}>Crear cliente</button>
              <button onClick={submitClienteNormal} className="btn-opaque" disabled={!clienteNombre || !clienteRTN} style={{ opacity: (!clienteNombre || !clienteRTN) ? 0.6 : 1 }}>Generar Factura</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal crear cliente (juridico) */}
      {createClienteModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ width: 680, maxWidth: '95%', background: 'white', borderRadius: 12, padding: 20, boxShadow: '0 18px 50px rgba(2,6,23,0.35)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h3 style={{ margin: 0 }}>Crear Cliente Jurídico</h3>
              <button onClick={() => setCreateClienteModalOpen(false)} className="btn-opaque" style={{ padding: '6px 10px' }}>Cerrar</button>
            </div>

            <p style={{ color: '#475569', marginTop: 6 }}>Complete los datos del cliente jurídico. El campo tipo se fijará a <strong>juridico</strong>.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, color: '#334155' }}>RTN</label>
                <input value={clienteRTN} onChange={e => setClienteRTN(e.target.value)} placeholder="00000000000000" style={{ padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, color: '#334155' }}>Razón social</label>
                <input value={clienteNombre} onChange={e => setClienteNombre(e.target.value)} placeholder="Razón social" style={{ padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, color: '#334155' }}>Teléfono</label>
                <input value={clienteTelefono} onChange={e => setClienteTelefono(e.target.value)} placeholder="Teléfono" style={{ padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 13, color: '#334155' }}>Correo electrónico</label>
                <input value={clienteCorreo} onChange={e => setClienteCorreo(e.target.value)} placeholder="correo@ejemplo.com" style={{ padding: 10, borderRadius: 8, border: '1px solid #e2e8f0' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input id="exon" type="checkbox" checked={clienteExonerado} onChange={e => setClienteExonerado(e.target.checked)} />
                <label htmlFor="exon">Exonerado</label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
              <button onClick={() => setCreateClienteModalOpen(false)} className="btn-opaque" style={{ background: 'transparent', color: '#111' }}>Cancelar</button>
              <button onClick={async () => {
                try {
                  if (!clienteNombre || !clienteRTN) return
                  const { data: existing, error: findErr } = await supabase.from('clientes').select('id').eq('rtn', clienteRTN).maybeSingle()
                  if (findErr) console.warn('Error buscando cliente al crear:', findErr)
                  if (existing && (existing as any).id) {
                    const { error: updErr } = await supabase.from('clientes').update({ nombre: clienteNombre, telefono: clienteTelefono || null, correo_electronica: clienteCorreo || null, tipo_cliente: 'juridico', exonerado: clienteExonerado }).eq('id', (existing as any).id)
                    if (updErr) console.warn('Error actualizando cliente al crear:', updErr)
                  } else {
                    const { error: insErr } = await supabase.from('clientes').insert([{ nombre: clienteNombre, rtn: clienteRTN, telefono: clienteTelefono || null, correo_electronica: clienteCorreo || null, tipo_cliente: 'juridico', exonerado: clienteExonerado }])
                    if (insErr) console.warn('Error insertando cliente al crear:', insErr)
                  }
                } catch (e) {
                  console.warn('Error creando cliente juridico:', e)
                }
                setCreateClienteModalOpen(false)
              }} className="btn-opaque" style={{ opacity: (!clienteNombre || !clienteRTN) ? 0.6 : 1 }} disabled={!clienteNombre || !clienteRTN}>Crear cliente</button>
            </div>
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