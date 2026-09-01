# Integraciones

```mermaid
flowchart LR
  APP[Sistema clínico]
  ERP[ERPNext]
  SAP[SAP]
  SRI[SRI]
  MAIL[Correo]
  APP -. REST JSON propuesto .-> ERP
  APP -. SOAP XML propuesto .-> SAP
  APP -. REST o SOAP propuesto .-> SRI
  APP -. SMTP o API propuesto .-> MAIL
```

No hay integraciones externas activas documentadas. Este mapa describe contratos posibles: REST/JSON para APIs web, SOAP/XML para sistemas legados y webhooks para notificaciones entrantes. Cualquier integración futura debe validar autenticación, permisos, auditoría y datos mínimos. Véanse [[ARQUITECTURA]] y [[USUARIOS_ROLES_PERMISOS]].
