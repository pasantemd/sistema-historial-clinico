import Image from "next/image";

import type { RecetaDetalleDto } from "@/modulos/recetas/tipos";
import { construirIndicacionesReceta } from "@/modulos/recetas/servicios/construir-indicaciones-receta";
import { formatearFecha } from "@/utilidades/fechas/formatear-fecha";

interface Props {
  receta: RecetaDetalleDto;
}

export function DetalleReceta({ receta }: Props) {
  const edad = calcularEdad(
    receta.trabajadorNacimientoHistorico,
    receta.fechaEmision,
  );
  const indicaciones = construirIndicacionesReceta(receta);

  return (
    <article
      className="receta-hoja mx-auto w-full max-w-(--contenedor-formulario) bg-white p-6 text-black"
      id="hoja-receta"
    >
      <header className="receta-bloque flex items-start gap-5 border-b-2 border-black pb-3">
        <Image
          src="/img/logoAP.png"
          alt="Logotipo de la empresa"
          width={88}
          height={88}
          className="h-auto shrink-0"
          priority
        />
        <div className="min-w-0 flex-1 text-sm leading-relaxed">
          <p className="text-base font-bold uppercase">
            {receta.empresaNombreHistorico ?? "Empresa no registrada"}
          </p>
          <p>
            <span className="font-bold">RUC:</span>{" "}
            {receta.empresaRucHistorico ?? "—"}
          </p>
          {receta.empresaDireccionHistorica && (
            <p>{receta.empresaDireccionHistorica}</p>
          )}
          {receta.empresaTelefonoHistorico && (
            <p>Teléfono: {receta.empresaTelefonoHistorico}</p>
          )}
        </div>
      </header>

      <section className="receta-bloque mt-3 grid grid-cols-2 gap-x-6 border-b border-black pb-2 text-sm">
        <p>
          <span className="font-bold">N.º receta:</span> {receta.numeroReceta}
        </p>
        <p className="text-right">
          <span className="font-bold">Fecha:</span>{" "}
          {formatearFecha(receta.fechaEmision)}
        </p>
      </section>

      <section className="receta-bloque mt-2 grid grid-cols-2 gap-x-6 text-xs leading-relaxed">
        <div>
          <p className="font-bold uppercase">Datos del trabajador</p>
          <p>{receta.trabajadorNombreHistorico}</p>
          <p>
            <span className="font-semibold">Cédula:</span>{" "}
            {receta.trabajadorDocumentoHistorico}
          </p>
          <p>
            <span className="font-semibold">Edad:</span> {edad ?? "—"} ·{" "}
            <span className="font-semibold">Sexo:</span>{" "}
            {receta.trabajadorSexoHistorico ?? "—"}
          </p>
          <p>
            <span className="font-semibold">Departamento:</span>{" "}
            {receta.departamentoNombreHistorico ?? "—"}
          </p>
        </div>
        <div>
          <p className="font-bold uppercase">Datos del médico</p>
          <p>{receta.profesionalNombreHistorico}</p>
          {receta.profesionalCodigoHistorico && (
            <p>Registro: {receta.profesionalCodigoHistorico}</p>
          )}
          {receta.profesionalEspecialidadHistorica && (
            <p>{receta.profesionalEspecialidadHistorica}</p>
          )}
        </div>
      </section>

      <section className="receta-medicamentos mt-3">
        <h2 className="border-b border-black text-sm font-bold uppercase">
          Medicamentos
        </h2>
        <div className="mt-1 overflow-hidden border border-black text-xs">
          <div className="grid grid-cols-[2fr_1fr_1fr] bg-neutral-100 font-bold uppercase">
            <div className="border-r border-black px-2 py-1.5">Nombre</div>
            <div className="border-r border-black px-2 py-1.5">Dosis</div>
            <div className="px-2 py-1.5">Vía</div>
          </div>
          {receta.medicamentos.length === 0 ? (
            <p className="border-t border-black px-2 py-3 text-muted-foreground">Sin medicamentos.</p>
          ) : (
            receta.medicamentos.map((medicamento, indice) => (
              <div
                key={medicamento.id ?? indice}
                className="receta-medicamento grid grid-cols-[2fr_1fr_1fr] border-t border-black"
              >
                <div className="border-r border-black px-2 py-2 font-semibold">
                  {medicamento.nombreMedicamentoHistorico}
                </div>
                <div className="border-r border-black px-2 py-2">{medicamento.dosis}</div>
                <div className="px-2 py-2">{medicamento.viaAdministracion}</div>
              </div>
            ))
          )}
        </div>
      </section>

      {indicaciones && (
        <section className="receta-indicaciones mt-3 text-xs">
          <h2 className="font-bold uppercase">Indicaciones</h2>
          <p className="mt-1 min-h-16 whitespace-pre-wrap border border-black p-2">
            {indicaciones}
          </p>
        </section>
      )}

      <footer className="receta-firma mt-8 flex justify-center text-xs">
        <div className="w-64 border-t border-black pt-2 text-center">
          <p className="font-bold">Firma del médico</p>
        </div>
      </footer>
    </article>
  );
}

function calcularEdad(nacimiento: Date | null, referencia: Date): number | null {
  if (!nacimiento) return null;
  let edad = referencia.getUTCFullYear() - nacimiento.getUTCFullYear();
  const aunNoCumple =
    referencia.getUTCMonth() < nacimiento.getUTCMonth() ||
    (referencia.getUTCMonth() === nacimiento.getUTCMonth() &&
      referencia.getUTCDate() < nacimiento.getUTCDate());
  if (aunNoCumple) edad -= 1;
  return edad >= 0 ? edad : null;
}
