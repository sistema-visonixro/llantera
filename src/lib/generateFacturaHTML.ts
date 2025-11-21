export function generateFacturaHTML(
	opts: any = {},
	tipo: 'factura' | 'cotizacion' = 'factura',
	params: any = {}
): string {
	const comercio = opts.comercio || 'Solutecc - Punto de Ventas'
	const rtnEmp = opts.rtn || opts.RTN || 'C/F'
	const direccion = opts.direccion || ''
	const telefono = opts.telefono || ''
	const EM = opts.email || opts.EM || ''
	const factura = opts.factura || String(Math.floor(Math.random() * 900000) + 100000)
	const CAI = opts.CAI || opts.cai || ''
	const fechaLimiteEmision = opts.fechaLimiteEmision || opts.fecha_limite_emision || (opts.fecha_vencimiento || '')
	const rangoAutorizadoDe = opts.rangoAutorizadoDe || opts.rango_desde || ''
	const rangoAutorizadoHasta = opts.rangoAutorizadoHasta || opts.rango_hasta || ''
	const cliente = opts.cliente || (tipo === 'factura' ? 'Consumidor Final' : 'Cotización Cliente')
	const identidad = opts.identidad || opts.rtnCliente || opts.rtn || 'C/F'
	const Ahora = new Date().toLocaleString()

	const carrito = Array.isArray(params.carrito) ? params.carrito : []
	const subtotal = typeof params.subtotal === 'number' ? params.subtotal : carrito.reduce((s: number, it: any) => s + (Number((it.producto && it.producto.precio) || it.precio || 0) * (it.cantidad || 1)), 0)
	const DSC = typeof params.descuento === 'number' ? params.descuento : 0
	const exonerado = typeof params.exonerado === 'number' ? params.exonerado : 0
	const Gravado = typeof params.gravado === 'number' ? params.gravado : subtotal
	const Exento = typeof params.exento === 'number' ? params.exento : 0
	const impuesto = typeof params.isvTotal === 'number' ? params.isvTotal : 0
	const ISV18 = typeof params.imp18Total === 'number' ? params.imp18Total : 0
	const isv4 = typeof params.impTouristTotal === 'number' ? params.impTouristTotal : 0
	const transaccion = subtotal + impuesto + ISV18 + isv4
	const ft = transaccion

	const pagos = params.pagos || {}
	const Efectivo = typeof pagos.efectivo === 'number' ? pagos.efectivo : (params.Efectivo || ft)
	const Tarjeta = typeof pagos.tarjeta === 'number' ? pagos.tarjeta : (params.Tarjeta || 0)
	const Transferencia = typeof pagos.transferencia === 'number' ? pagos.transferencia : (params.Transferencia || 0)
	const cambio = typeof params.cambio === 'number' ? params.cambio : (params.Cambio || 0)

	const buildProductosTabla = () => {
		return carrito.map((i: any) => {
			const desc = String((i.producto && (i.producto.nombre || i.producto.descripcion)) || i.descripcion || i.nombre || '')
			const cant = Number(i.cantidad || 0)
			const precioNum = Number((i.producto && (i.producto.precio ?? i.producto.precio_unitario)) ?? (i.precio_unitario ?? i.precio) ?? 0)
			const precio = precioNum.toFixed(2)
			const total = (cant * precioNum).toFixed(2)
			const sku = (i.producto && i.producto.sku) || (i.sku || '')
			return `<tr><td>${sku} ${desc}</td><td style="text-align:center">${cant}</td><td style="text-align:right">L ${precio}</td><td style="text-align:right">L ${total}</td></tr>`
		}).join('\n')
	}

	const tabla = buildProductosTabla()
	const letras = numeroALetras(ft)

	const htmlOutput = `<!DOCTYPE html>
<html lang="es">
<head>
	<meta charset="UTF-8" />
	<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
	<title>Factura</title>
	<style>
		@page { size: letter; margin: 0; }
		* { font-weight: bold !important; letter-spacing: 0 !important; word-spacing: 0 !important; margin: 0; padding: 0; line-height: 1 !important; }
		body { font-family: 'Arial', sans-serif; font-size: 10px; margin-top: 25px; margin:25px; padding: 0; color: #000; }
		.factura { width: 100%; margin: 0 auto; padding: 19px; box-sizing: border-box; max-width: 8.5in; }
		.titulo { font-size: 45px; color: #0066CC; text-align: center; }
		.factura-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px; }
		.factura-header img { width: 255px; height: 150px; margin:10px; }
		h3, p, h5 { font-size: 11px; margin: 0; padding: 0; }
		.tabla { width: 100%; border-collapse: collapse; margin-top: 3px; font-size: 10px; }
		.tabla th, .tabla td { border: 1px solid #000; padding: 2px; text-align: left; }
		.tabla th { background-color: gray; color: white; }
		.fecha, .right { text-align: right; }
		.totales { font-size: 10px; margin-top: 5px; }
		hr { border: none; border-top: 1px solid #000; margin: 3px 0; }
		.letr { font-size: 10px; text-align: center; }
		.firma { text-align: center; font-size: 10px; margin-top: 5px; }
		@media print { .tabla th { background-color: gray !important; color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; } .factura { box-shadow: none; border-radius: 0; } .footer { display: none; } }
	</style>
</head>
<body>
	<div class="factura">
		<div class="factura-header">
			<img src="https://i.imgur.com/Tt5yzy0.jpeg" alt="Logo" />
			<h2 class="titulo">FACTURA</h2>
		</div>
		<hr />
		<h3>${comercio}</h3>
		<p>RTN: ${rtnEmp}</p>
		<p>Dirección: ${direccion}</p>
		<p>Teléfono: ${telefono}</p>
		<p>Email: ${EM}</p>
		<hr />
		<p class="fecha">Fecha y hora: ${Ahora}</p>
		<p>Factura No: ${factura}</p>
		<p>CAI: ${CAI}</p>
		<p>Fecha límite de emisión: ${fechaLimiteEmision}</p>
		<p>Rango autorizado: ${rangoAutorizadoDe} al ${rangoAutorizadoHasta}</p>
		<hr />
		<p>Cliente: ${cliente}</p>
		<p>RTN Cliente: ${identidad}</p>
		<hr />
		<table class="tabla">
			<thead>
				<tr>
					<th>Descripción</th>
					<th>Cant</th>
					<th>Precio</th>
					<th>Total</th>
				</tr>
			</thead>
			<tbody>
				${tabla}
			</tbody>
		</table>
		<hr />
		<div class="totales">
			<p>Descuento: <span class="right">L ${DSC.toFixed(2)}</span></p>
			<p>Sub Total Exonerado: <span class="right">L ${Number(exonerado).toFixed(2)}</span></p>
			<p>Sub Total Gravado: <span class="right">L ${Number(Gravado).toFixed(2)}</span></p>
			<p>Sub Total Exento: <span class="right">L ${Number(Exento).toFixed(2)}</span></p>
			<p>Total Transacción: <span class="right">L ${Number(transaccion).toFixed(2)}</span></p>
			 <p>Tasa Turistica 4%: <span class="right">L ${Number(isv4).toFixed(2)}</span></p>
			<p>ISV 15%: <span class="right">L ${Number(impuesto).toFixed(2)}</span></p>
			<p>ISV 18%: <span class="right">L ${Number(ISV18).toFixed(2)}</span></p>
			<hr />
			<p>Total Factura: <span class="right">L ${ft.toFixed(2)}</span></p>
			<p>Efectivo: <span class="right">L ${Number(Efectivo).toFixed(2)}</span></p>
			<p>Tarjeta: <span class="right">L ${Number(Tarjeta).toFixed(2)}</span></p>
			<p>Transferencia: <span class="right">L ${Number(Transferencia).toFixed(2)}</span></p>
			<p>Cambio: <span class="right">L ${Number(cambio).toFixed(2)}</span></p>
		</div>
		<hr />
		<div class="letr">
			<p>Total Pagado: L ${ft.toFixed(2)}</p>
			<p>*** ${letras} Lempiras ***</p>
		</div>
		<hr />
		<div class="firma">
			<p>Firma del Cliente: ______________________</p>
			<p>Firma del Emisor: ______________________</p>
			<p>Original: Cliente</p>
			<p>Copia: Obligado tributario emisor</p>
			<h5>Para cualquier reclamo debe presentar su factura</h5>
			<h5>¡Gracias por su compra!</h5>
			<h5>¡LA FACTURA ES BENEFICIO DE TODOS EXÍJALA!</h5>
		</div>
	</div>
	<script>
		window.onload = function () {
			window.print();
			setTimeout(function () { window.close(); }, 1000);
		};
	</script>
</body>
</html>`

	return htmlOutput
}

