export class ErrorUsuarioNoEncontrado extends Error {
  constructor() {
    super("El usuario no existe.");
    this.name = "ErrorUsuarioNoEncontrado";
  }
}

export class ErrorRolNoEncontrado extends Error {
  constructor() {
    super("El rol no existe.");
    this.name = "ErrorRolNoEncontrado";
  }
}

export class ErrorSinAdministradorActivo extends Error {
  constructor() {
    super("No se puede dejar el sistema sin un administrador activo.");
    this.name = "ErrorSinAdministradorActivo";
  }
}

export class ErrorAutoCambioRol extends Error {
  constructor() {
    super("No puede modificar su propio rol.");
    this.name = "ErrorAutoCambioRol";
  }
}

export class ErrorPermisoDenegadoRol extends Error {
  constructor() {
    super("No tiene permiso para administrar roles de usuario.");
    this.name = "ErrorPermisoDenegadoRol";
  }
}