import { Prisma } from "@/generated/prisma/client";
import { requerirAccesoEmpresa } from "@/modulos/empresas/servicios/acceso-empresa.servicio";
import type {
  FiltrosReportes,
  MedicamentoEntregadoReporte,
} from "@/modulos/reportes/tipos";
import { normalizarFiltrosReportes } from "@/modulos/reportes/servicios/resolver-periodo-reportes";
import { prisma } from "@/servicios/base-datos/prisma";

interface FilaMedicamentoEntregado {
  medicamentoId: string;
  nombre: string;
  unidad: string;
  cantidadTotal: Prisma.Decimal;
  numeroEntregas: bigint;
}

function construirCondiciones(filtros: FiltrosReportes) {
  const condiciones: Prisma.Sql[] = [];

  if (filtros.fechaDesde) {
    condiciones.push(
      Prisma.sql`rd."diaAtencion" >= ${filtros.fechaDesde}::date`,
    );
  }
  if (filtros.fechaHasta) {
    condiciones.push(
      Prisma.sql`rd."diaAtencion" <= ${filtros.fechaHasta}::date`,
    );
  }
  if (filtros.empresaId) {
    condiciones.push(Prisma.sql`rd."empresaId" = ${filtros.empresaId}::uuid`);
  }
  if (filtros.departamentoId) {
    condiciones.push(
      Prisma.sql`rd."departamentoId" = ${filtros.departamentoId}::uuid`,
    );
  }
  if (filtros.trabajadorId) {
    condiciones.push(
      Prisma.sql`rd."trabajadorId" = ${filtros.trabajadorId}::uuid`,
    );
  }
  if (filtros.profesionalId) {
    condiciones.push(
      Prisma.sql`rd."profesionalId" = ${filtros.profesionalId}::uuid`,
    );
  }

  return condiciones.length > 0
    ? Prisma.sql`AND ${Prisma.join(condiciones, " AND ")}`
    : Prisma.empty;
}

export async function consultarMedicamentosEntregadosReporte(
  usuarioId: string,
  filtrosEntrada: FiltrosReportes,
): Promise<MedicamentoEntregadoReporte[]> {
  const filtros = normalizarFiltrosReportes(filtrosEntrada);
  if (filtros.empresaId) {
    await requerirAccesoEmpresa(usuarioId, filtros.empresaId);
  }

  const condiciones = construirCondiciones(filtros);
  const filas = await prisma.$queryRaw<FilaMedicamentoEntregado[]>(Prisma.sql`
    WITH entregas_por_atencion AS (
      SELECT
        rdm."medicamentoInventarioId" AS "medicamentoId",
        mi."nombre" AS "nombre",
        rdm."unidadSnapshot" AS "unidad",
        rd."id" AS "registroDiarioId",
        SUM(
          CASE
            WHEN mov."tipoMovimiento" = 'SALIDA'
              AND mov."referenciaTipo" = 'REGISTRO_DIARIO'
              THEN mov."cantidad"
            WHEN mov."tipoMovimiento" = 'DEVOLUCION'
              AND mov."referenciaTipo" = 'REGISTRO_DIARIO_ANULADO'
              THEN -mov."cantidad"
            ELSE 0
          END
        ) AS "cantidadNeta"
      FROM "registro_diario_medicamentos" AS rdm
      INNER JOIN "registros_diarios_atencion" AS rd
        ON rd."id" = rdm."registroDiarioId"
      INNER JOIN "medicamentos_inventario" AS mi
        ON mi."id" = rdm."medicamentoInventarioId"
      INNER JOIN "movimientos_inventario" AS mov
        ON mov."medicamentoInventarioId" = rdm."medicamentoInventarioId"
        AND mov."referenciaId" = rd."id"::text
        AND (
          (mov."tipoMovimiento" = 'SALIDA' AND mov."referenciaTipo" = 'REGISTRO_DIARIO')
          OR
          (mov."tipoMovimiento" = 'DEVOLUCION' AND mov."referenciaTipo" = 'REGISTRO_DIARIO_ANULADO')
        )
      WHERE EXISTS (
        SELECT 1
        FROM "UsuarioEmpresa" AS ue
        WHERE ue."usuarioId" = ${usuarioId}::uuid
          AND ue."empresaId" = rd."empresaId"
      )
      ${condiciones}
      GROUP BY
        rdm."medicamentoInventarioId",
        mi."nombre",
        rdm."unidadSnapshot",
        rd."id"
    ),
    entregas_netas AS (
      SELECT *
      FROM entregas_por_atencion
      WHERE "cantidadNeta" > 0
    )
    SELECT
      "medicamentoId",
      "nombre",
      "unidad",
      SUM("cantidadNeta") AS "cantidadTotal",
      COUNT(*)::bigint AS "numeroEntregas"
    FROM entregas_netas
    GROUP BY "medicamentoId", "nombre", "unidad"
    ORDER BY "cantidadTotal" DESC, "nombre" ASC, "unidad" ASC
  `);

  return filas.map((fila) => ({
    medicamentoId: fila.medicamentoId,
    nombre: fila.nombre,
    unidad: fila.unidad,
    cantidadTotal: Number(fila.cantidadTotal),
    numeroEntregas: Number(fila.numeroEntregas),
  }));
}
