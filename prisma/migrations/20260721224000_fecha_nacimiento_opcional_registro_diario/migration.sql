-- La fecha de nacimiento puede no constar en el maestro del trabajador.
-- Se conserva NULL y nunca se inventa una fecha clínica.
ALTER TABLE "registros_diarios_atencion"
ALTER COLUMN "fechaNacimiento" DROP NOT NULL;
