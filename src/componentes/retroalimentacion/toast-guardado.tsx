"use client";

import { useEffect, useRef, useCallback, useState, createContext, useContext } from "react";
import { CheckCircle2 } from "lucide-react";

/* ─── Contexto global ───────────────────────────────────────────── */

type ToastGuardadoContexto = {
  mostrar: (mensaje?: string) => void;
};

const Ctx = createContext<ToastGuardadoContexto | null>(null);

export function useToastGuardado() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useToastGuardado debe usarse dentro de <ProveedorToastGuardado>");
  return ctx;
}

/* ─── Proveedor (va en el layout del dashboard) ─────────────────── */

export function ProveedorToastGuardado({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [saliendo, setSaliendo] = useState(false);
  const [mensaje, setMensaje] = useState("Guardado");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const mostrar = useCallback((msg = "Guardado") => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMensaje(msg);
    setSaliendo(false);
    setVisible(true);
    // Empieza a salir en 2.2 s
    timerRef.current = setTimeout(() => {
      setSaliendo(true);
      // Remueve el nodo tras la animación de salida (300 ms)
      timerRef.current = setTimeout(() => setVisible(false), 300);
    }, 2200);
  }, []);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    <Ctx.Provider value={{ mostrar }}>
      {children}
      {visible && (
        <div
          role="status"
          aria-live="polite"
          aria-label={mensaje}
          data-saliendo={saliendo ? "true" : undefined}
          className={[
            "pointer-events-none fixed right-5 top-5 z-[9999] flex items-center gap-2.5",
            "rounded-xl border border-success/30 bg-success/10 px-4 py-3 shadow-lg",
            "text-sm font-semibold text-success backdrop-blur-sm",
            "transition-all duration-300",
            saliendo
              ? "translate-y-[-8px] opacity-0"
              : "translate-y-0 opacity-100 animate-[toast-entrada_0.35s_cubic-bezier(0.23,1,0.32,1)_both]",
          ].join(" ")}
        >
          <CheckCircle2 className="size-4 shrink-0" aria-hidden />
          {mensaje}
          {/* Barra de progreso */}
          {!saliendo && (
            <span
              className="absolute bottom-0 left-0 h-[3px] rounded-b-xl bg-success/40 animate-[toast-progreso_2.2s_linear_forwards]"
              aria-hidden
            />
          )}
        </div>
      )}
    </Ctx.Provider>
  );
}
