CREATE TABLE "IntentoInicioSesion" (
    "id" UUID NOT NULL,
    "claveHash" VARCHAR(64) NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntentoInicioSesion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "IntentoInicioSesion_claveHash_creadoEn_idx"
ON "IntentoInicioSesion"("claveHash", "creadoEn");

CREATE INDEX "IntentoInicioSesion_creadoEn_idx"
ON "IntentoInicioSesion"("creadoEn");
