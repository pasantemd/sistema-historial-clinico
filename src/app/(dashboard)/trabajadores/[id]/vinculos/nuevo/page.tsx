import PaginaNuevoVinculoLaboral from "@/modulos/trabajadores/componentes/pagina-nuevo-vinculo-laboral";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PaginaNuevoVinculoLaboral trabajadorId={id} />;
}
