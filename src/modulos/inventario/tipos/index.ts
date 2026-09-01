import type {
  EstadoMedicamentoInventario,
  TipoMovimientoInventario,
  UnidadMedicamentoInventario,
} from "@/generated/prisma/enums";

export interface MedicamentoInventarioResumenDto {
  id: string;
  nombre: string;
  cantidadDisponible: string;
  unidad: UnidadMedicamentoInventario;
  fechaCaducidad: string | null;
  estado: EstadoMedicamentoInventario;
  observaciones: string | null;
  ultimoMovimiento: string | null;
}

export interface MedicamentoInventarioDetalleDto extends MedicamentoInventarioResumenDto {
  creadoEn: string;
  actualizadoEn: string;
  movimientos: MovimientoInventarioDto[];
  entregas: EntregaMedicamentoInventarioDto[];
}

export interface ReporteMovimientosInventarioDto {
  id: string;
  nombre: string;
  cantidadDisponible: string;
  unidad: UnidadMedicamentoInventario;
  fechaCaducidad: string | null;
  estado: EstadoMedicamentoInventario;
  movimientos: MovimientoInventarioDto[];
}

export interface EntregaMedicamentoInventarioDto {
  id: string;
  registroDiarioId: string;
  numeroRegistro: string;
  trabajador: string;
  cedula: string;
  empresa: string;
  diaAtencion: string;
  cantidadEntregada: string;
  unidad: string;
  responsable: string;
  concepto: string;
}

export interface MovimientoInventarioDto {
  id: string;
  medicamentoInventarioId: string;
  medicamento: string;
  tipoMovimiento: TipoMovimientoInventario;
  cantidad: string;
  cantidadAnterior: string;
  cantidadPosterior: string;
  motivo: string;
  referenciaTipo: string | null;
  referenciaId: string | null;
  usuario: string;
  responsable: string;
  destinatario: string | null;
  concepto: string;
  creadoEn: string;
}

export interface IndicadoresInventarioDto {
  activos: number;
  unidadesDisponibles: string;
  sinStock: number;
  stockBajo: number;
}

export interface PaginaInventarioDto {
  medicamentos: MedicamentoInventarioResumenDto[];
  indicadores: IndicadoresInventarioDto;
  total: number;
  pagina: number;
  totalPaginas: number;
}

export interface FiltrosInventario {
  busqueda?: string;
  estado?: string;
  sinStock?: boolean;
  stockBajo?: boolean;
  pagina?: number;
  tamanoPagina?: number;
}

export interface MedicamentoInventarioBusquedaDto {
  id: string;
  nombre: string;
  cantidadDisponible: string;
  unidad: UnidadMedicamentoInventario;
}
