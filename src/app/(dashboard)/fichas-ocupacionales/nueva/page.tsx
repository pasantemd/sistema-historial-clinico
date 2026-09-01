import { redirect } from "next/navigation";
import { EncabezadoPagina } from "@/componentes/estructura/encabezado-pagina";
import { SelectorTrabajadorClinico } from "@/componentes/formularios/selector-trabajador-clinico";
import { Migas } from "@/componentes/navegacion/migas";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) { await requerirPermiso("ficha-ocupacional.crear"); const p = await searchParams; const valor = (v: string | string[] | undefined) => typeof v === "string" ? v : ""; const trabajadorId = valor(p.trabajadorId); const registroId = valor(p.registroDiarioId); if (trabajadorId) redirect(`/trabajadores/${trabajadorId}/fichas/nueva${registroId ? `?registroDiarioId=${registroId}` : ""}`); return <div className="space-y-6"><Migas /><EncabezadoPagina titulo="Nueva ficha ocupacional" descripcion="Seleccione un trabajador para abrir el formulario A–P" /><SelectorTrabajadorClinico destino="/fichas-ocupacionales/nueva" parametros={registroId ? `registroDiarioId=${registroId}` : ""} /></div>; }
