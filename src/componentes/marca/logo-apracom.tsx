import Image from "next/image";
import Link from "next/link";

import logoAP from "@/img/logoAP.png";
import { cn } from "@/utilidades/clases";

interface Props {
  className?: string;
  contenedorClassName?: string;
  width?: number;
  height?: number;
  variante?: "completo" | "isotipo";
  tabIndex?: number;
}

export function LogoAP({
  className,
  contenedorClassName,
  width = 120,
  height: h,
  variante = "completo",
  tabIndex,
}: Props) {
  if (variante === "isotipo") {
    const alto = h ?? width;
    const anchoImagen = Math.round(width * 2.15);
    const desplazamientoSuperior = Math.round(width * -0.42);

    return (
      <Link
        href="/inicio"
        aria-label="APRACOM"
        tabIndex={tabIndex}
        className={cn(
          "inline-flex shrink-0 items-center justify-center rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          contenedorClassName,
        )}
        style={{ width, height: alto }}
      >
        <span className="relative block h-9 w-full overflow-hidden">
          <Image
            src={logoAP}
            alt="APRACOM"
            width={anchoImagen}
            height={anchoImagen}
            className={cn("absolute left-1/2 h-auto max-w-none -translate-x-1/2 object-contain", className)}
            style={{
              top: `${desplazamientoSuperior}px`,
              width: `${anchoImagen}px`,
            }}
            priority
          />
        </span>
      </Link>
    );
  }

  const height = h ?? Math.round(width * 0.56);
  const desplazamientoSuperior = Math.round(width * -0.14);

  return (
    <Link
      href="/inicio"
      aria-label="APRACOM"
      tabIndex={tabIndex}
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        contenedorClassName,
      )}
      style={{ width, height }}
    >
      <Image
        src={logoAP}
        alt="APRACOM"
        width={width}
        height={width}
        style={{
          top: `${desplazamientoSuperior}px`,
          width: `${width}px`,
          height: `${width}px`,
        }}
        className={cn("absolute left-0 max-w-none object-contain", className)}
        priority
      />
    </Link>
  );
}
