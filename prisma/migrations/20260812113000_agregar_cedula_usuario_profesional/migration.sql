-- La cédula es opcional para conservar usuarios existentes sin inventar datos.
ALTER TABLE "Usuario"
ADD COLUMN "cedula" TEXT;

-- PostgreSQL permite múltiples NULL y evita duplicar cédulas registradas.
CREATE UNIQUE INDEX "Usuario_cedula_key" ON "Usuario"("cedula");
