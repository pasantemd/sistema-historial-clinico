"use client";

import { useEffect } from "react";

/**
 * Defensa secundaria para navegadores que restauran una ruta privada desde
 * BFCache. La autorización real sigue ocurriendo en el layout del servidor.
 */
export function ProteccionSesionNavegador() {
  useEffect(() => {
    const ocultarSnapshotPrivado = (evento: PageTransitionEvent) => {
      if (evento.persisted) {
        document.documentElement.style.visibility = "hidden";
      }
    };

    const revalidarSnapshotPrivado = (evento: PageTransitionEvent) => {
      if (evento.persisted) {
        window.location.replace(window.location.href);
      }
    };

    window.addEventListener("pagehide", ocultarSnapshotPrivado);
    window.addEventListener("pageshow", revalidarSnapshotPrivado);

    return () => {
      window.removeEventListener("pagehide", ocultarSnapshotPrivado);
      window.removeEventListener("pageshow", revalidarSnapshotPrivado);
      document.documentElement.style.visibility = "";
    };
  }, []);

  return null;
}
