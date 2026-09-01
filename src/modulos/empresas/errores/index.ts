export class AccesoEmpresaDenegadoError extends Error {
  constructor() {
    super("No tiene acceso a la empresa solicitada.");
    this.name = "AccesoEmpresaDenegadoError";
  }
}
