-- ===========================================================================
-- Migracion evolutiva: AtencionMedica, CitaMedica y rediseno de Receta.
-- Escrita para ser idempente: no elimina datos historicos y puede
-- ejecutarse de forma segura aunque algunos pasos ya se hayan aplicado.
-- ===========================================================================

-- CreateEnum (idempotente)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'EstadoAtencionMedica') THEN
    CREATE TYPE "EstadoAtencionMedica" AS ENUM ('ABIERTA', 'FINALIZADA', 'ANULADA');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'EstadoReceta') THEN
    CREATE TYPE "EstadoReceta" AS ENUM ('BORRADOR', 'EMITIDA', 'ANULADA');
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typname = 'EstadoCitaMedica') THEN
    CREATE TYPE "EstadoCitaMedica" AS ENUM ('PROGRAMADA', 'CONFIRMADA', 'ATENDIDA', 'CANCELADA', 'NO_ASISTIO');
  END IF;
END $$;

-- AlterTable: nuevas columnas opcionales (sin datos previos) en modelos existentes
ALTER TABLE "EvaluacionMedica" ADD COLUMN IF NOT EXISTS "atencionMedicaId" UUID;
ALTER TABLE "FichaOcupacional" ADD COLUMN IF NOT EXISTS "atencionMedicaId" UUID;

-- AlterTable: Receta (conserva datos historicos). Columnas nuevas como nulables primero.
ALTER TABLE "Receta" ADD COLUMN IF NOT EXISTS "actualizadoEn" TIMESTAMP(3);
ALTER TABLE "Receta" ADD COLUMN IF NOT EXISTS "anuladaEn" DATE;
ALTER TABLE "Receta" ADD COLUMN IF NOT EXISTS "atencionMedicaId" UUID;
ALTER TABLE "Receta" ADD COLUMN IF NOT EXISTS "consultaMedicaId" UUID;
ALTER TABLE "Receta" ADD COLUMN IF NOT EXISTS "empresaDireccionHistorica" TEXT;
ALTER TABLE "Receta" ADD COLUMN IF NOT EXISTS "estado" "EstadoReceta" NOT NULL DEFAULT 'BORRADOR';
ALTER TABLE "Receta" ADD COLUMN IF NOT EXISTS "motivoAnulacion" TEXT;
ALTER TABLE "Receta" ADD COLUMN IF NOT EXISTS "numeroReceta" TEXT;
ALTER TABLE "Receta" ADD COLUMN IF NOT EXISTS "observaciones" TEXT;
ALTER TABLE "Receta" ADD COLUMN IF NOT EXISTS "profesionalCodigoHistorico" TEXT;
ALTER TABLE "Receta" ADD COLUMN IF NOT EXISTS "profesionalId" UUID;
ALTER TABLE "Receta" ADD COLUMN IF NOT EXISTS "recomendaciones" TEXT;

-- Soltar NOT NULL de columnas que ahora son opcionales
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Receta' AND column_name = 'evaluacionId' AND is_nullable = 'NO') THEN
    ALTER TABLE "Receta" ALTER COLUMN "evaluacionId" DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Receta' AND column_name = 'departamentoId' AND is_nullable = 'NO') THEN
    ALTER TABLE "Receta" ALTER COLUMN "departamentoId" DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Receta' AND column_name = 'asignacionLaboralId' AND is_nullable = 'NO') THEN
    ALTER TABLE "Receta" ALTER COLUMN "asignacionLaboralId" DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Receta' AND column_name = 'usuarioId' AND is_nullable = 'NO') THEN
    ALTER TABLE "Receta" ALTER COLUMN "usuarioId" DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Receta' AND column_name = 'departamentoNombreHistorico' AND is_nullable = 'NO') THEN
    ALTER TABLE "Receta" ALTER COLUMN "departamentoNombreHistorico" DROP NOT NULL;
  END IF;
END $$;

-- Backfill de Receta: conserva el profesional y datos previos (idempotente)
UPDATE "Receta"
SET "actualizadoEn" = now(),
    "numeroReceta" = 'R-' || replace(id::text, '-', ''),
    "profesionalId" = "usuarioId"
WHERE "actualizadoEn" IS NULL
   OR "numeroReceta" IS NULL
   OR "profesionalId" IS NULL;

-- Ahora las columnas requeridas quedan sin nulos
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Receta' AND column_name = 'actualizadoEn' AND is_nullable = 'YES') THEN
    ALTER TABLE "Receta" ALTER COLUMN "actualizadoEn" SET NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Receta' AND column_name = 'numeroReceta' AND is_nullable = 'YES') THEN
    ALTER TABLE "Receta" ALTER COLUMN "numeroReceta" SET NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Receta' AND column_name = 'profesionalId' AND is_nullable = 'YES') THEN
    ALTER TABLE "Receta" ALTER COLUMN "profesionalId" SET NOT NULL;
  END IF;
END $$;

