import Link from "next/link";
import { Link2 } from "lucide-react";

import { EncabezadoPagina } from "@/componentes/estructura/encabezado-pagina";
import { BotonRegresar } from "@/componentes/navegacion/boton-regresar";
import { Migas } from "@/componentes/navegacion/migas";
import { EstadoVacio } from "@/componentes/retroalimentacion/estado-vacio";
import { Badge } from "@/componentes/ui/badge";
import { consultarVinculosLaborales } from "@/modulos/vinculos-laborales/consultas/vinculos-laborales.consulta";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";

export default async function PaginaVinculosLaborales() {
  const usuario = await requerirPermiso("vinculo-laboral.ver");
  const vinculos = await consultarVinculosLaborales(usuario.id);

  return (
    <div className="space-y-6">
      <Migas />
      <BotonRegresar rutaRespaldo="/inicio" />
      <EncabezadoPagina titulo="Asignaciones laborales" descripcion="Historial laboral interno." />
      {vinculos.length ? (
        <div className="max-w-full overflow-hidden rounded-xl border bg-card shadow-xs">
          <div className="overflow-x-auto overscroll-x-contain">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="border-b bg-muted/70">
                <tr>
                  <th>Trabajador</th>
                  <th>Empresa</th>
                  <th>Departamento</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {vinculos.map((vinculo) => (
                  <tr key={vinculo.id} className="border-b last:border-0">
                    <td>
                      <Link
                        className="font-medium hover:underline"
                        href={`/trabajadores/${vinculo.trabajador.id}`}
                      >
                        {vinculo.trabajador.apellidos}, {vinculo.trabajador.nombres}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {vinculo.trabajador.numeroDocumento}
                      </p>
                    </td>
                    <td>{vinculo.empresa.razonSocial}</td>
                    <td>{vinculo.departamento?.nombre ?? "—"}</td>
                    <td>
                      <Badge variant={vinculo.activa ? "default" : "secondary"}>
                        {vinculo.activa ? "ACTIVA" : "HISTÓRICA"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EstadoVacio
          icono={Link2}
          titulo="Sin asignaciones laborales"
          descripcion="Registre una asignación desde el perfil del trabajador."
        />
      )}
    </div>
  );
}
