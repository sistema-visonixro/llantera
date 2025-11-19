import React, { useState, useEffect, useCallback } from 'react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import supabase from '../../lib/supabaseClient';

interface CAI {
  id: number;
  cajero: string;
  cai: string;
  rango_de: string | null;
  rango_hasta: string | null;
  fecha_vencimiento: string | null;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-screen overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default function CAITable() {
  const [rows, setRows] = useState<CAI[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modales
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState<number | null>(null);
  const [editingRow, setEditingRow] = useState<CAI | null>(null);

  // Formulario
  const [form, setForm] = useState({
    cajero: '',
    cai: '',
    rango_de: '',
    rango_hasta: '',
    fecha_vencimiento: '',
  });

  const resetForm = () => {
    setForm({
      cajero: '',
      cai: '',
      rango_de: '',
      rango_hasta: '',
      fecha_vencimiento: '',
    });
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('cai')
        .select('*')
        .order('id', { ascending: true });

      if (error) throw error;
      setRows(data as CAI[]);
    } catch (err: any) {
      setError('Error al cargar los datos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cajero.trim() || !form.cai.trim()) {
      setError('Cajero y CAI son obligatorios');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (editModal && editingRow) {
        // Editar
        const { error } = await supabase
          .from('cai')
          .update({
            cajero: form.cajero.trim(),
            cai: form.cai.trim(),
            rango_de: form.rango_de.trim() || null,
            rango_hasta: form.rango_hasta.trim() || null,
            fecha_vencimiento: form.fecha_vencimiento || null,
          })
          .eq('id', editingRow.id);

        if (error) throw error;
        showSuccess('CAI actualizado correctamente');
        setEditModal(false);
      } else {
        // Crear
        const { error } = await supabase.from('cai').insert({
          cajero: form.cajero.trim(),
          cai: form.cai.trim(),
          rango_de: form.rango_de.trim() || null,
          rango_hasta: form.rango_hasta.trim() || null,
          fecha_vencimiento: form.fecha_vencimiento || null,
        });

        if (error) throw error;
        showSuccess('CAI creado exitosamente');
        setAddModal(false);
      }

      resetForm();
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (row: CAI) => {
    setEditingRow(row);
    setForm({
      cajero: row.cajero,
      cai: row.cai,
      rango_de: row.rango_de || '',
      rango_hasta: row.rango_hasta || '',
      fecha_vencimiento: row.fecha_vencimiento ? row.fecha_vencimiento.split('T')[0] : '',
    });
    setEditModal(true);
  };

  const confirmDelete = async () => {
    if (!deleteModal) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('cai').delete().eq('id', deleteModal);
      if (error) throw error;
      showSuccess('CAI eliminado');
      setDeleteModal(null);
      await loadData();
    } catch (err: any) {
      setError('Error al eliminar');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return <span className="text-gray-400">Sin fecha</span>;
    try {
      return format(parseISO(date), 'dd MMM yyyy', { locale: es });
    } catch {
      return date.split('T')[0].split('-').reverse().join('/');
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-12 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Gestión de CAI</h1>
            <p className="text-lg text-gray-600">Administra los códigos de autorización de impresión</p>
          </div>

          {/* Success & Error */}
          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded-xl flex items-center gap-3"
              >
                <CheckCircle2 className="w-5 h-5" />
                {success}
              </motion.div>
            )}
            {error && (
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -20, opacity: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center gap-3"
              >
                <AlertCircle className="w-5 h-5" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions Bar */}
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={() => { resetForm(); setAddModal(true); }}
              className="flex items-center gap-3 bg-blue-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-700 transition shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              Nuevo CAI
            </button>
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              Recargar
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
                  <tr>
                    <th className="px-6 py-5 text-left text-sm font-semibold">ID</th>
                    <th className="px-6 py-5 text-left text-sm font-semibold">Cajero</th>
                    <th className="px-6 py-5 text-left text-sm font-semibold">CAI</th>
                    <th className="px-6 py-5 text-left text-sm font-semibold">Rango</th>
                    <th className="px-6 py-5 text-left text-sm font-semibold">Vencimiento</th>
                    <th className="px-6 py-5 text-center text-sm font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    [...Array(6)].map((_, i) => (
                      <tr key={i}>
                        <td colSpan={6} className="px-6 py-8">
                          <div className="space-y-3">
                            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-16 text-gray-500 text-lg">
                        No hay registros CAI aún. ¡Crea el primero!
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-5 font-mono text-sm text-gray-600">#{row.id}</td>
                        <td className="px-6 py-5 font-semibold text-gray-900">{row.cajero}</td>
                        <td className="px-6 py-5 font-mono text-gray-800">{row.cai}</td>
                        <td className="px-6 py-5 text-sm text-gray-600">
                          {row.rango_de && row.rango_hasta 
                            ? `${row.rango_de} → ${row.rango_hasta}`
                            : <span className="text-gray-400">Sin rango</span>
                          }
                        </td>
                        <td className="px-6 py-5">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            row.fecha_vencimiento && new Date(row.fecha_vencimiento) < new Date()
                              ? 'bg-red-100 text-red-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {formatDate(row.fecha_vencimiento)}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-center">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => openEdit(row)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="Editar"
                            >
                              <Edit3 className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => setDeleteModal(row.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Eliminar"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {rows.length > 0 && (
              <div className="bg-gray-50 px-6 py-4 border-t">
                <p className="text-sm text-gray-600 font-medium">
                  Total: <span className="font-bold text-gray-900">{rows.length}</span> registro{rows.length !== 1 ? 's' : ''}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal Agregar / Editar */}
      <Modal
        isOpen={addModal || editModal}
        onClose={() => {
          setAddModal(false);
          setEditModal(false);
          resetForm();
          setEditingRow(null);
        }}
        title={editModal ? 'Editar CAI' : 'Nuevo CAI'}
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cajero *</label>
            <input
              type="text"
              required
              value={form.cajero}
              onChange={(e) => setForm({ ...form, cajero: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="Ej: Cajero Principal"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">CAI *</label>
            <input
              type="text"
              required
              value={form.cai}
              onChange={(e) => setForm({ ...form, cai: e.target.value.toUpperCase() })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="000000-0000-000000-000000-000000000000"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rango desde</label>
              <input
                type="text"
                value={form.rango_de}
                onChange={(e) => setForm({ ...form, rango_de: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                placeholder="000001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rango hasta</label>
              <input
                type="text"
                value={form.rango_hasta}
                onChange={(e) => setForm({ ...form, rango_hasta: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                placeholder="999999"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fecha de vencimiento</label>
            <input
              type="date"
              value={form.fecha_vencimiento}
              onChange={(e) => setForm({ ...form, fecha_vencimiento: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setAddModal(false);
                setEditModal(false);
                resetForm();
              }}
              className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:opacity-70"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {editModal ? 'Guardar Cambios' : 'Crear CAI'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Confirmar Eliminación */}
      <Modal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        title="¿Eliminar CAI?"
      >
        <div className="text-center py-6">
          <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">
            Esta acción no se puede deshacer
          </h3>
          <p className="text-gray-600 mb-8">
            Se eliminará permanentemente este registro CAI.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setDeleteModal(null)}
              className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              onClick={confirmDelete}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
              Sí, eliminar
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}