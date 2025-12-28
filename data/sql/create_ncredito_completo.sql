-- ============================================
-- TABLA PARA NOTAS DE CRÉDITO (ncredito)
-- Sistema de autorización de notas de crédito similar a CAI
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

-- Índices útiles
CREATE INDEX IF NOT EXISTS idx_ncredito_usuario ON ncredito(usuario_id);
CREATE INDEX IF NOT EXISTS idx_ncredito_caja ON ncredito(caja);
CREATE INDEX IF NOT EXISTS idx_ncredito_cajero ON ncredito(cajero);
CREATE INDEX IF NOT EXISTS idx_ncredito_fecha_venc ON ncredito(fecha_vencimiento);

-- Comentarios
COMMENT ON TABLE ncredito IS 'Registro de CAI para notas de crédito - similar a sistema de facturación';
COMMENT ON COLUMN ncredito.cai IS 'Código de Autorización de Impresión (CAI)';
COMMENT ON COLUMN ncredito.identificador IS 'Identificador único del rango de notas de crédito';
COMMENT ON COLUMN ncredito.rango_de IS 'Número inicial del rango autorizado';
COMMENT ON COLUMN ncredito.rango_hasta IS 'Número final del rango autorizado';
COMMENT ON COLUMN ncredito.fecha_vencimiento IS 'Fecha de vencimiento del CAI';
COMMENT ON COLUMN ncredito.secuencia_actual IS 'Último número de secuencia utilizado';
COMMENT ON COLUMN ncredito.caja IS 'Número de caja asignado';
COMMENT ON COLUMN ncredito.cajero IS 'Nombre del cajero asignado';
COMMENT ON COLUMN ncredito.usuario_id IS 'ID del usuario asignado';


-- ============================================
-- TRIGGER para actualizar updated_at automáticamente
-- ============================================

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
-- POLÍTICAS RLS (Row Level Security) - OPCIONAL
-- Descomentar si usas RLS en Supabase
-- ============================================

-- ALTER TABLE ncredito ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Allow read for authenticated users" 
--   ON ncredito FOR SELECT 
--   TO authenticated USING (true);

-- CREATE POLICY "Allow insert for authenticated users" 
--   ON ncredito FOR INSERT 
--   TO authenticated WITH CHECK (true);

-- CREATE POLICY "Allow update for authenticated users" 
--   ON ncredito FOR UPDATE 
--   TO authenticated USING (true) WITH CHECK (true);


-- ============================================
-- DATOS DE EJEMPLO (OPCIONAL)
-- ============================================

-- INSERT INTO ncredito (cai, identificador, rango_de, rango_hasta, fecha_vencimiento, secuencia_actual, caja, cajero, usuario_id)
-- VALUES 
--   ('A1B2C3D4-E5F6-7890', 'NC-001', '00001', '05000', '2025-12-31', '00000', 1, 'Maria Lopez', 1),
--   ('X9Y8Z7W6-V5U4-3210', 'NC-002', '05001', '10000', '2025-12-31', '00000', 2, 'Juan Perez', 2);
