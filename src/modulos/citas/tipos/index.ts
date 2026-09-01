import type { EstadoCita } from "@/modulos/citas/constantes";

export interface CitaMedicaDto {
  id: string;
  fecha: string;
  horaInicio: string;
  horaFin: string | null;
  motivo: string;
  observaciones: string | null;
  estado: EstadoCita;
  recordatorio: boolean;
  trabajadorId: string;
  trabajadorNombre: string;
  trabajadorDocumento: string;
  empresaNombre: string | null;
  departamentoNombre: string | null;
  profesionalId: string | null;
  profesionalNombre: string | null;
  creadoEn: string;
}

export interface FiltrosCitas {
  trabajador?: string;
  profesional?: string;
  empresa?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  estado?: string;
  pagina?: number;
}

export interface PaginaCitas {
  citas: CitaMedicaDto[];
  total: number;
  pagina: number;
  totalPaginas: number;
}

export interface EntradaCita {
  trabajadorId: string;
  profesionalId?: string;
  fecha: string;
  horaInicio: string;
  duracionMinutos: number;
  motivo: string;
  observaciones?: string;
  recordatorio: boolean;
}

export interface ConflictoCita {
  profesional: boolean;
  trabajador: boolean;
  citas: Array<{ id: string; fecha: string; horaInicio: string; horaFin: string | null; motivo: string }>;
}
