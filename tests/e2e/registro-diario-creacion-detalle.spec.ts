import { expect, test } from "@playwright/test";
import { Pool } from "pg";

import {
  hayCredencialesE2E,
  iniciarSesionE2E,
} from "./ayudantes/autenticacion";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

test.afterAll(async () => {
  await pool.end();
});

test.describe("Creación de Registro Diario y navegación al detalle", () => {
  test.skip(
    !hayCredencialesE2E ||
      process.env.PLAYWRIGHT_PERMITIR_ESCRITURAS !== "SI",
    "Requiere credenciales y autorización explícita de escrituras E2E.",
  );

  test("crea una sola vez, muestra el detalle y conserva el RDA al recargar", async ({
    page,
  }) => {
    test.setTimeout(120_000);
    const marcador = `QA REDIRECT REGISTRO DIARIO ${Date.now()}`;
    const erroresConsola: string[] = [];
    const respuestasFallidas: string[] = [];
    let accionesPostRegistro: string[] = [];

    page.on("console", (mensaje) => {
      if (mensaje.type() === "error") erroresConsola.push(mensaje.text());
    });
    page.on("request", (solicitud) => {
      if (
        solicitud.method() === "POST" &&
        solicitud.url().includes("/registro-diario")
      ) {
        accionesPostRegistro.push(
          solicitud.headers()["next-action"] ?? solicitud.url(),
        );
      }
    });
    page.on("response", (respuesta) => {
      const estado = respuesta.status();
      if (
        respuesta.url().startsWith(new URL(page.url()).origin) &&
        (estado === 404 || estado >= 500)
      ) {
        respuestasFallidas.push(`${estado} ${respuesta.url()}`);
      }
    });

    await iniciarSesionE2E(page);
    await page.goto("/registro-diario");
    await page.getByRole("link", { name: "Nuevo registro" }).first().click();
    await expect(page).toHaveURL(/\/registro-diario\/nuevo$/, {
      timeout: 20_000,
    });

    const buscadorTrabajador = page.getByLabel("Buscar trabajador");
    await buscadorTrabajador.fill("QA-DOC-001");
    await page
      .locator('[role="listbox"] [role="option"]')
      .first()
      .click();

    await page
      .locator('input[placeholder*="morbilidad"]')
      .first()
      .fill(marcador);
    await page.locator('textarea[name="procedimiento"]').fill("Control E2E");
    await page.locator('input[name="firmaConfirmada"]').check();
    await page.waitForLoadState("networkidle");

    const guardar = page.getByRole("button", { name: "Guardar registro" });
    accionesPostRegistro = [];
    await guardar.evaluate((boton: HTMLButtonElement) => {
      boton.click();
      boton.click();
    });

    await expect(page).toHaveURL(
      /\/registro-diario\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      {
      timeout: 20_000,
      },
    );
    const urlDetalle = page.url();
    const titulo = page.getByRole("heading", {
      name: /Registro diario RDA-/,
    });
    await expect(titulo).toBeVisible();
    const textoTitulo = await titulo.textContent();

    await expect(
      page.getByRole("link", { name: "Crear evaluación médica" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Crear ficha ocupacional" }),
    ).toBeVisible();
    await expect(page.getByRole("link", { name: "Crear receta" })).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Ver / Imprimir PDF" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Descargar Excel" }),
    ).toBeVisible();

    await page.reload();
    await expect(page).toHaveURL(urlDetalle);
    await expect(titulo).toHaveText(textoTitulo ?? "");

    await expect
      .poll(async () => {
        const resultado = await pool.query<{ cantidad: number }>(
          'SELECT COUNT(*)::int AS cantidad FROM "registros_diarios_atencion" WHERE "atencionMorbilidad" = $1',
          [marcador],
        );
        return resultado.rows[0]?.cantidad ?? 0;
      })
      .toBe(1);
    const repeticionesPorAccion = new Map<string, number>();
    for (const accion of accionesPostRegistro) {
      repeticionesPorAccion.set(
        accion,
        (repeticionesPorAccion.get(accion) ?? 0) + 1,
      );
    }
    expect(Math.max(...repeticionesPorAccion.values())).toBe(1);
    expect(respuestasFallidas).toEqual([]);
    expect(erroresConsola).toEqual([]);

    await page.goBack();
    await expect(page).toHaveURL(/\/registro-diario(?:\?.*)?$/);
  });
});
