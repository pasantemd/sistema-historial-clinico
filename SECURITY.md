# Seguridad

## Alcance

Este es un sistema privado que procesa información clínica ocupacional. Los datos reales, respaldos, credenciales, documentos exportados y registros de auditoría no deben publicarse en GitHub ni adjuntarse a incidencias públicas.

## Reportar una vulnerabilidad

No abras una incidencia pública con detalles explotables o información personal. Comunica el hallazgo mediante el canal privado definido por el propietario del repositorio e incluye:

- versión o commit afectado;
- ruta y rol necesarios para reproducirlo;
- impacto observado;
- pasos mínimos de reproducción sin datos reales;
- propuesta de mitigación, si existe.

No pruebes vulnerabilidades contra producción ni extraigas datos de terceros.

## Secretos

- Copia `.env.example` como `.env` y reemplaza todos los marcadores.
- Usa secretos diferentes para desarrollo, QA y producción.
- Guarda los secretos de CI/CD en el almacén de la plataforma.
- Si un secreto se publica, revócalo y rótalo; eliminarlo del último commit no es suficiente.

## Dependencias y estado

Las decisiones y riesgos técnicos vigentes se mantienen en [docs/AUDITORIA.md](docs/AUDITORIA.md). Las actualizaciones de dependencias deben probarse sin `npm audit fix --force` ni retrocesos automáticos incompatibles.

La rama activa es la única versión mantenida salvo que el propietario indique lo contrario.
