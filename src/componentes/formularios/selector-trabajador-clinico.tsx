"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/componentes/ui/card";
import { Input } from "@/componentes/ui/input";
import type { TrabajadorRegistroDto } from "@/modulos/registro-diario/tipos";
import { buscarTrabajadoresClinicosAccion } from "@/modulos/trabajadores/acciones/buscar-trabajadores-clinicos.accion";

export function SelectorTrabajadorClinico({
  destino,
  parametros = "",
}: {
  destino: string;
  parametros?: string;
}) {
  const [consulta, setConsulta] = useState("");
  const [resultados, setResultados] = useState<TrabajadorRegistroDto[]>([]);
  const consultaActiva = consulta.trim().length >= 2;

  useEffect(() => {
    if (!consultaActiva) return;
    const temporizador = setTimeout(async () => {
      setResultados(await buscarTrabajadoresClinicosAccion(consulta));
    }, 300);
    return () => clearTimeout(temporizador);
  }, [consulta, consultaActiva]);

  const resultadosVisibles = consultaActiva ? resultados : [];

  return (
    <Card>
      <CardHeader><CardTitle>Seleccionar trabajador</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Search aria-hidden className="absolute left-3 top-3 size-4" />
          <Input
            autoFocus
            className="pl-9"
            value={consulta}
            onChange={(evento) => setConsulta(evento.target.value)}
            placeholder="Buscar por cédula, nombres, apellidos o nombre completo"
          />
        </div>
        {resultadosVisibles.length > 0 && (
          <ul className="divide-y rounded border">
            {resultadosVisibles.map((trabajador) => (
              <li key={trabajador.id}>
                <Link
                  className="block min-h-11 p-3 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  href={`${destino}?trabajadorId=${trabajador.id}${parametros ? `&${parametros}` : ""}`}
                >
                  <b>{trabajador.nombreCompleto}</b>
                  <span className="block text-sm text-muted-foreground">
                    {trabajador.numeroDocumento} · {trabajador.empresa} · {trabajador.departamento}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {consultaActiva && resultadosVisibles.length === 0 && (
          <p className="text-sm text-muted-foreground">No se encontraron trabajadores.</p>
        )}
      </CardContent>
    </Card>
  );
}
