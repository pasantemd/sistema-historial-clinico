export interface UsuarioSesion {
  id: string;
  nombres: string;
  apellidos: string;
  correo: string;
  roles: string[];
  permisos: string[];
}

export interface UsuarioAutenticacion extends UsuarioSesion {
  claveHash: string;
  estado: "ACTIVO" | "INACTIVO";
}
