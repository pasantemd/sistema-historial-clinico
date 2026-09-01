export interface FiltrosAuditoria {
  usuario?: string;
  modulo?: string;
  accion?: string;
  fechaDesde?: string;
  fechaHasta?: string;
  severidad?: string;
  pagina?: number;
  take?: number;
}

export type ResultadoAuditoria = "EXITOSO" | "FALLIDO";

export interface ResumenAuditoria {
  total: number;
  exitos: number;
  errores: number;
}

export interface RegistroAuditoria {
  id: string;
  fecha: Date;
  usuario: string;
  modulo: string;
  accion: string;
  entidad: string;
  entidadId?: string | null;
  resultado: ResultadoAuditoria;
  datosAnteriores?: unknown;
  datosNuevos?: unknown;
  agenteUsuario?: string | null;
  direccionIp?: string | null;
}
