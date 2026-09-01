"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { Eye, Plus, Shield, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/componentes/ui/button";
import { Input } from "@/componentes/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/componentes/ui/dialog";
import { cambiarRolUsuarioAccion } from "@/modulos/usuarios/acciones/cambiar-rol-usuario.accion";
import { alternarEstadoUsuarioAccion } from "@/modulos/usuarios/acciones/alternar-estado-usuario.accion";
import { crearUsuarioAccion } from "@/modulos/usuarios/acciones/crear-usuario.accion";
import {
  crearUsuarioSchema,
  type EntradaCrearUsuario,
} from "@/modulos/usuarios/validaciones/crear-usuario.schema";

interface UsuarioRow {
  id: string;
  nombres: string;
  apellidos: string;
  correo: string;
  estado: string;
  rolUnico: string | null;
}

interface RolItem {
  id: string;
  nombre: string;
}

interface Props {
  usuarios: UsuarioRow[];
  roles: RolItem[];
  empresas: Array<{ id: string; razonSocial: string }>;
  usuarioActualId: string;
}

const usuarioVacio: EntradaCrearUsuario = {
  nombres: "",
  apellidos: "",
  correo: "",
  contrasena: "",
  rolId: "",
  empresaIds: [],
  cedula: "",
  codigoProfesional: "",
  especialidad: "",
};

