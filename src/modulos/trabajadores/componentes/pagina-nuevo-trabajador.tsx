import { BotonRegresar } from "@/componentes/navegacion/boton-regresar";
import { Migas } from "@/componentes/navegacion/migas";
import { EncabezadoPagina } from "@/componentes/estructura/encabezado-pagina";
import { consultarCatalogoOrganizacional } from "@/modulos/trabajadores";
import { FormularioTrabajador } from "@/modulos/trabajadores/componentes/formulario-trabajador";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";

export default async function NuevoTrabajadorPage() {
  const usuario = await requerirPermiso("trabajador.crear");
  await requerirPermiso("vinculo-laboral.crear");
  const catalogo = await consultarCatalogoOrganizacional(usuario.id);

  return (
    <div className="space-y-6">
      <BotonRegresar rutaRespaldo="/trabajadores" />
      <Migas />
      <EncabezadoPagina titulo="Nuevo trabajador" descripcion="Registre la identidad, el contacto y los datos laborales iniciales sin datos médicos." />
      <FormularioTrabajador catalogo={catalogo} />
    </div>
  );
}
