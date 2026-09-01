-- Migración aditiva: conserva AtencionMedica y todas sus referencias como legado.
CREATE TYPE "EstadoDocumentoClinico" AS ENUM ('BORRADOR', 'FINALIZADO', 'ANULADO');
CREATE TYPE "TipoDiagnosticoClinico" AS ENUM ('PRESUNTIVO', 'DEFINITIVO');

ALTER TABLE "EvaluacionMedica"
  ADD COLUMN "numeroEvaluacion" TEXT,
  ADD COLUMN "registroDiarioId" UUID;

ALTER TABLE "FichaOcupacional"
  ADD COLUMN "numeroFicha" TEXT,
  ADD COLUMN "registroDiarioId" UUID;

ALTER TABLE "Receta"
  ADD COLUMN "documentoClinicoId" UUID,
  ADD COLUMN "fichaOcupacionalId" UUID,
  ADD COLUMN "registroDiarioId" UUID;

ALTER TABLE "registros_diarios_atencion" ADD COLUMN "observaciones" TEXT;

CREATE SEQUENCE IF NOT EXISTS "registro_diario_numero_seq" AS BIGINT INCREMENT BY 1 CACHE 1;
CREATE SEQUENCE IF NOT EXISTS "evaluacion_medica_numero_seq" AS BIGINT INCREMENT BY 1 CACHE 1;
CREATE SEQUENCE IF NOT EXISTS "ficha_ocupacional_numero_seq" AS BIGINT INCREMENT BY 1 CACHE 1;
CREATE SEQUENCE IF NOT EXISTS "documento_clinico_numero_seq" AS BIGINT INCREMENT BY 1 CACHE 1;

WITH numeradas AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "creadoEn", "id") AS numero
  FROM "EvaluacionMedica"
  WHERE "numeroEvaluacion" IS NULL
)
UPDATE "EvaluacionMedica" AS e
SET "numeroEvaluacion" = 'EM-' || LPAD(numeradas.numero::TEXT, 6, '0')
FROM numeradas
WHERE e."id" = numeradas."id";

WITH numeradas AS (
  SELECT "id", ROW_NUMBER() OVER (ORDER BY "creadoEn", "id") AS numero
  FROM "FichaOcupacional"
  WHERE "numeroFicha" IS NULL
)
UPDATE "FichaOcupacional" AS f
SET "numeroFicha" = 'FO-' || LPAD(numeradas.numero::TEXT, 6, '0')
FROM numeradas
WHERE f."id" = numeradas."id";

DO $$
DECLARE
  max_registro BIGINT;
  max_evaluacion BIGINT;
  max_ficha BIGINT;
BEGIN
  SELECT COALESCE(MAX(NULLIF(REGEXP_REPLACE("numeroRegistro", '[^0-9]', '', 'g'), '')::BIGINT), 0)
    INTO max_registro FROM "registros_diarios_atencion";
  SELECT COALESCE(MAX(NULLIF(REGEXP_REPLACE("numeroEvaluacion", '[^0-9]', '', 'g'), '')::BIGINT), 0)
    INTO max_evaluacion FROM "EvaluacionMedica";
  SELECT COALESCE(MAX(NULLIF(REGEXP_REPLACE("numeroFicha", '[^0-9]', '', 'g'), '')::BIGINT), 0)
    INTO max_ficha FROM "FichaOcupacional";

  IF max_registro > 0 THEN
    PERFORM setval('registro_diario_numero_seq', max_registro, true);
  END IF;
  IF max_evaluacion > 0 THEN
    PERFORM setval('evaluacion_medica_numero_seq', max_evaluacion, true);
  END IF;
  IF max_ficha > 0 THEN
    PERFORM setval('ficha_ocupacional_numero_seq', max_ficha, true);
  END IF;
END $$;

