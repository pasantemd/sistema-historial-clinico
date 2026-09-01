import type { EstadoAtencionMedica } from "@/generated/prisma/enums";

export interface AtencionMedicaResumenDto {
  id: string;
  trabajadorId: string;
  empresaId: string;
  departamentoId: string | null;
  fechaAtencion: string | null;
  horaAtencion: string | null;
  motivoGeneral: string | null;
  estado: EstadoAtencionMedica;
  empresaNombreHistorico: string;
  empresaRucHistorico: string;
  departamentoNombreHistorico: string | null;
  trabajadorNombreHistorico: string;
  trabajadorDocumentoHistorico: string;
  profesionalResponsableId: string | null;
  profesionalResponsableNombre: string | null;
  finalizadaEn: string | null;
  anuladaEn: string | null;
}

export interface DocumentoAtencionDto {
  tipo: "FICHA" | "EVALUACION" | "CERTIFICADO" | "RECETA" | "CONSULTA";
  id: string;
  etiqueta: string;
  estado: string;
  fecha: string | null;
  ruta: string;
}

export interface AtencionMedicaDetalleDto extends AtencionMedicaResumenDto {
  documentos: DocumentoAtencionDto[];
}

export interface EstadisticasAtencionDto {
  total: number;
  abiertas: number;
  finalizadas: number;
  anuladas: number;
}
