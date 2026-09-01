-- AlterTable
ALTER TABLE "AtencionMedica" ADD COLUMN     "profesionalCodigoHistorico" TEXT,
ADD COLUMN     "profesionalNombreHistorico" TEXT;

-- AlterTable
ALTER TABLE "Receta" ADD COLUMN     "alergiaConfirmada" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "alergiaConfirmadaEn" TIMESTAMP(3),
ADD COLUMN     "alergiaConfirmadaPorId" UUID,
ADD COLUMN     "diagnosticosHistoricos" JSONB,
ADD COLUMN     "emitidaEn" TIMESTAMP(3),
ADD COLUMN     "empresaTelefonoHistorico" TEXT,
ADD COLUMN     "justificacionAlergia" TEXT,
ADD COLUMN     "profesionalEspecialidadHistorica" TEXT,
ADD COLUMN     "trabajadorNacimientoHistorico" DATE,
ADD COLUMN     "trabajadorSexoHistorico" TEXT;

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN     "codigoProfesional" TEXT,
ADD COLUMN     "especialidad" TEXT;

-- CreateIndex
CREATE INDEX "Receta_alergiaConfirmadaPorId_idx" ON "Receta"("alergiaConfirmadaPorId");

-- AddForeignKey
ALTER TABLE "Receta" ADD CONSTRAINT "Receta_alergiaConfirmadaPorId_fkey" FOREIGN KEY ("alergiaConfirmadaPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Reconciliar cada ficha histórica como una visita independiente. No se agrupa
-- por fecha: dos documentos del mismo día pueden pertenecer a visitas distintas.
INSERT INTO "AtencionMedica" (
  "id", "trabajadorId", "empresaId", "departamentoId", "asignacionLaboralId",
  "fechaAtencion", "motivoGeneral", "profesionalResponsableId",
  "profesionalNombreHistorico", "profesionalCodigoHistorico", "estado",
  "empresaNombreHistorico", "empresaRucHistorico", "departamentoNombreHistorico",
  "trabajadorNombreHistorico", "trabajadorDocumentoHistorico", "creadoPorId",
  "creadoEn", "actualizadoEn", "finalizadaEn", "anuladaEn"
)
SELECT
  md5('ficha:' || f."id"::text)::uuid,
  f."trabajadorId", f."empresaId", f."departamentoId", f."asignacionLaboralId",
  COALESCE(f."fechaAtencion", f."creadoEn"::date),
  'Ficha ocupacional histórica', f."usuarioId",
  NULLIF(TRIM(f."profesionalNombres"), ''), NULLIF(TRIM(f."profesionalCodigoMedico"), ''),
  CASE f."estado"::text
    WHEN 'ANULADA' THEN 'ANULADA'::"EstadoAtencionMedica"
    WHEN 'BORRADOR' THEN 'ABIERTA'::"EstadoAtencionMedica"
    ELSE 'FINALIZADA'::"EstadoAtencionMedica"
  END,
  COALESCE(NULLIF(f."empresaNombreHistorico", ''), e."razonSocial"),
  COALESCE(NULLIF(f."empresaRucHistorico", ''), e."ruc"),
  COALESCE(NULLIF(f."departamentoNombreHistorico", ''), d."nombre"),
  COALESCE(
    NULLIF(TRIM(CONCAT_WS(' ', f."primerApellido", f."segundoApellido", f."primerNombre", f."segundoNombre")), ''),
    TRIM(CONCAT_WS(' ', t."apellidos", t."nombres"))
  ),
  t."numeroDocumento", f."creadoPorId", f."creadoEn", f."actualizadoEn",
  CASE WHEN f."estado"::text = 'FINALIZADA' THEN COALESCE(f."finalizadoEn"::date, f."actualizadoEn"::date) END,
  CASE WHEN f."estado"::text = 'ANULADA' THEN f."actualizadoEn"::date END
FROM "FichaOcupacional" f
JOIN "Trabajador" t ON t."id" = f."trabajadorId"
JOIN "Empresa" e ON e."id" = f."empresaId"
JOIN "Departamento" d ON d."id" = f."departamentoId"
WHERE f."atencionMedicaId" IS NULL
ON CONFLICT ("id") DO NOTHING;

UPDATE "FichaOcupacional" f
SET "atencionMedicaId" = md5('ficha:' || f."id"::text)::uuid
WHERE f."atencionMedicaId" IS NULL;

-- Cada evaluación histórica es otra visita independiente. Su receta derivada
-- se enlaza a esta misma atención.
INSERT INTO "AtencionMedica" (
  "id", "trabajadorId", "empresaId", "departamentoId", "asignacionLaboralId",
  "fechaAtencion", "motivoGeneral", "profesionalResponsableId",
  "profesionalNombreHistorico", "profesionalCodigoHistorico", "estado",
  "empresaNombreHistorico", "empresaRucHistorico", "departamentoNombreHistorico",
  "trabajadorNombreHistorico", "trabajadorDocumentoHistorico", "creadoPorId",
  "creadoEn", "actualizadoEn", "finalizadaEn", "anuladaEn", "motivoAnulacion"
)
SELECT
  md5('evaluacion:' || ev."id"::text)::uuid,
  ev."trabajadorId", ev."empresaId", ev."departamentoId", ev."asignacionLaboralId",
  COALESCE(ev."fechaAtencion", ev."creadoEn"::date),
  COALESCE(NULLIF(ev."motivoConsulta", ''), 'Evaluación médica histórica'),
  ev."usuarioId", ev."profesionalNombreHistorico", u."codigoProfesional",
  CASE ev."estado"::text
    WHEN 'ANULADA' THEN 'ANULADA'::"EstadoAtencionMedica"
    WHEN 'BORRADOR' THEN 'ABIERTA'::"EstadoAtencionMedica"
    ELSE 'FINALIZADA'::"EstadoAtencionMedica"
  END,
  ev."empresaNombreHistorico", ev."empresaRucHistorico", ev."departamentoNombreHistorico",
  ev."trabajadorNombreHistorico", ev."trabajadorDocumentoHistorico", ev."creadoPorId",
  ev."creadoEn", ev."actualizadoEn", ev."finalizadoEn"::date, ev."anuladaEn"::date,
  ev."motivoAnulacion"
FROM "EvaluacionMedica" ev
LEFT JOIN "Usuario" u ON u."id" = ev."usuarioId"
WHERE ev."atencionMedicaId" IS NULL
ON CONFLICT ("id") DO NOTHING;

UPDATE "EvaluacionMedica" ev
SET "atencionMedicaId" = md5('evaluacion:' || ev."id"::text)::uuid
WHERE ev."atencionMedicaId" IS NULL;

UPDATE "Receta" r
SET "atencionMedicaId" = ev."atencionMedicaId"
FROM "EvaluacionMedica" ev
WHERE r."atencionMedicaId" IS NULL
  AND r."evaluacionId" = ev."id";

-- Las recetas sin evaluación conservan su propia visita histórica.
INSERT INTO "AtencionMedica" (
  "id", "trabajadorId", "empresaId", "departamentoId", "asignacionLaboralId",
  "fechaAtencion", "motivoGeneral", "profesionalResponsableId",
  "profesionalNombreHistorico", "profesionalCodigoHistorico", "estado",
  "empresaNombreHistorico", "empresaRucHistorico", "departamentoNombreHistorico",
  "trabajadorNombreHistorico", "trabajadorDocumentoHistorico", "creadoPorId",
  "creadoEn", "actualizadoEn", "finalizadaEn", "anuladaEn", "motivoAnulacion"
)
SELECT
  md5('receta:' || r."id"::text)::uuid,
  r."trabajadorId", r."empresaId", r."departamentoId", r."asignacionLaboralId",
  r."fecha", 'Receta médica histórica', r."profesionalId",
  r."profesionalNombreHistorico", r."profesionalCodigoHistorico",
  CASE r."estado"::text
    WHEN 'ANULADA' THEN 'ANULADA'::"EstadoAtencionMedica"
    WHEN 'BORRADOR' THEN 'ABIERTA'::"EstadoAtencionMedica"
    ELSE 'FINALIZADA'::"EstadoAtencionMedica"
  END,
  r."empresaNombreHistorico", r."empresaRucHistorico", r."departamentoNombreHistorico",
  r."trabajadorNombreHistorico", r."trabajadorDocumentoHistorico", r."usuarioId",
  r."creadoEn", r."actualizadoEn",
  CASE WHEN r."estado"::text = 'EMITIDA' THEN COALESCE(r."emitidaEn"::date, r."fecha") END,
  r."anuladaEn", r."motivoAnulacion"
FROM "Receta" r
WHERE r."atencionMedicaId" IS NULL
ON CONFLICT ("id") DO NOTHING;

UPDATE "Receta" r
SET "atencionMedicaId" = md5('receta:' || r."id"::text)::uuid
WHERE r."atencionMedicaId" IS NULL;

-- Completar snapshots que el diseño anterior no almacenaba. Las recetas
-- automáticas históricas (R-<uuid>) proceden de evaluaciones finalizadas.
UPDATE "Receta" r
SET
  "trabajadorNacimientoHistorico" = COALESCE(r."trabajadorNacimientoHistorico", t."fechaNacimiento"),
  "trabajadorSexoHistorico" = COALESCE(r."trabajadorSexoHistorico", t."sexo"::text),
  "empresaTelefonoHistorico" = COALESCE(r."empresaTelefonoHistorico", e."telefono"),
  "profesionalCodigoHistorico" = COALESCE(r."profesionalCodigoHistorico", u."codigoProfesional"),
  "profesionalEspecialidadHistorica" = COALESCE(r."profesionalEspecialidadHistorica", u."especialidad"),
  "estado" = CASE WHEN r."numeroReceta" LIKE 'R-%' AND r."estado" = 'BORRADOR' THEN 'EMITIDA'::"EstadoReceta" ELSE r."estado" END,
  "emitidaEn" = CASE WHEN r."numeroReceta" LIKE 'R-%' THEN COALESCE(r."emitidaEn", r."creadoEn") ELSE r."emitidaEn" END
FROM "Trabajador" t, "Empresa" e, "Usuario" u
WHERE t."id" = r."trabajadorId"
  AND e."id" = r."empresaId"
  AND u."id" = r."profesionalId";

UPDATE "Receta" r
SET "diagnosticosHistoricos" = diagnosticos.valor
FROM (
  SELECT
    r2."id" AS "recetaId",
    jsonb_agg(
      jsonb_build_object(
        'codigo', cie."codigo",
        'descripcion', cie."descripcion",
        'pre', de."pre",
        'def', de."def"
      ) ORDER BY de."def" DESC, cie."codigo"
    ) AS valor
  FROM "Receta" r2
  JOIN "DiagnosticoEvaluacion" de ON de."evaluacionId" = r2."evaluacionId"
  JOIN "enfermedades_cie10" cie ON cie."id" = de."enfermedadId"
  GROUP BY r2."id"
) diagnosticos
WHERE r."id" = diagnosticos."recetaId"
  AND r."diagnosticosHistoricos" IS NULL;
