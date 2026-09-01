import { EstructuraAplicacion } from "@/componentes/estructura/estructura-aplicacion";
import { ProteccionSesionNavegador } from "@/modulos/autenticacion/componentes/proteccion-sesion-navegador";
import { ProveedorToastGuardado } from "@/componentes/retroalimentacion/toast-guardado";
import { requerirUsuario } from "@/servicios/autenticacion/requerir-usuario";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function LayoutPanel({
  children,
}: {
  children: React.ReactNode;
}) {
  const usuario = await requerirUsuario();
  return (
    <>
      <ProteccionSesionNavegador />
      <ProveedorToastGuardado>
        <EstructuraAplicacion usuario={usuario}>{children}</EstructuraAplicacion>
      </ProveedorToastGuardado>
    </>
  );
}
