import { redirect } from "next/navigation";

import { Card, CardContent, CardHeader } from "@/componentes/ui/card";
import { FormularioInicioSesion } from "@/modulos/autenticacion/componentes/formulario-inicio-sesion";
import { obtenerRutaRetornoSegura } from "@/modulos/autenticacion";
import { obtenerUsuarioActual } from "@/servicios/autenticacion/obtener-sesion";

interface Props {
  searchParams: Promise<{ retorno?: string | string[] }>;
}

export default async function IniciarSesionPage({ searchParams }: Props) {
  const usuario = await obtenerUsuarioActual();
  if (usuario) redirect("/inicio");

  const parametros = await searchParams;
  const retorno = Array.isArray(parametros.retorno)
    ? parametros.retorno[0]
    : parametros.retorno;
  const rutaRetorno = obtenerRutaRetornoSegura(retorno);

  return (
    <Card className="shadow-sm">
      <CardHeader className="text-center">
        <h2 className="text-lg font-semibold">Iniciar sesión</h2>
        <p className="text-sm text-muted-foreground">
          Ingrese sus credenciales para acceder al panel.
        </p>
      </CardHeader>
      <CardContent>
        <FormularioInicioSesion rutaRetorno={rutaRetorno} />
      </CardContent>
    </Card>
  );
}
