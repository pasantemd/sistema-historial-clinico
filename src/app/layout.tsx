import type { Metadata } from "next";
import "./globals.css";
import { ProveedorTema } from "@/componentes/tema/proveedor-tema";

export const metadata: Metadata = {
  title: "Sistema de Historial Clínico Ocupacional",
  description:
    "Sistema de control de historial clínico ocupacional para trabajadores.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <body className="min-h-full font-sans">
        <ProveedorTema
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ProveedorTema>
      </body>
    </html>
  );
}
