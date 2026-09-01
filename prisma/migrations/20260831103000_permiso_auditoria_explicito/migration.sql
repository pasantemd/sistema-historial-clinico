-- Separa el permiso administrativo de auditoría del concepto de historial clínico.
UPDATE "Permiso"
SET
  "codigo" = 'auditoria.ver',
  "nombre" = 'Ver auditoría del sistema',
  "modulo" = 'auditoria'
WHERE "codigo" = 'historial.ver';
