import { notFound } from "next/navigation";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";
import { consultarCertificadoFicha } from "@/modulos/fichas-ocupacionales/consultas/fichas.consulta";
import { VistaPreviaDocumento } from "@/componentes/documentos/vista-previa-documento";
import { PERMISOS_FICHA } from "@/modulos/fichas-ocupacionales/constantes";
import { CertificadoEvaluacionOcupacionalOficial } from "./certificado-oficial";

interface Props {
  fichaId: string;
  trabajadorId: string;
}

export async function VistaPreviaCertificado({ fichaId, trabajadorId }: Props) {
  const usuario = await requerirPermiso(PERMISOS_FICHA.exportarCertificado);
  const ficha = await consultarCertificadoFicha(usuario.id, fichaId);
  if (!ficha) notFound();

  return (
    <VistaPreviaDocumento
      titulo="Certificado - Evaluación Médica Ocupacional"
      subtitulo={`${ficha.trabajador.apellidos} ${ficha.trabajador.nombres} · ${ficha.fechaAtencion ?? ""}`}
      tipo="html"
      orientacion="horizontal"
      rutaPdf={`/api/fichas/${fichaId}/certificado/pdf`}
      rutaExcel={`/api/fichas/${fichaId}/exportar/excel`}
      rutaRegreso={`/trabajadores/${trabajadorId}/fichas/${fichaId}`}
    >
      <div className="print-area">
        <CertificadoEvaluacionOcupacionalOficial ficha={ficha} />
      </div>
    </VistaPreviaDocumento>
  );
}
