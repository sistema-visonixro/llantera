// Utility to generate factura/cotización HTML from provided cart and totals
export function generateFacturaHTML(
  opts: { cliente?: string; rtn?: string; factura?: string; CAI?: string } = {},
  tipo: 'factura' | 'cotizacion' = 'factura',
  params: {
    carrito?: any[];
    subtotal?: number;
    isvTotal?: number;
    imp18Total?: number;
    impTouristTotal?: number;
    taxRate?: number;
    tax18Rate?: number;
    taxTouristRate?: number;
  } = {}
): string {
  const cliente = opts.cliente || (tipo === 'factura' ? 'Consumidor Final' : 'Cotización Cliente')
  const rtn = opts.rtn || (tipo === 'factura' ? 'C/F' : 'C/F')
  const factura = opts.factura || String(Math.floor(Math.random() * 900000) + 100000)
  const Ahora = new Date().toLocaleString()

  const carrito = Array.isArray(params.carrito) ? params.carrito : []
  const subtotal = typeof params.subtotal === 'number' ? params.subtotal : carrito.reduce((s, it: any) => s + (Number((it.producto && it.producto.precio) || it.precio || 0) * (it.cantidad || 1)), 0)
  const impuestoISV = typeof params.isvTotal === 'number' ? params.isvTotal : 0
  const impuesto18 = typeof params.imp18Total === 'number' ? params.imp18Total : 0
  const impuestoTuristico = typeof params.impTouristTotal === 'number' ? params.impTouristTotal : 0
  const ft = subtotal + impuestoISV + impuesto18 + impuestoTuristico

  const buildProductosTabla = () => {
    return carrito.map(i => {
      const desc = String((i.producto && (i.producto.nombre || i.producto.descripcion)) || i.descripcion || i.nombre || '')
      const cant = Number(i.cantidad || 0)
      const precioNum = Number(
        (i.producto && (i.producto.precio ?? i.producto.precio_unitario)) ??
        (i.precio_unitario ?? i.precio) ??
        0
      )
      const precio = precioNum.toFixed(2)
      const total = (cant * precioNum).toFixed(2)
      const sku = (i.producto && i.producto.sku) || (i.sku || '')
      return `<tr><td>${sku} ${desc}</td><td style="text-align:center">${cant}</td><td style="text-align:right">L ${precio}</td><td style="text-align:right">L ${total}</td></tr>`
    }).join('\n')
  }

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
    <div style="margin-top:8px;text-align:right"><div>SubTotal: L ${subtotal.toFixed(2)}</div><div>ISV: L ${impuestoISV.toFixed(2)}</div><div>Impuesto 18%: L ${impuesto18.toFixed(2)}</div><div>Impuesto turístico: L ${impuestoTuristico.toFixed(2)}</div><h3>Total: L ${ft.toFixed(2)}</h3></div>
    ${footerNote}
    <div style="margin-top:20px;text-align:center"><small>Gracias por su preferencia</small></div>
    </div></body></html>`

  return htmlOutput
}

export default generateFacturaHTML
