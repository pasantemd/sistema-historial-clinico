export class PermisoDenegadoError extends Error {
  constructor() {
    super("No tiene permiso para realizar esta operación.");
    this.name = "PermisoDenegadoError";
  }
}
