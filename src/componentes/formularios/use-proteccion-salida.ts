"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Anteriormente mostraba el diálogo nativo del navegador "¿Quieres salir?".
 * Ahora solo gestiona internamente el flag de salida permitida.
 * La notificación visual de guardado se maneja con useToastGuardado().
 */
export function useProteccionSalida(_hayCambios: boolean) {
  const permitirSalidaRef = useRef(false);

  useEffect(() => {
    permitirSalidaRef.current = false;
  }, [_hayCambios]);

  return useCallback(() => {
    permitirSalidaRef.current = true;
  }, []);
}
