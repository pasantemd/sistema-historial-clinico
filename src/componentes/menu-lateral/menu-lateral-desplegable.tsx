"use client";

import * as React from "react";

const CLAVE_ALMACENAMIENTO = "menu-lateral-colapsado";

const escuchas = new Set<() => void>();

function suscribir(alCambiar: () => void): () => void {
  escuchas.add(alCambiar);
  return () => {
    escuchas.delete(alCambiar);
  };
}

function obtenerInstantanea(): boolean {
  return window.localStorage.getItem(CLAVE_ALMACENAMIENTO) === "true";
}

function obtenerInstantaneaServidor(): boolean {
  return false;
}

function establecerColapsoAlmacenado(valor: boolean): void {
  window.localStorage.setItem(CLAVE_ALMACENAMIENTO, String(valor));
  escuchas.forEach((alCambiar) => alCambiar());
}

interface ContextoMenuLateral {
  colapsada: boolean;
  alternarColapso: () => void;
  abiertaMovil: boolean;
  establecerAbiertaMovil: (abierta: boolean) => void;
}

const ContextoMenuLateral = React.createContext<ContextoMenuLateral | null>(
  null,
);

export function useMenuLateral(): ContextoMenuLateral {
  const contexto = React.useContext(ContextoMenuLateral);
  if (!contexto) {
    throw new Error(
      "useMenuLateral debe usarse dentro de ProveedorMenuLateral",
    );
  }
  return contexto;
}

export function ProveedorMenuLateral({
  children,
}: {
  children: React.ReactNode;
}) {
  const colapsada = React.useSyncExternalStore(
    suscribir,
    obtenerInstantanea,
    obtenerInstantaneaServidor,
  );
  const [abiertaMovil, establecerAbiertaMovil] = React.useState(false);

  const alternarColapso = React.useCallback(() => {
    establecerColapsoAlmacenado(!obtenerInstantanea());
  }, []);

  const valor = React.useMemo<ContextoMenuLateral>(
    () => ({
      colapsada,
      alternarColapso,
      abiertaMovil,
      establecerAbiertaMovil,
    }),
    [colapsada, alternarColapso, abiertaMovil],
  );

  return (
    <ContextoMenuLateral.Provider value={valor}>
      {children}
    </ContextoMenuLateral.Provider>
  );
}