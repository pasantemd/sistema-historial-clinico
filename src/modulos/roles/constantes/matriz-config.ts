export const COLUMNAS = [
  { id: "ver", etiqueta: "Ver" },
  { id: "crear", etiqueta: "Crear" },
  { id: "editar", etiqueta: "Editar" },
  { id: "finalizar", etiqueta: "Finalizar" },
  { id: "atender", etiqueta: "Atender" },
  { id: "emitir", etiqueta: "Emitir" },
  { id: "movimiento", etiqueta: "Movimiento" },
  { id: "anular", etiqueta: "Anular" },
  { id: "exportar", etiqueta: "Exportar" },
  { id: "desactivar", etiqueta: "Desactivar" },
  { id: "administrar", etiqueta: "Administrar" },
] as const;

export type ColumnaId = (typeof COLUMNAS)[number]["id"];

export interface MapeoPermiso {
  codigo: string;
  moduloId: string;
  modulo: string;
  columnaId: ColumnaId;
  grupo: "CLINICO" | "ADMINISTRATIVO" | "CONFIGURACION";
}

export const MODULOS: { id: string; etiqueta: string; grupo: string }[] = [
  { id: "trabajadores", etiqueta: "Trabajadores", grupo: "CLINICO" },
  { id: "citas", etiqueta: "Citas", grupo: "CLINICO" },
  { id: "registro-diario", etiqueta: "Registro diario", grupo: "CLINICO" },
  { id: "evaluaciones-medicas", etiqueta: "Evaluaciones médicas", grupo: "CLINICO" },
  { id: "fichas-ocupacionales", etiqueta: "Fichas ocupacionales", grupo: "CLINICO" },
  { id: "recetas", etiqueta: "Recetas", grupo: "CLINICO" },
  { id: "documentos-clinicos", etiqueta: "Documentos clínicos", grupo: "CLINICO" },
  { id: "vinculos-laborales", etiqueta: "Vínculos laborales", grupo: "CLINICO" },
  { id: "alergias", etiqueta: "Alergias", grupo: "CLINICO" },
  { id: "inventario", etiqueta: "Inventario", grupo: "CLINICO" },
  { id: "reportes", etiqueta: "Reportes", grupo: "ADMINISTRATIVO" },
  { id: "auditoria", etiqueta: "Auditoría", grupo: "ADMINISTRATIVO" },
  { id: "empresas", etiqueta: "Empresas", grupo: "ADMINISTRATIVO" },
  { id: "departamentos", etiqueta: "Departamentos", grupo: "ADMINISTRATIVO" },
  { id: "usuarios", etiqueta: "Usuarios", grupo: "CONFIGURACION" },
  { id: "roles-permisos", etiqueta: "Roles y permisos", grupo: "CONFIGURACION" },
];

export const MODULOS_POR_GRUPO: Record<string, string[]> = {
  CLINICO: ["trabajadores", "citas", "registro-diario", "evaluaciones-medicas", "fichas-ocupacionales", "recetas", "documentos-clinicos", "vinculos-laborales", "alergias", "inventario"],
  ADMINISTRATIVO: ["reportes", "auditoria", "empresas", "departamentos"],
  CONFIGURACION: ["usuarios", "roles-permisos"],
};

export const GRUPO_ETIQUETAS: Record<string, string> = {
  CLINICO: "Clínicos",
  ADMINISTRATIVO: "Administrativos",
  CONFIGURACION: "Configuración",
};

export const GRUPO_ORDEN = ["CLINICO", "ADMINISTRATIVO", "CONFIGURACION"];

