import React, { useEffect, useState } from "react";
import SupabaseTable from "../../components/SupabaseTable";

export default function InventarioTable() {
  const [summary, setSummary] = useState<{
    categorias: number;
    marcas: number;
    items: number;
    publicadas: number;
    exentos: number;
  } | null>(null);
  const [selectedCategoria, setSelectedCategoria] = useState<string | "">("");
  const [selectedMarca, setSelectedMarca] = useState<string | "">("");
  const [categoriasList, setCategoriasList] = useState<string[]>([]);
  const [marcasList, setMarcasList] = useState<string[]>([]);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const sup = (await import("../../lib/supabaseClient")).default;
        // fetch relevant fields and compute counts client-side
        const res = await sup
          .from("inventario")
          .select("id,categoria,marca,publicacion_web,exento");
        if (!mounted) return;
        const rows = Array.isArray(res.data) ? res.data : [];
        const categoriasSet = new Set(rows.map((r: any) => (r.categoria ?? "")).filter(Boolean));
        const marcasSet = new Set(rows.map((r: any) => (r.marca ?? "")).filter(Boolean));
        const items = rows.length;
        const publicadas = rows.filter((r: any) => Boolean(r.publicacion_web)).length;
        const isExento = (v: any) => {
          if (v == null) return false;
          if (typeof v === "boolean") return v === true;
          if (typeof v === "number") return v === 1;
          const s = String(v).toLowerCase().trim();
          return s === "1" || s === "true" || s === "t" || s === "si" || s === "s" || s === "yes";
        };
        const exentos = rows.filter((r: any) => isExento(r.exento)).length;
        setSummary({
          categorias: categoriasSet.size,
          marcas: marcasSet.size,
          items,
          publicadas,
          exentos,
        });
        setCategoriasList(Array.from(categoriasSet).sort());
        setMarcasList(Array.from(marcasSet).sort());
      } catch (err) {
        console.error("Error loading inventario summary", err);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div>
      <h2 style={{ marginTop: 0 }}>PRODUCTOS</h2>

      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <Card label="Categorías (cuenta)" value={summary ? String(summary.categorias) : "..."} />
        <Card label="Marcas" value={summary ? String(summary.marcas) : "..."} />
        <Card label="Items" value={summary ? String(summary.items) : "..."} />
        <Card label="Publicadas en web" value={summary ? String(summary.publicadas) : "..."} />
        <Card label="Exentos" value={summary ? String(summary.exentos) : "..."} />
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ fontSize: 13, color: '#374151' }}>Categoria:</div>
          <select value={selectedCategoria} onChange={(e) => setSelectedCategoria(e.target.value)} className="input">
            <option value="">Todas</option>
            {categoriasList.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>

        <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ fontSize: 13, color: '#374151' }}>Marca:</div>
          <select value={selectedMarca} onChange={(e) => setSelectedMarca(e.target.value)} className="input">
            <option value="">Todas</option>
            {marcasList.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </label>

        <button className="btn-opaque" onClick={() => { setSelectedCategoria(""); setSelectedMarca(""); }}>
          Limpiar filtros
        </button>
        <button
          className="btn-opaque"
          onClick={() => {
            // apply print-only class to body so print CSS can hide other elements
            document.body.classList.add("print-table-only");
            // small timeout to let class apply
            setTimeout(() => {
              window.print();
              document.body.classList.remove("print-table-only");
            }, 50);
          }}
        >
          Imprimir tabla
        </button>
      </div>

      <SupabaseTable
        table="inventario"
        select="id, nombre, sku, codigo_barras, categoria, marca, descripcion, modelo, publicacion_web, exento, creado_en,imagen"
        title=""
        order={["id","categoria","marca"]}
        filters={{ categoria: selectedCategoria || undefined, marca: selectedMarca || undefined }}
        columns={[
          "imagen",
          "sku",
          "nombre",
          "marca",
          "modelo",
          "categoria",
          "descripcion",
          "publicacion_web",
          "exento",
          "creado_en",
        ]}
        searchColumns={["nombre", "sku", "descripcion", "codigo_barras", "modelo"]}
        formExclude={["codigo_barras", "creado_en"]}
        allowAdd={true}
        allowEdit={true}
        allowDelete={true}
      />
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ padding: 12, background: "#fff", borderRadius: 8, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", minWidth: 140 }}>
      <div style={{ fontSize: 12, color: "#6b7280" }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, marginTop: 6 }}>{value}</div>
    </div>
  );
}
