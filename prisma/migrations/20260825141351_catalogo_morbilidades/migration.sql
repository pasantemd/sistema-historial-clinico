-- CreateTable
CREATE TABLE "Morbilidad" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "nombreNormalizado" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Morbilidad_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Morbilidad_nombre_key" ON "Morbilidad"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Morbilidad_nombreNormalizado_key" ON "Morbilidad"("nombreNormalizado");

-- CreateIndex
CREATE INDEX "Morbilidad_nombreNormalizado_idx" ON "Morbilidad"("nombreNormalizado");

-- Poblar el catálogo con morbilidades históricas existentes
INSERT INTO "Morbilidad" ("id", "nombre", "nombreNormalizado", "actualizadoEn")
SELECT
    gen_random_uuid(),
    sub.nombre,
    sub.nombre_normalizado,
    CURRENT_TIMESTAMP
FROM (
    SELECT DISTINCT ON (LOWER(TRIM(m)))
        TRIM(m) AS nombre,
        LOWER(TRIM(m)) AS nombre_normalizado
    FROM (
        SELECT "morbilidad" AS m FROM "EvaluacionMedica" WHERE "morbilidad" IS NOT NULL AND TRIM("morbilidad") <> ''
        UNION ALL
        SELECT "atencionMorbilidad" AS m FROM "registros_diarios_atencion" WHERE "atencionMorbilidad" IS NOT NULL AND TRIM("atencionMorbilidad") <> ''
    ) todos
    WHERE TRIM(m) <> ''
    ORDER BY LOWER(TRIM(m)), TRIM(m)
) sub
ON CONFLICT ("nombreNormalizado") DO NOTHING;
