import type { EstadoRegistroDiario } from "@/generated/prisma/enums";

export interface AlergiaResumenDto {
  id: string;
  sustancia: string;
  severidad: string;
  reaccion: string | null;
}

export interface TrabajadorRegistroDto {
  id: string;
  nombreCompleto: string;
  numeroDocumento: string;
  fechaNacimiento: string | null;
  edad: number | null;
  empresaId: string;
  empresa: string;
  empresaRuc: string;
  departamentoId: string;
  departamento: string;
  alergias: AlergiaResumenDto[];
}

export interface RegistroDiarioResumenDto {
  id: string;
  numeroRegistro: string;
  trabajadorId: string;
  empresaId: string;
  departamentoId: string | null;
  nombreCompleto: string;
  numeroDocumento: string;
  fechaNacimiento: string | null;
  fechaAtencion: string;
  atencionMorbilidad: string;
  medicacion: string | null;
  procedimiento: string | null;
  firmaConfirmada: boolean;
  empresa: string;
  departamento: string | null;
  profesional: string | null;
  estado: EstadoRegistroDiario;
  medicamentos?: RegistroDiarioMedicamentoDto[];
}

export interface RegistroDiarioMedicamentoDto {
  id: string;
  medicamentoInventarioId: string;
  nombreSnapshot: string;
  unidadSnapshot: string;
  cantidadEntregada: string;
}

export interface RegistroDiarioFechaDto {
  fechaAtencion: string;
  empresa: string;
  empresaRuc: string | null;
  profesional: string | null;
  numeroRegistroInicio: string;
  numeroRegistroFin: string;
  totalPacientes: number;
  registros: RegistroDiarioResumenDto[];
}

export interface RecetaAsociadaRegistroDto {
  id: string;
  numeroReceta: string;
  estado: string;
}

export interface RegistroDiarioDetalleDto extends RegistroDiarioResumenDto {
  empresaRuc: string | null;
  observaciones: string | null;
  anuladoEn: string | null;
  motivoAnulacion: string | null;
  creadoEn: string;
  recetaAsociada?: RecetaAsociadaRegistroDto | null;
}

export interface PaginaRegistrosDiarios {
  registros: RegistroDiarioResumenDto[];
  total: number;
  pagina: number;
  totalPaginas: number;
}

export interface FiltrosRegistroDiario {
  fecha?: string;
  empresaId?: string;
  trabajador?: string;
  profesionalId?: string;
  estado?: string;
  pagina?: number;
}
