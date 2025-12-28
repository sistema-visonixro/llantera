-- ============================================
-- TABLAS PARA DEVOLUCIONES A PROVEEDORES
-- ============================================

-- Tabla maestra de devoluciones a proveedores
CREATE TABLE IF NOT EXISTS devoluciones_proveedores (
  id bigserial PRIMARY KEY,
  proveedor_id bigint NOT NULL,
  numero_documento text,
  usuario text,
  created_at timestamptz DEFAULT now(),
  
  -- Foreign key (opcional, depende si la tabla proveedores existe)
  CONSTRAINT fk_proveedor FOREIGN KEY (proveedor_id) 
    REFERENCES proveedores(id) ON DELETE CASCADE
);

-- Índices para devoluciones_proveedores
CREATE INDEX IF NOT EXISTS idx_dev_prov_proveedor ON devoluciones_proveedores(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_dev_prov_numero_doc ON devoluciones_proveedores(numero_documento);
CREATE INDEX IF NOT EXISTS idx_dev_prov_created_at ON devoluciones_proveedores(created_at DESC);

-- Comentarios
COMMENT ON TABLE devoluciones_proveedores IS 'Registro de devoluciones de productos hacia proveedores';
COMMENT ON COLUMN devoluciones_proveedores.proveedor_id IS 'ID del proveedor al que se devuelve';
COMMENT ON COLUMN devoluciones_proveedores.numero_documento IS 'Número de documento de la compra original (opcional)';
COMMENT ON COLUMN devoluciones_proveedores.usuario IS 'Usuario que registró la devolución';


-- ============================================
-- Tabla de detalles de devoluciones a proveedores
CREATE TABLE IF NOT EXISTS devoluciones_proveedores_detalle (
  id bigserial PRIMARY KEY,
  devolucion_id bigint NOT NULL,
  producto_id bigint NOT NULL,
  cantidad numeric(10, 2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  
  -- Foreign keys
  CONSTRAINT fk_devolucion FOREIGN KEY (devolucion_id) 
    REFERENCES devoluciones_proveedores(id) ON DELETE CASCADE,
  CONSTRAINT fk_producto FOREIGN KEY (producto_id) 
    REFERENCES inventario(id) ON DELETE RESTRICT
);

-- Índices para devoluciones_proveedores_detalle
CREATE INDEX IF NOT EXISTS idx_dev_prov_det_devolucion ON devoluciones_proveedores_detalle(devolucion_id);
CREATE INDEX IF NOT EXISTS idx_dev_prov_det_producto ON devoluciones_proveedores_detalle(producto_id);

-- Comentarios
COMMENT ON TABLE devoluciones_proveedores_detalle IS 'Detalles de productos devueltos en cada devolución a proveedor';
COMMENT ON COLUMN devoluciones_proveedores_detalle.devolucion_id IS 'ID de la devolución maestra';
COMMENT ON COLUMN devoluciones_proveedores_detalle.producto_id IS 'ID del producto devuelto';
COMMENT ON COLUMN devoluciones_proveedores_detalle.cantidad IS 'Cantidad devuelta del producto';


-- ============================================
-- POLÍTICAS RLS (Row Level Security) - OPCIONAL
-- Descomentar si usas RLS en Supabase
-- ============================================

-- ALTER TABLE devoluciones_proveedores ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE devoluciones_proveedores_detalle ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Allow read for authenticated users" 
--   ON devoluciones_proveedores FOR SELECT 
--   TO authenticated USING (true);

-- CREATE POLICY "Allow insert for authenticated users" 
--   ON devoluciones_proveedores FOR INSERT 
--   TO authenticated WITH CHECK (true);

-- CREATE POLICY "Allow read for authenticated users" 
--   ON devoluciones_proveedores_detalle FOR SELECT 
--   TO authenticated USING (true);

-- CREATE POLICY "Allow insert for authenticated users" 
--   ON devoluciones_proveedores_detalle FOR INSERT 
--   TO authenticated WITH CHECK (true);
