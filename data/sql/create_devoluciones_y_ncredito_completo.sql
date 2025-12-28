-- ============================================
-- SCRIPT COMPLETO PARA DEVOLUCIONES Y NOTAS DE CRÉDITO
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. DEVOLUCIONES A PROVEEDORES
-- ============================================

-- Tabla maestra de devoluciones a proveedores
CREATE TABLE IF NOT EXISTS devoluciones_proveedores (
  id bigserial PRIMARY KEY,
  proveedor_id bigint NOT NULL,
  numero_documento text,
  usuario text,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT fk_proveedor FOREIGN KEY (proveedor_id) 
    REFERENCES proveedores(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_dev_prov_proveedor ON devoluciones_proveedores(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_dev_prov_numero_doc ON devoluciones_proveedores(numero_documento);
CREATE INDEX IF NOT EXISTS idx_dev_prov_created_at ON devoluciones_proveedores(created_at DESC);

COMMENT ON TABLE devoluciones_proveedores IS 'Registro de devoluciones de productos hacia proveedores';

-- Tabla de detalles de devoluciones a proveedores
CREATE TABLE IF NOT EXISTS devoluciones_proveedores_detalle (
  id bigserial PRIMARY KEY,
  devolucion_id bigint NOT NULL,
  producto_id bigint NOT NULL,
  cantidad numeric(10, 2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  
  CONSTRAINT fk_devolucion FOREIGN KEY (devolucion_id) 
    REFERENCES devoluciones_proveedores(id) ON DELETE CASCADE,
  CONSTRAINT fk_producto FOREIGN KEY (producto_id) 
    REFERENCES inventario(id) ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_dev_prov_det_devolucion ON devoluciones_proveedores_detalle(devolucion_id);
CREATE INDEX IF NOT EXISTS idx_dev_prov_det_producto ON devoluciones_proveedores_detalle(producto_id);

COMMENT ON TABLE devoluciones_proveedores_detalle IS 'Detalles de productos devueltos en cada devolución a proveedor';


-- ============================================
-- 2. NOTAS DE CRÉDITO (ncredito)
-- ============================================

CREATE TABLE IF NOT EXISTS ncredito (
  id bigserial PRIMARY KEY,
  cai text,
  identificador text,
  rango_de text,
  rango_hasta text,
  fecha_vencimiento timestamptz,
  secuencia_actual text,
  caja integer,
  cajero text,
  usuario_id bigint,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ncredito_usuario ON ncredito(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ncredito_caja ON ncredito(caja);
CREATE INDEX IF NOT EXISTS idx_ncredito_cajero ON ncredito(cajero);
CREATE INDEX IF NOT EXISTS idx_ncredito_fecha_venc ON ncredito(fecha_vencimiento);

COMMENT ON TABLE ncredito IS 'Registro de CAI para notas de crédito - sistema de autorización similar a facturación';

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ncredito_updated_at 
  BEFORE UPDATE ON ncredito 
  FOR EACH ROW 
  EXECUTE PROCEDURE update_updated_at_column();


-- ============================================
-- 3. POLÍTICAS RLS (Row Level Security)
-- Descomentar si necesitas habilitar RLS
-- ============================================

-- Devoluciones a proveedores
-- ALTER TABLE devoluciones_proveedores ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE devoluciones_proveedores_detalle ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Allow all for authenticated users" 
--   ON devoluciones_proveedores FOR ALL 
--   TO authenticated USING (true) WITH CHECK (true);

-- CREATE POLICY "Allow all for authenticated users" 
--   ON devoluciones_proveedores_detalle FOR ALL 
--   TO authenticated USING (true) WITH CHECK (true);

-- Notas de crédito
-- ALTER TABLE ncredito ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Allow all for authenticated users" 
--   ON ncredito FOR ALL 
--   TO authenticated USING (true) WITH CHECK (true);


-- ============================================
-- 4. VERIFICACIÓN DE TABLAS CREADAS
-- ============================================

SELECT 
  table_name, 
  (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('devoluciones_proveedores', 'devoluciones_proveedores_detalle', 'ncredito')
ORDER BY table_name;
