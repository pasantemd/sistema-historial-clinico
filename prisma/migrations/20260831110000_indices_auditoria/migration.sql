CREATE INDEX "Auditoria_creadoEn_idx" ON "Auditoria"("creadoEn");

CREATE INDEX "Auditoria_modulo_creadoEn_idx" ON "Auditoria"("modulo", "creadoEn");

CREATE INDEX "Auditoria_usuarioId_creadoEn_idx" ON "Auditoria"("usuarioId", "creadoEn");
