"use client";

import Link from "next/link";
import { FileQuestion } from "lucide-react";

import { Button } from "@/componentes/ui/button";
import { LogoAP } from "@/componentes/marca/logo-apracom";
import { EstadoVacio } from "@/componentes/retroalimentacion/estado-vacio";

export default function NoEncontrado() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6">
      <LogoAP width={180} />
      <EstadoVacio
        icono={FileQuestion}
        titulo="Página no encontrada"
        descripcion="La página que buscas no existe o aún no está disponible."
        accion={
          <Button render={<Link href="/inicio" />} nativeButton={false}>Volver al inicio</Button>
        }
      />
    </div>
  );
}
