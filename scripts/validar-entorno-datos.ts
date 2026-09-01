interface EntornoDatos {
  nodeEnv?: string;
  databaseUrl?: string;
  exigirBaseLocal?: boolean;
}

const HOSTS_LOCALES = new Set(["localhost", "127.0.0.1", "::1"]);

export function validarEntornoDatos({
  nodeEnv,
  databaseUrl,
  exigirBaseLocal = false,
}: EntornoDatos) {
  if (!databaseUrl) throw new Error("DATABASE_URL no está definida.");
  if (nodeEnv === "production") {
    throw new Error("Este script de datos no puede ejecutarse en producción.");
  }

  let host: string;
  try {
    host = new URL(databaseUrl).hostname;
  } catch {
    throw new Error("DATABASE_URL no es válida.");
  }

  if (exigirBaseLocal && !HOSTS_LOCALES.has(host)) {
    throw new Error("Este script de prueba solo puede ejecutarse en una base local.");
  }
}
