-- EnableExtension
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- CreateTable
CREATE TABLE "sinonimos_cie10" (
    "id" UUID NOT NULL,
    "termino" VARCHAR(160) NOT NULL,
    "enfermedadId" UUID NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sinonimos_cie10_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sinonimos_cie10_termino_idx" ON "sinonimos_cie10"("termino");

-- CreateIndex
CREATE INDEX "sinonimos_cie10_termino_busqueda_idx" ON "sinonimos_cie10" USING GIN (LOWER("termino") gin_trgm_ops);

-- CreateIndex
CREATE INDEX "sinonimos_cie10_enfermedadId_idx" ON "sinonimos_cie10"("enfermedadId");

-- CreateIndex
CREATE UNIQUE INDEX "sinonimos_cie10_termino_enfermedadId_key" ON "sinonimos_cie10"("termino", "enfermedadId");

-- AddForeignKey
ALTER TABLE "sinonimos_cie10" ADD CONSTRAINT "sinonimos_cie10_enfermedadId_fkey" FOREIGN KEY ("enfermedadId") REFERENCES "enfermedades_cie10"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
