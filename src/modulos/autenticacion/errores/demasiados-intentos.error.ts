export class DemasiadosIntentosError extends Error {
  constructor() {
    super("Demasiados intentos de inicio de sesión. Intente nuevamente más tarde.");
  }
}
