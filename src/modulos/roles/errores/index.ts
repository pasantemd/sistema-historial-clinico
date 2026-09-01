export class ErrorRolNoEncontrado extends Error {
  constructor() {
    super("El rol no existe.");
    this.name = "ErrorRolNoEncontrado";
  }
}

export class ErrorPermisoNoEncontrado extends Error {
  constructor() {
    super("Uno o más permisos no existen.");
    this.name = "ErrorPermisoNoEncontrado";
  }
}

export class ErrorProteccionPermisoAdministrador extends Error {
  constructor() {
    super("El permiso usuario.administrar solo puede pertenecer al rol Administrador.");
    this.name = "ErrorProteccionPermisoAdministrador";
  }
}