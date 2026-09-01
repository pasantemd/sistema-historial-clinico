export class UsuarioInactivoError extends Error {
  constructor() {
    super("El usuario no está activo.");
    this.name = "UsuarioInactivoError";
  }
}
