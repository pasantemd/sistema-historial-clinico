-- La aplicación asigna exactamente un rol funcional por usuario.
-- Esta restricción evita múltiples roles por inserciones directas o scripts.
CREATE UNIQUE INDEX "UsuarioRol_usuarioId_key" ON "UsuarioRol"("usuarioId");
