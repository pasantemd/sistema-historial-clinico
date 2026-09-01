DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "VinculoLaboral"
    WHERE "activa" = true
      AND "estado" = 'ACTIVO'
    GROUP BY "trabajadorId"
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION 'No se puede crear la restricción: existen trabajadores con más de una asignación laboral activa.';
  END IF;
END
$$;

CREATE UNIQUE INDEX "VinculoLaboral_trabajador_activo_unico_idx"
ON "VinculoLaboral" ("trabajadorId")
WHERE "activa" = true
  AND "estado" = 'ACTIVO';
