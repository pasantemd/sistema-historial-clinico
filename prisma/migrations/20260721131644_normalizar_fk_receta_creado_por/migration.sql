-- DropForeignKey
ALTER TABLE "Receta" DROP CONSTRAINT "Receta_usuarioId_fkey";

-- AddForeignKey
ALTER TABLE "Receta" ADD CONSTRAINT "Receta_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