CREATE TABLE "DocumentoClinico" (
  "id" UUID NOT NULL,
  "numeroDocumento" TEXT NOT NULL,
  "trabajadorId" UUID NOT NULL,
  "registroDiarioId" UUID,
  "evaluacionMedicaId" UUID,
  "fichaOcupacionalId" UUID,
  "empresaId" UUID NOT NULL,
  "departamentoId" UUID,
  "profesionalId" UUID NOT NULL,
  "fechaDocumento" DATE NOT NULL,
  "motivoConsulta" TEXT,
  "evolucion" TEXT,
  "observaciones" TEXT,
  "estado" "EstadoDocumentoClinico" NOT NULL DEFAULT 'BORRADOR',
  "trabajadorNombreHistorico" TEXT NOT NULL,
  "trabajadorDocumentoHistorico" TEXT NOT NULL,
  "trabajadorNacimientoHistorico" DATE,
  "empresaNombreHistorico" TEXT NOT NULL,
  "empresaRucHistorico" TEXT,
  "departamentoNombreHistorico" TEXT,
  "profesionalNombreHistorico" TEXT NOT NULL,
  "profesionalCodigoHistorico" TEXT,
  "creadoPorId" UUID NOT NULL,
  "actualizadoPorId" UUID,
  "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "actualizadoEn" TIMESTAMP(3) NOT NULL,
  "finalizadoEn" TIMESTAMP(3),
  "anuladoEn" TIMESTAMP(3),
  "motivoAnulacion" TEXT,
  CONSTRAINT "DocumentoClinico_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DocumentoClinicoDiagnostico" (
  "id" UUID NOT NULL,
  "documentoClinicoId" UUID NOT NULL,
  "enfermedadId" UUID NOT NULL,
  "tipo" "TipoDiagnosticoClinico" NOT NULL,
  "codigoHistorico" TEXT NOT NULL,
  "descripcionHistorica" TEXT NOT NULL,
  "observacion" TEXT,
  "orden" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "DocumentoClinicoDiagnostico_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DocumentoClinicoTratamiento" (
  "id" UUID NOT NULL,
  "documentoClinicoId" UUID NOT NULL,
  "medicamentoId" UUID,
  "nombreHistorico" TEXT NOT NULL,
  "concentracion" TEXT,
  "dosis" TEXT NOT NULL,
  "cantidad" TEXT NOT NULL,
  "frecuencia" TEXT,
  "intervaloHoras" INTEGER,
  "duracion" TEXT,
  "via" TEXT,
  "indicaciones" TEXT,
  "observaciones" TEXT,
  "alertaAlergiaConfirmada" BOOLEAN NOT NULL DEFAULT false,
  "justificacionAlergia" TEXT,
  "orden" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "DocumentoClinicoTratamiento_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DocumentoClinico_numeroDocumento_key" ON "DocumentoClinico"("numeroDocumento");
CREATE INDEX "DocumentoClinico_trabajadorId_fechaDocumento_idx" ON "DocumentoClinico"("trabajadorId", "fechaDocumento");
CREATE INDEX "DocumentoClinico_registroDiarioId_idx" ON "DocumentoClinico"("registroDiarioId");
CREATE INDEX "DocumentoClinico_evaluacionMedicaId_idx" ON "DocumentoClinico"("evaluacionMedicaId");
CREATE INDEX "DocumentoClinico_fichaOcupacionalId_idx" ON "DocumentoClinico"("fichaOcupacionalId");
CREATE INDEX "DocumentoClinico_empresaId_idx" ON "DocumentoClinico"("empresaId");
CREATE INDEX "DocumentoClinico_profesionalId_idx" ON "DocumentoClinico"("profesionalId");
CREATE INDEX "DocumentoClinico_estado_idx" ON "DocumentoClinico"("estado");
CREATE INDEX "DocumentoClinicoDiagnostico_enfermedadId_idx" ON "DocumentoClinicoDiagnostico"("enfermedadId");
CREATE UNIQUE INDEX "DocumentoClinicoDiagnostico_documentoClinicoId_enfermedadId_key" ON "DocumentoClinicoDiagnostico"("documentoClinicoId", "enfermedadId");
CREATE INDEX "DocumentoClinicoTratamiento_documentoClinicoId_idx" ON "DocumentoClinicoTratamiento"("documentoClinicoId");
CREATE INDEX "DocumentoClinicoTratamiento_medicamentoId_idx" ON "DocumentoClinicoTratamiento"("medicamentoId");
CREATE UNIQUE INDEX "EvaluacionMedica_numeroEvaluacion_key" ON "EvaluacionMedica"("numeroEvaluacion");
CREATE INDEX "EvaluacionMedica_registroDiarioId_idx" ON "EvaluacionMedica"("registroDiarioId");
CREATE UNIQUE INDEX "FichaOcupacional_numeroFicha_key" ON "FichaOcupacional"("numeroFicha");
CREATE INDEX "FichaOcupacional_registroDiarioId_idx" ON "FichaOcupacional"("registroDiarioId");
CREATE INDEX "Receta_registroDiarioId_idx" ON "Receta"("registroDiarioId");
CREATE INDEX "Receta_fichaOcupacionalId_idx" ON "Receta"("fichaOcupacionalId");
CREATE INDEX "Receta_documentoClinicoId_idx" ON "Receta"("documentoClinicoId");

ALTER TABLE "FichaOcupacional" ADD CONSTRAINT "FichaOcupacional_registroDiarioId_fkey" FOREIGN KEY ("registroDiarioId") REFERENCES "registros_diarios_atencion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EvaluacionMedica" ADD CONSTRAINT "EvaluacionMedica_registroDiarioId_fkey" FOREIGN KEY ("registroDiarioId") REFERENCES "registros_diarios_atencion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Receta" ADD CONSTRAINT "Receta_registroDiarioId_fkey" FOREIGN KEY ("registroDiarioId") REFERENCES "registros_diarios_atencion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Receta" ADD CONSTRAINT "Receta_fichaOcupacionalId_fkey" FOREIGN KEY ("fichaOcupacionalId") REFERENCES "FichaOcupacional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Receta" ADD CONSTRAINT "Receta_documentoClinicoId_fkey" FOREIGN KEY ("documentoClinicoId") REFERENCES "DocumentoClinico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DocumentoClinico" ADD CONSTRAINT "DocumentoClinico_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "Trabajador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DocumentoClinico" ADD CONSTRAINT "DocumentoClinico_registroDiarioId_fkey" FOREIGN KEY ("registroDiarioId") REFERENCES "registros_diarios_atencion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DocumentoClinico" ADD CONSTRAINT "DocumentoClinico_evaluacionMedicaId_fkey" FOREIGN KEY ("evaluacionMedicaId") REFERENCES "EvaluacionMedica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DocumentoClinico" ADD CONSTRAINT "DocumentoClinico_fichaOcupacionalId_fkey" FOREIGN KEY ("fichaOcupacionalId") REFERENCES "FichaOcupacional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DocumentoClinico" ADD CONSTRAINT "DocumentoClinico_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DocumentoClinico" ADD CONSTRAINT "DocumentoClinico_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "Departamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DocumentoClinico" ADD CONSTRAINT "DocumentoClinico_profesionalId_fkey" FOREIGN KEY ("profesionalId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DocumentoClinico" ADD CONSTRAINT "DocumentoClinico_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DocumentoClinico" ADD CONSTRAINT "DocumentoClinico_actualizadoPorId_fkey" FOREIGN KEY ("actualizadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "DocumentoClinicoDiagnostico" ADD CONSTRAINT "DocumentoClinicoDiagnostico_documentoClinicoId_fkey" FOREIGN KEY ("documentoClinicoId") REFERENCES "DocumentoClinico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DocumentoClinicoDiagnostico" ADD CONSTRAINT "DocumentoClinicoDiagnostico_enfermedadId_fkey" FOREIGN KEY ("enfermedadId") REFERENCES "enfermedades_cie10"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DocumentoClinicoTratamiento" ADD CONSTRAINT "DocumentoClinicoTratamiento_documentoClinicoId_fkey" FOREIGN KEY ("documentoClinicoId") REFERENCES "DocumentoClinico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DocumentoClinicoTratamiento" ADD CONSTRAINT "DocumentoClinicoTratamiento_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "Medicamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
