export interface RolItem {
  id: string;
  nombre: string;
}

export interface PermisoItem {
  id: string;
  codigo: string;
}

export interface DatosPaginaRoles {
  roles: RolItem[];
  permisos: PermisoItem[];
  permisosPorRol: Record<string, string[]>;
}