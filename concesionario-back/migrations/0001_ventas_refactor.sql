-- =============================================================
-- MIGRACIÓN: Refactor Módulo de Ventas
-- Autor: figudieg  |  Fecha: 2026-05-08
-- =============================================================

BEGIN;

-- ------------------------------------------------------------
-- 1. NUEVO CAMPO: estado_comercial en vehiculo_nuevo
-- ------------------------------------------------------------
ALTER TABLE vehiculo_nuevo
    ADD COLUMN IF NOT EXISTS estado_comercial INTEGER NOT NULL DEFAULT 1;

-- Poblar con la lógica de negocio:
--   estado logístico 1 (En stock)       → Disponible (1)
--   estado logístico 2 (Reservado)      → Reservado  (2)
--   estado logístico 3,4,5 (En tránsito/otros no disponibles) → Disponible (1) hasta que lleguen
--   estado logístico 6 (Vendido)        → Vendido    (3)
--   estado logístico 7 (Baja/No disp.)  → No Disponible (4)
UPDATE vehiculo_nuevo
SET estado_comercial = CASE
    WHEN estado_id = 1 THEN 1  -- En stock → Disponible
    WHEN estado_id = 2 THEN 2  -- Reservado → Reservado
    WHEN estado_id IN (3, 4, 5) THEN 1  -- En tránsito → Disponible (llegará)
    WHEN estado_id = 6 THEN 3  -- Vendido → Vendido
    WHEN estado_id = 7 THEN 4  -- Dado de baja → No Disponible
    ELSE 1
END;

-- ------------------------------------------------------------
-- 2. TABLA: reserva
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reserva (
    id                  SERIAL PRIMARY KEY,
    vehiculo_id         INTEGER NOT NULL
                            REFERENCES vehiculo_nuevo(id) ON DELETE RESTRICT,
    cliente_id          INTEGER
                            REFERENCES cliente(id) ON DELETE SET NULL,
    vendedor_id         INTEGER
                            REFERENCES vendedor(id) ON DELETE SET NULL,
    orden_id            INTEGER UNIQUE
                            REFERENCES orden_venta(id) ON DELETE SET NULL,
    fecha_inicio        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_vencimiento   TIMESTAMPTZ NOT NULL,
    monto_separacion    NUMERIC(12, 2),
    estado              VARCHAR(20) NOT NULL DEFAULT 'ACTIVA'
                            CHECK (estado IN ('ACTIVA','VENCIDA','CONVERTIDA','CANCELADA')),
    notas               TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS idx_reserva_vehiculo   ON reserva(vehiculo_id);
CREATE INDEX IF NOT EXISTS idx_reserva_estado     ON reserva(estado);
CREATE INDEX IF NOT EXISTS idx_reserva_vencimiento ON reserva(fecha_vencimiento);

-- ------------------------------------------------------------
-- 3. TABLA: plan_pago
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS plan_pago (
    id              SERIAL PRIMARY KEY,
    orden_id        INTEGER NOT NULL UNIQUE
                        REFERENCES orden_venta(id) ON DELETE CASCADE,
    tipo            VARCHAR(20) NOT NULL DEFAULT 'CONTADO'
                        CHECK (tipo IN ('CONTADO','CUOTAS_FIJAS','HITOS')),
    total_acordado  NUMERIC(12, 2) NOT NULL,
    cuotas_totales  INTEGER NOT NULL DEFAULT 1,
    periodicidad    VARCHAR(20)
                        CHECK (periodicidad IN ('MENSUAL','TRIMESTRAL','SEMESTRAL')),
    fecha_inicio    DATE NOT NULL,
    estado          VARCHAR(20) NOT NULL DEFAULT 'ACTIVO'
                        CHECK (estado IN ('ACTIVO','COMPLETADO','EN_MORA','CANCELADO'))
);

-- ------------------------------------------------------------
-- 4. TABLA: cuota_plan
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS cuota_plan (
    id                  SERIAL PRIMARY KEY,
    plan_id             INTEGER NOT NULL
                            REFERENCES plan_pago(id) ON DELETE CASCADE,
    transaccion_id      INTEGER
                            REFERENCES transaccion_pago(id) ON DELETE SET NULL,
    numero_cuota        INTEGER NOT NULL,
    monto_esperado      NUMERIC(12, 2) NOT NULL,
    fecha_vencimiento   DATE NOT NULL,
    fecha_pago_real     DATE,
    estado              VARCHAR(20) NOT NULL DEFAULT 'PENDIENTE'
                            CHECK (estado IN ('PENDIENTE','PAGADA','VENCIDA','PERDONADA')),
    UNIQUE (plan_id, numero_cuota)
);

CREATE INDEX IF NOT EXISTS idx_cuota_plan_plan   ON cuota_plan(plan_id);
CREATE INDEX IF NOT EXISTS idx_cuota_plan_estado ON cuota_plan(estado);

-- ------------------------------------------------------------
-- 5. VERIFICACIÓN
-- ------------------------------------------------------------
DO $$
BEGIN
    ASSERT (SELECT COUNT(*) FROM information_schema.columns
            WHERE table_name='vehiculo_nuevo' AND column_name='estado_comercial') = 1,
           'ERROR: columna estado_comercial no creada';
    ASSERT (SELECT COUNT(*) FROM information_schema.tables
            WHERE table_name='reserva') = 1,
           'ERROR: tabla reserva no creada';
    ASSERT (SELECT COUNT(*) FROM information_schema.tables
            WHERE table_name='plan_pago') = 1,
           'ERROR: tabla plan_pago no creada';
    ASSERT (SELECT COUNT(*) FROM information_schema.tables
            WHERE table_name='cuota_plan') = 1,
           'ERROR: tabla cuota_plan no creada';
    RAISE NOTICE 'Migración verificada correctamente.';
END $$;

COMMIT;
