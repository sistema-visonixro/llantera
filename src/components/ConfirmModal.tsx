import React from "react";
import { createPortal } from "react-dom";

type Props = {
  open: boolean;
  title?: string;
  message?: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export default function ConfirmModal({
  open,
  title = "Confirmar",
  message = "¿Estás seguro?",
  onClose,
  onConfirm,
}: Props) {
  const [loading, setLoading] = React.useState(false);

  if (!open) return null;

  const handle = async () => {
    try {
      setLoading(true);
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
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
        style={{ background: "#fff", padding: 18, borderRadius: 8, width: 420 }}
      >
        <h3 style={{ marginTop: 0 }}>{title}</h3>
        <p>{message}</p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="btn-opaque" onClick={onClose} disabled={loading}>
            Cancelar
          </button>
          <button className="btn-danger" onClick={handle} disabled={loading}>
            {loading ? "..." : "Eliminar"}
          </button>
        </div>
      </div>
    </div>,
    (typeof document !== "undefined" && document.body) ||
      document.createElement("div")
  );
}
