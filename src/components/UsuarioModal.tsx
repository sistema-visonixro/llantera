import React, { useState, useEffect } from "react";

type UsuarioModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (data: {
    username: string;
    password?: string;
    nombre_usuario: string;
    role: string;
  }) => Promise<void>;
  editUser?: {
    id: number;
    username: string;
    nombre_usuario: string;
    role: string;
  } | null;
};

export default function UsuarioModal({
  open,
  onClose,
  onSave,
  editUser,
}: UsuarioModalProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [nombreUsuario, setNombreUsuario] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && editUser) {
      setUsername(editUser.username || "");
      setNombreUsuario(editUser.nombre_usuario || "");
      setPassword("");
      setError(null);
    } else if (open && !editUser) {
      setUsername("");
      setPassword("");
      setNombreUsuario("");
      setError(null);
    }
  }, [open, editUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim()) {
      setError("El nombre de usuario es requerido");
      return;
    }

    if (!editUser && !password.trim()) {
      setError("La contraseña es requerida para usuarios nuevos");
      return;
    }

    if (!nombreUsuario.trim()) {
      setError("El nombre completo es requerido");
      return;
    }

    setLoading(true);
    try {
      const data: any = {
        username: username.trim(),
        nombre_usuario: nombreUsuario.trim(),
        role: "cajero",
      };
      if (password.trim()) {
        data.password = password;
      }
      await onSave(data);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Error al guardar el usuario");
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <>
      <style>{`
        .usuario-modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(2, 6, 23, 0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          animation: fadeIn 200ms ease-out;
        }
        .usuario-modal-content {
          background: white;
          border-radius: 12px;
          padding: 24px;
          width: 90%;
          max-width: 520px;
          box-shadow: 0 20px 60px rgba(2, 6, 23, 0.3);
          animation: slideUp 250ms ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px) scale(0.98);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .usuario-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 12px;
          border-bottom: 2px solid #e2e8f0;
        }
        .usuario-modal-title {
          font-size: 1.25rem;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }
        .usuario-modal-close {
          background: transparent;
          border: none;
          font-size: 1.5rem;
          color: #64748b;
          cursor: pointer;
          padding: 4px 8px;
          line-height: 1;
          transition: color 150ms;
        }
        .usuario-modal-close:hover {
          color: #1e293b;
        }
        .usuario-form-group {
          margin-bottom: 16px;
        }
        .usuario-form-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          color: #334155;
          margin-bottom: 6px;
        }
        .usuario-form-input {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 0.95rem;
          transition: border-color 150ms, box-shadow 150ms;
          box-sizing: border-box;
        }
        .usuario-form-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .usuario-form-select {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 0.95rem;
          background: white;
          cursor: pointer;
          transition: border-color 150ms;
        }
        .usuario-form-select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .usuario-error {
          background: #fee2e2;
          border: 1px solid #fca5a5;
          color: #b91c1c;
          padding: 10px 12px;
          border-radius: 8px;
          font-size: 0.875rem;
          margin-bottom: 16px;
        }
        .usuario-form-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
        }
        .usuario-btn {
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 0.95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 150ms;
          border: none;
        }
        .usuario-btn-primary {
          background: #3b82f6;
          color: white;
        }
        .usuario-btn-primary:hover:not(:disabled) {
          background: #2563eb;
        }
        .usuario-btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .usuario-btn-secondary {
          background: #f1f5f9;
          color: #334155;
          border: 1px solid #cbd5e1;
        }
        .usuario-btn-secondary:hover:not(:disabled) {
          background: #e2e8f0;
        }
        .usuario-hint {
          font-size: 0.8rem;
          color: #64748b;
          margin-top: 4px;
        }
      `}</style>
      <div className="usuario-modal-backdrop">
        <div className="usuario-modal-content">
          <div className="usuario-modal-header">
            <h3 className="usuario-modal-title">
              {editUser ? "Editar Usuario" : "Nuevo Usuario"}
            </h3>
            <button
              className="usuario-modal-close"
              onClick={onClose}
              type="button"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {error && <div className="usuario-error">{error}</div>}

            <div className="usuario-form-group">
              <label className="usuario-form-label" htmlFor="username">
                Nombre de usuario *
              </label>
              <input
                id="username"
                type="text"
                className="usuario-form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ej: jperez"
                disabled={loading}
                autoComplete="off"
              />
            </div>

            <div className="usuario-form-group">
              <label className="usuario-form-label" htmlFor="nombreUsuario">
                Nombre completo *
              </label>
              <input
                id="nombreUsuario"
                type="text"
                className="usuario-form-input"
                value={nombreUsuario}
                onChange={(e) => setNombreUsuario(e.target.value)}
                placeholder="Ej: Juan Pérez"
                disabled={loading}
                autoComplete="off"
              />
            </div>

            <div className="usuario-form-group">
              <label className="usuario-form-label" htmlFor="password">
                Contraseña {editUser && "(dejar vacío para no cambiar)"}
                {!editUser && " *"}
              </label>
              <input
                id="password"
                type="password"
                className="usuario-form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  editUser ? "Nueva contraseña (opcional)" : "Contraseña"
                }
                disabled={loading}
                autoComplete="new-password"
              />
              {editUser && (
                <div className="usuario-hint">
                  Solo ingresa una contraseña si deseas cambiarla
                </div>
              )}
            </div>

            <div className="usuario-form-actions">
              <button
                type="button"
                className="usuario-btn usuario-btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="usuario-btn usuario-btn-primary"
                disabled={loading}
              >
                {loading
                  ? "Guardando..."
                  : editUser
                  ? "Guardar cambios"
                  : "Crear usuario"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
