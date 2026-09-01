import { redirect } from "next/navigation";

import { BotonRegresar } from "@/componentes/navegacion/boton-regresar";

export default function Page() {
  redirect("/inventario");
  return <BotonRegresar rutaRespaldo="/inventario" />;
}
