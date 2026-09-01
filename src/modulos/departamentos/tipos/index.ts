export interface DepartamentoLista { id: string; empresaId: string; empresa: string; nombre: string; descripcion: string | null; estado: "ACTIVO" | "INACTIVO" }
export interface PaginaDepartamentos { departamentos: DepartamentoLista[]; total: number; pagina: number; totalPaginas: number; tamanoPagina: number }
