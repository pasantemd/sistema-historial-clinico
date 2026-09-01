import { notFound } from "next/navigation";

import { EncabezadoPagina } from "@/componentes/estructura/encabezado-pagina";
import { BotonRegresar } from "@/componentes/navegacion/boton-regresar";
import { Migas } from "@/componentes/navegacion/migas";
import { FormularioDatosProfesional } from "@/modulos/configuracion-profesional/componentes/formulario-datos-profesional";
import { consultarDatosProfesional } from "@/modulos/configuracion-profesional/servicios/profesional.servicio";
import { requerirUsuario } from "@/servicios/autenticacion/requerir-usuario";

export async function PaginaMiPerfilProfesional() {
  const usuario = await requerirUsuario();
  const datos = await consultarDatosProfesional(usuario.id);

  if (!datos) notFound();

  return (
    <div className="space-y-6">
      <BotonRegresar rutaRespaldo="/inicio" />
      <Migas />
      <EncabezadoPagina
        titulo="Mi perfil profesional"
        descripcion="Actualice los datos que aparecen en sus documentos clínicos."
      />
      <FormularioDatosProfesional valoresIniciales={datos} />
    </div>
  );
}
