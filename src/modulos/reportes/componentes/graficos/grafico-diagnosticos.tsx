import type { DatosDiagnosticoFrecuente } from "../../tipos";

interface PropiedadesGraficoDiagnosticos {
  data: DatosDiagnosticoFrecuente[];
  titulo: string;
}

export function GraficoDiagnosticos({
  data,
  titulo,
}: PropiedadesGraficoDiagnosticos) {
  if (data.length === 0) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">{titulo}</p>
        <p className="py-8 text-center text-sm text-muted-foreground">
          Sin datos para graficar
        </p>
      </div>
    );
  }

  const valorMaximo = Math.max(...data.map((diagnostico) => diagnostico.valor));

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-foreground">{titulo}</p>
      <ol className="space-y-5">
        {data.map((diagnostico) => {
          const porcentaje = (diagnostico.valor / valorMaximo) * 100;

          return (
            <li key={diagnostico.codigo} className="space-y-2">
              <div className="flex items-start gap-2">
                <p className="min-w-0 text-sm leading-snug text-foreground">
                  <span className="font-semibold text-primary">
                    {diagnostico.codigo}
                  </span>
                  <span aria-hidden="true"> — </span>
                  <span>{diagnostico.descripcion}</span>
                </p>
              </div>
              <div
                className="relative h-9 overflow-hidden rounded-lg border border-border bg-muted/70"
                role="progressbar"
                aria-label={`${diagnostico.codigo}: ${diagnostico.valor} registros`}
                aria-valuemin={0}
                aria-valuemax={valorMaximo}
                aria-valuenow={diagnostico.valor}
              >
                <div
                  className="flex h-full min-w-12 items-center justify-end rounded-md bg-primary px-3 text-sm font-bold tabular-nums text-primary-foreground"
                  style={{ width: `${porcentaje}%` }}
                >
                  {diagnostico.valor}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
