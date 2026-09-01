export interface UsuarioConRolesDto {
  id: string;
  nombres: string;
  apellidos: string;
  correo: string;
  estado: string;
  roles: { id: string; nombre: string }[];
  rolUnico: string | null;
}

export interface CambioRolResultado {
  exito: true;
  usuarioId: string;
  rolAnterior: string | null;
  rolNuevo: string;
}