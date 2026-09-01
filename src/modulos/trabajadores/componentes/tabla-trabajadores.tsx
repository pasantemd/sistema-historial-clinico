"use client";

import Link from "next/link";
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table";
import { Eye, Pencil } from "lucide-react";

import { buttonVariants } from "@/componentes/ui/button";
import { Card, CardContent } from "@/componentes/ui/card";
import { Avatar, AvatarFallback } from "@/componentes/ui/avatar";
import { cn } from "@/utilidades/clases";
import { EstadoTrabajador } from "@/modulos/trabajadores/componentes/estado-trabajador";
import type { TrabajadorLista } from "@/modulos/trabajadores/tipos";

function Iniciales(nombre: string): string {
  const partes = nombre.split(" ");
  return partes.length >= 2
    ? `${partes[0].charAt(0)}${partes[1].charAt(0)}`.toUpperCase()
    : nombre.charAt(0).toUpperCase();
}

function Acciones({ trabajador }: { trabajador: TrabajadorLista }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <Link
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        href={`/trabajadores/${trabajador.trabajadorId}`}
      >
        <Eye className="size-3.5" aria-hidden /> Ver
      </Link>
      <Link
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        href={`/trabajadores/${trabajador.trabajadorId}/editar`}
      >
        <Pencil className="size-3.5" aria-hidden /> Editar
      </Link>
    </div>
  );
}

const columnas: ColumnDef<TrabajadorLista>[] = [
  {
    id: "nombre",
    header: "Trabajador",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <Avatar size="sm">
          <AvatarFallback>{Iniciales(row.original.nombreCompleto)}</AvatarFallback>
        </Avatar>
        <div>
          <Link href={`/trabajadores/${row.original.trabajadorId}`} className="font-medium hover:underline">
            {row.original.nombreCompleto}
          </Link>
          <p className="text-xs text-muted-foreground">{row.original.numeroDocumento}</p>
        </div>
      </div>
    ),
  },
  { accessorKey: "empresa", header: "Empresa" },
  {
    accessorKey: "departamento",
    header: "Departamento",
    cell: ({ getValue }) => getValue<string | null>() ?? "—",
  },
  {
    accessorKey: "estadoLaboral",
    header: "Estado",
    cell: ({ row }) => <EstadoTrabajador estado={row.original.estadoLaboral} />,
  },
  {
    id: "acciones",
    header: () => <span className="sr-only">Acciones</span>,
    cell: ({ row }) => <Acciones trabajador={row.original} />,
  },
];

export function TablaTrabajadores({ trabajadores }: { trabajadores: TrabajadorLista[] }) {
  // eslint-disable-next-line react-hooks/incompatible-library
  const tabla = useReactTable({ data: trabajadores, columns: columnas, getCoreRowModel: getCoreRowModel() });

  return (
    <>
      <div className="hidden max-w-full overflow-hidden rounded-xl border bg-card shadow-xs xl:block">
        <div className="overflow-x-auto overscroll-x-contain">
        <table className="w-full min-w-[800px] text-sm">
          <thead className="border-b bg-muted/70">
            {tabla.getHeaderGroups().map((grupo) => (
              <tr key={grupo.id}>
                {grupo.headers.map((encabezado) => (
                  <th key={encabezado.id} className="h-11 px-4 text-left font-semibold text-muted-foreground">
                    {encabezado.isPlaceholder ? null : flexRender(encabezado.column.columnDef.header, encabezado.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {tabla.getRowModel().rows.map((fila) => (
              <tr key={fila.original.vinculoId} className="border-b transition-colors last:border-0 hover:bg-muted/30">
                {fila.getVisibleCells().map((celda) => <td key={celda.id} className="px-4 py-3">{flexRender(celda.column.columnDef.cell, celda.getContext())}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:hidden">
        {trabajadores.map((trabajador) => (
          <Card key={trabajador.vinculoId} className="overflow-hidden">
            <CardContent className="space-y-4 p-4">
              <div className="flex items-center gap-3">
                <Avatar size="sm">
                  <AvatarFallback>{Iniciales(trabajador.nombreCompleto)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{trabajador.nombreCompleto}</p>
                  <p className="text-sm text-muted-foreground">{trabajador.numeroDocumento}</p>
                </div>
              </div>
              <dl className="grid grid-cols-2 gap-3 text-sm">
                <div className="col-span-2"><dt className="text-xs font-medium text-muted-foreground">Empresa</dt><dd>{trabajador.empresa}</dd></div>
                <div><dt className="text-xs font-medium text-muted-foreground">Departamento</dt><dd>{trabajador.departamento ?? "—"}</dd></div>
                <div><dt className="text-xs font-medium text-muted-foreground">Estado</dt><dd className="mt-1"><EstadoTrabajador estado={trabajador.estadoLaboral} /></dd></div>
              </dl>
              <Acciones trabajador={trabajador} />
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
