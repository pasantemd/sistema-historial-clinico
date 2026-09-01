import { BotonRegresar } from "@/componentes/navegacion/boton-regresar";
import { EncabezadoPagina } from "@/componentes/estructura/encabezado-pagina";
import { Migas } from "@/componentes/navegacion/migas";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";
import { PaginaRolesPermisos } from "@/modulos/roles/componentes/pagina-roles-permisos";
import { obtenerDatosPaginaRoles } from "@/modulos/roles/consultas/roles-permisos.consulta";

export default async function PaginaRoles() {
  await requerirPermiso("usuario.administrar");

  const datos = await obtenerDatosPaginaRoles();

  return (
    <div className="space-y-8">
      <BotonRegresar rutaRespaldo="/configuracion" />
      <Migas />
      <EncabezadoPagina
        titulo="Roles y permisos"
        descripcion="Administre los perfiles de acceso y permisos del sistema."
      />
      <PaginaRolesPermisos datos={datos} />
    </div>
  );
}