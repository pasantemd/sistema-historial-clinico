-- CreateEnum
CREATE TYPE "TipoEvaluacionOcupacional" AS ENUM ('INGRESO', 'PERIODICA', 'REINGRESO', 'RETIRO');

-- CreateEnum
CREATE TYPE "AptitudMedicaOcupacional" AS ENUM ('APTO', 'APTO_EN_OBSERVACION', 'APTO_CON_LIMITACIONES', 'NO_APTO');

-- CreateEnum
CREATE TYPE "EstadoFichaOcupacional" AS ENUM ('BORRADOR', 'FINALIZADA', 'ANULADA');

-- CreateTable
CREATE TABLE "FichaOcupacional" (
    "id" UUID NOT NULL,
    "trabajadorId" UUID NOT NULL,
    "empresaId" UUID NOT NULL,
    "departamentoId" UUID NOT NULL,
    "usuarioId" UUID NOT NULL,
    "tipoEvaluacion" "TipoEvaluacionOcupacional" NOT NULL,
    "estado" "EstadoFichaOcupacional" NOT NULL DEFAULT 'BORRADOR',
    "institucionSistema" TEXT,
    "tipoInstitucion" TEXT,
    "ruc" TEXT,
    "ciiu" TEXT,
    "establecimiento" TEXT,
    "numeroHistoriaClinica" TEXT,
    "numeroArchivo" TEXT,
    "primerApellido" TEXT,
    "segundoApellido" TEXT,
    "primerNombre" TEXT,
    "segundoNombre" TEXT,
    "atencionEmbarazada" BOOLEAN NOT NULL DEFAULT false,
    "atencionDiscapacidad" BOOLEAN NOT NULL DEFAULT false,
    "atencionCatastrofica" BOOLEAN NOT NULL DEFAULT false,
    "atencionLactancia" BOOLEAN NOT NULL DEFAULT false,
    "atencionAdultoMayor" BOOLEAN NOT NULL DEFAULT false,
    "sexo" TEXT,
    "fechaNacimiento" DATE,
    "edad" INTEGER,
    "grupoSanguineo" TEXT,
    "lateralidad" TEXT,
    "puestoTrabajoCIUO" TEXT,
    "fechaAtencion" DATE,
    "fechaIngresoTrabajo" DATE,
    "fechaReintegro" DATE,
    "fechaSalida" DATE,
    "observacionMotivo" TEXT,
    "antecedentesClinicosQuirurgicos" TEXT,
    "antecedentesFamiliares" TEXT,
    "autorizaTransfusiones" TEXT,
    "tratamientoHormonal" TEXT,
    "tratamientoHormonalCual" TEXT,
    "fechaUltimaMenstruacion" DATE,
    "gestas" INTEGER,
    "partos" INTEGER,
    "cesareas" INTEGER,
    "abortos" INTEGER,
    "planificacionFamiliarFemenina" TEXT,
    "metodoPlanificacionFemenina" TEXT,
    "examenesFemeninos" JSONB,
    "planificacionFamiliarMasculina" TEXT,
    "metodoPlanificacionMasculina" TEXT,
    "examenesMasculinos" JSONB,
    "consumoSustancias" JSONB,
    "actividadFisica" TEXT,
    "actividadFisicaCual" TEXT,
    "actividadFisicaTiempo" TEXT,
    "medicacionHabitual" TEXT,
    "medicacionHabitualCual" TEXT,
    "medicacionHabitualCantidad" TEXT,
    "observacionEstiloVida" TEXT,
    "noRefiereSintomatologia" BOOLEAN NOT NULL DEFAULT false,
    "descripcionProblemaActual" TEXT,
    "temperatura" DOUBLE PRECISION,
    "presionArterial" TEXT,
    "frecuenciaCardiaca" INTEGER,
    "frecuenciaRespiratoria" INTEGER,
    "saturacionOxigeno" INTEGER,
    "peso" DOUBLE PRECISION,
    "talla" DOUBLE PRECISION,
    "imc" DOUBLE PRECISION,
    "perimetroAbdominal" DOUBLE PRECISION,
    "examenFisico" JSONB,
    "observacionesExamenFisico" TEXT,
    "actividadesRiesgo" JSONB,
    "factoresRiesgo" JSONB,
    "medidasPreventivas" TEXT,
    "antecedentesLaborales" JSONB,
    "actividadesExtralaborales" JSONB,
    "resultadosExamenes" JSONB,
    "observacionesResultados" TEXT,
    "diagnosticos" JSONB,
    "aptitudMedica" TEXT,
    "observacionesAptitud" TEXT,
    "recomendaciones" JSONB,
    "retiroRealizaEvaluacion" TEXT,
    "retiroRelacionadoTrabajo" TEXT,
    "retiroObservacion" TEXT,
    "profesionalNombres" TEXT,
    "profesionalCodigoMedico" TEXT,
    "profesionalFirmaUrl" TEXT,
    "profesionalSelloUrl" TEXT,
    "firmaTrabajadorAcepta" BOOLEAN NOT NULL DEFAULT false,
    "firmaTrabajadorFecha" DATE,
    "firmaTrabajadorUrl" TEXT,
    "creadoPorId" UUID,
    "actualizadoPorId" UUID,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FichaOcupacional_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FichaOcupacional_trabajadorId_idx" ON "FichaOcupacional"("trabajadorId");

-- CreateIndex
CREATE INDEX "FichaOcupacional_empresaId_idx" ON "FichaOcupacional"("empresaId");

-- CreateIndex
CREATE INDEX "FichaOcupacional_departamentoId_idx" ON "FichaOcupacional"("departamentoId");

-- CreateIndex
CREATE INDEX "FichaOcupacional_usuarioId_idx" ON "FichaOcupacional"("usuarioId");

-- CreateIndex
CREATE INDEX "FichaOcupacional_tipoEvaluacion_idx" ON "FichaOcupacional"("tipoEvaluacion");

-- CreateIndex
CREATE INDEX "FichaOcupacional_estado_idx" ON "FichaOcupacional"("estado");

-- AddForeignKey
ALTER TABLE "FichaOcupacional" ADD CONSTRAINT "FichaOcupacional_trabajadorId_fkey" FOREIGN KEY ("trabajadorId") REFERENCES "Trabajador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FichaOcupacional" ADD CONSTRAINT "FichaOcupacional_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FichaOcupacional" ADD CONSTRAINT "FichaOcupacional_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "Departamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FichaOcupacional" ADD CONSTRAINT "FichaOcupacional_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FichaOcupacional" ADD CONSTRAINT "FichaOcupacional_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FichaOcupacional" ADD CONSTRAINT "FichaOcupacional_actualizadoPorId_fkey" FOREIGN KEY ("actualizadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
