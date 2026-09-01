export type EstadoTrabajadorValor = "ACTIVO" | "INACTIVO" | "SUSPENDIDO" | "RETIRADO";
export type TipoDocumentoValor = "CEDULA" | "PASAPORTE" | "RUC" | "OTRO";
export type SexoValor = "MASCULINO" | "FEMENINO" | "OTRO" | "NO_ESPECIFICADO";
export type EstadoVinculoValor = "ACTIVO" | "SUSPENDIDO" | "FINALIZADO";

export interface CatalogoOrganizacional {
  empresas: Array<{ id: string; ruc: string; razonSocial: string; nombreComercial: string | null }>;
  departamentos: Array<{ id: string; empresaId: string; nombre: string }>;
}

export interface VinculoLaboralDetalle {
  id: string;
  empresaId: string;
  empresa: string;
  departamentoId: string;
  departamento: string;
  fechaIngreso: string | null;
  fechaReingreso: string | null;
  fechaSalida: string | null;
  creadoEn: string;
  estado: EstadoVinculoValor;
  activa: boolean;
}

export interface TrabajadorLista {
  vinculoId: string;
  trabajadorId: string;
  empresa: string;
  departamento: string;
  nombreCompleto: string;
  numeroDocumento: string;
  estadoLaboral: EstadoTrabajadorValor | EstadoVinculoValor;
}

export interface TrabajadorDetalle {
  id: string;
  tipoDocumento: TipoDocumentoValor;
  numeroDocumento: string;
  nombres: string;
  apellidos: string;
  fechaNacimiento: string | null;
  sexo: SexoValor;
  telefono: string | null;
  correo: string | null;
  direccion: string | null;
  puestoLaboral: string | null;
  estadoLaboral: EstadoTrabajadorValor;
  empresa: string;
  empresaId: string;
  departamentoId: string;
  departamento: string;
  vinculoId: string | null;
  vinculos: VinculoLaboralDetalle[];
  creadoEn: string;
  actualizadoEn: string;
}

export interface FiltrosTrabajadores {
  busqueda?: string;
  empresaId?: string;
  estado?: EstadoVinculoValor;
  departamentoId?: string;
  pagina: number;
  tamanoPagina: 10 | 25 | 50;
}

export interface PaginaTrabajadores {
  trabajadores: TrabajadorLista[];
  total: number;
  pagina: number;
  totalPaginas: number;
  tamanoPagina: 10 | 25 | 50;
}

export type ResultadoAccion<T = undefined> =
  | { exito: true; datos?: T }
  | { exito: false; mensaje: string; erroresCampos?: Record<string, string[]> };
