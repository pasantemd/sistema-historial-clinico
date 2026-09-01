import { test, expect } from "@playwright/test";
import { hayCredencialesE2E, iniciarSesionE2E } from "./ayudantes/autenticacion";

test.describe("Traspaso de Registro Diario a Receta Médica - Dosis y Medicamentos", () => {
  test.skip(!hayCredencialesE2E || process.env.PLAYWRIGHT_PERMITIR_ESCRITURAS !== "SI", "Requiere credenciales y autorización explícita de escrituras E2E.");
  test("Flujo E2E: Crear registro diario con procedimiento -> Crear receta -> Dosis precargada y un solo campo de indicaciones", async ({ page }) => {
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

    // 9. En el detalle del registro diario, hacer clic en "Crear receta"
    const botonCrearReceta = page.locator('a:has-text("Crear receta")');
    await expect(botonCrearReceta).toBeVisible();
    await botonCrearReceta.click();

    // 10. Esperar que cargue el formulario de nueva receta médica
    await page.waitForURL("**/recetas/nueva*", { timeout: 15000 });

    // 11. Verificar sección de Datos de la receta y trabajador
    await expect(page.locator("text=Datos de la receta")).toBeVisible();

    // 12. Verificar inputs de medicamento precargado
    const inputNombreMed = page.locator('input[name="medicamentos.0.nombreMedicamentoHistorico"]');
    const inputCantidadMed = page.locator('input[name="medicamentos.0.cantidad"]');
    const inputDosisMed = page.locator('input[name="medicamentos.0.dosis"]');
    const selectViaMed = page.locator('select[name="medicamentos.0.viaAdministracion"]');
    const textareaIndicacionesMed = page.locator('textarea[name="medicamentos.0.indicaciones"]');

    await expect(inputNombreMed).toHaveValue(/QA_IBUPROFENO_400/);
    // El nombre no debe contener (5 tabletas) ni x5
    const valorNombre = await inputNombreMed.inputValue();
    expect(valorNombre).not.toContain("x5");
    expect(valorNombre).not.toContain("(5");

    await expect(inputCantidadMed).toHaveValue("5");
    await expect(inputDosisMed).toHaveValue("Cada 5 horas");
    await expect(selectViaMed).toHaveValue("");
    await expect(textareaIndicacionesMed).toHaveValue("");

    // 13. Verificar no duplicación: comprobar que solo hay un campo de indicaciones en la tarjeta
    const textareasIndicaciones = page.locator('textarea[placeholder*="indicaciones"], textarea[name*="indicaciones"]');
    await expect(textareasIndicaciones).toHaveCount(1);

    // 14. Completar vía y guardar borrador de receta
    await selectViaMed.selectOption("Oral");
    const botonGuardarReceta = page.locator('button:has-text("Guardar borrador")');
    await botonGuardarReceta.click();

    // 15. Esperar redirección al detalle de la receta
    await expect(page).toHaveURL(
      /\/recetas\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      { timeout: 30000 },
    );
    await expect(page.locator("text=Medicamentos")).toBeVisible();
    await expect(page.locator("text=QA_IBUPROFENO_400").first()).toBeVisible();
    await expect(page.locator("text=Cada 5 horas").first()).toBeVisible();
    await expect(page.locator("text=Oral").first()).toBeVisible();
  });
});
