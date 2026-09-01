import { notFound } from "next/navigation";

import { Migas } from "@/componentes/navegacion/migas";
import { AccionesCertificado } from "@/modulos/fichas-ocupacionales/componentes/acciones-certificado";
import { CertificadoEvaluacionOcupacionalOficial } from "@/modulos/fichas-ocupacionales/componentes/certificado-oficial";
import { consultarCertificadoFicha } from "@/modulos/fichas-ocupacionales/consultas/fichas.consulta";
import { PERMISOS_FICHA } from "@/modulos/fichas-ocupacionales/constantes";
import {
  obtenerAgenteUsuarioSolicitud,
  registrarAuditoriaSegura,
} from "@/servicios/auditoria/registrar-auditoria";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";
import { tienePermiso } from "@/servicios/autenticacion/tiene-permiso";

interface Props {
  params: Promise<{ id: string; fichaId: string }>;
}

export default async function PaginaCertificado({ params }: Props) {
  const usuario = await requerirPermiso(PERMISOS_FICHA.certificado);
  const { id: trabajadorId, fichaId } = await params;
  const ficha = await consultarCertificadoFicha(usuario.id, fichaId);
  if (!ficha || ficha.trabajadorId !== trabajadorId) notFound();

  await registrarAuditoriaSegura({
    usuarioId: usuario.id,
    accion: "CERTIFICADO_CONSULTADO",
    modulo: "FICHAS_OCUPACIONALES",
    entidad: "CERTIFICADO_OCUPACIONAL",
    entidadId: ficha.id,
    agenteUsuario: await obtenerAgenteUsuarioSolicitud(),
    resultado: "EXITOSO",
  });

  const puedeExportar = tienePermiso(
    usuario,
    PERMISOS_FICHA.exportarCertificado,
  );

  return (
    <div className="space-y-4 p-4">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Migas />
        <AccionesCertificado
          trabajadorId={trabajadorId}
          fichaId={fichaId}
          puedeExportar={puedeExportar}
        />
      </div>

      <div className="overflow-x-auto pb-2">
        <CertificadoEvaluacionOcupacionalOficial ficha={ficha} />
      </div>
    </div>
  );
}
