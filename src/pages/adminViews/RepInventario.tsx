import React, { useEffect, useState } from "react";
import supabase from "../../lib/supabaseClient";

type InventarioRow = {
  id: string;
  nombre: string;
  sku?: string;
  marca?: string;
  modelo?: string;
  categoria?: string;
  descripcion?: string;
};

export default function RepInventario() {
  const [sku, setSku] = useState("");
  const [marca, setMarca] = useState("");
  const [modelo, setModelo] = useState("");
  const [categoria, setCategoria] = useState("");
  const [rows, setRows] = useState<InventarioRow[]>([]);
  const [stockMap, setStockMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      let query: any = supabase
        .from("inventario")
        .select("id, nombre, sku, marca, modelo, categoria, descripcion");
      // Excluir productos de la categoría 'SERVICIOS' (case-insensitive)
      query = query.not("categoria", "ilike", "%servicios%");
      if (sku) query = query.ilike("sku", `%${sku}%`);
      if (marca) query = query.ilike("marca", `%${marca}%`);
      if (modelo) query = query.ilike("modelo", `%${modelo}%`);
      if (categoria) query = query.ilike("categoria", `%${categoria}%`);
      const { data, error } = await query.order("nombre", { ascending: true });
      if (error) throw error;
      const inv: InventarioRow[] = Array.isArray(data)
        ? (data as InventarioRow[])
        : [];
      setRows(inv);

      // Compute stock from registro_de_inventario: sum(ENTRADA) - sum(SALIDA)
      const ids = inv.map((r) => r.id);
      if (ids.length === 0) {
        setStockMap({});
        setLoading(false);
        return;
      }

      const { data: regData, error: regErr } = await supabase
        .from("registro_de_inventario")
        .select("producto_id, cantidad, tipo_de_movimiento")
        .in("producto_id", ids);
      if (regErr) throw regErr;
      const regRows = Array.isArray(regData) ? regData : [];

      const map: Record<string, number> = {};
      for (const r of inv) map[String(r.id)] = 0;

      for (const r of regRows) {
        const pid = String((r as any).producto_id);
        const qty = Number((r as any).cantidad) || 0;
        const tipo = String((r as any).tipo_de_movimiento || "").toUpperCase();
        if (!map.hasOwnProperty(pid)) map[pid] = 0;
        if (tipo === "ENTRADA") map[pid] = (map[pid] || 0) + qty;
        else if (tipo === "SALIDA") map[pid] = (map[pid] || 0) - qty;
      }

      for (const k of Object.keys(map))
        map[k] = Number((map[k] || 0).toFixed(2));
      setStockMap(map);
    } catch (err) {
      console.error("Error fetching inventario report", err);
      setRows([]);
      setStockMap({});
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(); /* eslint-disable-next-line */
  }, []);

  return (
    <div style={{ padding: 18 }}>
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            .printable, .printable * { visibility: visible; }
            .printable { position: absolute; left: 0; top: 0; width: 100%; }
            .no-print { display: none !important; }
          }
        `}
      </style>
      <h2 style={{ marginTop: 0 }}>Inventario (reportes)</h2>

      <div
        className="no-print"
        style={{
          display: "flex",
          gap: 12,
          marginBottom: 18,
          alignItems: "flex-end",
          flexWrap: "wrap",
        }}
      >
        <div>
          <label
            style={{
              display: "block",
              fontSize: 12,
              color: "#475569",
              marginBottom: 4,
            }}
          >
            SKU
          </label>
          <input
            className="input"
            type="text"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="Filtrar por SKU"
          />
        </div>
        <div>
          <label
            style={{
              display: "block",
              fontSize: 12,
              color: "#475569",
              marginBottom: 4,
            }}
          >
            Marca
          </label>
          <input
            className="input"
            type="text"
            value={marca}
            onChange={(e) => setMarca(e.target.value)}
            placeholder="Filtrar por marca"
          />
        </div>
        <div>
          <label
            style={{
              display: "block",
              fontSize: 12,
              color: "#475569",
              marginBottom: 4,
            }}
          >
            Modelo
          </label>
          <input
            className="input"
            type="text"
            value={modelo}
            onChange={(e) => setModelo(e.target.value)}
            placeholder="Filtrar por modelo"
          />
        </div>
        <div>
          <label
            style={{
              display: "block",
              fontSize: 12,
              color: "#475569",
              marginBottom: 4,
            }}
          >
            Categoría
          </label>
          <input
            className="input"
            type="text"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            placeholder="Filtrar por categoría"
          />
        </div>
        <div style={{ marginLeft: "auto" }}>
          <button className="btn-opaque" onClick={fetchData} disabled={loading}>
            {loading ? "Cargando..." : "Buscar"}
          </button>
          <button
            className="btn-opaque"
            onClick={() => window.print()}
            style={{ marginLeft: 8 }}
          >
            Imprimir Hoja de Toma
          </button>
        </div>
      </div>

      <div
        style={{ background: "white", padding: 12, borderRadius: 8 }}
        className="printable"
      >
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
            HOJA DE TOMA DE INVENTARIO
          </h3>
          <p style={{ margin: "8px 0 0 0", fontSize: 12, color: "#475569" }}>
            Fecha: {new Date().toLocaleDateString()}
          </p>
        </div>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: 12,
            color: "#0f1724",
          }}
        >
          <thead>
            <tr style={{ background: "#eef2f7", textAlign: "left" }}>
              <th
                style={{
                  padding: 8,
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#0b1220",
                  border: "1px solid #cbd5e1",
                }}
              >
                SKU
              </th>
              <th
                style={{
                  padding: 8,
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#0b1220",
                  border: "1px solid #cbd5e1",
                }}
              >
                PRODUCTO
              </th>
              <th
                style={{
                  padding: 8,
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#0b1220",
                  border: "1px solid #cbd5e1",
                }}
              >
                MARCA
              </th>
              <th
                style={{
                  padding: 8,
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#0b1220",
                  border: "1px solid #cbd5e1",
                }}
              >
                MODELO
              </th>
              <th
                style={{
                  padding: 8,
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#0b1220",
                  border: "1px solid #cbd5e1",
                }}
              >
                CATEGORÍA
              </th>
              <th
                style={{
                  padding: 8,
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#0b1220",
                  border: "1px solid #cbd5e1",
                  textAlign: "center",
                }}
              >
                STOCK SISTEMA
              </th>
              <th
                style={{
                  padding: 8,
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#0b1220",
                  border: "1px solid #cbd5e1",
                  textAlign: "center",
                }}
              >
                CONTEO FÍSICO
              </th>
              <th
                style={{
                  padding: 8,
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#0b1220",
                  border: "1px solid #cbd5e1",
                  textAlign: "center",
                }}
              >
                DIFERENCIA
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  style={{
                    padding: 24,
                    textAlign: "center",
                    color: "#94a3b8",
                    fontSize: 12,
                    border: "1px solid #cbd5e1",
                  }}
                >
                  No hay productos en el inventario
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const stock = stockMap[String(r.id)] || 0;
                return (
                  <tr key={r.id}>
                    <td
                      style={{
                        padding: 8,
                        fontSize: 11,
                        border: "1px solid #cbd5e1",
                      }}
                    >
                      {r.sku || ""}
                    </td>
                    <td
                      style={{
                        padding: 8,
                        fontSize: 11,
                        border: "1px solid #cbd5e1",
                      }}
                    >
                      {r.nombre}
                    </td>
                    <td
                      style={{
                        padding: 8,
                        fontSize: 11,
                        border: "1px solid #cbd5e1",
                      }}
                    >
                      {r.marca || ""}
                    </td>
                    <td
                      style={{
                        padding: 8,
                        fontSize: 11,
                        border: "1px solid #cbd5e1",
                      }}
                    >
                      {r.modelo || ""}
                    </td>
                    <td
                      style={{
                        padding: 8,
                        fontSize: 11,
                        border: "1px solid #cbd5e1",
                      }}
                    >
                      {r.categoria || ""}
                    </td>
                    <td
                      style={{
                        padding: 8,
                        fontSize: 11,
                        border: "1px solid #cbd5e1",
                        textAlign: "center",
                      }}
                    >
                      {stock}
                    </td>
                    <td
                      style={{
                        padding: 8,
                        fontSize: 11,
                        border: "1px solid #cbd5e1",
                        background: "#f8fafc",
                      }}
                    ></td>
                    <td
                      style={{
                        padding: 8,
                        fontSize: 11,
                        border: "1px solid #cbd5e1",
                        background: "#f8fafc",
                      }}
                    ></td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        <div
          style={{
            marginTop: 30,
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
          }}
        >
          <div style={{ width: "40%" }}>
            <p style={{ margin: "0 0 30px 0" }}>
              Realizado por: _______________________________
            </p>
            <p style={{ margin: 0 }}>Firma: _______________________________</p>
          </div>
          <div style={{ width: "40%" }}>
            <p style={{ margin: "0 0 30px 0" }}>
              Revisado por: _______________________________
            </p>
            <p style={{ margin: 0 }}>Firma: _______________________________</p>
          </div>
        </div>
      </div>
    </div>
  );
}
