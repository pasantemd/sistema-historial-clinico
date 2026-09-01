"use client";

import { Fragment } from "react";
import { Lock } from "lucide-react";
import { Checkbox } from "@/componentes/ui/checkbox";
import {
  COLUMNAS,
  MODULOS,
  GRUPO_ORDEN,
  GRUPO_ETIQUETAS,
  MODULOS_POR_GRUPO,
  obtenerCeldaMatriz,
} from "@/modulos/roles/constantes/matriz-config";

interface MatrizPermisosProps {
  codigoToPermisoId: Record<string, string>;
  checkedIds: Set<string>;
  onToggle: (permisoId: string, checked: boolean) => void;
  isProtected: (permisoId: string) => boolean;
}

function CeldaCheckbox({
  moduloId,
  columnaId,
  codigoToPermisoId,
  checkedIds,
  onToggle,
  isProtected,
}: {
  moduloId: string;
  columnaId: string;
  codigoToPermisoId: Record<string, string>;
  checkedIds: Set<string>;
  onToggle: (permisoId: string, checked: boolean) => void;
  isProtected: (permisoId: string) => boolean;
}) {
  const mapeo = obtenerCeldaMatriz(moduloId, columnaId);
  if (!mapeo) {
    return <span className="text-xs text-muted-foreground select-none">—</span>;
  }

  const permisoId = codigoToPermisoId[mapeo.codigo] ?? null;
  if (!permisoId) {
    return <span className="text-xs text-muted-foreground select-none">—</span>;
  }

  const columna = COLUMNAS.find((c) => c.id === columnaId);
  const checked = checkedIds.has(permisoId);
  const protegido = isProtected(permisoId);
  const label = `Permitir al rol ${mapeo.modulo} ${columna?.etiqueta?.toLowerCase() ?? ""}`;

  if (protegido) {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-primary"
        title="Permiso obligatorio para conservar la administración del sistema."
      >
        <span className="relative inline-flex items-center">
          <Checkbox checked={checked} disabled aria-label={label} />
          <Lock className="pointer-events-none absolute -right-1.5 -top-1.5 size-3" aria-hidden />
        </span>
      </span>
    );
  }

  return (
    <Checkbox
      checked={checked}
      onCheckedChange={(next) => onToggle(permisoId, next === true)}
      aria-label={label}
    />
  );
}

export function MatrizPermisosDesktop(props: MatrizPermisosProps) {
  return (
    <div className="max-w-full overflow-x-auto overscroll-x-contain rounded-xl border border-border bg-card shadow-xs">
      <table className="w-full min-w-[960px] text-sm">
        <colgroup>
          <col style={{ minWidth: 200, width: 240 }} />
          {COLUMNAS.map((col) => (
            <col key={col.id} style={{ width: 100, minWidth: 88 }} />
          ))}
        </colgroup>
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="sticky left-0 z-20 bg-muted/30 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Módulo
            </th>
            {COLUMNAS.map((col) => (
              <th
                key={col.id}
                className="px-2 py-3 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground"
              >
                {col.etiqueta}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {GRUPO_ORDEN.map((grupoId) => {
            const modulosGrupo = MODULOS.filter((m) => MODULOS_POR_GRUPO[grupoId]?.includes(m.id));
            if (modulosGrupo.length === 0) return null;
            return (
              <Fragment key={`grupo-${grupoId}`}>
                <tr className="border-b border-border">
                  <td
                    colSpan={COLUMNAS.length + 1}
                    className="bg-muted/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                  >
                    {GRUPO_ETIQUETAS[grupoId]}
                  </td>
                </tr>
                {modulosGrupo.map((mod) => (
                  <tr
                    key={mod.id}
                    className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                  >
                    <td className="sticky left-0 z-10 bg-card px-4 py-2.5 text-sm font-medium text-foreground">
                      {mod.etiqueta}
                    </td>
                    {COLUMNAS.map((col) => (
                      <td key={col.id} className="px-2 py-2.5 text-center align-middle">
                        <div className="flex justify-center">
                          <CeldaCheckbox
                            moduloId={mod.id}
                            columnaId={col.id}
                            codigoToPermisoId={props.codigoToPermisoId}
                            checkedIds={props.checkedIds}
                            onToggle={props.onToggle}
                            isProtected={props.isProtected}
                          />
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function MatrizPermisosMobile(props: MatrizPermisosProps) {
  return (
    <div className="space-y-4">
      {GRUPO_ORDEN.map((grupoId) => {
        const modulosGrupo = MODULOS.filter((m) => MODULOS_POR_GRUPO[grupoId]?.includes(m.id));
        if (modulosGrupo.length === 0) return null;
        return (
          <div key={grupoId}>
            <h3 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {GRUPO_ETIQUETAS[grupoId]}
            </h3>
            <div className="space-y-2">
              {modulosGrupo.map((mod) => {
                const columnasVisibles = COLUMNAS.filter((col) => {
                  const celda = obtenerCeldaMatriz(mod.id, col.id);
                  if (!celda) return false;
                  return props.codigoToPermisoId[celda.codigo] != null;
                });
                if (columnasVisibles.length === 0) return null;

                return (
                  <div key={mod.id} className="rounded-lg border border-border bg-card p-3">
                    <h4 className="mb-2 text-sm font-semibold text-foreground">{mod.etiqueta}</h4>
                    <div className="space-y-1.5">
                      {columnasVisibles.map((col) => {
                        const mapeo = obtenerCeldaMatriz(mod.id, col.id);
                        if (!mapeo) return null;
                        const permisoId = props.codigoToPermisoId[mapeo.codigo] ?? null;
                        if (!permisoId) return null;
                        const checked = props.checkedIds.has(permisoId);
                        const protegido = props.isProtected(permisoId);
                        const label = `Permitir al rol ${mod.etiqueta} ${col.etiqueta.toLowerCase()}`;
                        return (
                          <label
                            key={col.id}
                            className="flex items-center justify-between text-sm text-foreground"
                          >
                            <span>{col.etiqueta}</span>
                            <span className="inline-flex items-center gap-1">
{protegido && (
  <Lock
    className="size-3 text-primary"
    aria-hidden
  />
)}
                              <Checkbox
                                checked={checked}
                                disabled={protegido}
                                onCheckedChange={(next) => props.onToggle(permisoId, next === true)}
                                aria-label={label}
                              />
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