-- AlterTable: RecetaMedicamento (conserva datos historicos)
ALTER TABLE "RecetaMedicamento" ADD COLUMN IF NOT EXISTS "cantidad" TEXT;
ALTER TABLE "RecetaMedicamento" ADD COLUMN IF NOT EXISTS "concentracionHistorica" TEXT;
ALTER TABLE "RecetaMedicamento" ADD COLUMN IF NOT EXISTS "intervaloHoras" INTEGER;
ALTER TABLE "RecetaMedicamento" ADD COLUMN IF NOT EXISTS "nombreMedicamentoHistorico" TEXT;
ALTER TABLE "RecetaMedicamento" ADD COLUMN IF NOT EXISTS "observaciones" TEXT;
ALTER TABLE "RecetaMedicamento" ADD COLUMN IF NOT EXISTS "orden" INTEGER NOT NULL DEFAULT 0;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'RecetaMedicamento' AND column_name = 'medicamentoId' AND is_nullable = 'NO') THEN
    ALTER TABLE "RecetaMedicamento" ALTER COLUMN "medicamentoId" DROP NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'RecetaMedicamento' AND column_name = 'nombreGenericoHistorico' AND is_nullable = 'NO') THEN
    ALTER TABLE "RecetaMedicamento" ALTER COLUMN "nombreGenericoHistorico" DROP NOT NULL;
  END IF;
END $$;

UPDATE "RecetaMedicamento"
SET "cantidad" = COALESCE("dosis", '1'),
    "nombreMedicamentoHistorico" = COALESCE("nombreComercialHistorico", "nombreGenericoHistorico", 'MEDICAMENTO')
WHERE "cantidad" IS NULL
   OR "nombreMedicamentoHistorico" IS NULL;

DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'RecetaMedicamento' AND column_name = 'cantidad' AND is_nullable = 'YES') THEN
    ALTER TABLE "RecetaMedicamento" ALTER COLUMN "cantidad" SET NOT NULL;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'RecetaMedicamento' AND column_name = 'nombreMedicamentoHistorico' AND is_nullable = 'YES') THEN
    ALTER TABLE "RecetaMedicamento" ALTER COLUMN "nombreMedicamentoHistorico" SET NOT NULL;
  END IF;
END $$;

