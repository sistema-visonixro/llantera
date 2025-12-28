-- TABLAS BASE / INDEPENDIENTES
CREATE TABLE public.clientenatural (
rtn text NOT NULL,
nombre text NOT NULL,
CONSTRAINT clientenatural_pkey PRIMARY KEY (rtn)
);

CREATE TABLE public.empresa (
id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
rtn text NOT NULL,
nombre text NOT NULL,
telefono text,
email text,
direccion text,
logo text
);

CREATE TABLE public.impuesto (
id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
impuesto_venta numeric NOT NULL
);

-- USUARIOS
CREATE TABLE public.users (
id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
username text NOT NULL UNIQUE,
password text NOT NULL,
role text NOT NULL,
nombre_usuario text
);

CREATE TABLE public.usuarios_web (
id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
nombre text NOT NULL,
email text NOT NULL UNIQUE,
password text NOT NULL,
telefono text,
direccion text,
fecha_creacion timestamp without time zone DEFAULT now(),
estado text DEFAULT 'activo'::text
);

-- INVENTARIO Y PRECIOS
CREATE TABLE public.inventario (
id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
nombre text NOT NULL,
sku text NOT NULL UNIQUE,
codigo_barras text,
categoria text,
marca text,
descripcion text,
modelo text,
publicacion_web boolean DEFAULT false,
exento boolean DEFAULT false,
creado_en timestamp without time zone DEFAULT now(),
imagen text,
aplica_impuesto_18 boolean DEFAULT false,
aplica_impuesto_turistico boolean DEFAULT false,
tipo character varying DEFAULT 'producto'::character varying CHECK (tipo::text = ANY (ARRAY['producto'::character varying, 'servicio'::character varying]::text[]))
);

CREATE TABLE public.precios (
id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
producto_id uuid NOT NULL,
precio numeric NOT NULL CHECK (precio >= 0::numeric),
CONSTRAINT precios_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.inventario(id)
);

CREATE TABLE public.precios_historico (
id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
producto_id uuid NOT NULL,
precio numeric NOT NULL CHECK (precio >= 0::numeric),
cambiado_en timestamp without time zone DEFAULT now(),
CONSTRAINT precios_historico_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.inventario(id)
);

-- PROVEEDORES Y COMPRAS
CREATE TABLE public.proveedores (
id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
nombre text NOT NULL,
rtn text,
telefono text,
correo text,
direccion text,
tipo_proveedor text,
activo boolean DEFAULT true
);

CREATE TABLE public.compras (
id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
proveedor_id integer NOT NULL,
fecha_compra timestamp without time zone DEFAULT now(),
numero_documento text,
tipo_documento text,
subtotal numeric DEFAULT 0,
impuesto numeric DEFAULT 0,
total numeric DEFAULT 0,
usuario text
);

CREATE TABLE public.compras_detalle (
id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
compra_id integer NOT NULL,
producto_id uuid NOT NULL,
cantidad numeric NOT NULL,
costo_unitario numeric NOT NULL,
subtotal numeric ,
CONSTRAINT compras_detalle_compra_id_fkey FOREIGN KEY (compra_id) REFERENCES public.compras(id),
CONSTRAINT compras_detalle_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.inventario(id)
);

-- CLIENTES Y COTIZACIONES
CREATE TABLE public.clientes (
id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
nombre text NOT NULL,
rtn text,
telefono text,
tipo_cliente text CHECK (tipo_cliente = ANY (ARRAY['juridico'::text, 'natural'::text])),
correo_electronico text,
exonerado boolean DEFAULT false
);

CREATE TABLE public.cotizaciones (
id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
cliente_id integer,
usuario text NOT NULL,
fecha_cotizacion timestamp without time zone DEFAULT now(),
numero_cotizacion text UNIQUE,
validez_dias integer DEFAULT 30,
subtotal numeric DEFAULT 0,
impuesto numeric DEFAULT 0,
total numeric DEFAULT 0,
estado text DEFAULT 'pendiente'::text CHECK (estado = ANY (ARRAY['pendiente'::text, 'aceptada'::text, 'rechazada'::text])),
CONSTRAINT cotizaciones_cliente_id_fkey FOREIGN KEY (cliente_id) REFERENCES public.clientes(id)
);

CREATE TABLE public.cotizaciones_detalle (
id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
cotizacion_id uuid NOT NULL,
producto_id uuid,
descripcion text NOT NULL,
cantidad numeric NOT NULL,
precio_unitario numeric NOT NULL,
subtotal numeric NOT NULL,
descuento numeric DEFAULT 0,
total numeric NOT NULL,
CONSTRAINT cotizaciones_detalle_cotizacion_id_fkey FOREIGN KEY (cotizacion_id) REFERENCES public.cotizaciones(id),
CONSTRAINT cotizaciones_detalle_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.inventario(id)
);

