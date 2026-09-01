import { expect, test } from "@playwright/test";

test.describe("Protección para visitantes", () => {
  test("redirige una página privada al inicio de sesión", async ({ page }) => {
    await page.goto("/trabajadores");
    await expect(page).toHaveURL(/\/iniciar-sesion(?:\?|$)/);
    await expect(page.getByRole("button", { name: "Iniciar sesión" })).toBeVisible();
  });

  test("no entrega una exportación privada sin sesión", async ({ request }) => {
    const respuesta = await request.post("/api/reportes/exportar", {
      data: { filtros: { periodo: "semanal" }, graficos: [] },
      maxRedirects: 0,
    });
    expect([302, 303, 307, 308, 401, 403]).toContain(respuesta.status());
  });
});