export function PaginaUsuarios({ usuarios, roles, empresas, usuarioActualId }: Props) {
  const router = useRouter();
  const [dialog, setDialog] = useState<{ tipo: "rol" | "ver"; usuario: UsuarioRow } | null>(null);
  const [crearAbierto, setCrearAbierto] = useState(false);
  const [rolSeleccionado, setRolSeleccionado] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);
  const formulario = useForm<EntradaCrearUsuario>({
    resolver: zodResolver(crearUsuarioSchema),
    defaultValues: usuarioVacio,
  });
  const rolNuevo = useWatch({ control: formulario.control, name: "rolId" });
  const esMedico = roles.find((rol) => rol.id === rolNuevo)?.nombre === "MÉDICO";

  function abrirEditarRol(usuario: UsuarioRow) {
    setDialog({ tipo: "rol", usuario });
    setRolSeleccionado(usuario.rolUnico ?? "");
    setMensaje("");
  }

  function abrirVer(usuario: UsuarioRow) {
    setDialog({ tipo: "ver", usuario });
    setMensaje("");
  }

  function cerrar() {
    setDialog(null);
    setRolSeleccionado("");
    setMensaje("");
  }

  async function guardarRol() {
    if (!dialog || dialog.tipo !== "rol" || !rolSeleccionado) return;
    setCargando(true);
    setMensaje("");
    const resultado = await cambiarRolUsuarioAccion({
      usuarioId: dialog.usuario.id,
      nuevoRolId: rolSeleccionado,
    });
    setCargando(false);
    if (!resultado.exito) {
      setMensaje(resultado.mensaje);
      return;
    }
    cerrar();
    router.refresh();
  }

  async function alternarEstado(usuario: UsuarioRow) {
    const accion = usuario.estado === "ACTIVO" ? "desactivar" : "activar";
    const ok = window.confirm(
      `¿Está seguro de ${accion} a ${usuario.nombres} ${usuario.apellidos}?`,
    );
    if (!ok) return;
    setCargando(true);
    setMensaje("");
    const resultado = await alternarEstadoUsuarioAccion({ usuarioId: usuario.id });
    setCargando(false);
    if (!resultado.exito) {
      setMensaje(resultado.mensaje);
      return;
    }
    router.refresh();
  }

  async function crearUsuario(datos: EntradaCrearUsuario) {
    setCargando(true);
    setMensaje("");
    const resultado = await crearUsuarioAccion(datos);
    setCargando(false);
    if (!resultado.exito) {
      setMensaje(resultado.mensaje);
      return;
    }
    setCrearAbierto(false);
    formulario.reset(usuarioVacio);
    router.refresh();
  }

  function nombreRol(rolId: string | null): string {
    return roles.find((r) => r.id === rolId)?.nombre ?? "—";
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <Button type="button" onClick={() => { setMensaje(""); setCrearAbierto(true); }}>
          <Plus className="size-4" aria-hidden />
          Nuevo usuario
        </Button>
      </div>
      <div className="max-w-full overflow-hidden rounded-xl border bg-card shadow-xs">
        <div className="overflow-x-auto overscroll-x-contain">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-muted/60">
            <tr>
              <th className="p-3 text-left text-xs uppercase text-muted-foreground">Nombre</th>
              <th className="p-3 text-left text-xs uppercase text-muted-foreground">Correo</th>
              <th className="p-3 text-left text-xs uppercase text-muted-foreground">Rol</th>
              <th className="p-3 text-left text-xs uppercase text-muted-foreground">Estado</th>
              <th className="p-3 text-right text-xs uppercase text-muted-foreground">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => {
              const esActual = usuario.id === usuarioActualId;
              return (
                <tr key={usuario.id} className="border-t">
                  <td className="p-3 font-medium">
                    {usuario.nombres} {usuario.apellidos}
                    {esActual && (
                      <span className="ml-2 text-xs text-muted-foreground">(tú)</span>
                    )}
                  </td>
                  <td className="p-3 text-muted-foreground">{usuario.correo}</td>
                  <td className="p-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                      <Shield className="size-3" aria-hidden />
                      {nombreRol(usuario.rolUnico)}
                    </span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        usuario.estado === "ACTIVO"
                          ? "bg-success/10 text-success"
                          : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {usuario.estado === "ACTIVO" ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => abrirVer(usuario)}
                        aria-label="Ver detalles"
                      >
                        <Eye className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => abrirEditarRol(usuario)}
                      >
                        Editar rol
                      </Button>
                      {!esActual && (
                        <Button
                          type="button"
                          size="sm"
                          variant={usuario.estado === "ACTIVO" ? "destructive" : "outline"}
                          onClick={() => alternarEstado(usuario)}
                          disabled={cargando}
                          aria-label={usuario.estado === "ACTIVO" ? "Desactivar usuario" : "Activar usuario"}
                        >
                          {usuario.estado === "ACTIVO" ? (
                            <ToggleRight className="size-4" />
                          ) : (
                            <ToggleLeft className="size-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>

      {mensaje && (
        <p className="text-sm text-destructive" role="alert">{mensaje}</p>
      )}

      <Dialog open={dialog !== null} onOpenChange={(abierto) => { if (!abierto) cerrar(); }}>
        {dialog?.tipo === "rol" && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar rol de usuario</DialogTitle>
              <DialogDescription>
                Cambie el rol asignado a este usuario.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-lg border bg-muted/20 p-3">
                <p className="text-sm">
                  <span className="font-medium">Usuario:</span>{" "}
                  {dialog.usuario.nombres} {dialog.usuario.apellidos}
                </p>
                <p className="mt-1 text-sm">
                  <span className="font-medium">Rol actual:</span>{" "}
                  <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    {nombreRol(dialog.usuario.rolUnico)}
                  </span>
                </p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="rol-select" className="text-sm font-medium">Nuevo rol</label>
                <select
                  id="rol-select"
                  value={rolSeleccionado}
                  onChange={(e) => setRolSeleccionado(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/35 disabled:cursor-not-allowed disabled:opacity-50"
                  autoFocus
                >
                  <option value="" disabled>Seleccione un rol</option>
                  {roles.map((rol) => (
                    <option key={rol.id} value={rol.id}>{rol.nombre}</option>
                  ))}
                </select>
              </div>

              {mensaje && <p className="text-sm text-destructive" role="alert">{mensaje}</p>}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={cerrar} disabled={cargando}>
                Cancelar
              </Button>
              <Button type="button" onClick={guardarRol} disabled={cargando || !rolSeleccionado}>
                {cargando ? "Guardando…" : "Guardar cambios"}
              </Button>
            </DialogFooter>
          </DialogContent>
        )}

        {dialog?.tipo === "ver" && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Detalles del usuario</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Nombre:</span> {dialog.usuario.nombres} {dialog.usuario.apellidos}</p>
              <p><span className="font-medium">Correo:</span> {dialog.usuario.correo}</p>
              <p><span className="font-medium">Rol:</span> {nombreRol(dialog.usuario.rolUnico)}</p>
              <p><span className="font-medium">Estado:</span> {dialog.usuario.estado === "ACTIVO" ? "Activo" : "Inactivo"}</p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={cerrar}>Cerrar</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      <Dialog
        open={crearAbierto}
        onOpenChange={(abierto) => {
          setCrearAbierto(abierto);
          setMensaje("");
          if (!abierto) formulario.reset(usuarioVacio);
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crear usuario</DialogTitle>
            <DialogDescription>
              Asigne un rol y al menos una empresa. Los datos profesionales se solicitan para médicos.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-5" onSubmit={formulario.handleSubmit(crearUsuario)}>
            <div className="grid gap-4 sm:grid-cols-2">
              <CampoTexto etiqueta="Nombres" error={formulario.formState.errors.nombres?.message}>
                <Input autoComplete="given-name" {...formulario.register("nombres")} />
              </CampoTexto>
              <CampoTexto etiqueta="Apellidos" error={formulario.formState.errors.apellidos?.message}>
                <Input autoComplete="family-name" {...formulario.register("apellidos")} />
              </CampoTexto>
              <CampoTexto etiqueta="Correo" error={formulario.formState.errors.correo?.message}>
                <Input type="email" autoComplete="email" {...formulario.register("correo")} />
              </CampoTexto>
              <CampoTexto etiqueta="Contraseña temporal" error={formulario.formState.errors.contrasena?.message}>
                <Input type="password" autoComplete="new-password" {...formulario.register("contrasena")} />
              </CampoTexto>
              <CampoTexto etiqueta="Cédula (opcional)" error={formulario.formState.errors.cedula?.message}>
                <Input {...formulario.register("cedula")} />
              </CampoTexto>
              <CampoTexto etiqueta="Rol" error={formulario.formState.errors.rolId?.message}>
                <select
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  {...formulario.register("rolId")}
                >
                  <option value="">Seleccione un rol</option>
                  {roles.map((rol) => <option key={rol.id} value={rol.id}>{rol.nombre}</option>)}
                </select>
              </CampoTexto>
            </div>

            {esMedico && (
              <div className="grid gap-4 rounded-lg border bg-muted/20 p-4 sm:grid-cols-2">
                <CampoTexto etiqueta="Código médico" error={formulario.formState.errors.codigoProfesional?.message}>
                  <Input {...formulario.register("codigoProfesional")} />
                </CampoTexto>
                <CampoTexto etiqueta="Especialidad" error={formulario.formState.errors.especialidad?.message}>
                  <Input {...formulario.register("especialidad")} />
                </CampoTexto>
              </div>
            )}

            <fieldset className="space-y-2 rounded-lg border p-4">
              <legend className="px-1 text-sm font-medium">Empresas</legend>
              {empresas.map((empresa) => (
                <label key={empresa.id} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    value={empresa.id}
                    className="size-4 accent-primary"
                    {...formulario.register("empresaIds")}
                  />
                  {empresa.razonSocial}
                </label>
              ))}
              {formulario.formState.errors.empresaIds?.message && (
                <p className="text-sm text-destructive">{formulario.formState.errors.empresaIds.message}</p>
              )}
            </fieldset>

            {mensaje && <p className="text-sm text-destructive" role="alert">{mensaje}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCrearAbierto(false)} disabled={cargando}>
                Cancelar
              </Button>
              <Button type="submit" disabled={cargando}>
                <Plus className="size-4" aria-hidden />
                {cargando ? "Creando…" : "Crear usuario"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

function CampoTexto({
  etiqueta,
  error,
  children,
}: {
  etiqueta: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="space-y-1.5 text-sm font-medium">
      <span>{etiqueta}</span>
      {children}
      {error && <span className="block text-sm font-normal text-destructive">{error}</span>}
    </label>
  );
}