-- VENTAS
CREATE TABLE public.ventas (
id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
usuario text NOT NULL,
fecha_venta timestamp without time zone DEFAULT now(),
factura text,
tipo_pago text,
subtotal numeric DEFAULT 0,
impuesto numeric DEFAULT 0,
total numeric DEFAULT 0,
estado text DEFAULT 'pagada'::text,
cai text,
fecha_limite_emision text,
rango_desde text,
rango_hasta text,
cambio text,
rtn text,
nombre_cliente text,
observaciones text,
isv_15 numeric NOT NULL DEFAULT 0,
isv_18 numeric NOT NULL DEFAULT 0,
isv_4 numeric NOT NULL DEFAULT 0,
sub_exonerado numeric NOT NULL DEFAULT 0,
sub_exento numeric NOT NULL DEFAULT 0,
sub_gravado numeric NOT NULL DEFAULT 0
);

CREATE TABLE public.ventas_detalle (
id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
venta_id uuid NOT NULL,
factura text,
producto_id uuid,
cantidad numeric NOT NULL,
precio_unitario numeric NOT NULL,
subtotal numeric NOT NULL,
descuento numeric DEFAULT 0,
total numeric NOT NULL,
descripcion text,
CONSTRAINT ventas_detalle_venta_id_fkey FOREIGN KEY (venta_id) REFERENCES public.ventas(id)
);

-- CAJA Y MOVIMIENTOS
CREATE TABLE public.caja_sesiones (
id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
usuario text NOT NULL,
fecha_apertura timestamp without time zone DEFAULT now(),
monto_inicial numeric NOT NULL,
total_ingresos numeric DEFAULT 0,
total_egresos numeric DEFAULT 0,
saldo_final numeric,
fecha_cierre timestamp without time zone,
estado text NOT NULL DEFAULT 'abierta'::text CHECK (estado = ANY (ARRAY['abierta'::text, 'cerrada'::text])),
efectivo_obtenido numeric DEFAULT 0,
dolares_obtenido numeric DEFAULT 0,
tarjeta_obtenido numeric DEFAULT 0,
transferencia_obtenido numeric DEFAULT 0,
efectivo_registrado numeric DEFAULT 0,
dolares_registrado numeric DEFAULT 0,
tarjeta_registrado numeric DEFAULT 0,
transferencia_registrado numeric DEFAULT 0,
diferencia numeric DEFAULT 0
);

CREATE TABLE public.caja_movimientos (
id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
tipo_movimiento text NOT NULL CHECK (tipo_movimiento = ANY (ARRAY['ingreso'::text, 'egreso'::text])),
monto numeric NOT NULL,
concepto text NOT NULL,
referencia text,
usuario text NOT NULL,
fecha timestamp without time zone DEFAULT now()
);

-- AUDITORÍA
CREATE TABLE public.auditoria (
id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
tabla text NOT NULL,
registro_id uuid,
accion text NOT NULL CHECK (accion = ANY (ARRAY['INSERT'::text, 'UPDATE'::text, 'DELETE'::text])),
usuario text NOT NULL,
fecha timestamp without time zone DEFAULT now(),
datos_anteriores jsonb,
datos_nuevos jsonb
);

-- CAI
CREATE TABLE public.cai (
id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
cajero text NOT NULL,
cai text NOT NULL,
rango_de text NOT NULL,
rango_hasta text NOT NULL,
fecha_vencimiento date NOT NULL,
caja text,
secuencia_actual text,
usuario_id integer,
identificador text,
CONSTRAINT fk_cai_usuario FOREIGN KEY (usuario_id) REFERENCES public.users(id)
);

-- REGISTRO DE INVENTARIO
CREATE TABLE public.registro_de_inventario (
id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
producto_id uuid NOT NULL,
cantidad numeric NOT NULL,
tipo_de_movimiento text NOT NULL CHECK (tipo_de_movimiento = ANY (ARRAY['ENTRADA'::text, 'SALIDA'::text])),
referencia text,
usuario text,
fecha_salida timestamp without time zone DEFAULT now(),
CONSTRAINT salidas_inventario_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.inventario(id)
);

