-- CreateEnum
CREATE TYPE "NivelCie10" AS ENUM ('CATEGORIA', 'SUBCATEGORIA');

-- EnableExtension
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- CreateTable
CREATE TABLE "enfermedades_cie10" (
    "id" UUID NOT NULL,
    "codigo" VARCHAR(10) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "nivel" "NivelCie10" NOT NULL,
    "categoriaPadreCodigo" VARCHAR(10),
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enfermedades_cie10_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DiagnosticoFicha" (
    "id" UUID NOT NULL,
    "fichaId" UUID NOT NULL,
    "enfermedadId" UUID NOT NULL,
    "pre" BOOLEAN NOT NULL DEFAULT false,
    "def" BOOLEAN NOT NULL DEFAULT false,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DiagnosticoFicha_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "DiagnosticoFicha_tipo_check" CHECK ("pre" <> "def")
);

-- CreateIndex
CREATE UNIQUE INDEX "enfermedades_cie10_codigo_key" ON "enfermedades_cie10"("codigo");

-- CreateIndex
CREATE INDEX "enfermedades_cie10_codigo_idx" ON "enfermedades_cie10"("codigo");

-- CreateIndex
CREATE INDEX "enfermedades_cie10_descripcion_idx" ON "enfermedades_cie10"("descripcion");

-- CreateIndex
CREATE INDEX "enfermedades_cie10_codigo_busqueda_idx" ON "enfermedades_cie10" (LOWER("codigo") varchar_pattern_ops);

-- CreateIndex
CREATE INDEX "enfermedades_cie10_descripcion_busqueda_idx" ON "enfermedades_cie10" USING GIN (LOWER("descripcion") gin_trgm_ops);

-- CreateIndex
CREATE INDEX "enfermedades_cie10_categoriaPadreCodigo_idx" ON "enfermedades_cie10"("categoriaPadreCodigo");

-- CreateIndex
CREATE INDEX "DiagnosticoFicha_fichaId_idx" ON "DiagnosticoFicha"("fichaId");

-- CreateIndex
CREATE INDEX "DiagnosticoFicha_enfermedadId_idx" ON "DiagnosticoFicha"("enfermedadId");

-- CreateIndex
CREATE UNIQUE INDEX "DiagnosticoFicha_fichaId_enfermedadId_key" ON "DiagnosticoFicha"("fichaId", "enfermedadId");

-- AddForeignKey
ALTER TABLE "enfermedades_cie10" ADD CONSTRAINT "enfermedades_cie10_categoriaPadreCodigo_fkey" FOREIGN KEY ("categoriaPadreCodigo") REFERENCES "enfermedades_cie10"("codigo") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticoFicha" ADD CONSTRAINT "DiagnosticoFicha_fichaId_fkey" FOREIGN KEY ("fichaId") REFERENCES "FichaOcupacional"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DiagnosticoFicha" ADD CONSTRAINT "DiagnosticoFicha_enfermedadId_fkey" FOREIGN KEY ("enfermedadId") REFERENCES "enfermedades_cie10"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
