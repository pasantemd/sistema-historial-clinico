export class DocumentoClinicoNoEncontradoError extends Error { constructor() { super("El documento clínico no existe."); this.name = "DocumentoClinicoNoEncontradoError"; } }
export class DocumentoClinicoBloqueadoError extends Error { constructor() { super("Solo los documentos clínicos en borrador pueden editarse."); this.name = "DocumentoClinicoBloqueadoError"; } }
export class AlergiaDocumentoRequiereJustificacionError extends Error { constructor() { super("Existe una coincidencia con una alergia activa. Confirme la decisión y registre la justificación clínica."); this.name = "AlergiaDocumentoRequiereJustificacionError"; } }

