import { Card, CardContent, CardHeader, CardTitle } from "@/componentes/ui/card";
import { Input } from "@/componentes/ui/input";

import { Campo, CampoGrupo, FilaCheckbox } from "@/modulos/fichas-ocupacionales/componentes/campos/campo";
import { GRUPOS_SANGUINEOS, LATERALIDADES } from "@/modulos/fichas-ocupacionales/constantes";
import { obtenerError, type PropsSeccion } from "@/modulos/fichas-ocupacionales/componentes/secciones/props";
import type { EmpresaCatalogoFicha } from "@/modulos/fichas-ocupacionales/tipos";

const selector = "min-h-11 w-full rounded-lg border border-input bg-background px-3 text-sm";

interface Props extends PropsSeccion {
  empresa?: EmpresaCatalogoFicha;
  numeroDocumento: string;
}

export function SeccionAEstablecimientoUsuario({ register, errors, empresa, numeroDocumento }: Props) {
  return (
    <Card id="seccion-a">
      <CardHeader><CardTitle>A. Datos del establecimiento - Datos del usuario</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <input type="hidden" {...register("institucionSistema")} />
        <input type="hidden" {...register("ruc")} />
        <input type="hidden" {...register("ciiu")} />
        <input type="hidden" {...register("establecimiento")} />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <DatoMaestro etiqueta="Institución del sistema" valor="Privado" />
          <DatoMaestro etiqueta="RUC" valor={empresa?.ruc} />
          <DatoMaestro etiqueta="CIIU / actividad económica" valor={[empresa?.actividadEconomicaCodigo, empresa?.actividadEconomicaDescripcion].filter(Boolean).join(" — ")} />
          <DatoMaestro etiqueta="Establecimiento" valor={empresa?.nombreComercial || empresa?.razonSocial} />
          <DatoMaestro etiqueta="Dirección" valor={empresa?.direccion} />
          <DatoMaestro etiqueta="Teléfono" valor={empresa?.telefono} />
          <DatoMaestro etiqueta="Correo" valor={empresa?.correo} />
          <Campo etiqueta="Número de historia clínica" error={obtenerError(errors, "numeroHistoriaClinica")}>
            <Input placeholder="Ingrese el número de historia clínica" {...register("numeroHistoriaClinica")} />
          </Campo>
          <DatoMaestro etiqueta="Documento" valor={numeroDocumento} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Campo etiqueta="Primer apellido" error={obtenerError(errors, "primerApellido")}><Input readOnly aria-readonly="true" {...register("primerApellido")} /></Campo>
          <Campo etiqueta="Segundo apellido" error={obtenerError(errors, "segundoApellido")}><Input readOnly aria-readonly="true" {...register("segundoApellido")} /></Campo>
          <Campo etiqueta="Primer nombre" error={obtenerError(errors, "primerNombre")}><Input readOnly aria-readonly="true" {...register("primerNombre")} /></Campo>
          <Campo etiqueta="Segundo nombre" error={obtenerError(errors, "segundoNombre")}><Input readOnly aria-readonly="true" {...register("segundoNombre")} /></Campo>
        </div>

        <CampoGrupo etiqueta="Atención prioritaria">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            <FilaCheckbox registro={register("atencionEmbarazada")} etiqueta="Embarazada" />
            <FilaCheckbox registro={register("atencionDiscapacidad")} etiqueta="Persona con discapacidad" />
            <FilaCheckbox registro={register("atencionCatastrofica")} etiqueta="Enfermedad catastrófica" />
            <FilaCheckbox registro={register("atencionLactancia")} etiqueta="Lactancia" />
            <FilaCheckbox registro={register("atencionAdultoMayor")} etiqueta="Adulto mayor" />
          </div>
        </CampoGrupo>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Campo etiqueta="Sexo" error={obtenerError(errors, "sexo")}><Input readOnly aria-readonly="true" {...register("sexo")} /></Campo>
          <Campo etiqueta="Fecha de nacimiento" error={obtenerError(errors, "fechaNacimiento")}><Input type="date" readOnly aria-readonly="true" {...register("fechaNacimiento")} /></Campo>
          <Campo etiqueta="Edad" error={obtenerError(errors, "edad")}>
            <Input type="number" min={0} max={150} inputMode="numeric" {...register("edad")} />
          </Campo>
          <Campo etiqueta="Grupo sanguíneo" error={obtenerError(errors, "grupoSanguineo")}>
            <select className={selector} {...register("grupoSanguineo")}>
              <option value="">Seleccione</option>
              {GRUPOS_SANGUINEOS.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </Campo>
          <Campo etiqueta="Lateralidad" error={obtenerError(errors, "lateralidad")}>
            <select className={selector} {...register("lateralidad")}>
              <option value="">Seleccione</option>
              {LATERALIDADES.map((item) => <option key={item.valor} value={item.valor}>{item.etiqueta}</option>)}
            </select>
          </Campo>
        </div>
      </CardContent>
    </Card>
  );
}

function DatoMaestro({ etiqueta, valor }: { etiqueta: string; valor?: string | null }) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{etiqueta}</p>
      <p className="min-h-11 rounded-lg border bg-muted/40 px-3 py-2.5 text-sm">{valor || "No registrado"}</p>
    </div>
  );
}
