export class EvaluacionNoEncontradaError extends Error { constructor(){super("La evaluación médica no existe o no está disponible.");this.name="EvaluacionNoEncontradaError";} }
export class EvaluacionBloqueadaError extends Error { constructor(){super("Una evaluación finalizada o anulada no puede editarse.");this.name="EvaluacionBloqueadaError";} }
export class AsignacionActivaRequeridaError extends Error { constructor(){super("El trabajador no tiene una asignación laboral activa válida.");this.name="AsignacionActivaRequeridaError";} }
export class AlertaAlergiaRequiereConfirmacionError extends Error { constructor(public readonly indices: number[]){super("Confirme y justifique los medicamentos que coinciden con alergias activas.");this.name="AlertaAlergiaRequiereConfirmacionError";} }
