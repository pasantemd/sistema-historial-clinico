-- CreateEnum
CREATE TYPE "EstadoRegistroDiario" AS ENUM ('REGISTRADO', 'ANULADO');

-- CreateTable
CREATE TABLE "registros_diarios_atencion" (
    "id" UUID NOT NULL,
    "numeroRegistro" TEXT NOT NULL,
    "trabajadorId" UUID NOT NULL,
    "atencionMedicaId" UUID,
    "empresaId" UUID NOT NULL,
    "departamentoId" UUID,
    "profesionalId" UUID,
    "apellidosNombres" TEXT NOT NULL,
    "cedula" TEXT NOT NULL,
    "fechaNacimiento" DATE NOT NULL,
    "diaAtencion" DATE NOT NULL,
    "atencionMorbilidad" TEXT NOT NULL,
    "medicacion" TEXT,
    "procedimiento" TEXT,
    "firmaConfirmada" BOOLEAN NOT NULL DEFAULT false,
    "empresaNombreHistorico" TEXT NOT NULL,
    "empresaRucHistorico" TEXT,
    "departamentoNombreHistorico" TEXT,
    "profesionalNombreHistorico" TEXT,
    "estado" "EstadoRegistroDiario" NOT NULL DEFAULT 'REGISTRADO',
    "creadoPorId" UUID NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,
    "anuladoEn" TIMESTAMP(3),
    "motivoAnulacion" TEXT,

    CONSTRAINT "registros_diarios_atencion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "registros_diarios_atencion_numeroRegistro_key" ON "registros_diarios_atencion"("numeroRegistro");

-- CreateIndex
CREATE INDEX "registros_diarios_atencion_trabajadorId_idx" ON "registros_diarios_atencion"("trabajadorId");

-- CreateIndex
CREATE INDEX "registros_diarios_atencion_diaAtencion_idx" ON "registros_diarios_atencion"("diaAtencion");

-- CreateIndex
CREATE INDEX "registros_diarios_atencion_empresaId_idx" ON "registros_diarios_atencion"("empresaId");

-- CreateIndex
CREATE INDEX "registros_diarios_atencion_cedula_idx" ON "registros_diarios_atencion"("cedula");

-- CreateIndex
CREATE INDEX "registros_diarios_atencion_estado_idx" ON "registros_diarios_atencion"("estado");

-- AddForeignKey
ALTER TABLE "registros_diarios_atencion" ADD CONSTRAINT "registros_diarios_atencion_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "Trabajador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_diarios_atencion" ADD CONSTRAINT "registros_diarios_atencion_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_diarios_atencion" ADD CONSTRAINT "registros_diarios_atencion_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "Departamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_diarios_atencion" ADD CONSTRAINT "registros_diarios_atencion_profesionalId_fkey" FOREIGN KEY ("profesionalId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_diarios_atencion" ADD CONSTRAINT "registros_diarios_atencion_atencionMedicaId_fkey" FOREIGN KEY ("atencionMedicaId") REFERENCES "AtencionMedica"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registros_diarios_atencion" ADD CONSTRAINT "registros_diarios_atencion_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
