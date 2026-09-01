import Link from "next/link";
import { Building, Building2, Shield, Users } from "lucide-react";

import { BotonRegresar } from "@/componentes/navegacion/boton-regresar";
import { EncabezadoPagina } from "@/componentes/estructura/encabezado-pagina";
import { Migas } from "@/componentes/navegacion/migas";
import { Card, CardContent, CardHeader, CardTitle } from "@/componentes/ui/card";
import { FormularioDatosProfesional } from "@/modulos/configuracion-profesional/componentes/formulario-datos-profesional";
import { requerirUsuario } from "@/servicios/autenticacion/requerir-usuario";
import { tienePermiso } from "@/servicios/autenticacion/tiene-permiso";
import { prisma } from "@/servicios/base-datos/prisma";

export default async function ConfiguracionPage() {
  const usuario = await requerirUsuario();
  const puedeVerEmpresas = tienePermiso(usuario, "empresa.ver");
  const puedeVerDepartamentos = tienePermiso(usuario, "departamento.ver");
  const puedeAdministrarUsuarios = tienePermiso(usuario, "usuario.administrar");

  const medico = await prisma.usuario.findFirst({
    where: { id: usuario.id },
    select: {
      nombres: true,
      apellidos: true,
      cedula: true,
      correo: true,
      codigoProfesional: true,
      especialidad: true,
      estado: true,
      roles: { select: { rol: { select: { nombre: true } } } },
    },
  });

  const totalEmpresas = puedeVerEmpresas
    ? await prisma.empresa.count({
        where: {
          estado: "ACTIVO",
          usuariosAutorizados: { some: { usuarioId: usuario.id } },
        },
      })
    : 0;
  const empresasRecientes = puedeVerEmpresas ? await prisma.empresa.findMany({
    where: {
      estado: "ACTIVO",
      usuariosAutorizados: { some: { usuarioId: usuario.id } },
    },
    select: {
      id: true,
      ruc: true,
      razonSocial: true,
      nombreComercial: true,
      actividadEconomicaDescripcion: true,
      estado: true,
    },
    orderBy: { razonSocial: "asc" },
    take: 5,
  }) : [];

  const totalDepartamentos = puedeVerDepartamentos
    ? await prisma.departamento.count({
        where: {
          empresa: { usuariosAutorizados: { some: { usuarioId: usuario.id } } },
        },
      })
    : 0;
  const departamentosRecientes = puedeVerDepartamentos ? await prisma.departamento.findMany({
    where: {
      empresa: { usuariosAutorizados: { some: { usuarioId: usuario.id } } },
    },
    select: {
      id: true,
      nombre: true,
      descripcion: true,
      estado: true,
      empresa: { select: { razonSocial: true } },
    },
    orderBy: { empresa: { razonSocial: "asc" } },
    take: 5,
  }) : [];

  return (
    <div className="space-y-8">
      <BotonRegresar rutaRespaldo="/inicio" />
      <Migas />
      <EncabezadoPagina titulo="Configuración" descripcion="Administración del sistema" />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {puedeVerEmpresas && (
          <Link href="/configuracion/empresas" className="group">
            <Card className="h-full transition-[border-color,box-shadow] hover:border-primary/25 hover:shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="size-5 text-primary" aria-hidden />
                  Empresas
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {totalEmpresas} empresa{totalEmpresas !== 1 ? "s" : ""} activa{totalEmpresas !== 1 ? "s" : ""}
              </CardContent>
            </Card>
          </Link>
        )}

        {puedeVerDepartamentos && (
          <Link href="/configuracion/departamentos" className="group">
            <Card className="h-full transition-[border-color,box-shadow] hover:border-primary/25 hover:shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building className="size-5 text-primary" aria-hidden />
                  Departamentos
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                {totalDepartamentos} departamento{totalDepartamentos !== 1 ? "s" : ""} registrado
                {totalDepartamentos !== 1 ? "s" : ""}
              </CardContent>
            </Card>
          </Link>
        )}

        {puedeAdministrarUsuarios && <Link href="/configuracion/usuarios" className="group">
          <Card className="h-full transition-[border-color,box-shadow] hover:border-primary/25 hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="size-5 text-primary" aria-hidden />
                Usuarios
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">Gestión de usuarios del sistema</CardContent>
          </Card>
        </Link>}

        {puedeAdministrarUsuarios && <Link href="/configuracion/roles" className="group">
          <Card className="h-full transition-[border-color,box-shadow] hover:border-primary/25 hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="size-5 text-primary" aria-hidden />
                Roles y permisos
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Administración de roles y códigos de permiso
            </CardContent>
          </Card>
        </Link>}
      </div>

      {medico && (
        <FormularioDatosProfesional
          valoresIniciales={{
            nombreCompleto: `${medico.nombres} ${medico.apellidos}`.trim(),
            cedula: medico.cedula ?? "",
            codigoProfesional: medico.codigoProfesional ?? "",
            profesion: medico.especialidad ?? "",
            correo: medico.correo,
            estado: medico.estado,
            roles: medico.roles.map((rolUsuario) => rolUsuario.rol.nombre),
          }}
        />
      )}

      {puedeVerEmpresas && empresasRecientes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 className="size-5 text-primary" aria-hidden />
              Empresas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/60">
                  <tr>
                    <th className="p-3 text-left text-xs uppercase text-muted-foreground">RUC</th>
                    <th className="p-3 text-left text-xs uppercase text-muted-foreground">Razón social</th>
                    <th className="p-3 text-left text-xs uppercase text-muted-foreground">Nombre comercial</th>
                    <th className="p-3 text-left text-xs uppercase text-muted-foreground">Actividad económica</th>
                    <th className="p-3 text-left text-xs uppercase text-muted-foreground">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {empresasRecientes.map((empresa) => (
                    <tr key={empresa.id} className="border-t">
                      <td className="p-3">{empresa.ruc}</td>
                      <td className="p-3">{empresa.razonSocial}</td>
                      <td className="p-3">{empresa.nombreComercial ?? "—"}</td>
                      <td className="p-3">{empresa.actividadEconomicaDescripcion ?? "—"}</td>
                      <td className="p-3">{empresa.estado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {puedeVerDepartamentos && departamentosRecientes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building className="size-5 text-primary" aria-hidden />
              Departamentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/60">
                  <tr>
                    <th className="p-3 text-left text-xs uppercase text-muted-foreground">Empresa</th>
                    <th className="p-3 text-left text-xs uppercase text-muted-foreground">Nombre</th>
                    <th className="p-3 text-left text-xs uppercase text-muted-foreground">Descripción</th>
                    <th className="p-3 text-left text-xs uppercase text-muted-foreground">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {departamentosRecientes.map((departamento) => (
                    <tr key={departamento.id} className="border-t">
                      <td className="p-3">{departamento.empresa.razonSocial}</td>
                      <td className="p-3">{departamento.nombre}</td>
                      <td className="p-3">{departamento.descripcion ?? "—"}</td>
                      <td className="p-3">{departamento.estado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