export default generateFacturaHTML

function numeroALetras(num: number) {
	// Convert number to words in Spanish (simplified, handles integers)
	if (!isFinite(num)) return ''
	const unidades = ['', 'uno','dos','tres','cuatro','cinco','seis','siete','ocho','nueve','diez','once','doce','trece','catorce','quince','dieciseis','diecisiete','dieciocho','diecinueve','veinte']
	const decenas = ['', '', 'veinte','treinta','cuarenta','cincuenta','sesenta','setenta','ochenta','noventa']
	const centenas = ['', 'cien','doscientos','trescientos','cuatrocientos','quinientos','seiscientos','setecientos','ochocientos','novecientos']

	function numeroMenorDeMil(n: number): string {
		let s = ''
		if (n === 0) return ''
		if (n < 21) return unidades[n]
		if (n < 100) {
			const d = Math.floor(n/10)
			const r = n%10
			return decenas[d] + (r? (' y ' + unidades[r]) : '')
		}
		if (n < 1000) {
			const c = Math.floor(n/100)
			const rest = n%100
			const cent = (c === 1 && rest === 0) ? 'cien' : (centenas[c] || '')
			return cent + (rest ? ' ' + numeroMenorDeMil(rest) : '')
		}
		return ''
	}

	const entero = Math.floor(Math.abs(num))
	if (entero === 0) return 'cero'
	const partes: string[] = []
	let remainder = entero
	const unidadesMiles = ['', 'mil', 'millón', 'mil millones']
	let idx = 0
	while (remainder > 0) {
		const chunk = remainder % 1000
		if (chunk) {
			let chunkStr = numeroMenorDeMil(chunk)
			if (idx === 2 && chunk === 1) chunkStr = 'un'
			partes.unshift(chunkStr + (unidadesMiles[idx] ? ' ' + unidadesMiles[idx] : ''))
		}
		remainder = Math.floor(remainder/1000)
		idx++
	}
	return partes.join(' ').trim()
}
// Utility to generate factura/cotización HTML from provided cart and totals

