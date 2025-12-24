import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

interface DashboardStats {
  ventasHoy: number;
  ventasHoyTotal: number;
  ventasMes: number;
  ventasMesTotal: number;
  comprasHoy: number;
  comprasHoyTotal: number;
  comprasMes: number;
  comprasMesTotal: number;
  ingresosHoy: number;
  egresosHoy: number;
  ingresosMes: number;
  egresosMes: number;
  productosStockBajo: number;
  totalProductos: number;
  valorInventario: number;
}

export default function DashboardView() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topProductos, setTopProductos] = useState<any[]>([]);
  const [ventasRecientes, setVentasRecientes] = useState<any[]>([]);
  const [comprasRecientes, setComprasRecientes] = useState<any[]>([]);
  const [movimientosRecientes, setMovimientosRecientes] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const now = new Date();
      const hoy = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1);

      console.log("Iniciando carga de dashboard...");
      // Evitar acceder a propiedades protegidas del cliente Supabase
      console.log("Cliente Supabase configurado:", {
        initialized: !!supabase,
        clientType: typeof supabase,
      });

      // Verificar primero si RLS está causando problemas
      console.log("Intentando consulta simple a ventas...");
      const {
        data: testVentas,
        error: testError,
        count,
      } = await supabase
        .from("ventas")
        .select("id", { count: "exact" })
        .limit(1);

      console.log("Resultado test ventas:", {
        hasData: !!testVentas,
        count,
        error: testError,
        errorDetails: testError
          ? {
              message: testError.message,
              details: testError.details,
              hint: testError.hint,
              code: testError.code,
            }
          : null,
      });

      if (testError) {
        console.error("Error detallado en test:", testError);

        // Verificar si es un problema de RLS específicamente
        if (
          testError.code === "PGRST301" ||
          testError.message?.includes("policy")
        ) {
          throw new Error(
            "Las políticas RLS están bloqueando el acceso.\n\nVerifica en Supabase Dashboard → Authentication → Policies:\n1. Que las políticas existen\n2. Que están habilitadas\n3. O desactiva RLS temporalmente para testing"
          );
        }

        throw new Error(
          `Error al consultar ventas: ${
            testError.message || testError.code
          }\n\nDetalles: ${JSON.stringify(testError, null, 2)}`
        );
      }

      // VENTAS - consulta completa
      const { data: todasVentas, error: errorVentas } = await supabase
        .from("ventas")
        .select("*")
        .order("fecha_venta", { ascending: false })
        .limit(1000);

      if (errorVentas) {
        console.error("Error obteniendo todas las ventas:", errorVentas);
        throw new Error(`Error en ventas: ${errorVentas.message}`);
      }

      console.log("Ventas obtenidas:", todasVentas?.length || 0);

      const ventasHoy =
        todasVentas?.filter((v) => {
          const vDate = new Date(v.fecha_venta || v.created_at);
          return (
            vDate >= hoy &&
            (v.estado === "pagada" || v.estado === "completada" || !v.estado)
          );
        }) || [];

      const ventasMes =
        todasVentas?.filter((v) => {
          const vDate = new Date(v.fecha_venta || v.created_at);
          return (
            vDate >= inicioMes &&
            (v.estado === "pagada" || v.estado === "completada" || !v.estado)
          );
        }) || [];

      // COMPRAS
      const { data: todasCompras } = await supabase
        .from("compras")
        .select("*")
        .order("fecha_compra", { ascending: false })
        .limit(1000);

      const comprasHoy =
        todasCompras?.filter((c) => {
          const cDate = new Date(c.fecha_compra || c.created_at);
          return cDate >= hoy;
        }) || [];

      const comprasMes =
        todasCompras?.filter((c) => {
          const cDate = new Date(c.fecha_compra || c.created_at);
          return cDate >= inicioMes;
        }) || [];

      // MOVIMIENTOS DE CAJA
      const { data: todosMovimientos } = await supabase
        .from("caja_movimientos")
        .select("*")
        .order("fecha", { ascending: false })
        .limit(1000);

      const movimientosHoy =
        todosMovimientos?.filter((m) => {
          const mDate = new Date(m.fecha || m.created_at);
          return mDate >= hoy;
        }) || [];

      const movimientosMes =
        todosMovimientos?.filter((m) => {
          const mDate = new Date(m.fecha || m.created_at);
          return mDate >= inicioMes;
        }) || [];

      const ingresosHoy = movimientosHoy
        .filter(
          (m) => (m.tipo_movimiento || m.tipo || "").toLowerCase() === "ingreso"
        )
        .reduce((sum, m) => sum + Number(m.monto || 0), 0);

      const egresosHoy = movimientosHoy
        .filter(
          (m) => (m.tipo_movimiento || m.tipo || "").toLowerCase() === "egreso"
        )
        .reduce((sum, m) => sum + Number(m.monto || 0), 0);

      const ingresosMes = movimientosMes
        .filter(
          (m) => (m.tipo_movimiento || m.tipo || "").toLowerCase() === "ingreso"
        )
        .reduce((sum, m) => sum + Number(m.monto || 0), 0);

      const egresosMes = movimientosMes
        .filter(
          (m) => (m.tipo_movimiento || m.tipo || "").toLowerCase() === "egreso"
        )
        .reduce((sum, m) => sum + Number(m.monto || 0), 0);

      // INVENTARIO
      const { data: productos } = await supabase
        .from("inventario")
        .select("*")
        .limit(5000);

      const productosFisicos =
        productos?.filter((p) => p.tipo === "producto" || !p.tipo) || [];
      const stockBajo = productosFisicos.filter(
        (p) => (p.stock || 0) < 10
      ).length;
      const valorInventario = productosFisicos.reduce((sum, p) => {
        return sum + Number(p.precio || 0) * Number(p.stock || 0);
      }, 0);

      // TOP PRODUCTOS
      const { data: topVentas } = await supabase
        .from("ventas_detalle")
        .select("*, inventario(*)")
        .not("producto_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(1000);

      const topVentasMes =
        topVentas?.filter((vd) => {
          if (!vd.created_at) return true;
          const vDate = new Date(vd.created_at);
          return vDate >= inicioMes;
        }) || [];

      const productosMap = new Map();
      topVentasMes.forEach((vd: any) => {
        const pid = vd.producto_id;
        if (!pid) return;
        const cant = Number(vd.cantidad || 0);
        const nombre = vd.inventario?.nombre || "Sin nombre";
        const monto = Number(vd.total || vd.subtotal || 0);
        if (productosMap.has(pid)) {
          const existing = productosMap.get(pid);
          productosMap.set(pid, {
            ...existing,
            cantidad: existing.cantidad + cant,
            monto: existing.monto + monto,
          });
        } else {
          productosMap.set(pid, { nombre, cantidad: cant, monto });
        }
      });

      const topProd = Array.from(productosMap.values())
        .sort((a, b) => b.monto - a.monto)
        .slice(0, 5);

      setStats({
        ventasHoy: ventasHoy.length,
        ventasHoyTotal: ventasHoy.reduce(
          (sum, v) => sum + Number(v.total || 0),
          0
        ),
        ventasMes: ventasMes.length,
        ventasMesTotal: ventasMes.reduce(
          (sum, v) => sum + Number(v.total || 0),
          0
        ),
        comprasHoy: comprasHoy.length,
        comprasHoyTotal: comprasHoy.reduce(
          (sum, c) => sum + Number(c.total || 0),
          0
        ),
        comprasMes: comprasMes.length,
        comprasMesTotal: comprasMes.reduce(
          (sum, c) => sum + Number(c.total || 0),
          0
        ),
        ingresosHoy,
        egresosHoy,
        ingresosMes,
        egresosMes,
        productosStockBajo: stockBajo,
        totalProductos: productosFisicos.length,
        valorInventario,
      });

      setTopProductos(topProd);
      setVentasRecientes(todasVentas?.slice(0, 5) || []);
      setComprasRecientes(todasCompras?.slice(0, 5) || []);
      setMovimientosRecientes(todosMovimientos?.slice(0, 5) || []);
    } catch (err: any) {
      console.error("Error cargando dashboard:", err);
      setError(err.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat("es-HN", {
      style: "currency",
      currency: "HNL",
      minimumFractionDigits: 2,
    }).format(val);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleString("es-HN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <h2 style={{ marginTop: 0, marginBottom: 24 }}>📊 Dashboard</h2>
        <div style={{ textAlign: "center", padding: 60, color: "#64748b" }}>
          <div style={{ fontSize: 18, marginBottom: 12 }}>
            ⏳ Cargando datos...
          </div>
          <div style={{ fontSize: 14 }}>Esto puede tomar unos segundos</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <h2 style={{ marginTop: 0, marginBottom: 24 }}>📊 Dashboard</h2>
        <div
          style={{
            padding: 24,
            background: "#fee2e2",
            border: "1px solid #ef4444",
            borderRadius: 8,
            color: "#991b1b",
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
            ❌ Error al cargar datos
          </div>
          <div
            style={{ fontSize: 14, marginBottom: 16, whiteSpace: "pre-wrap" }}
          >
            {error}
          </div>

          {error.includes("RLS") ||
          error.includes("políticas") ||
          error.includes("tabla") ? (
            <div
              style={{
                marginTop: 16,
                padding: 16,
                background: "#fef3c7",
                border: "1px solid #f59e0b",
                borderRadius: 6,
                color: "#78350f",
              }}
            >
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                🔧 Solución:
              </div>
              <div style={{ fontSize: 13, marginBottom: 12 }}>
                Ejecuta los siguientes comandos SQL en Supabase (Settings → SQL
                Editor):
              </div>
              <pre
                style={{
                  background: "#1f2937",
                  color: "#10b981",
                  padding: 12,
                  borderRadius: 6,
                  fontSize: 12,
                  overflowX: "auto",
                  fontFamily: "monospace",
                }}
              >
                {`-- Permitir lectura pública de las tablas
CREATE POLICY "Permitir lectura pública de ventas" 
ON ventas FOR SELECT USING (true);

CREATE POLICY "Permitir lectura pública de inventario" 
ON inventario FOR SELECT USING (true);

CREATE POLICY "Permitir lectura pública de ventas_detalle" 
ON ventas_detalle FOR SELECT USING (true);

CREATE POLICY "Permitir lectura pública de compras" 
ON compras FOR SELECT USING (true);

CREATE POLICY "Permitir lectura pública de caja_movimientos" 
ON caja_movimientos FOR SELECT USING (true);`}
              </pre>
            </div>
          ) : null}

          <button
            onClick={loadDashboardData}
            style={{
              marginTop: 16,
              padding: "8px 16px",
              background: "#ef4444",
              color: "white",
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            🔄 Reintentar
          </button>
        </div>
      </div>
    );
  }

  const utilidadBrutaMes =
    (stats?.ventasMesTotal || 0) - (stats?.comprasMesTotal || 0);
  const flujoEfectivoMes =
    (stats?.ventasMesTotal || 0) +
    (stats?.ingresosMes || 0) -
    (stats?.comprasMesTotal || 0) -
    (stats?.egresosMes || 0);

  return (
    <div style={{ padding: 24, background: "#f8fafc", minHeight: "100vh" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <h2 style={{ margin: 0, fontSize: 28, color: "#0f172a" }}>
          📊 Dashboard Ejecutivo
        </h2>
        <button
          onClick={loadDashboardData}
          style={{
            padding: "10px 20px",
            background: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontSize: 14,
            fontWeight: 600,
            boxShadow: "0 2px 4px rgba(59,130,246,0.3)",
          }}
        >
          🔄 Actualizar
        </button>
      </div>

      {/* Ventas */}
      <div style={{ marginBottom: 16 }}>
        <h3
          style={{
            margin: "0 0 12px 0",
            fontSize: 16,
            color: "#64748b",
            fontWeight: 500,
          }}
        >
          💰 VENTAS
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          <div
            style={{
              padding: 24,
              background: "white",
              borderRadius: 12,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              borderLeft: "4px solid #10b981",
            }}
          >
            <div
              style={{
                fontSize: 13,
                color: "#64748b",
                marginBottom: 8,
                fontWeight: 500,
              }}
            >
              Ventas Hoy
            </div>
            <div
              style={{
                fontSize: 32,
                fontWeight: "bold",
                color: "#0f172a",
                marginBottom: 4,
              }}
            >
              {stats?.ventasHoy || 0}
            </div>
            <div style={{ fontSize: 18, color: "#10b981", fontWeight: 600 }}>
              {formatCurrency(stats?.ventasHoyTotal || 0)}
            </div>
          </div>

          <div
            style={{
              padding: 24,
              background: "white",
              borderRadius: 12,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              borderLeft: "4px solid #3b82f6",
            }}
          >
            <div
              style={{
                fontSize: 13,
                color: "#64748b",
                marginBottom: 8,
                fontWeight: 500,
              }}
            >
              Ventas del Mes
            </div>
            <div
              style={{
                fontSize: 32,
                fontWeight: "bold",
                color: "#0f172a",
                marginBottom: 4,
              }}
            >
              {stats?.ventasMes || 0}
            </div>
            <div style={{ fontSize: 18, color: "#3b82f6", fontWeight: 600 }}>
              {formatCurrency(stats?.ventasMesTotal || 0)}
            </div>
          </div>

          <div
            style={{
              padding: 24,
              background: "white",
              borderRadius: 12,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              borderLeft: "4px solid #8b5cf6",
            }}
          >
            <div
              style={{
                fontSize: 13,
                color: "#64748b",
                marginBottom: 8,
                fontWeight: 500,
              }}
            >
              Promedio por Venta
            </div>
            <div style={{ fontSize: 28, fontWeight: "bold", color: "#0f172a" }}>
              {formatCurrency(
                stats?.ventasMes && stats.ventasMes > 0
                  ? stats.ventasMesTotal / stats.ventasMes
                  : 0
              )}
            </div>
            <div style={{ fontSize: 12, color: "#8b5cf6", marginTop: 4 }}>
              Basado en {stats?.ventasMes || 0} ventas del mes
            </div>
          </div>
        </div>
      </div>

      {/* Compras y Gastos */}
      <div style={{ marginBottom: 16 }}>
        <h3
          style={{
            margin: "0 0 12px 0",
            fontSize: 16,
            color: "#64748b",
            fontWeight: 500,
          }}
        >
          📦 COMPRAS Y GASTOS
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          <div
            style={{
              padding: 20,
              background: "white",
              borderRadius: 12,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              borderLeft: "4px solid #ef4444",
            }}
          >
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>
              Compras Hoy
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: "bold",
                color: "#0f172a",
                marginBottom: 4,
              }}
            >
              {stats?.comprasHoy || 0}
            </div>
            <div style={{ fontSize: 16, color: "#ef4444", fontWeight: 600 }}>
              {formatCurrency(stats?.comprasHoyTotal || 0)}
            </div>
          </div>

          <div
            style={{
              padding: 20,
              background: "white",
              borderRadius: 12,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              borderLeft: "4px solid #f97316",
            }}
          >
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>
              Compras del Mes
            </div>
            <div
              style={{
                fontSize: 24,
                fontWeight: "bold",
                color: "#0f172a",
                marginBottom: 4,
              }}
            >
              {stats?.comprasMes || 0}
            </div>
            <div style={{ fontSize: 16, color: "#f97316", fontWeight: 600 }}>
              {formatCurrency(stats?.comprasMesTotal || 0)}
            </div>
          </div>

          <div
            style={{
              padding: 20,
              background: "white",
              borderRadius: 12,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              borderLeft: "4px solid #f59e0b",
            }}
          >
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>
              Egresos Hoy
            </div>
            <div style={{ fontSize: 20, fontWeight: "bold", color: "#f59e0b" }}>
              {formatCurrency(stats?.egresosHoy || 0)}
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
              Movimientos de caja
            </div>
          </div>

          <div
            style={{
              padding: 20,
              background: "white",
              borderRadius: 12,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              borderLeft: "4px solid #eab308",
            }}
          >
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>
              Egresos del Mes
            </div>
            <div style={{ fontSize: 20, fontWeight: "bold", color: "#eab308" }}>
              {formatCurrency(stats?.egresosMes || 0)}
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
              Movimientos de caja
            </div>
          </div>
        </div>
      </div>

      {/* Ingresos y Métricas */}
      <div style={{ marginBottom: 16 }}>
        <h3
          style={{
            margin: "0 0 12px 0",
            fontSize: 16,
            color: "#64748b",
            fontWeight: 500,
          }}
        >
          💵 INGRESOS Y MÉTRICAS
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          <div
            style={{
              padding: 20,
              background: "white",
              borderRadius: 12,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              borderLeft: "4px solid #14b8a6",
            }}
          >
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>
              Ingresos Hoy
            </div>
            <div style={{ fontSize: 20, fontWeight: "bold", color: "#14b8a6" }}>
              {formatCurrency(stats?.ingresosHoy || 0)}
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
              Movimientos de caja
            </div>
          </div>

          <div
            style={{
              padding: 20,
              background: "white",
              borderRadius: 12,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              borderLeft: "4px solid #06b6d4",
            }}
          >
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>
              Ingresos del Mes
            </div>
            <div style={{ fontSize: 20, fontWeight: "bold", color: "#06b6d4" }}>
              {formatCurrency(stats?.ingresosMes || 0)}
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
              Movimientos de caja
            </div>
          </div>

          <div
            style={{
              padding: 20,
              background: utilidadBrutaMes >= 0 ? "#d1fae5" : "#fee2e2",
              borderRadius: 12,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              borderLeft: `4px solid ${
                utilidadBrutaMes >= 0 ? "#10b981" : "#ef4444"
              }`,
            }}
          >
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>
              Utilidad Bruta Mes
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: utilidadBrutaMes >= 0 ? "#059669" : "#dc2626",
              }}
            >
              {formatCurrency(utilidadBrutaMes)}
            </div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
              Ventas - Compras
            </div>
          </div>

          <div
            style={{
              padding: 20,
              background: flujoEfectivoMes >= 0 ? "#dbeafe" : "#fee2e2",
              borderRadius: 12,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              borderLeft: `4px solid ${
                flujoEfectivoMes >= 0 ? "#3b82f6" : "#ef4444"
              }`,
            }}
          >
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>
              Flujo Efectivo Mes
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: flujoEfectivoMes >= 0 ? "#2563eb" : "#dc2626",
              }}
            >
              {formatCurrency(flujoEfectivoMes)}
            </div>
            <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
              Ingresos - Egresos totales
            </div>
          </div>
        </div>
      </div>

      {/* Inventario */}
      <div style={{ marginBottom: 24 }}>
        <h3
          style={{
            margin: "0 0 12px 0",
            fontSize: 16,
            color: "#64748b",
            fontWeight: 500,
          }}
        >
          📦 INVENTARIO
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          <div
            style={{
              padding: 20,
              background: "white",
              borderRadius: 12,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>
              Total Productos
            </div>
            <div style={{ fontSize: 28, fontWeight: "bold", color: "#0f172a" }}>
              {stats?.totalProductos || 0}
            </div>
          </div>

          <div
            style={{
              padding: 20,
              background: "white",
              borderRadius: 12,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              borderLeft: stats?.productosStockBajo
                ? "4px solid #ef4444"
                : "4px solid #10b981",
            }}
          >
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>
              Stock Bajo (&lt; 10)
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: "bold",
                color: stats?.productosStockBajo ? "#ef4444" : "#10b981",
              }}
            >
              {stats?.productosStockBajo || 0}
            </div>
          </div>

          <div
            style={{
              padding: 20,
              background: "white",
              borderRadius: 12,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              borderLeft: "4px solid #6366f1",
            }}
          >
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>
              Valor Inventario
            </div>
            <div style={{ fontSize: 20, fontWeight: "bold", color: "#6366f1" }}>
              {formatCurrency(stats?.valorInventario || 0)}
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>
              Valor estimado (precio × stock)
            </div>
          </div>
        </div>
      </div>

      {/* Tablas */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          marginBottom: 16,
        }}
      >
        {/* Top productos */}
        <div
          style={{
            padding: 20,
            background: "white",
            borderRadius: 12,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: 16,
              fontSize: 16,
              color: "#0f172a",
            }}
          >
            🏆 Top 5 Productos (Monto)
          </h3>
          {topProductos.length === 0 ? (
            <div
              style={{
                color: "#94a3b8",
                fontSize: 14,
                padding: 20,
                textAlign: "center",
              }}
            >
              No hay datos disponibles
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {topProductos.map((p, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    background: "#f8fafc",
                    borderRadius: 8,
                    fontSize: 13,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <span style={{ fontWeight: 600, color: "#0f172a" }}>
                      {i + 1}. {p.nombre}
                    </span>
                    <div
                      style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}
                    >
                      {p.cantidad} unidades
                    </div>
                  </div>
                  <span
                    style={{ color: "#10b981", fontWeight: 600, fontSize: 14 }}
                  >
                    {formatCurrency(p.monto)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Últimas ventas */}
        <div
          style={{
            padding: 20,
            background: "white",
            borderRadius: 12,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: 16,
              fontSize: 16,
              color: "#0f172a",
            }}
          >
            🧾 Últimas Ventas
          </h3>
          {ventasRecientes.length === 0 ? (
            <div
              style={{
                color: "#94a3b8",
                fontSize: 14,
                padding: 20,
                textAlign: "center",
              }}
            >
              No hay ventas recientes
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {ventasRecientes.map((v, i) => (
                <div
                  key={i}
                  style={{
                    padding: "10px 12px",
                    background: "#f8fafc",
                    borderRadius: 8,
                    borderLeft: `3px solid ${
                      v.estado === "pagada" ? "#10b981" : "#ef4444"
                    }`,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: 13,
                        color: "#0f172a",
                      }}
                    >
                      {v.factura}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#10b981",
                      }}
                    >
                      {formatCurrency(Number(v.total || 0))}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "#64748b" }}>
                    {v.nombre_cliente || "Cliente general"}
                  </div>
                  <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>
                    {formatDate(v.fecha_venta || v.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Segunda fila */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Últimas compras */}
        <div
          style={{
            padding: 20,
            background: "white",
            borderRadius: 12,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: 16,
              fontSize: 16,
              color: "#0f172a",
            }}
          >
            📦 Últimas Compras
          </h3>
          {comprasRecientes.length === 0 ? (
            <div
              style={{
                color: "#94a3b8",
                fontSize: 14,
                padding: 20,
                textAlign: "center",
              }}
            >
              No hay compras recientes
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {comprasRecientes.map((c, i) => (
                <div
                  key={i}
                  style={{
                    padding: "10px 12px",
                    background: "#fef3c7",
                    borderRadius: 8,
                    borderLeft: "3px solid #f59e0b",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: 13,
                        color: "#0f172a",
                      }}
                    >
                      {c.numero_documento || "Sin #"}
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#f59e0b",
                      }}
                    >
                      {formatCurrency(Number(c.total || 0))}
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: "#92400e", marginTop: 2 }}>
                    {formatDate(c.fecha_compra || c.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Últimos movimientos */}
        <div
          style={{
            padding: 20,
            background: "white",
            borderRadius: 12,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <h3
            style={{
              marginTop: 0,
              marginBottom: 16,
              fontSize: 16,
              color: "#0f172a",
            }}
          >
            💵 Últimos Movimientos
          </h3>
          {movimientosRecientes.length === 0 ? (
            <div
              style={{
                color: "#94a3b8",
                fontSize: 14,
                padding: 20,
                textAlign: "center",
              }}
            >
              No hay movimientos recientes
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {movimientosRecientes.map((m, i) => {
                const tipo = (m.tipo_movimiento || m.tipo || "").toLowerCase();
                const esIngreso = tipo === "ingreso";
                return (
                  <div
                    key={i}
                    style={{
                      padding: "10px 12px",
                      background: "#f8fafc",
                      borderRadius: 8,
                      borderLeft: `3px solid ${
                        esIngreso ? "#10b981" : "#ef4444"
                      }`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: 13,
                          color: "#0f172a",
                          textTransform: "uppercase",
                        }}
                      >
                        {esIngreso ? "📥" : "📤"} {tipo}
                      </span>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: esIngreso ? "#10b981" : "#ef4444",
                        }}
                      >
                        {formatCurrency(Number(m.monto || 0))}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b" }}>
                      {m.descripcion || m.concepto || "Sin descripción"}
                    </div>
                    <div
                      style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}
                    >
                      {formatDate(m.fecha || m.created_at)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
