-- Convertir la clasificación cerrada a texto libre sin recrear la columna ni perder datos.
ALTER TABLE "EvaluacionMedica"
ALTER COLUMN "morbilidad" TYPE VARCHAR(160)
USING CASE "morbilidad"::text
  WHEN 'ENFERMEDAD_GENERAL' THEN 'Enfermedad general'
  WHEN 'ENFERMEDAD_OCUPACIONAL' THEN 'Enfermedad ocupacional'
  WHEN 'ACCIDENTE_LABORAL' THEN 'Accidente laboral'
  WHEN 'ACCIDENTE_NO_LABORAL' THEN 'Accidente no laboral'
  WHEN 'CONTROL_MEDICO' THEN 'Control médico'
  ELSE "morbilidad"::text
END;

DROP TYPE "TipoMorbilidad";
