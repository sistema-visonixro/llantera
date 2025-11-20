import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  title?: string;
  columns: string[];
  initialData?: any;
  onClose: () => void;
  onSave: (data: any) => Promise<void>;
};

export default function RecordFormModal({
  open,
  title = "Formulario",
  columns,
  initialData = {},
  onClose,
  onSave,
}: Props) {
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    setForm(initialData || {});
    // set preview for existing imagen URL
    if (initialData && typeof initialData.imagen === "string") {
      setPreview(initialData.imagen as string);
    } else {
      setPreview(null);
    }
  }, [initialData, open]);

  if (!open) return null;

  const handleChange = (col: string, value: any) => {
    setForm((s: any) => ({ ...s, [col]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await onSave(form);
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (col: string) => {
    // Hide creado_en from the form (we rely on DB default NOW())
    if (col === "creado_en") return null;

    if (col === "id") {
      return <input className="input" value={form[col] ?? ""} readOnly />;
    }

    // Better UI for boolean switches (toggles)
    if (
      col.includes("publicacion") ||
      col.includes("exento") ||
      col === "publicacion_web"
    ) {
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <label className="switch">
            <input
              type="checkbox"
              checked={Boolean(form[col])}
              onChange={(e) => handleChange(col, e.target.checked)}
            />
            <span className="slider" />
          </label>
          <span style={{ fontSize: 13 }}>{form[col] ? "Sí" : "No"}</span>
        </div>
      );
    }

    if (col.includes("categoria") || col.includes("marca")) {
      return (
        <input
          type="text"
          className="input"
          value={form[col] ?? ""}
          onChange={(e) => handleChange(col, e.target.value === "" ? null : e.target.value)}
        />
      );
    }

    if (col === "imagen") {
      return (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {preview ? (
            <img
              src={preview}
              alt="preview"
              style={{ maxWidth: 200, maxHeight: 120, objectFit: "contain" }}
            />
          ) : null}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const f = e.target.files && e.target.files[0];
              handleChange(col, f ?? null);
              if (f) {
                try {
                  const url = URL.createObjectURL(f);
                  setPreview(url);
                } catch (err) {
                  setPreview(null);
                }
              } else {
                setPreview(null);
              }
            }}
          />
          {preview ? (
            <button
              type="button"
              className="btn-opaque"
              onClick={() => {
                handleChange(col, null);
                setPreview(null);
              }}
            >
              Eliminar imagen
            </button>
          ) : null}
        </div>
      );
    }

    return (
      <input
        className="input"
        value={form[col] ?? ""}
        onChange={(e) => handleChange(col, e.target.value)}
      />
    );
  };

  const modal = (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.45)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: 18,
          borderRadius: 8,
          width: 720,
          maxHeight: "90vh",
          overflow: "auto",
        }}
      >
        <h3 style={{ marginTop: 0 }}>{title}</h3>
        <form onSubmit={handleSubmit}>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
          >
            {columns.map((col) => (
              <label key={col} style={{ display: "block" }}>
                <div
                  style={{ fontSize: 12, color: "#374151", marginBottom: 6 }}
                >
                  {String(col).replace(/_/g, " ").toUpperCase()}
                </div>
                {renderInput(col)}
              </label>
            ))}
          </div>

          <div
            style={{
              marginTop: 12,
              display: "flex",
              gap: 8,
              justifyContent: "flex-end",
            }}
          >
            <button
              type="button"
              className="btn-opaque"
              onClick={onClose}
              disabled={saving}
            >
              Cancelar
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return createPortal(
    modal,
    (typeof document !== "undefined" && document.body) ||
      document.createElement("div")
  );
}
