import { notFound } from "next/navigation";
import { VistaPreviaReceta } from "@/modulos/recetas/componentes/vista-previa-receta";
import { VistaPreviaCertificado } from "@/modulos/fichas-ocupacionales/componentes/vista-previa-certificado";

interface Props {
  params: Promise<{ tipo: string; id: string }>;
  searchParams: Promise<{ trabajadorId?: string }>;
}

export default async function Page({ params, searchParams }: Props) {
  const { tipo, id } = await params;
  const { trabajadorId } = await searchParams;

  if (tipo === "receta") {
    return <VistaPreviaReceta recetaId={id} />;
  }

  if (tipo === "certificado" && trabajadorId) {
    return <VistaPreviaCertificado fichaId={id} trabajadorId={trabajadorId} />;
  }

  notFound();
}
