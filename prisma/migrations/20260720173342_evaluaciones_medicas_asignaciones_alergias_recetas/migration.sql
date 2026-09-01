-- CreateEnum
CREATE TYPE "EstadoEvaluacionMedica" AS ENUM ('BORRADOR', 'FINALIZADA', 'ANULADA');

-- CreateEnum
CREATE TYPE "TipoAlergia" AS ENUM ('MEDICAMENTO', 'ALIMENTO', 'AMBIENTAL', 'OTRA');

-- CreateEnum
CREATE TYPE "SeveridadAlergia" AS ENUM ('LEVE', 'MODERADA', 'GRAVE');

-- AlterTable
ALTER TABLE "FichaOcupacional" ADD COLUMN     "asignacionLaboralId" UUID,
ADD COLUMN     "departamentoNombreHistorico" TEXT,
ADD COLUMN     "empresaNombreHistorico" TEXT,
ADD COLUMN     "empresaRucHistorico" TEXT;

-- Conservar snapshots de todas las fichas existentes usando sus relaciones históricas.
UPDATE "FichaOcupacional" AS f
SET "empresaNombreHistorico" = e."razonSocial",
    "empresaRucHistorico" = e."ruc",
    "departamentoNombreHistorico" = d."nombre",
    "asignacionLaboralId" = (
      SELECT v.id
      FROM "VinculoLaboral" AS v
      WHERE v."trabajadorId" = f."trabajadorId"
        AND v."empresaId" = f."empresaId"
        AND v."departamentoId" = f."departamentoId"
      ORDER BY (v.estado = 'ACTIVO') DESC, v."actualizadoEn" DESC
      LIMIT 1
    )
FROM "Empresa" AS e, "Departamento" AS d
WHERE e.id = f."empresaId" AND d.id = f."departamentoId";

-- AlterTable
ALTER TABLE "VinculoLaboral" ADD COLUMN     "activa" BOOLEAN NOT NULL DEFAULT true;

-- Reconciliar vínculos legados sin borrar historial: uno activo por trabajador.
UPDATE "VinculoLaboral" SET "activa" = false;

WITH candidatas AS (
  SELECT v.id,
         row_number() OVER (
           PARTITION BY v."trabajadorId"
           ORDER BY
             (v."empresaId" = t."empresaId" AND v."departamentoId" = t."departamentoId") DESC,
             v."actualizadoEn" DESC,
             v.id
         ) AS posicion
  FROM "VinculoLaboral" AS v
  INNER JOIN "Trabajador" AS t ON t.id = v."trabajadorId"
  WHERE v.estado = 'ACTIVO'
)
UPDATE "VinculoLaboral" AS v
SET "activa" = true
FROM candidatas AS c
WHERE v.id = c.id AND c.posicion = 1;

