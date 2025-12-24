import React, { useEffect, useState } from "react";
import supabase from "../../lib/supabaseClient";

type Cuenta = {
  id: number;
  codigo: string;
  nombre: string;
  tipo: "activo" | "pasivo" | "patrimonio" | "ingreso" | "gasto";
  descripcion?: string;
  cuenta_padre_id?: number;
  activo: boolean;
};

export default function CuentasContables() {
  const [cuentas, setCuentas] = useState<Cuenta[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingCuenta, setEditingCuenta] = useState<Cuenta | null>(null);
  const [formData, setFormData] = useState({
    codigo: "",
    nombre: "",
    tipo: "activo" as Cuenta["tipo"],
    descripcion: "",
    cuenta_padre_id: "",
    activo: true,
  });

  const fetchCuentas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("cuentas_contables")
        .select("*")
        .order("codigo", { ascending: true });
      if (error) throw error;
      setCuentas(data || []);
    } catch (err) {
      console.error("Error fetching cuentas contables", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCuentas();
  }, []);

  const handleOpenModal = (cuenta?: Cuenta) => {
    if (cuenta) {
      setEditingCuenta(cuenta);
      setFormData({
        codigo: cuenta.codigo,
        nombre: cuenta.nombre,
        tipo: cuenta.tipo,
        descripcion: cuenta.descripcion || "",
        cuenta_padre_id: cuenta.cuenta_padre_id?.toString() || "",
        activo: cuenta.activo,
      });
    } else {
      setEditingCuenta(null);
      setFormData({
        codigo: "",
        nombre: "",
        tipo: "activo",
        descripcion: "",
        cuenta_padre_id: "",
        activo: true,
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      const payload: any = {
        codigo: formData.codigo,
        nombre: formData.nombre,
        tipo: formData.tipo,
        descripcion: formData.descripcion || null,
        cuenta_padre_id: formData.cuenta_padre_id
          ? parseInt(formData.cuenta_padre_id)
          : null,
        activo: formData.activo,
      };

      if (editingCuenta) {
        const { error } = await supabase
          .from("cuentas_contables")
          .update(payload)
          .eq("id", editingCuenta.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("cuentas_contables")
          .insert([payload]);
        if (error) throw error;
      }

      setShowModal(false);
      fetchCuentas();
    } catch (err) {
      console.error("Error saving cuenta", err);
      alert("Error al guardar la cuenta");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar esta cuenta?")) return;
    try {
      const { error } = await supabase
        .from("cuentas_contables")
        .delete()
        .eq("id", id);
      if (error) throw error;
      fetchCuentas();
    } catch (err) {
      console.error("Error deleting cuenta", err);
      alert("Error al eliminar la cuenta");
    }
  };

  const getCuentaNombre = (id?: number) => {
    if (!id) return "-";
    const cuenta = cuentas.find((c) => c.id === id);
    return cuenta ? `${cuenta.codigo} - ${cuenta.nombre}` : "-";
  };

  return (
    <div style={{ padding: 18 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h2 style={{ margin: 0 }}>Plan de Cuentas Contables</h2>
        <button className="btn-opaque" onClick={() => handleOpenModal()}>
          + Nueva Cuenta
        </button>
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div style={{ background: "white", padding: 12, borderRadius: 8 }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}
          >
            <thead>
              <tr style={{ background: "#eef2f7", textAlign: "left" }}>
                <th style={{ padding: 12, fontWeight: 700 }}>Código</th>
                <th style={{ padding: 12, fontWeight: 700 }}>Nombre</th>
                <th style={{ padding: 12, fontWeight: 700 }}>Tipo</th>
                <th style={{ padding: 12, fontWeight: 700 }}>Cuenta Padre</th>
                <th style={{ padding: 12, fontWeight: 700 }}>Estado</th>
                <th style={{ padding: 12, fontWeight: 700 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cuentas.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: 24,
                      textAlign: "center",
                      color: "#94a3b8",
                    }}
                  >
                    No hay cuentas registradas
                  </td>
                </tr>
              ) : (
                cuentas.map((cuenta) => (
                  <tr
                    key={cuenta.id}
                    style={{ borderBottom: "1px solid #e2e8f0" }}
                  >
                    <td style={{ padding: 12 }}>{cuenta.codigo}</td>
                    <td style={{ padding: 12 }}>{cuenta.nombre}</td>
                    <td style={{ padding: 12 }}>
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          background:
                            cuenta.tipo === "activo"
                              ? "#dbeafe"
                              : cuenta.tipo === "pasivo"
                              ? "#fef3c7"
                              : cuenta.tipo === "ingreso"
                              ? "#dcfce7"
                              : cuenta.tipo === "gasto"
                              ? "#fee2e2"
                              : "#f3e8ff",
                          color:
                            cuenta.tipo === "activo"
                              ? "#1e40af"
                              : cuenta.tipo === "pasivo"
                              ? "#92400e"
                              : cuenta.tipo === "ingreso"
                              ? "#15803d"
                              : cuenta.tipo === "gasto"
                              ? "#991b1b"
                              : "#6b21a8",
                        }}
                      >
                        {cuenta.tipo.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: 12, fontSize: 12, color: "#64748b" }}>
                      {getCuentaNombre(cuenta.cuenta_padre_id)}
                    </td>
                    <td style={{ padding: 12 }}>
                      <span
                        style={{
                          padding: "4px 8px",
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600,
                          background: cuenta.activo ? "#dcfce7" : "#fee2e2",
                          color: cuenta.activo ? "#15803d" : "#991b1b",
                        }}
                      >
                        {cuenta.activo ? "ACTIVA" : "INACTIVA"}
                      </span>
                    </td>
                    <td style={{ padding: 12 }}>
                      <button
                        onClick={() => handleOpenModal(cuenta)}
                        style={{
                          marginRight: 8,
                          padding: "4px 8px",
                          fontSize: 12,
                        }}
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(cuenta.id)}
                        style={{
                          padding: "4px 8px",
                          fontSize: 12,
                          background: "#fee2e2",
                          color: "#991b1b",
                        }}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "white",
              padding: 24,
              borderRadius: 8,
              width: 500,
              maxHeight: "90vh",
              overflow: "auto",
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              {editingCuenta ? "Editar Cuenta" : "Nueva Cuenta"}
            </h3>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  color: "#475569",
                  marginBottom: 4,
                }}
              >
                Código *
              </label>
              <input
                className="input"
                value={formData.codigo}
                onChange={(e) =>
                  setFormData({ ...formData, codigo: e.target.value })
                }
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  color: "#475569",
                  marginBottom: 4,
                }}
              >
                Nombre *
              </label>
              <input
                className="input"
                value={formData.nombre}
                onChange={(e) =>
                  setFormData({ ...formData, nombre: e.target.value })
                }
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  color: "#475569",
                  marginBottom: 4,
                }}
              >
                Tipo *
              </label>
              <select
                className="input"
                value={formData.tipo}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    tipo: e.target.value as Cuenta["tipo"],
                  })
                }
              >
                <option value="activo">Activo</option>
                <option value="pasivo">Pasivo</option>
                <option value="patrimonio">Patrimonio</option>
                <option value="ingreso">Ingreso</option>
                <option value="gasto">Gasto</option>
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  color: "#475569",
                  marginBottom: 4,
                }}
              >
                Cuenta Padre (opcional)
              </label>
              <select
                className="input"
                value={formData.cuenta_padre_id}
                onChange={(e) =>
                  setFormData({ ...formData, cuenta_padre_id: e.target.value })
                }
              >
                <option value="">Sin cuenta padre</option>
                {cuentas
                  .filter((c) => c.id !== editingCuenta?.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.codigo} - {c.nombre}
                    </option>
                  ))}
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  color: "#475569",
                  marginBottom: 4,
                }}
              >
                Descripción
              </label>
              <textarea
                className="input"
                rows={3}
                value={formData.descripcion}
                onChange={(e) =>
                  setFormData({ ...formData, descripcion: e.target.value })
                }
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label
                style={{ display: "flex", alignItems: "center", fontSize: 13 }}
              >
                <input
                  type="checkbox"
                  checked={formData.activo}
                  onChange={(e) =>
                    setFormData({ ...formData, activo: e.target.checked })
                  }
                  style={{ marginRight: 8 }}
                />
                Cuenta activa
              </label>
            </div>

            <div
              style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}
            >
              <button
                className="btn-opaque"
                onClick={() => setShowModal(false)}
              >
                Cancelar
              </button>
              <button className="btn-opaque" onClick={handleSave}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
