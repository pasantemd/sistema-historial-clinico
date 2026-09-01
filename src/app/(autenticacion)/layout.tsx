import { SelectorTema } from "@/componentes/tema/selector-tema";
import { LogoAP } from "@/componentes/marca/logo-apracom";

export default function LayoutAutenticacion({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-muted/30 px-4 py-12">
      <div className="absolute right-4 top-4">
        <SelectorTema />
      </div>
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <LogoAP width={160} className="object-contain" tabIndex={-1} />
        </div>
        {children}
      </div>
    </main>
  );
}
