-- CreateTable
CREATE TABLE "UsuarioEmpresa" (
    "usuarioId" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "asignadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsuarioEmpresa_pkey" PRIMARY KEY ("usuarioId","empresaId")
);

-- Backfill compatible: el acceso global previo se convierte en membresías
-- explícitas para no bloquear a usuarios existentes al aplicar la migración.
INSERT INTO "UsuarioEmpresa" ("usuarioId", "empresaId")
SELECT u."id", e."id"
FROM "Usuario" AS u
CROSS JOIN "Empresa" AS e
WHERE u."estado" = 'ACTIVO'
  AND e."estado" = 'ACTIVO'
ON CONFLICT ("usuarioId", "empresaId") DO NOTHING;

-- CreateIndex
CREATE INDEX "UsuarioEmpresa_empresaId_idx" ON "UsuarioEmpresa"("empresaId");

-- AddForeignKey
ALTER TABLE "UsuarioEmpresa" ADD CONSTRAINT "UsuarioEmpresa_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioEmpresa" ADD CONSTRAINT "UsuarioEmpresa_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE CASCADE ON UPDATE CASCADE;
