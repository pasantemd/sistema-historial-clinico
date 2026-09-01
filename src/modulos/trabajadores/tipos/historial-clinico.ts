export type TipoDocumentoHistorial =
  | "ATENCION_LEGADA"
  | "REGISTRO_DIARIO"
  | "EVALUACION_MEDICA"
  | "FICHA_OCUPACIONAL"
  | "CERTIFICADO_OCUPACIONAL"
  | "RECETA"
  | "DOCUMENTO_CLINICO";

export interface DocumentoHistorialClinicoDto {
  id: string;
  tipo: TipoDocumentoHistorial;
  etiqueta: string;
  numero: string;
  estado: string;
  profesional: string | null;
  empresa: string;
  ruta: string;
  rutaPdf?: string;
  rutaExcel?: string;
}

export interface GrupoHistorialClinicoDto {
  clave: string;
  fecha: string | null;
  documentos: DocumentoHistorialClinicoDto[];
}

export interface PermisosHistorialClinico {
  registroDiario: boolean;
  evaluaciones: boolean;
  fichas: boolean;
  recetas: boolean;
  documentos: boolean;
}