-- PAGOS Y PEDIDOS WEB
CREATE TABLE public.pedidos_web (
id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
usuario_id uuid NOT NULL,
fecha_pedido timestamp without time zone DEFAULT now(),
subtotal numeric DEFAULT 0,
impuesto numeric DEFAULT 0,
total numeric DEFAULT 0,
estado text DEFAULT 'pendiente'::text CHECK (estado = ANY (ARRAY['pendiente'::text, 'pagado'::text, 'cancelado'::text, 'enviado'::text])),
CONSTRAINT pedidos_web_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios_web(id)
);

CREATE TABLE public.pedidos_web_detalle (
id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
pedido_id uuid NOT NULL,
producto_id uuid NOT NULL,
cantidad numeric NOT NULL,
precio_unitario numeric NOT NULL,
subtotal numeric NOT NULL,
descuento numeric DEFAULT 0,
total numeric NOT NULL,
CONSTRAINT pedidos_web_detalle_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES public.pedidos_web(id),
CONSTRAINT pedidos_web_detalle_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.inventario(id)
);

CREATE TABLE public.pagos_web (
id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
pedido_id uuid NOT NULL,
metodo_pago text NOT NULL,
monto numeric NOT NULL,
estado text DEFAULT 'pendiente'::text CHECK (estado = ANY (ARRAY['pendiente'::text, 'pagado'::text, 'rechazado'::text])),
fecha_pago timestamp without time zone DEFAULT now(),
referencia text,
CONSTRAINT pagos_web_pedido_id_fkey FOREIGN KEY (pedido_id) REFERENCES public.pedidos_web(id)
);

CREATE TABLE public.pagos (
id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
venta_id text,
tipo character varying NOT NULL,
monto numeric NOT NULL,
banco character varying,
tarjeta character varying,
factura text,
autorizador character varying,
referencia character varying,
meta jsonb,
created_by uuid,
created_at timestamp with time zone NOT NULL DEFAULT now(),
usuario_id integer,
usuario_nombre text,
valor_moneda text
);

CREATE TABLE public.pagos_backup (
id bigint,
venta_id bigint,
tipo character varying,
monto numeric,
banco character varying,
tarjeta character varying,
factura character varying,
autorizador character varying,
referencia character varying,
meta jsonb,
created_by uuid,
created_at timestamp with time zone
);

-- CARRITO
CREATE TABLE public.carrito_compras (
id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
usuario_id uuid NOT NULL,
producto_id uuid NOT NULL,
cantidad numeric NOT NULL,
precio_unitario numeric NOT NULL,
subtotal numeric NOT NULL,
fecha_agregado timestamp without time zone DEFAULT now(),
CONSTRAINT carrito_compras_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios_web(id),
CONSTRAINT carrito_compras_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.inventario(id)
);




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





CREATE TABLE IF NOT EXISTS devoluciones_proveedores_detalle (
  id bigserial PRIMARY KEY,
  devolucion_id bigint NOT NULL,
  producto_id bigint NOT NULL,
  cantidad numeric(10, 2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
  
 
);


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





-- Políticas para tablas públicas de negocio
CREATE POLICY "Permitir lectura pública de caja_movimientos"
ON public.caja_movimientos
FOR SELECT
TO public
USING (true);

CREATE POLICY "Permitir lectura pública de compras"
ON public.compras
FOR SELECT
TO public
USING (true);

CREATE POLICY "Permitir lectura pública de inventario"
ON public.inventario
FOR SELECT
TO public
USING (true);

CREATE POLICY "Permitir lectura pública de ventas"
ON public.ventas
FOR SELECT
TO public
USING (true);

CREATE POLICY "Permitir lectura pública de ventas_detalle"
ON public.ventas_detalle
FOR SELECT
TO public
USING (true);

-- Políticas para storage.objects (bucket inventario)
CREATE POLICY "imagen-ful tj1nch_0"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'inventario'::text);

CREATE POLICY "imagen-ful tj1nch_1"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'inventario'::text);

CREATE POLICY "imagen-ful tj1nch_2"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'inventario'::text);

CREATE POLICY "imagen-ful tj1nch_3"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'inventario'::text);

-- Políticas para storage.objects (bucket logo)
CREATE POLICY "logo 1zbfv_0"
ON storage.objects
FOR DELETE
TO public
USING (bucket_id = 'logo'::text);

CREATE POLICY "logo 1zbfv_1"
ON storage.objects
FOR UPDATE
TO public
USING (bucket_id = 'logo'::text);

CREATE POLICY "logo 1zbfv_2"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (bucket_id = 'logo'::text);

CREATE POLICY "logo 1zbfv_3"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'logo'::text);

-- crea bunkest : logo , inventario (los dos publicos)
