# Arquitectura

```mermaid
flowchart LR
  UI[React / Navegador] --> NEXT[Next.js]
  NEXT --> AUTH[Auth.js]
  AUTH --> PERM[Permisos]
  PERM --> VAL[Zod]
  VAL --> SERV[Servicios]
  SERV --> REPO[Repositorios y consultas]
  REPO --> PRISMA[Prisma]
  PRISMA --> DB[(PostgreSQL)]
```

Server Components resuelven páginas y consultas seguras. Client Components aportan formularios e interacción. Server Actions reciben escrituras; Route Handlers entregan integraciones o exportaciones. Servicios aplican casos de uso y repositorios concentran Prisma. Véanse [[USUARIOS_ROLES_PERMISOS]] y [[BASE_DE_DATOS]].
