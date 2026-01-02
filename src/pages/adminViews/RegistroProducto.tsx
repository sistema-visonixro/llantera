import React, { useEffect, useState } from "react";
import supabase from "../../lib/supabaseClient";

export default function RegistroProducto() {
  const [productos, setProductos] = useState<any[]>([]);
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [productoId, setProductoId] = useState<string | number>("");
  const [productoName, setProductoName] = useState<string>("");
  const [cantidad, setCantidad] = useState<number>(1);
  const [tipo, setTipo] = useState<"ENTRADA" | "SALIDA">("ENTRADA");
  const [referencia, setReferencia] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const loadProductos = async () => {
    try {
      const { data, error } = await supabase
        .from("inventario")
        .select("id, nombre, sku, categoria")
        .not("categoria", "ilike", "%servicios%")
        .order("nombre", { ascending: true });
      if (error) throw error;
      setProductos(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error loading productos", err);
      setProductos([]);
    }
  };

  const loadMovimientos = async () => {
    try {
      const { data, error } = await supabase
        .from("registro_de_inventario")
        .select("*")
        .order("fecha_salida", { ascending: false })
        .limit(100);
      if (error) throw error;
      const allMov = Array.isArray(data) ? data : [];
      // Exclude movements for products in category 'SERVICIOS'
      const ids = Array.from(
        new Set(allMov.map((m: any) => String(m.producto_id)))
      ).filter(Boolean);
      if (ids.length > 0) {
        const { data: prodData } = await supabase
          .from("inventario")
          .select("id")
          .in("id", ids)
          .not("categoria", "ilike", "%servicios%");
        const allowed = new Set(
          Array.isArray(prodData) ? prodData.map((p: any) => String(p.id)) : []
        );
        setMovimientos(
          allMov.filter((m) => allowed.has(String(m.producto_id)))
        );
      } else {
        setMovimientos([]);
      }
    } catch (err) {
      console.error("Error loading movimientos", err);
      setMovimientos([]);
    }
  };

  useEffect(() => {
    loadProductos();
    loadMovimientos();
  }, []);

  const getUserName = () => {
    try {
      const raw = localStorage.getItem("user");
      const parsed = raw ? JSON.parse(raw) : null;
      return (
        (parsed &&
          (parsed.username ||
            parsed.user?.username ||
            parsed.name ||
            parsed.user?.name)) ||
        "sistema"
      );
    } catch (e) {
      return "sistema";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productoId) {
      setMessage("Seleccione un producto");
      return;
    }
    if (!cantidad || cantidad <= 0) {
      setMessage("Ingrese una cantidad válida");
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      const usuario = getUserName();
      const payload = {
        producto_id: productoId,
        cantidad: cantidad,
        tipo_de_movimiento: tipo,
        referencia: referencia || `${tipo} manual desde admin`,
        usuario,
        fecha_salida: new Date().toISOString(),
      } as any;

      const { data, error } = await supabase
        .from("registro_de_inventario")
        .insert([payload]);

      if (error) throw error;

      setMessage("Movimiento registrado correctamente");
      setCantidad(1);
      setReferencia("");
      setProductoId("");
      setProductoName("");
      // recargar lista
      await loadMovimientos();
    } catch (err: any) {
      console.error("Error inserting movimiento", err);
      setMessage(
        "Error al registrar movimiento: " + (err.message || String(err))
      );
    } finally {
      setLoading(false);
    }
  };

  // helper to map producto id to nombre
  const productoMap = productos.reduce(
    (acc: Record<string, string>, p: any) => {
      acc[String(p.id)] = p.nombre || `#${p.id}`;
      return acc;
    },
    {} as Record<string, string>
  );

  return (
    <div style={{ padding: 24, background: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        <h2
          style={{
            marginTop: 0,
            marginBottom: 24,
            fontSize: 28,
            fontWeight: 600,
            color: "#1e293b",
          }}
        >
          Registro de producto
        </h2>

        <div
          style={{ display: "grid", gridTemplateColumns: "450px 1fr", gap: 24 }}
        >
          {/* Formulario */}
          <div
            style={{
              background: "white",
              padding: 24,
              borderRadius: 12,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              height: "fit-content",
            }}
          >
            <h3
              style={{
                marginTop: 0,
                marginBottom: 20,
                fontSize: 18,
                fontWeight: 600,
                color: "#334155",
              }}
            >
              Nuevo movimiento
            </h3>

            <form onSubmit={handleSubmit}>
              {/* Campo Producto con búsqueda */}
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#475569",
                    marginBottom: 6,
                  }}
                >
                  Producto *
                </label>
                <input
                  list="productos-registro-list"
                  className="input"
                  value={productoName}
                  onChange={(e) => {
                    const val = e.target.value;
                    setProductoName(val);
                    const match = productos.find(
                      (p) =>
                        p.nombre === val || `${p.nombre} (${p.sku})` === val
                    );
                    setProductoId(match ? match.id : "");
                  }}
                  placeholder="Buscar o seleccionar producto..."
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    fontSize: 14,
                    border: "1px solid #e2e8f0",
                    borderRadius: 6,
                    transition: "border-color 0.2s",
                  }}
                />
                <datalist id="productos-registro-list">
                  {productos.map((p) => (
                    <option
                      key={p.id}
                      value={p.sku ? `${p.nombre} (${p.sku})` : p.nombre}
                    />
                  ))}
                </datalist>
              </div>

              {/* Campo Tipo */}
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#475569",
                    marginBottom: 6,
                  }}
                >
                  Tipo de movimiento *
                </label>
                <select
                  className="input"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as any)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    fontSize: 14,
                    border: "1px solid #e2e8f0",
                    borderRadius: 6,
                  }}
                >
                  <option value="ENTRADA">📥 ENTRADA</option>
                  <option value="SALIDA">📤 SALIDA</option>
                </select>
              </div>

              {/* Campo Cantidad */}
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#475569",
                    marginBottom: 6,
                  }}
                >
                  Cantidad *
                </label>
                <input
                  className="input"
                  type="number"
                  min={1}
                  value={cantidad}
                  onChange={(e) => setCantidad(Number(e.target.value))}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    fontSize: 14,
                    border: "1px solid #e2e8f0",
                    borderRadius: 6,
                  }}
                />
              </div>

              {/* Campo Referencia */}
              <div style={{ marginBottom: 20 }}>
                <label
                  style={{
                    display: "block",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#475569",
                    marginBottom: 6,
                  }}
                >
                  Referencia
                </label>
                <input
                  className="input"
                  value={referencia}
                  onChange={(e) => setReferencia(e.target.value)}
                  placeholder="Ej: Ajuste de inventario, Compra #123..."
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    fontSize: 14,
                    border: "1px solid #e2e8f0",
                    borderRadius: 6,
                  }}
                />
              </div>

              {/* Botón Submit */}
              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "12px",
                  fontSize: 15,
                  fontWeight: 600,
                  borderRadius: 8,
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? "Guardando..." : "✓ Registrar movimiento"}
              </button>

              {/* Mensaje */}
              {message && (
                <div
                  style={{
                    marginTop: 16,
                    padding: "12px 14px",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 500,
                    background: message.startsWith("Error")
                      ? "#fee2e2"
                      : "#d1fae5",
                    color: message.startsWith("Error") ? "#dc2626" : "#059669",
                    border: `1px solid ${
                      message.startsWith("Error") ? "#fecaca" : "#a7f3d0"
                    }`,
                  }}
                >
                  {message}
                </div>
              )}
            </form>
          </div>

          {/* Tabla de movimientos */}
          <div
            style={{
              background: "white",
              padding: 24,
              borderRadius: 12,
              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            }}
          >
            <h3
              style={{
                marginTop: 0,
                marginBottom: 16,
                fontSize: 18,
                fontWeight: 600,
                color: "#334155",
              }}
            >
              Últimos 100 movimientos
            </h3>
            <div
              style={{
                maxHeight: 600,
                overflow: "auto",
                border: "1px solid #e2e8f0",
                borderRadius: 8,
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead
                  style={{
                    position: "sticky",
                    top: 0,
                    background: "#f8fafc",
                    zIndex: 1,
                  }}
                >
                  <tr style={{ textAlign: "left" }}>
                    <th
                      style={{
                        padding: "12px 16px",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#64748b",
                        borderBottom: "2px solid #e2e8f0",
                      }}
                    >
                      Fecha
                    </th>
                    <th
                      style={{
                        padding: "12px 16px",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#64748b",
                        borderBottom: "2px solid #e2e8f0",
                      }}
                    >
                      Producto
                    </th>
                    <th
                      style={{
                        padding: "12px 16px",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#64748b",
                        textAlign: "right",
                        borderBottom: "2px solid #e2e8f0",
                      }}
                    >
                      Cantidad
                    </th>
                    <th
                      style={{
                        padding: "12px 16px",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#64748b",
                        borderBottom: "2px solid #e2e8f0",
                      }}
                    >
                      Tipo
                    </th>
                    <th
                      style={{
                        padding: "12px 16px",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#64748b",
                        borderBottom: "2px solid #e2e8f0",
                      }}
                    >
                      Referencia
                    </th>
                    <th
                      style={{
                        padding: "12px 16px",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#64748b",
                        borderBottom: "2px solid #e2e8f0",
                      }}
                    >
                      Usuario
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {movimientos.map((m: any) => (
                    <tr
                      key={m.id}
                      style={{ borderBottom: "1px solid #f1f5f9" }}
                    >
                      <td
                        style={{
                          padding: "12px 16px",
                          fontSize: 13,
                          color: "#475569",
                        }}
                      >
                        {m.fecha_salida
                          ? new Date(m.fecha_salida).toLocaleString("es-HN", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          fontSize: 13,
                          color: "#1e293b",
                          fontWeight: 500,
                        }}
                      >
                        {productoMap[String(m.producto_id)] ||
                          String(m.producto_id)}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          fontSize: 13,
                          textAlign: "right",
                          color: "#1e293b",
                          fontWeight: 600,
                        }}
                      >
                        {m.cantidad}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 13 }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 10px",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            background:
                              m.tipo_de_movimiento === "ENTRADA"
                                ? "#dbeafe"
                                : "#fee2e2",
                            color:
                              m.tipo_de_movimiento === "ENTRADA"
                                ? "#1e40af"
                                : "#991b1b",
                          }}
                        >
                          {m.tipo_de_movimiento === "ENTRADA"
                            ? "📥 ENTRADA"
                            : "📤 SALIDA"}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          fontSize: 13,
                          color: "#64748b",
                        }}
                      >
                        {m.referencia}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          fontSize: 13,
                          color: "#64748b",
                        }}
                      >
                        {m.usuario}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {movimientos.length === 0 && (
                <div
                  style={{
                    padding: 32,
                    textAlign: "center",
                    color: "#94a3b8",
                    fontSize: 14,
                  }}
                >
                  No hay movimientos registrados.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