-- CreateTable (idempotente)
CREATE TABLE IF NOT EXISTS "AtencionMedica" (
    "id" UUID NOT NULL,
    "trabajadorId" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "departamentoId" UUID,
    "asignacionLaboralId" UUID,
    "fechaAtencion" DATE NOT NULL,
    "horaAtencion" TIME,
    "motivoGeneral" TEXT,
    "profesionalResponsableId" UUID,
    "estado" "EstadoAtencionMedica" NOT NULL DEFAULT 'ABIERTA',
    "empresaNombreHistorico" TEXT NOT NULL,
    "empresaRucHistorico" TEXT NOT NULL,
    "departamentoNombreHistorico" TEXT,
    "trabajadorNombreHistorico" TEXT NOT NULL,
    "trabajadorDocumentoHistorico" TEXT NOT NULL,
    "creadoPorId" UUID,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "finalizadaEn" DATE,
    "anuladaEn" DATE,
    "motivoAnulacion" TEXT,

    CONSTRAINT "AtencionMedica_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CitaMedica" (
    "id" UUID NOT NULL,
    "trabajadorId" UUID NOT NULL,
    "empresaId" UUID,
    "departamentoId" UUID,
    "profesionalId" UUID,
    "atencionMedicaId" UUID,
    "fecha" DATE NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFin" TEXT,
    "motivo" TEXT NOT NULL,
    "observaciones" TEXT,
    "estado" "EstadoCitaMedica" NOT NULL DEFAULT 'PROGRAMADA',
    "recordatorio" BOOLEAN NOT NULL DEFAULT false,
    "creadoPorId" UUID,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "canceladaEn" DATE,
    "motivoCancelacion" TEXT,

    CONSTRAINT "CitaMedica_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (idempotente)
CREATE INDEX IF NOT EXISTS "AtencionMedica_trabajadorId_idx" ON "AtencionMedica"("trabajadorId");
CREATE INDEX IF NOT EXISTS "AtencionMedica_empresaId_idx" ON "AtencionMedica"("empresaId");
CREATE INDEX IF NOT EXISTS "AtencionMedica_departamentoId_idx" ON "AtencionMedica"("departamentoId");
CREATE INDEX IF NOT EXISTS "AtencionMedica_fechaAtencion_idx" ON "AtencionMedica"("fechaAtencion");
CREATE INDEX IF NOT EXISTS "AtencionMedica_estado_idx" ON "AtencionMedica"("estado");
CREATE INDEX IF NOT EXISTS "CitaMedica_trabajadorId_idx" ON "CitaMedica"("trabajadorId");
CREATE INDEX IF NOT EXISTS "CitaMedica_empresaId_idx" ON "CitaMedica"("empresaId");
CREATE INDEX IF NOT EXISTS "CitaMedica_profesionalId_idx" ON "CitaMedica"("profesionalId");
CREATE INDEX IF NOT EXISTS "CitaMedica_atencionMedicaId_idx" ON "CitaMedica"("atencionMedicaId");
CREATE INDEX IF NOT EXISTS "CitaMedica_fecha_idx" ON "CitaMedica"("fecha");
CREATE INDEX IF NOT EXISTS "CitaMedica_estado_idx" ON "CitaMedica"("estado");
CREATE INDEX IF NOT EXISTS "EvaluacionMedica_atencionMedicaId_idx" ON "EvaluacionMedica"("atencionMedicaId");
CREATE INDEX IF NOT EXISTS "FichaOcupacional_atencionMedicaId_idx" ON "FichaOcupacional"("atencionMedicaId");
CREATE INDEX IF NOT EXISTS "Receta_atencionMedicaId_idx" ON "Receta"("atencionMedicaId");
CREATE INDEX IF NOT EXISTS "Receta_evaluacionId_idx" ON "Receta"("evaluacionId");
CREATE INDEX IF NOT EXISTS "Receta_asignacionLaboralId_idx" ON "Receta"("asignacionLaboralId");
CREATE INDEX IF NOT EXISTS "Receta_profesionalId_idx" ON "Receta"("profesionalId");
CREATE INDEX IF NOT EXISTS "Receta_estado_idx" ON "Receta"("estado");
CREATE UNIQUE INDEX IF NOT EXISTS "Receta_numeroReceta_key" ON "Receta"("numeroReceta");

-- AddForeignKey (idempotente)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'FichaOcupacional_atencionMedicaId_fkey') THEN
    ALTER TABLE "FichaOcupacional" ADD CONSTRAINT "FichaOcupacional_atencionMedicaId_fkey" FOREIGN KEY ("atencionMedicaId") REFERENCES "AtencionMedica"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'EvaluacionMedica_atencionMedicaId_fkey') THEN
    ALTER TABLE "EvaluacionMedica" ADD CONSTRAINT "EvaluacionMedica_atencionMedicaId_fkey" FOREIGN KEY ("atencionMedicaId") REFERENCES "AtencionMedica"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Receta_atencionMedicaId_fkey') THEN
    ALTER TABLE "Receta" ADD CONSTRAINT "Receta_atencionMedicaId_fkey" FOREIGN KEY ("atencionMedicaId") REFERENCES "AtencionMedica"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Receta_profesionalId_fkey') THEN
    ALTER TABLE "Receta" ADD CONSTRAINT "Receta_profesionalId_fkey" FOREIGN KEY ("profesionalId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

-- Nota: "Receta_usuarioId_fkey" ya existe desde migraciones previas y apunta a la
-- misma columna usuarioId (ahora creadoPorId). No se recrea.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AtencionMedica_trabajadorId_fkey') THEN
    ALTER TABLE "AtencionMedica" ADD CONSTRAINT "AtencionMedica_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "Trabajador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AtencionMedica_empresaId_fkey') THEN
    ALTER TABLE "AtencionMedica" ADD CONSTRAINT "AtencionMedica_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AtencionMedica_departamentoId_fkey') THEN
    ALTER TABLE "AtencionMedica" ADD CONSTRAINT "AtencionMedica_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "Departamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AtencionMedica_asignacionLaboralId_fkey') THEN
    ALTER TABLE "AtencionMedica" ADD CONSTRAINT "AtencionMedica_asignacionLaboralId_fkey" FOREIGN KEY ("asignacionLaboralId") REFERENCES "VinculoLaboral"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AtencionMedica_profesionalResponsableId_fkey') THEN
    ALTER TABLE "AtencionMedica" ADD CONSTRAINT "AtencionMedica_profesionalResponsableId_fkey" FOREIGN KEY ("profesionalResponsableId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AtencionMedica_creadoPorId_fkey') THEN
    ALTER TABLE "AtencionMedica" ADD CONSTRAINT "AtencionMedica_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CitaMedica_trabajadorId_fkey') THEN
    ALTER TABLE "CitaMedica" ADD CONSTRAINT "CitaMedica_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "Trabajador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CitaMedica_empresaId_fkey') THEN
    ALTER TABLE "CitaMedica" ADD CONSTRAINT "CitaMedica_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CitaMedica_departamentoId_fkey') THEN
    ALTER TABLE "CitaMedica" ADD CONSTRAINT "CitaMedica_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "Departamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CitaMedica_profesionalId_fkey') THEN
    ALTER TABLE "CitaMedica" ADD CONSTRAINT "CitaMedica_profesionalId_fkey" FOREIGN KEY ("profesionalId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CitaMedica_atencionMedicaId_fkey') THEN
    ALTER TABLE "CitaMedica" ADD CONSTRAINT "CitaMedica_atencionMedicaId_fkey" FOREIGN KEY ("atencionMedicaId") REFERENCES "AtencionMedica"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CitaMedica_creadoPorId_fkey') THEN
    ALTER TABLE "CitaMedica" ADD CONSTRAINT "CitaMedica_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
