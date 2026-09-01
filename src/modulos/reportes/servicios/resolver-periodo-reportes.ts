import type { FiltrosReportes, PeriodoReporte } from "@/modulos/reportes/tipos";

const FECHA_CIVIL = /^\d{4}-\d{2}-\d{2}$/;
const MES_CIVIL = /^\d{4}-\d{2}$/;

function hoyCivil(): string {
  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

function isoCivil(fecha: Date): string {
  return fecha.toISOString().slice(0, 10);
}

function fechaUtc(valor: string): Date {
  return new Date(`${valor}T00:00:00.000Z`);
}

function periodoValido(valor?: string): PeriodoReporte {
  if (valor === "mensual" || valor === "personalizado") return valor;
  return "semanal";
}

export function resolverPeriodoReportes(
  filtros: FiltrosReportes,
): Required<Pick<FiltrosReportes, "periodo" | "fechaReferencia" | "fechaDesde" | "fechaHasta">> {
  const periodo = periodoValido(filtros.periodo);
  const hoy = hoyCivil();

  if (periodo === "personalizado") {
    const desdeSolicitado = FECHA_CIVIL.test(filtros.fechaDesde ?? "")
      ? filtros.fechaDesde!
      : hoy;
    const hastaSolicitado = FECHA_CIVIL.test(filtros.fechaHasta ?? "")
      ? filtros.fechaHasta!
      : desdeSolicitado;
    const [fechaDesde, fechaHasta] = desdeSolicitado <= hastaSolicitado
      ? [desdeSolicitado, hastaSolicitado]
      : [hastaSolicitado, desdeSolicitado];

    return {
      periodo,
      fechaReferencia: fechaDesde,
      fechaDesde,
      fechaHasta,
    };
  }

  if (periodo === "mensual") {
    const mesReferencia = MES_CIVIL.test(filtros.fechaReferencia ?? "")
      ? filtros.fechaReferencia!
      : FECHA_CIVIL.test(filtros.fechaReferencia ?? "")
        ? filtros.fechaReferencia!.slice(0, 7)
        : hoy.slice(0, 7);
    const [anio, mes] = mesReferencia.split("-").map(Number);
    const inicio = new Date(Date.UTC(anio, mes - 1, 1));
    const fin = new Date(Date.UTC(anio, mes, 0));

    return {
      periodo,
      fechaReferencia: mesReferencia,
      fechaDesde: isoCivil(inicio),
      fechaHasta: isoCivil(fin),
    };
  }

  const referencia = FECHA_CIVIL.test(filtros.fechaReferencia ?? "")
    ? filtros.fechaReferencia!
    : hoy;
  const fecha = fechaUtc(referencia);
  const diaSemana = fecha.getUTCDay() || 7;
  const inicio = new Date(fecha);
  inicio.setUTCDate(fecha.getUTCDate() - diaSemana + 1);
  const fin = new Date(inicio);
  fin.setUTCDate(inicio.getUTCDate() + 6);

  return {
    periodo,
    fechaReferencia: referencia,
    fechaDesde: isoCivil(inicio),
    fechaHasta: isoCivil(fin),
  };
}

export function normalizarFiltrosReportes(filtros: FiltrosReportes): FiltrosReportes {
  return { ...filtros, ...resolverPeriodoReportes(filtros) };
}
