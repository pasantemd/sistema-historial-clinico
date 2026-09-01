-- Secuencia para numeración correlativa de recetas (REC-001, REC-002, …)
CREATE SEQUENCE IF NOT EXISTS "receta_numero_seq"
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

-- Inicializar con el valor más alto existente (si hay recetas)
DO $$
DECLARE
  max_num INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING("numeroReceta", 5) AS INTEGER)), 0) INTO max_num
  FROM "Receta"
  WHERE "numeroReceta" LIKE 'REC-%';

  IF max_num > 0 THEN
    PERFORM setval('"receta_numero_seq"', max_num, true);
  END IF;
END $$;