-- CreateTable
CREATE TABLE "AlergiaTrabajador" (
    "id" UUID NOT NULL,
    "trabajadorId" UUID NOT NULL,
    "tipo" "TipoAlergia" NOT NULL,
    "sustancia" TEXT NOT NULL,
    "descripcion" TEXT,
    "severidad" "SeveridadAlergia" NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AlergiaTrabajador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EvaluacionMedica" (
    "id" UUID NOT NULL,
    "trabajadorId" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "departamentoId" UUID NOT NULL,
    "asignacionLaboralId" UUID NOT NULL,
    "usuarioId" UUID NOT NULL,
    "estado" "EstadoEvaluacionMedica" NOT NULL DEFAULT 'BORRADOR',
    "fechaAtencion" DATE,
    "profesionalNombreHistorico" TEXT,
    "empresaNombreHistorico" TEXT NOT NULL,
    "empresaRucHistorico" TEXT NOT NULL,
    "departamentoNombreHistorico" TEXT NOT NULL,
    "trabajadorNombreHistorico" TEXT NOT NULL,
    "trabajadorDocumentoHistorico" TEXT NOT NULL,
    "trabajadorSexoHistorico" TEXT,
    "trabajadorNacimientoHistorico" DATE,
    "motivoConsulta" TEXT,
    "sintomas" TEXT,
    "tiempoEvolucion" TEXT,
    "observacionesMotivo" TEXT,
    "temperatura" DOUBLE PRECISION,
    "presionArterial" TEXT,
    "frecuenciaCardiaca" INTEGER,
    "frecuenciaRespiratoria" INTEGER,
    "saturacionOxigeno" INTEGER,
    "peso" DOUBLE PRECISION,
    "talla" DOUBLE PRECISION,
    "antecedentesRelevantes" TEXT,
    "examenFisico" TEXT,
    "observacionesClinicas" TEXT,
    "observacionesDiagnostico" TEXT,
    "indicaciones" TEXT,
    "recomendaciones" TEXT,
    "reposoDias" INTEGER,
    "seguimiento" TEXT,
    "proximaConsulta" DATE,
    "finalizadoEn" TIMESTAMP(3),
    "anuladaEn" TIMESTAMP(3),
    "motivoAnulacion" TEXT,
    "creadoPorId" UUID,
    "actualizadoPorId" UUID,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EvaluacionMedica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticoEvaluacion" (
    "id" UUID NOT NULL,
    "evaluacionId" UUID NOT NULL,
    "enfermedadId" UUID NOT NULL,
    "pre" BOOLEAN NOT NULL DEFAULT false,
    "def" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DiagnosticoEvaluacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Medicamento" (
    "id" UUID NOT NULL,
    "nombreGenerico" TEXT NOT NULL,
    "nombreComercial" TEXT,
    "presentacion" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Medicamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MedicamentoEvaluacion" (
    "id" UUID NOT NULL,
    "evaluacionId" UUID NOT NULL,
    "medicamentoId" UUID NOT NULL,
    "dosis" TEXT NOT NULL,
    "frecuencia" TEXT NOT NULL,
    "duracion" TEXT NOT NULL,
    "viaAdministracion" TEXT NOT NULL,
    "indicaciones" TEXT,
    "alertaAlergiaConfirmada" BOOLEAN NOT NULL DEFAULT false,
    "justificacionAlergia" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MedicamentoEvaluacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Receta" (
    "id" UUID NOT NULL,
    "evaluacionId" UUID NOT NULL,
    "trabajadorId" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "departamentoId" UUID NOT NULL,
    "asignacionLaboralId" UUID NOT NULL,
    "usuarioId" UUID NOT NULL,
    "trabajadorNombreHistorico" TEXT NOT NULL,
    "trabajadorDocumentoHistorico" TEXT NOT NULL,
    "empresaNombreHistorico" TEXT NOT NULL,
    "empresaRucHistorico" TEXT NOT NULL,
    "departamentoNombreHistorico" TEXT NOT NULL,
    "profesionalNombreHistorico" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "indicaciones" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Receta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecetaMedicamento" (
    "id" UUID NOT NULL,
    "recetaId" UUID NOT NULL,
    "medicamentoId" UUID NOT NULL,
    "nombreGenericoHistorico" TEXT NOT NULL,
    "nombreComercialHistorico" TEXT,
    "presentacionHistorica" TEXT NOT NULL,
    "dosis" TEXT NOT NULL,
    "frecuencia" TEXT NOT NULL,
    "duracion" TEXT NOT NULL,
    "viaAdministracion" TEXT NOT NULL,
    "indicaciones" TEXT,

    CONSTRAINT "RecetaMedicamento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AlergiaTrabajador_trabajadorId_activa_idx" ON "AlergiaTrabajador"("trabajadorId", "activa");

-- CreateIndex
CREATE INDEX "AlergiaTrabajador_tipo_sustancia_idx" ON "AlergiaTrabajador"("tipo", "sustancia");

-- CreateIndex
CREATE INDEX "EvaluacionMedica_trabajadorId_estado_idx" ON "EvaluacionMedica"("trabajadorId", "estado");

-- CreateIndex
CREATE INDEX "EvaluacionMedica_empresaId_idx" ON "EvaluacionMedica"("empresaId");

-- CreateIndex
CREATE INDEX "EvaluacionMedica_departamentoId_idx" ON "EvaluacionMedica"("departamentoId");

-- CreateIndex
CREATE INDEX "EvaluacionMedica_asignacionLaboralId_idx" ON "EvaluacionMedica"("asignacionLaboralId");

-- CreateIndex
CREATE INDEX "EvaluacionMedica_usuarioId_idx" ON "EvaluacionMedica"("usuarioId");

-- CreateIndex
CREATE INDEX "EvaluacionMedica_fechaAtencion_idx" ON "EvaluacionMedica"("fechaAtencion");

-- CreateIndex
CREATE INDEX "DiagnosticoEvaluacion_enfermedadId_idx" ON "DiagnosticoEvaluacion"("enfermedadId");

-- CreateIndex
CREATE UNIQUE INDEX "DiagnosticoEvaluacion_evaluacionId_enfermedadId_key" ON "DiagnosticoEvaluacion"("evaluacionId", "enfermedadId");

-- CreateIndex
CREATE INDEX "Medicamento_nombreGenerico_idx" ON "Medicamento"("nombreGenerico");

-- CreateIndex
CREATE INDEX "Medicamento_activo_idx" ON "Medicamento"("activo");

-- CreateIndex
CREATE UNIQUE INDEX "Medicamento_nombreGenerico_presentacion_key" ON "Medicamento"("nombreGenerico", "presentacion");

-- CreateIndex
CREATE INDEX "MedicamentoEvaluacion_evaluacionId_idx" ON "MedicamentoEvaluacion"("evaluacionId");

-- CreateIndex
CREATE INDEX "MedicamentoEvaluacion_medicamentoId_idx" ON "MedicamentoEvaluacion"("medicamentoId");

-- CreateIndex
CREATE UNIQUE INDEX "Receta_evaluacionId_key" ON "Receta"("evaluacionId");

-- CreateIndex
CREATE INDEX "Receta_trabajadorId_idx" ON "Receta"("trabajadorId");

-- CreateIndex
CREATE INDEX "Receta_empresaId_idx" ON "Receta"("empresaId");

-- CreateIndex
CREATE INDEX "Receta_fecha_idx" ON "Receta"("fecha");

-- CreateIndex
CREATE INDEX "RecetaMedicamento_recetaId_idx" ON "RecetaMedicamento"("recetaId");

-- CreateIndex
CREATE INDEX "RecetaMedicamento_medicamentoId_idx" ON "RecetaMedicamento"("medicamentoId");

-- CreateIndex
CREATE INDEX "FichaOcupacional_asignacionLaboralId_idx" ON "FichaOcupacional"("asignacionLaboralId");

-- CreateIndex
CREATE INDEX "VinculoLaboral_trabajadorId_activa_idx" ON "VinculoLaboral"("trabajadorId", "activa");

-- Garantía final contra dos asignaciones activas concurrentes.
CREATE UNIQUE INDEX "VinculoLaboral_unica_activa_por_trabajador"
ON "VinculoLaboral"("trabajadorId")
WHERE "activa" = true;

-- AddForeignKey
ALTER TABLE "FichaOcupacional" ADD CONSTRAINT "FichaOcupacional_asignacionLaboralId_fkey" FOREIGN KEY ("asignacionLaboralId") REFERENCES "VinculoLaboral"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AlergiaTrabajador" ADD CONSTRAINT "AlergiaTrabajador_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "Trabajador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluacionMedica" ADD CONSTRAINT "EvaluacionMedica_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "Trabajador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluacionMedica" ADD CONSTRAINT "EvaluacionMedica_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluacionMedica" ADD CONSTRAINT "EvaluacionMedica_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "Departamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluacionMedica" ADD CONSTRAINT "EvaluacionMedica_asignacionLaboralId_fkey" FOREIGN KEY ("asignacionLaboralId") REFERENCES "VinculoLaboral"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluacionMedica" ADD CONSTRAINT "EvaluacionMedica_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluacionMedica" ADD CONSTRAINT "EvaluacionMedica_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EvaluacionMedica" ADD CONSTRAINT "EvaluacionMedica_actualizadoPorId_fkey" FOREIGN KEY ("actualizadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticoEvaluacion" ADD CONSTRAINT "DiagnosticoEvaluacion_evaluacionId_fkey" FOREIGN KEY ("evaluacionId") REFERENCES "EvaluacionMedica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticoEvaluacion" ADD CONSTRAINT "DiagnosticoEvaluacion_enfermedadId_fkey" FOREIGN KEY ("enfermedadId") REFERENCES "enfermedades_cie10"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicamentoEvaluacion" ADD CONSTRAINT "MedicamentoEvaluacion_evaluacionId_fkey" FOREIGN KEY ("evaluacionId") REFERENCES "EvaluacionMedica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicamentoEvaluacion" ADD CONSTRAINT "MedicamentoEvaluacion_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "Medicamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receta" ADD CONSTRAINT "Receta_evaluacionId_fkey" FOREIGN KEY ("evaluacionId") REFERENCES "EvaluacionMedica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receta" ADD CONSTRAINT "Receta_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "Trabajador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receta" ADD CONSTRAINT "Receta_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receta" ADD CONSTRAINT "Receta_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "Departamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receta" ADD CONSTRAINT "Receta_asignacionLaboralId_fkey" FOREIGN KEY ("asignacionLaboralId") REFERENCES "VinculoLaboral"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Receta" ADD CONSTRAINT "Receta_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecetaMedicamento" ADD CONSTRAINT "RecetaMedicamento_recetaId_fkey" FOREIGN KEY ("recetaId") REFERENCES "Receta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecetaMedicamento" ADD CONSTRAINT "RecetaMedicamento_medicamentoId_fkey" FOREIGN KEY ("medicamentoId") REFERENCES "Medicamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
