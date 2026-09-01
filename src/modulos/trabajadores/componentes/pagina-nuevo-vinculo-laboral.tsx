import { notFound } from "next/navigation";

import { EncabezadoPagina } from "@/componentes/estructura/encabezado-pagina";
import { BotonRegresar } from "@/componentes/navegacion/boton-regresar";
import { Migas } from "@/componentes/navegacion/migas";
import { FormularioVinculoLaboral } from "@/modulos/trabajadores/componentes/formulario-vinculo-laboral";
import { consultarCatalogoOrganizacional, consultarTrabajadorPorId } from "@/modulos/trabajadores/consultas/trabajadores.consulta";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";

export default async function PaginaNuevoVinculoLaboral({ trabajadorId }: { trabajadorId: string }) {
  const usuario = await requerirPermiso("vinculo-laboral.crear");
  await requerirPermiso("trabajador.ver");
  const [trabajador, catalogo] = await Promise.all([consultarTrabajadorPorId(usuario.id, trabajadorId), consultarCatalogoOrganizacional(usuario.id)]);
  if (!trabajador) notFound();
  return <div className="space-y-6"><BotonRegresar rutaRespaldo="/trabajadores/[id]" /><Migas /><EncabezadoPagina titulo="Cambiar asignación laboral" descripcion={`${trabajador.apellidos} ${trabajador.nombres}`} /><FormularioVinculoLaboral trabajadorId={trabajador.id} catalogo={catalogo} /></div>;
}