export const PERMISO_MAP: MapeoPermiso[] = [
  { codigo: "trabajador.ver", moduloId: "trabajadores", modulo: "Trabajadores", columnaId: "ver", grupo: "CLINICO" },
  { codigo: "trabajador.crear", moduloId: "trabajadores", modulo: "Trabajadores", columnaId: "crear", grupo: "CLINICO" },
  { codigo: "trabajador.editar", moduloId: "trabajadores", modulo: "Trabajadores", columnaId: "editar", grupo: "CLINICO" },
  { codigo: "cita.ver", moduloId: "citas", modulo: "Citas", columnaId: "ver", grupo: "CLINICO" },
  { codigo: "cita.crear", moduloId: "citas", modulo: "Citas", columnaId: "crear", grupo: "CLINICO" },
  { codigo: "cita.editar", moduloId: "citas", modulo: "Citas", columnaId: "editar", grupo: "CLINICO" },
  { codigo: "cita.cancelar", moduloId: "citas", modulo: "Citas", columnaId: "anular", grupo: "CLINICO" },
  { codigo: "cita.atender", moduloId: "citas", modulo: "Citas", columnaId: "atender", grupo: "CLINICO" },
  { codigo: "registro-diario.ver", moduloId: "registro-diario", modulo: "Registro diario", columnaId: "ver", grupo: "CLINICO" },
  { codigo: "registro-diario.crear", moduloId: "registro-diario", modulo: "Registro diario", columnaId: "crear", grupo: "CLINICO" },
  { codigo: "registro-diario.editar", moduloId: "registro-diario", modulo: "Registro diario", columnaId: "editar", grupo: "CLINICO" },
  { codigo: "registro-diario.anular", moduloId: "registro-diario", modulo: "Registro diario", columnaId: "anular", grupo: "CLINICO" },
  { codigo: "registro-diario.exportar", moduloId: "registro-diario", modulo: "Registro diario", columnaId: "exportar", grupo: "CLINICO" },
  { codigo: "evaluacion-medica.ver", moduloId: "evaluaciones-medicas", modulo: "Evaluaciones médicas", columnaId: "ver", grupo: "CLINICO" },
  { codigo: "evaluacion-medica.crear", moduloId: "evaluaciones-medicas", modulo: "Evaluaciones médicas", columnaId: "crear", grupo: "CLINICO" },
  { codigo: "evaluacion-medica.editar", moduloId: "evaluaciones-medicas", modulo: "Evaluaciones médicas", columnaId: "editar", grupo: "CLINICO" },
  { codigo: "evaluacion-medica.finalizar", moduloId: "evaluaciones-medicas", modulo: "Evaluaciones médicas", columnaId: "finalizar", grupo: "CLINICO" },
  { codigo: "evaluacion-medica.anular", moduloId: "evaluaciones-medicas", modulo: "Evaluaciones médicas", columnaId: "anular", grupo: "CLINICO" },
  { codigo: "evaluacion-medica.exportar", moduloId: "evaluaciones-medicas", modulo: "Evaluaciones médicas", columnaId: "exportar", grupo: "CLINICO" },
  { codigo: "ficha-ocupacional.ver", moduloId: "fichas-ocupacionales", modulo: "Fichas ocupacionales", columnaId: "ver", grupo: "CLINICO" },
  { codigo: "ficha-ocupacional.crear", moduloId: "fichas-ocupacionales", modulo: "Fichas ocupacionales", columnaId: "crear", grupo: "CLINICO" },
  { codigo: "ficha-ocupacional.editar", moduloId: "fichas-ocupacionales", modulo: "Fichas ocupacionales", columnaId: "editar", grupo: "CLINICO" },
  { codigo: "ficha-ocupacional.finalizar", moduloId: "fichas-ocupacionales", modulo: "Fichas ocupacionales", columnaId: "finalizar", grupo: "CLINICO" },
  { codigo: "ficha-ocupacional.anular", moduloId: "fichas-ocupacionales", modulo: "Fichas ocupacionales", columnaId: "anular", grupo: "CLINICO" },
  { codigo: "certificado-ocupacional.exportar", moduloId: "fichas-ocupacionales", modulo: "Fichas ocupacionales", columnaId: "exportar", grupo: "CLINICO" },
  { codigo: "receta.ver", moduloId: "recetas", modulo: "Recetas", columnaId: "ver", grupo: "CLINICO" },
  { codigo: "receta.crear", moduloId: "recetas", modulo: "Recetas", columnaId: "crear", grupo: "CLINICO" },
  { codigo: "receta.editar", moduloId: "recetas", modulo: "Recetas", columnaId: "editar", grupo: "CLINICO" },
  { codigo: "receta.emitir", moduloId: "recetas", modulo: "Recetas", columnaId: "emitir", grupo: "CLINICO" },
  { codigo: "receta.anular", moduloId: "recetas", modulo: "Recetas", columnaId: "anular", grupo: "CLINICO" },
  { codigo: "receta.exportar", moduloId: "recetas", modulo: "Recetas", columnaId: "exportar", grupo: "CLINICO" },
  { codigo: "documento-clinico.ver", moduloId: "documentos-clinicos", modulo: "Documentos clínicos", columnaId: "ver", grupo: "CLINICO" },
  { codigo: "documento-clinico.crear", moduloId: "documentos-clinicos", modulo: "Documentos clínicos", columnaId: "crear", grupo: "CLINICO" },
  { codigo: "documento-clinico.editar", moduloId: "documentos-clinicos", modulo: "Documentos clínicos", columnaId: "editar", grupo: "CLINICO" },
  { codigo: "documento-clinico.finalizar", moduloId: "documentos-clinicos", modulo: "Documentos clínicos", columnaId: "finalizar", grupo: "CLINICO" },
  { codigo: "documento-clinico.anular", moduloId: "documentos-clinicos", modulo: "Documentos clínicos", columnaId: "anular", grupo: "CLINICO" },
  { codigo: "documento-clinico.exportar", moduloId: "documentos-clinicos", modulo: "Documentos clínicos", columnaId: "exportar", grupo: "CLINICO" },
  { codigo: "vinculo-laboral.ver", moduloId: "vinculos-laborales", modulo: "Vínculos laborales", columnaId: "ver", grupo: "CLINICO" },
  { codigo: "vinculo-laboral.crear", moduloId: "vinculos-laborales", modulo: "Vínculos laborales", columnaId: "crear", grupo: "CLINICO" },
  { codigo: "vinculo-laboral.editar", moduloId: "vinculos-laborales", modulo: "Vínculos laborales", columnaId: "editar", grupo: "CLINICO" },
  { codigo: "alergia.ver", moduloId: "alergias", modulo: "Alergias", columnaId: "ver", grupo: "CLINICO" },
  { codigo: "alergia.crear", moduloId: "alergias", modulo: "Alergias", columnaId: "crear", grupo: "CLINICO" },
  { codigo: "alergia.editar", moduloId: "alergias", modulo: "Alergias", columnaId: "editar", grupo: "CLINICO" },
  { codigo: "inventario.ver", moduloId: "inventario", modulo: "Inventario", columnaId: "ver", grupo: "CLINICO" },
  { codigo: "inventario.crear", moduloId: "inventario", modulo: "Inventario", columnaId: "crear", grupo: "CLINICO" },
  { codigo: "inventario.editar", moduloId: "inventario", modulo: "Inventario", columnaId: "editar", grupo: "CLINICO" },
  { codigo: "inventario.movimiento", moduloId: "inventario", modulo: "Inventario", columnaId: "movimiento", grupo: "CLINICO" },
  { codigo: "inventario.desactivar", moduloId: "inventario", modulo: "Inventario", columnaId: "desactivar", grupo: "CLINICO" },
  { codigo: "reporte.ver", moduloId: "reportes", modulo: "Reportes", columnaId: "ver", grupo: "ADMINISTRATIVO" },
  { codigo: "reporte.exportar", moduloId: "reportes", modulo: "Reportes", columnaId: "exportar", grupo: "ADMINISTRATIVO" },
  { codigo: "auditoria.ver", moduloId: "auditoria", modulo: "Auditoría", columnaId: "ver", grupo: "ADMINISTRATIVO" },
  { codigo: "empresa.ver", moduloId: "empresas", modulo: "Empresas", columnaId: "ver", grupo: "ADMINISTRATIVO" },
  { codigo: "departamento.ver", moduloId: "departamentos", modulo: "Departamentos", columnaId: "ver", grupo: "ADMINISTRATIVO" },
  { codigo: "departamento.crear", moduloId: "departamentos", modulo: "Departamentos", columnaId: "crear", grupo: "ADMINISTRATIVO" },
  { codigo: "departamento.editar", moduloId: "departamentos", modulo: "Departamentos", columnaId: "editar", grupo: "ADMINISTRATIVO" },
  { codigo: "departamento.desactivar", moduloId: "departamentos", modulo: "Departamentos", columnaId: "desactivar", grupo: "ADMINISTRATIVO" },
  { codigo: "usuario.administrar", moduloId: "usuarios", modulo: "Usuarios", columnaId: "administrar", grupo: "CONFIGURACION" },
];

export function obtenerCeldaMatriz(moduloId: string, columnaId: string): MapeoPermiso | null {
  return PERMISO_MAP.find((m) => m.moduloId === moduloId && m.columnaId === columnaId) ?? null;
}

export const PERMISOS_PROTEGIDOS_ADMIN = new Set(["usuario.administrar"]);
