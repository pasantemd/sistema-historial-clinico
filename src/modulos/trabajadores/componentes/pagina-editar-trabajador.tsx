import { notFound } from "next/navigation";

import { BotonRegresar } from "@/componentes/navegacion/boton-regresar";
import { Migas } from "@/componentes/navegacion/migas";
import { EncabezadoPagina } from "@/componentes/estructura/encabezado-pagina";
import { consultarCatalogoOrganizacional, consultarTrabajadorPorId } from "@/modulos/trabajadores";
import { FormularioTrabajador } from "@/modulos/trabajadores/componentes/formulario-trabajador";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";

interface Props { params: Promise<{ id: string }> }

export default async function EditarTrabajadorPage({ params }: Props) {
  const usuario = await requerirPermiso("trabajador.editar");
  await requerirPermiso("vinculo-laboral.editar");
  const { id } = await params;
  const [trabajador, catalogo] = await Promise.all([
    consultarTrabajadorPorId(usuario.id, id),
    consultarCatalogoOrganizacional(usuario.id),
  ]);
  if (!trabajador) notFound();

  return (
    <div className="space-y-6">
      <BotonRegresar rutaRespaldo="/trabajadores/[id]" />
      <Migas />
      <EncabezadoPagina titulo="Editar trabajador" descripcion={`${trabajador.nombres} ${trabajador.apellidos}`} />
      <FormularioTrabajador catalogo={catalogo} trabajador={trabajador} />
    </div>
  );
}
