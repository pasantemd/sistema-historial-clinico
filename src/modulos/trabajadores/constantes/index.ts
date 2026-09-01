export const TAMANO_PAGINA_TRABAJADORES = 10;

export const ESTADOS_TRABAJADOR = [
  { valor: "ACTIVO", etiqueta: "Activo" },
  { valor: "INACTIVO", etiqueta: "Inactivo" },
  { valor: "SUSPENDIDO", etiqueta: "Suspendido" },
  { valor: "RETIRADO", etiqueta: "Retirado" },
  { valor: "FINALIZADO", etiqueta: "Finalizado" },
] as const;

export const ESTADOS_VINCULO = [
  { valor: "ACTIVO", etiqueta: "Activo" },
  { valor: "SUSPENDIDO", etiqueta: "Suspendido" },
  { valor: "FINALIZADO", etiqueta: "Finalizado" },
] as const;

export const TIPOS_DOCUMENTO = [
  { valor: "CEDULA", etiqueta: "Cédula" },
  { valor: "PASAPORTE", etiqueta: "Pasaporte" },
  { valor: "RUC", etiqueta: "RUC" },
  { valor: "OTRO", etiqueta: "Otro" },
] as const;

export const SEXOS = [
  { valor: "MASCULINO", etiqueta: "Masculino" },
  { valor: "FEMENINO", etiqueta: "Femenino" },
  { valor: "OTRO", etiqueta: "Otro" },
  { valor: "NO_ESPECIFICADO", etiqueta: "No especificado" },
] as const;
