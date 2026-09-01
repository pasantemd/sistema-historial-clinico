export class RegistroDiarioNoEncontradoError extends Error {
  constructor() {
    super("El registro diario no existe o no está disponible.");
    this.name = "RegistroDiarioNoEncontradoError";
  }
}

export class RegistroDiarioAnuladoError extends Error {
  constructor() {
    super("Un registro diario anulado no puede modificarse.");
    this.name = "RegistroDiarioAnuladoError";
  }
}

export class TrabajadorClinicoNoDisponibleError extends Error {
  constructor() {
    super("El trabajador no tiene una empresa y departamento vigentes.");
    this.name = "TrabajadorClinicoNoDisponibleError";
  }
}

