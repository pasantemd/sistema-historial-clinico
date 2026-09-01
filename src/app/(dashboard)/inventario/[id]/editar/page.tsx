import { notFound } from "next/navigation";

import { BotonRegresar } from "@/componentes/navegacion/boton-regresar";
import { EncabezadoPagina } from "@/componentes/estructura/encabezado-pagina";
import { Migas } from "@/componentes/navegacion/migas";
import { consultarMedicamentoInventario } from "@/modulos/inventario/consultas/inventario.consulta";
import { FormularioMedicamentoInventario } from "@/modulos/inventario/componentes/formulario-medicamento-inventario";
import { PERMISOS_INVENTARIO } from "@/modulos/inventario/constantes";
import { requerirPermiso } from "@/servicios/autenticacion/requerir-permiso";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  await requerirPermiso(PERMISOS_INVENTARIO.editar);
  const { id } = await params;
  const medicamento = await consultarMedicamentoInventario(id);
  if (!medicamento) notFound();
  return (
    <div className="space-y-6">
      <BotonRegresar rutaRespaldo={`/inventario/${id}`} />
      <Migas />
      <EncabezadoPagina titulo="Editar medicamento" descripcion={medicamento.nombre} />
      <FormularioMedicamentoInventario
        medicamentoId={id}
        valores={{
          nombre: medicamento.nombre,
          cantidadDisponible: Number(medicamento.cantidadDisponible),
          unidad: medicamento.unidad,
          fechaCaducidad: medicamento.fechaCaducidad ?? "",
          estado: medicamento.estado,
          observaciones: medicamento.observaciones ?? "",
        }}
      />
    </div>
  );
}
