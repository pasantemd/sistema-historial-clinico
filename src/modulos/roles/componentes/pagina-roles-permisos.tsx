"use client";

import { useState, useCallback, useMemo, useRef, useEffect, useActionState } from "react";
import { AlertCircle, CheckCircle2, RotateCcw, Save } from "lucide-react";
import { MatrizPermisosDesktop, MatrizPermisosMobile } from "./matriz-permisos";
import { actualizarPermisosRolAccion } from "@/modulos/roles/acciones/actualizar-permisos-rol.accion";
import { PERMISOS_PROTEGIDOS_ADMIN } from "@/modulos/roles/constantes/matriz-config";
import type { DatosPaginaRoles } from "@/modulos/roles/tipos/matriz-permisos";

interface Props {
  datos: DatosPaginaRoles;
}

function FormularioGuardar({
  rolId,
  checkedIds,
  deshabilitado,
  onResultado,
}: {
  rolId: string;
  checkedIds: Set<string>;
  deshabilitado: boolean;
  onResultado: (r: { exito?: boolean; error?: string } | null) => void;
}) {
  const [state, formAction, pendiente] = useActionState(actualizarPermisosRolAccion, null);
  const ultimo = useRef(state);

  useEffect(() => {
    if (ultimo.current !== state) {
      ultimo.current = state;
      if (state) {
        const timerId = setTimeout(() => onResultado(state), 0);
        return () => clearTimeout(timerId);
      }
    }
  }, [state, onResultado]);

  return (
    <form action={formAction}>
      <input type="hidden" name="rolId" value={rolId} />
      <input type="hidden" name="permisoIds" value={JSON.stringify([...checkedIds])} />
      <button
        type="submit"
        disabled={deshabilitado || pendiente}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
      >
        <Save className="size-4" />
        {pendiente ? "Guardando…" : "Guardar cambios"}
      </button>
    </form>
  );
}

export function PaginaRolesPermisos({ datos }: Props) {
  const { roles, permisos, permisosPorRol } = datos;
  const primerRolId = roles[0]?.id ?? "";
  const [selectedRolId, setSelectedRolId] = useState(primerRolId);
  const [checkedIds, setCheckedIds] = useState(() => new Set(permisosPorRol[primerRolId] ?? []));
  const [originalIds, setOriginalIds] = useState(() => new Set(permisosPorRol[primerRolId] ?? []));
  const [mensaje, setMensaje] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);

  const codigoToPermisoId = useMemo(() => {
    const m: Record<string, string> = {};
    for (const p of permisos) m[p.codigo] = p.id;
    return m;
  }, [permisos]);

  const permisoIdToCodigo = useMemo(() => {
    const m: Record<string, string> = {};
    for (const p of permisos) m[p.id] = p.codigo;
    return m;
  }, [permisos]);

  const handleRolChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const rolId = e.target.value;
      setSelectedRolId(rolId);
      const ids = new Set(permisosPorRol[rolId] ?? []);
      setCheckedIds(ids);
      setOriginalIds(ids);
      setMensaje(null);
    },
    [permisosPorRol]
  );

  const handleToggle = useCallback((permisoId: string, checked: boolean) => {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(permisoId);
      else next.delete(permisoId);
      return next;
    });
    setMensaje(null);
  }, []);

  const handleReset = useCallback(() => {
    setCheckedIds(new Set(originalIds));
    setMensaje(null);
  }, [originalIds]);

  const handleResultado = useCallback(
    (r: { exito?: boolean; error?: string } | null) => {
      if (!r) return;
      if (r.exito) {
        const actual = new Set(checkedIds);
        setOriginalIds(actual);
        setCheckedIds(actual);
        setMensaje({ tipo: "exito", texto: "Permisos actualizados correctamente." });
      } else if (r.error) {
        setMensaje({ tipo: "error", texto: r.error });
      }
    },
    [checkedIds]
  );

  const hasChanges = useMemo(() => {
    if (checkedIds.size !== originalIds.size) return true;
    for (const id of checkedIds) if (!originalIds.has(id)) return true;
    return false;
  }, [checkedIds, originalIds]);

  const selectedRol = roles.find((r) => r.id === selectedRolId);
  const esAdmin = selectedRol?.nombre === "ADMINISTRADOR";

  const isProtected = useCallback(
    (permisoId: string) => {
      const codigo = permisoIdToCodigo[permisoId];
      if (!codigo || !PERMISOS_PROTEGIDOS_ADMIN.has(codigo)) return false;
      return esAdmin;
    },
    [esAdmin, permisoIdToCodigo]
  );

  if (roles.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
        <AlertCircle className="size-4 shrink-0" />
        No se encontraron roles configurados.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="rol-select" className="text-sm font-medium text-foreground">
          Rol seleccionado:
        </label>
        <select
          id="rol-select"
          value={selectedRolId}
          onChange={handleRolChange}
          className="h-9 rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nombre}
            </option>
          ))}
        </select>
        {hasChanges && (
          <span className="ml-2 text-xs font-medium text-amber-600 dark:text-amber-400">
            Tiene cambios pendientes
          </span>
        )}
      </div>

      {selectedRolId && (
        <>
          <div className="hidden md:block">
            <MatrizPermisosDesktop
              codigoToPermisoId={codigoToPermisoId}
              checkedIds={checkedIds}
              onToggle={handleToggle}
              isProtected={isProtected}
            />
          </div>
          <div className="md:hidden">
            <MatrizPermisosMobile
              codigoToPermisoId={codigoToPermisoId}
              checkedIds={checkedIds}
              onToggle={handleToggle}
              isProtected={isProtected}
            />
          </div>
        </>
      )}

      <div className="flex flex-wrap items-center justify-end gap-3 pt-2 pb-4">
        <button
          type="button"
          onClick={handleReset}
          disabled={!hasChanges}
          className="inline-flex items-center gap-2 rounded-lg border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition hover:bg-accent disabled:pointer-events-none disabled:opacity-50"
        >
          <RotateCcw className="size-4" />
          Restablecer
        </button>
        <FormularioGuardar
          key={selectedRolId}
          rolId={selectedRolId}
          checkedIds={checkedIds}
          deshabilitado={!hasChanges}
          onResultado={handleResultado}
        />
      </div>

      {mensaje?.tipo === "exito" && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300">
          <CheckCircle2 className="size-4 shrink-0" />
          {mensaje.texto}
        </div>
      )}
      {mensaje?.tipo === "error" && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          <AlertCircle className="size-4 shrink-0" />
          {mensaje.texto}
        </div>
      )}
    </div>
  );
}