-- AlterTable
ALTER TABLE "MedicamentoEvaluacion" ADD COLUMN     "cantidad" DECIMAL(12,2),
ALTER COLUMN "dosis" DROP NOT NULL,
ALTER COLUMN "frecuencia" DROP NOT NULL,
ALTER COLUMN "duracion" DROP NOT NULL,
ALTER COLUMN "viaAdministracion" DROP NOT NULL;
