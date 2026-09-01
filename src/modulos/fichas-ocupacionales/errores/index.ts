export class FichaNoEncontradaError extends Error {
  constructor() {
    super("La ficha ocupacional solicitada no existe.");
    this.name = "FichaNoEncontradaError";
  }
}

export class FichaFinalizadaError extends Error {
  constructor() {
    super("No se puede editar una ficha finalizada.");
    this.name = "FichaFinalizadaError";
  }
}

export class FichaAnuladaError extends Error {
  constructor() {
    super("La ficha ocupacional ya está anulada.");
    this.name = "FichaAnuladaError";
  }
}

export class TrabajadorNoEncontradoError extends Error {
  constructor() {
    super("El trabajador no existe o no tiene acceso.");
    this.name = "TrabajadorNoEncontradoError";
  }
}

export class EmpresaDepartamentoInvalidoError extends Error {
  constructor() {
    super("La empresa o el departamento no son válidos para este usuario.");
    this.name = "EmpresaDepartamentoInvalidoError";
  }
}
