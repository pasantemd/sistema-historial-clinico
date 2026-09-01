CREATE EXTENSION IF NOT EXISTS btree_gist;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "CitaMedica" a
    JOIN "CitaMedica" b
      ON a.id < b.id
      AND a."profesionalId" IS NOT NULL
      AND a."profesionalId" = b."profesionalId"
      AND a."fecha" = b."fecha"
      AND a."estado" IN ('PROGRAMADA', 'CONFIRMADA')
      AND b."estado" IN ('PROGRAMADA', 'CONFIRMADA')
      AND int4range(
        substring(a."horaInicio" from 1 for 2)::int * 60 + substring(a."horaInicio" from 4 for 2)::int,
        substring(COALESCE(a."horaFin", a."horaInicio") from 1 for 2)::int * 60 + substring(COALESCE(a."horaFin", a."horaInicio") from 4 for 2)::int,
        '[)'
      ) && int4range(
        substring(b."horaInicio" from 1 for 2)::int * 60 + substring(b."horaInicio" from 4 for 2)::int,
        substring(COALESCE(b."horaFin", b."horaInicio") from 1 for 2)::int * 60 + substring(COALESCE(b."horaFin", b."horaInicio") from 4 for 2)::int,
        '[)'
      )
  ) THEN
    RAISE EXCEPTION 'No se puede crear la restricción: existen citas activas superpuestas para un mismo profesional.';
  END IF;
END
$$;

ALTER TABLE "CitaMedica"
ADD CONSTRAINT "CitaMedica_profesional_solape_activo_excl"
EXCLUDE USING gist (
  "profesionalId" WITH =,
  "fecha" WITH =,
  int4range(
    substring("horaInicio" from 1 for 2)::int * 60 + substring("horaInicio" from 4 for 2)::int,
    substring(COALESCE("horaFin", "horaInicio") from 1 for 2)::int * 60 + substring(COALESCE("horaFin", "horaInicio") from 4 for 2)::int,
    '[)'
  ) WITH &&
)
WHERE (
  "profesionalId" IS NOT NULL
  AND "estado" IN ('PROGRAMADA', 'CONFIRMADA')
);
