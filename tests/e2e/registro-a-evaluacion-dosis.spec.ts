import { test, expect } from "@playwright/test";
import { hayCredencialesE2E, iniciarSesionE2E } from "./ayudantes/autenticacion";

test.describe("Traspaso de Registro Diario a Evaluación Médica - Dosis", () => {
  test.skip(!hayCredencialesE2E || process.env.PLAYWRIGHT_PERMITIR_ESCRITURAS !== "SI", "Requiere credenciales y autorización explícita de escrituras E2E.");
  test("Flujo E2E: Crear registro diario con procedimiento -> Crear evaluación médica -> Dosis precargada", async ({ page }) => {
    await iniciarSesionE2E(page);

    // 2. Ir a nuevo registro diario
    await page.goto("/registro-diario/nuevo");
    await expect(page).toHaveURL(/.*registro-diario\/nuevo/);

    // 3. Buscar y seleccionar un trabajador
    const inputTrabajador = page.locator('input[aria-label="Buscar trabajador"]');
    await inputTrabajador.fill("Carlos");
    await page.waitForTimeout(600);

    const opcionTrabajador = page.locator('div[role="listbox"] button[role="option"]').first();
    await opcionTrabajador.waitFor({ state: "visible", timeout: 10000 });
    await opcionTrabajador.click();

    // 4. Llenar morbilidad
    const inputMorbilidad = page.locator('input[placeholder*="morbilidad"]').first();
    await inputMorbilidad.fill("Gastroenteritis aguda");

    // 5. Buscar y agregar medicamento
    const inputBusqMed = page.locator('input[placeholder*="Buscar medicamento"]').first();
    await inputBusqMed.fill("QA_IBUPROFENO_400");
    await page.waitForTimeout(600);

    const opcionMed = page.locator('button:has-text("QA_IBUPROFENO_400")').first();
    await opcionMed.waitFor({ state: "visible", timeout: 10000 });
    await opcionMed.click();

    // Ajustar cantidad a 5
    const inputCant = page.locator('input[name="medicamentos.0.cantidadEntregada"]');
    await inputCant.fill("5");

    // 6. Llenar Procedimiento = "Cada 5 horas"
    const inputProc = page.locator('textarea[name="procedimiento"]');
    await inputProc.fill("Cada 5 horas");

    // Confirmar firma
    const checkboxFirma = page.locator('input[name="firmaConfirmada"]');
    await checkboxFirma.check();

    // 7. Guardar registro diario
    const botonGuardar = page.locator('button:has-text("Guardar registro"), button:has-text("Registrar atención")').first();
    await botonGuardar.click();

    // 8. Esperar el detalle del registro diario recién creado
    await expect(page).toHaveURL(
      /\/registro-diario\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      { timeout: 30000 },
    );
    await expect(
      page.getByRole("heading", { name: /Registro diario RDA-/ }),
    ).toBeVisible();

    // 9. En el detalle del registro diario, hacer clic en "Crear evaluación médica"
    const botonCrearEval = page.locator('a:has-text("Crear evaluación médica")');
    await expect(botonCrearEval).toBeVisible();
    await botonCrearEval.click();

    // 10. Esperar que cargue el formulario de nueva evaluación médica
    await page.waitForURL("**/evaluaciones-medicas/nueva*", { timeout: 15000 });

    // 11. Verificar sección de Medicamentos
    await expect(page.locator("text=F. Medicamentos")).toBeVisible();
    await expect(page.locator("text=Precargado desde el registro diario")).toBeVisible();

    const inputNombre = page.locator('input[name="medicamentos.0.nombreGenerico"]');
    const inputCantidad = page.locator('input[name="medicamentos.0.cantidad"]');
    const inputDosis = page.locator('input[name="medicamentos.0.dosis"]');
    const inputVia = page.locator('input[name="medicamentos.0.viaAdministracion"]');
    const inputIndicaciones = page.locator('input[name="medicamentos.0.indicaciones"]');

    await expect(inputNombre).toHaveValue(/QA_IBUPROFENO_400/);
    await expect(inputCantidad).toHaveValue("5");
    await expect(inputDosis).toHaveValue("Cada 5 horas");
    await expect(inputVia).toHaveValue("");
    await expect(inputIndicaciones).toHaveValue("");

    // 12. Verificar que el campo Dosis es editable
    await inputDosis.fill("1 tableta cada 8 horas");
    await expect(inputDosis).toHaveValue("1 tableta cada 8 horas");
  });
});
