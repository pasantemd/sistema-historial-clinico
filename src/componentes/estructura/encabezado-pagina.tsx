interface EncabezadoPaginaProps {
  titulo: string;
  descripcion?: string;
  acciones?: React.ReactNode;
}

export function EncabezadoPagina({
  titulo,
  descripcion,
  acciones,
}: EncabezadoPaginaProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 space-y-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
          {titulo}
        </h1>
        {descripcion && (
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            {descripcion}
          </p>
        )}
      </div>
      {acciones && (
        <div className="flex w-full shrink-0 flex-wrap items-center gap-2 sm:w-auto sm:justify-end">
          {acciones}
        </div>
      )}
    </div>
  );
}
