export class TrabajadorNoEncontradoError extends Error {
  constructor() {
    super("El trabajador solicitado no existe.");
    this.name = "TrabajadorNoEncontradoError";
  }
}

export class DocumentoDuplicadoError extends Error {
  constructor() {
    super("Ya existe un trabajador con ese número de documento.");
    this.name = "DocumentoDuplicadoError";
  }
}

export class OrganizacionLaboralInvalidaError extends Error { constructor(){super("La empresa y el departamento seleccionados no son coherentes.");this.name="OrganizacionLaboralInvalidaError";} }
export class VinculoLaboralNoEncontradoError extends Error { constructor(){super("El vínculo laboral solicitado no existe o no es accesible.");this.name="VinculoLaboralNoEncontradoError";} }
export class VinculoLaboralDuplicadoError extends Error { constructor(){super("Ya existe un vínculo laboral activo equivalente.");this.name="VinculoLaboralDuplicadoError";} }
