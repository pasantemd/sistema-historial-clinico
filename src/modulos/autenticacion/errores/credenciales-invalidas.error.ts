export class CredencialesInvalidasError extends Error {
  constructor() {
    super("El correo o la contraseña son incorrectos.");
    this.name = "CredencialesInvalidasError";
  }
}
