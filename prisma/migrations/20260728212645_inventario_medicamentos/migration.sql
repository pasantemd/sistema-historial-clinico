-- CreateEnum
CREATE TYPE "EstadoMedicamentoInventario" AS ENUM ('ACTIVO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "UnidadMedicamentoInventario" AS ENUM ('UNIDADES', 'TABLETAS', 'CAPSULAS', 'FRASCOS', 'AMPOLLAS', 'SOBRES', 'TUBOS', 'MILILITROS', 'OTRO');

-- CreateEnum
CREATE TYPE "TipoMovimientoInventario" AS ENUM ('ENTRADA', 'SALIDA', 'AJUSTE', 'DEVOLUCION');

-- CreateTable
CREATE TABLE "medicamentos_inventario" (
    "id" UUID NOT NULL,
    "nombre" TEXT NOT NULL,
    "cantidadDisponible" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "unidad" "UnidadMedicamentoInventario" NOT NULL,
    "estado" "EstadoMedicamentoInventario" NOT NULL DEFAULT 'ACTIVO',
    "observaciones" TEXT,
    "creadoPorUsuarioId" UUID,
    "actualizadoPorUsuarioId" UUID,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "medicamentos_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_inventario" (
    "id" UUID NOT NULL,
    "medicamentoInventarioId" UUID NOT NULL,
    "tipoMovimiento" "TipoMovimientoInventario" NOT NULL,
    "cantidad" DECIMAL(12,2) NOT NULL,
    "cantidadAnterior" DECIMAL(12,2) NOT NULL,
    "cantidadPosterior" DECIMAL(12,2) NOT NULL,
    "motivo" TEXT NOT NULL,
    "referenciaTipo" TEXT,
    "referenciaId" TEXT,
    "usuarioId" UUID NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_inventario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registro_diario_medicamentos" (
    "id" UUID NOT NULL,
    "registroDiarioId" UUID NOT NULL,
    "medicamentoInventarioId" UUID NOT NULL,
    "nombreSnapshot" TEXT NOT NULL,
    "unidadSnapshot" TEXT NOT NULL,
    "cantidadEntregada" DECIMAL(12,2) NOT NULL,
    "movimientoInventarioId" UUID,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "registro_diario_medicamentos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "medicamentos_inventario_nombre_idx" ON "medicamentos_inventario"("nombre");

-- CreateIndex
CREATE INDEX "medicamentos_inventario_estado_idx" ON "medicamentos_inventario"("estado");

-- CreateIndex
CREATE INDEX "movimientos_inventario_medicamentoInventarioId_idx" ON "movimientos_inventario"("medicamentoInventarioId");

-- CreateIndex
CREATE INDEX "movimientos_inventario_tipoMovimiento_idx" ON "movimientos_inventario"("tipoMovimiento");

-- CreateIndex
CREATE INDEX "movimientos_inventario_referenciaTipo_referenciaId_idx" ON "movimientos_inventario"("referenciaTipo", "referenciaId");

-- CreateIndex
CREATE INDEX "movimientos_inventario_usuarioId_idx" ON "movimientos_inventario"("usuarioId");

-- CreateIndex
CREATE UNIQUE INDEX "registro_diario_medicamentos_movimientoInventarioId_key" ON "registro_diario_medicamentos"("movimientoInventarioId");

-- CreateIndex
CREATE INDEX "registro_diario_medicamentos_registroDiarioId_idx" ON "registro_diario_medicamentos"("registroDiarioId");

-- CreateIndex
CREATE INDEX "registro_diario_medicamentos_medicamentoInventarioId_idx" ON "registro_diario_medicamentos"("medicamentoInventarioId");

-- CreateIndex
CREATE UNIQUE INDEX "registro_diario_medicamentos_registroDiarioId_medicamentoIn_key" ON "registro_diario_medicamentos"("registroDiarioId", "medicamentoInventarioId");

-- AddForeignKey
ALTER TABLE "medicamentos_inventario" ADD CONSTRAINT "medicamentos_inventario_creadoPorUsuarioId_fkey" FOREIGN KEY ("creadoPorUsuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicamentos_inventario" ADD CONSTRAINT "medicamentos_inventario_actualizadoPorUsuarioId_fkey" FOREIGN KEY ("actualizadoPorUsuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_medicamentoInventarioId_fkey" FOREIGN KEY ("medicamentoInventarioId") REFERENCES "medicamentos_inventario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_inventario" ADD CONSTRAINT "movimientos_inventario_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_diario_medicamentos" ADD CONSTRAINT "registro_diario_medicamentos_registroDiarioId_fkey" FOREIGN KEY ("registroDiarioId") REFERENCES "registros_diarios_atencion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_diario_medicamentos" ADD CONSTRAINT "registro_diario_medicamentos_medicamentoInventarioId_fkey" FOREIGN KEY ("medicamentoInventarioId") REFERENCES "medicamentos_inventario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_diario_medicamentos" ADD CONSTRAINT "registro_diario_medicamentos_movimientoInventarioId_fkey" FOREIGN KEY ("movimientoInventarioId") REFERENCES "movimientos_inventario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
