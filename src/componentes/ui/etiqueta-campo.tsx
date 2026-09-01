export function EtiquetaCampo({ etiqueta, required }: { etiqueta: string; required?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1">
      {etiqueta}
      {required && (
        <>
          <span className="text-destructive" aria-hidden="true">*</span>
          <span className="sr-only">Campo obligatorio</span>
        </>
      )}
    </span>
  );
}
