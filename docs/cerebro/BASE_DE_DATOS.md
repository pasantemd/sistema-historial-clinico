# Base de datos

```mermaid
erDiagram
  Usuario }o--|| Rol : tiene
  Rol }o--o{ Permiso : posee
  Trabajador ||--o{ VinculoLaboral : tiene
  Empresa ||--o{ VinculoLaboral : relaciona
  Departamento ||--o{ VinculoLaboral : relaciona
  Trabajador ||--o{ CitaMedica : tiene
  Usuario ||--o{ CitaMedica : atiende
  Trabajador ||--o{ RegistroDiarioAtencion : tiene
  Trabajador ||--o{ EvaluacionMedica : tiene
  Trabajador ||--o{ FichaOcupacional : tiene
  Trabajador ||--o{ RecetaMedica : tiene
  MedicamentoInventario ||--o{ MovimientoInventario : genera
  Usuario ||--o{ Auditoria : ejecuta
```

Es un ERD conceptual, no un reemplazo de `schema.prisma`. `VinculoLaboral` representa la tabla mapeada por `AsignacionLaboral`. Véanse [[TRABAJADORES_Y_VINCULOS]], [[INVENTARIO]] y [[USUARIOS_ROLES_PERMISOS]].
