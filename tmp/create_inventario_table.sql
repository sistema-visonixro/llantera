-- Script para crear la tabla `Inventario` en Supabase
CREATE TABLE IF NOT EXISTS Inventario (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    sku VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT,
    creado_en TIMESTAMP DEFAULT NOW()
);

-- Opcional: Insertar datos de ejemplo
INSERT INTO Inventario (nombre, sku, descripcion) VALUES
('Producto A', 'SKU001', 'Descripción del Producto A'),
('Producto B', 'SKU002', 'Descripción del Producto B');