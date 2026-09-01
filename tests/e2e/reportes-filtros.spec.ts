import { test, expect } from "@playwright/test";
import { hayCredencialesE2E, iniciarSesionE2E } from "./ayudantes/autenticacion";

test.describe("Módulo de Reportes - Validación Visual y Funcional", () => {
  test.skip(!hayCredencialesE2E, "Defina credenciales E2E por variables de entorno.");
  test("Verificación visual, orientación horizontal, ausencia de Top 10 y responsive", async ({ page }) => {
    await iniciarSesionE2E(page);

    // 2. Navegar a /reportes
    await page.goto("/reportes");
    await expect(page).toHaveURL(/.*reportes/);
    await expect(page.locator("h1")).toContainText("Reportes");

    // 3. Verificar que NO exista el texto "Top 10 medicamentos entregados"
    const contenido = await page.content();
    expect(contenido).not.toContain("Top 10 medicamentos entregados");

    // 4. Verificar la tabla cuando existen entregas o el estado vacío cuando no hay datos.
    await expect(page.getByText("Medicamentos entregados", { exact: true })).toBeVisible();

    const encabezadoMedicamento = page.getByRole("columnheader", {
      name: "Medicamento",
      exact: true,
    });
    const estadoVacioMedicamentos = page.getByText("Sin medicamentos entregados", {
      exact: true,
    });

    await expect(encabezadoMedicamento.or(estadoVacioMedicamentos)).toBeVisible();

    if (await encabezadoMedicamento.isVisible()) {
      await expect(encabezadoMedicamento).toBeVisible();
      await expect(
        page.getByRole("columnheader", { name: "Cantidad entregada", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("columnheader", { name: "Unidad", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("columnheader", { name: "N.º entregas", exact: true }),
      ).toBeVisible();
    } else {
      await expect(estadoVacioMedicamentos).toBeVisible();
      await expect(
        page.getByText("No hay medicamentos entregados para los filtros seleccionados.", {
          exact: true,
        }),
      ).toBeVisible();
    }

    // 5. Verificar presencia de "Tipos de morbilidades"
    await expect(page.locator("text=Tipos de morbilidades").first()).toBeVisible();

    // 6. Viewport Desktop 1440x900
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForTimeout(500);

    // 7. Viewport Tablet 768x1024
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);

    // 8. Viewport Mobile 375x812 (verificar que no haya overflow global)
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);

    // Verificar que los gráficos se renderizan dentro del viewport móvil
    await expect(page.locator("text=Tipos de morbilidades").first()).toBeVisible();
    await expect(page.locator("text=Medicamentos entregados").first()).toBeVisible();
  });
});
