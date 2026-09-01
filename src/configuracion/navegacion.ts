import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  ClipboardList,
  FileBarChart,
  FileText,
  LayoutDashboard,
  NotebookPen,
  Package,
  ScrollText,
  Settings,
  Stethoscope,
  Pill,
  Users,
} from "lucide-react";

export interface ElementoNavegacion {
  etiqueta: string;
  ruta: string;
  icono: LucideIcon;
  disponible: boolean;
  permiso?: string;
}

export const NAVEGACION_PRINCIPAL: ElementoNavegacion[] = [
  { etiqueta: "Inicio", ruta: "/inicio", icono: LayoutDashboard, disponible: true, permiso: "trabajador.ver" },
  { etiqueta: "Trabajadores", ruta: "/trabajadores", icono: Users, disponible: true, permiso: "trabajador.ver" },
  { etiqueta: "Citas", ruta: "/citas", icono: CalendarDays, disponible: true, permiso: "cita.ver" },
  { etiqueta: "Registro diario", ruta: "/registro-diario", icono: NotebookPen, disponible: true, permiso: "registro-diario.ver" },
  { etiqueta: "Evaluaciones médicas", ruta: "/evaluaciones-medicas", icono: ClipboardList, disponible: true, permiso: "evaluacion-medica.ver" },
  { etiqueta: "Fichas ocupacionales", ruta: "/fichas-ocupacionales", icono: FileText, disponible: true, permiso: "ficha-ocupacional.ver" },
  { etiqueta: "Recetas", ruta: "/recetas", icono: Pill, disponible: true, permiso: "receta.ver" },
  { etiqueta: "Inventario", ruta: "/inventario", icono: Package, disponible: true, permiso: "inventario.ver" },
  { etiqueta: "Reportes", ruta: "/reportes", icono: FileBarChart, disponible: true, permiso: "reporte.ver" },
  { etiqueta: "Configuración", ruta: "/mi-perfil", icono: Stethoscope, disponible: true },
  { etiqueta: "Auditoría", ruta: "/auditoria", icono: ScrollText, disponible: true, permiso: "auditoria.ver" },
  { etiqueta: "Configuración", ruta: "/configuracion", icono: Settings, disponible: true, permiso: "empresa.ver" },
];
