import { readdirSync, readFileSync } from "node:fs";
import { extname, join } from "node:path";

let _logoBuffer: Buffer | null = null;
let _logoBase64: string | null = null;
let _logoRuta: string | null = null;
let _logoMime: string | null = null;

const MIME_POR_EXTENSION: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

export function obtenerRutaLogoApracom(): string {
  if (_logoRuta) return _logoRuta;

  const directorio = join(process.cwd(), "src", "img");
  const archivo = readdirSync(directorio, { withFileTypes: true }).find(
    (entrada) =>
      entrada.isFile() &&
      entrada.name.replace(extname(entrada.name), "").toLocaleLowerCase("es") ===
        "logoap" &&
      Boolean(MIME_POR_EXTENSION[extname(entrada.name).toLowerCase()]),
  );

  if (!archivo) {
    throw new Error(
      "No se encontró el logo oficial APRACOM en src/img/logoAP.",
    );
  }

  _logoRuta = join(directorio, archivo.name);
  _logoMime =
    MIME_POR_EXTENSION[extname(archivo.name).toLowerCase()] ?? "image/png";
  return _logoRuta;
}

export function obtenerLogoBuffer(): Buffer {
  if (!_logoBuffer) {
    _logoBuffer = readFileSync(obtenerRutaLogoApracom());
  }
  return _logoBuffer;
}

export function obtenerLogoBase64(): string {
  if (!_logoBase64) {
    const buf = obtenerLogoBuffer();
    _logoBase64 = `data:${_logoMime ?? "image/png"};base64,${buf.toString("base64")}`;
  }
  return _logoBase64;
}
