import { BotonRegresar } from "@/componentes/navegacion/boton-regresar";
import { EncabezadoPagina } from "@/componentes/estructura/encabezado-pagina";
import { Migas } from "@/componentes/navegacion/migas";
import { FormularioMedicamentoInventario } from "@/modulos/inventario/componentes/formulario-medicamento-inventario";
import { PERMISOS_INVENTARIO } from "@/modulos/inventario/constantes";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";

export default async function Page() {
  await requerirPermiso(PERMISOS_INVENTARIO.crear);
  return (
    <div className="space-y-6">
      <BotonRegresar rutaRespaldo="/inventario" />
      <Migas />
      <EncabezadoPagina titulo="Nuevo medicamento" descripcion="Registre un medicamento de inventario físico." />
      <FormularioMedicamentoInventario
        valores={{
          nombre: "",
          cantidadDisponible: 0,
          unidad: "UNIDADES",
          fechaCaducidad: "",
          observaciones: "",
        }}
      />
    </div>
  );
}
