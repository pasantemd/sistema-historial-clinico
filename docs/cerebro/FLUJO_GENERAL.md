# Flujo general

```mermaid
flowchart TD
  ADMIN[Administrador] --> USERS[Usuarios] --> ROLES[Roles] --> PERM[Permisos]
  RRHH[Recursos Humanos] --> TRAB[Trabajadores] --> VIN[Vínculos laborales]
  VIN --> EMP[Empresas]
  VIN --> DEP[Departamentos]
  TRAB --> CIT[Citas] --> MED[Médicos] --> RD[Registro diario]
  RD --> EVA[Evaluaciones médicas]
  EVA --> RX[Recetas]
  EVA --> FIC[Fichas ocupacionales] --> CERT[Certificados]
  RD --> INV[Inventario]
  TRAB --> REP[Reportes]
  EVA --> REP
  RX --> REP
  FIC --> REP
  ADMIN --> AUD[Auditoría]
  RRHH --> AUD
  MED --> AUD
```

El administrador administra usuarios, roles y permisos. RRHH registra identidad y contexto laboral. El médico atiende, documenta y emite documentos autorizados. La auditoría registra las operaciones relevantes. Véanse [[CITAS_Y_ATENCION]], [[FLUJO_CLINICO]] e [[INVENTARIO]].
