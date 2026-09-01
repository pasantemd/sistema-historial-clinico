"use client";

import * as React from "react";

import { Button } from "@/componentes/ui/button";
import { EstadoError } from "@/componentes/retroalimentacion/estado-error";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <EstadoError
        titulo="Algo salió mal"
        descripcion="No fue posible mostrar esta sección. Puedes intentarlo nuevamente."
        accion={<Button onClick={reset}>Reintentar</Button>}
      />
    </div>
  );
}
