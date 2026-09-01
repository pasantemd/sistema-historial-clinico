import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";
import { tienePermiso } from "@/servicios/autenticacion/tiene-permiso";
import {
  consultarTrabajadorResumen,
  listarFichas,
} from "@/modulos/fichas-ocupacionales/consultas/fichas.consulta";
import { PaginaListaFichas } from "@/modulos/fichas-ocupacionales/componentes/pagina-lista-fichas";
import { PERMISOS_FICHA } from "@/modulos/fichas-ocupacionales/constantes";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PaginaFichasTrabajador({ params }: Props) {
  const usuario = await requerirPermiso(PERMISOS_FICHA.ver);
  const { id: trabajadorId } = await params;
  const [trabajador, fichas] = await Promise.all([
    consultarTrabajadorResumen(usuario.id, trabajadorId),
    listarFichas(usuario.id, trabajadorId),
  ]);
  const nombre = trabajador
    ? `${trabajador.apellidos} ${trabajador.nombres}`
    : "Trabajador";
  return (
    <PaginaListaFichas
      trabajadorId={trabajadorId}
      trabajadorNombre={nombre}
      fichas={fichas}
      puedeCrear={tienePermiso(usuario, PERMISOS_FICHA.crear)}
      puedeEditar={tienePermiso(usuario, PERMISOS_FICHA.editar)}
      puedeCertificado={tienePermiso(usuario, PERMISOS_FICHA.certificado)}
    />
  );
}
