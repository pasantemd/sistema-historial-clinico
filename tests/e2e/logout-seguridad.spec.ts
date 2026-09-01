import { expect, test, type Page } from "@playwright/test";

const correo = process.env.PLAYWRIGHT_EMAIL;
const contrasena = process.env.PLAYWRIGHT_PASSWORD;

async function iniciarSesion(page: Page) {
  await page.goto("/iniciar-sesion");
  await page.locator("#correo").fill(correo!);
  await page.locator("#contrasena").fill(contrasena!);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/inicio/, { timeout: 15000 });
}

test.describe("Seguridad después del cierre de sesión", () => {
  test.skip(
    !correo || !contrasena,
    "Defina PLAYWRIGHT_EMAIL y PLAYWRIGHT_PASSWORD con una cuenta de prueba válida.",
  );

  test("logout, Atrás y URL privada permanecen en inicio de sesión", async ({
    page,
  }) => {
    await iniciarSesion(page);
    await page.goto("/trabajadores");
    await expect(page).toHaveURL(/\/trabajadores$/);
    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    await expect(page).toHaveURL(/\/iniciar-sesion$/);

    await page.goBack();
    await expect(page).toHaveURL(/\/iniciar-sesion$/);
    await expect(page.getByText("Panel principal")).not.toBeVisible();

    await page.goto("/trabajadores");
    await expect(page).toHaveURL(/\/iniciar-sesion$/);
    await page.reload();
    await expect(page).toHaveURL(/\/iniciar-sesion$/);
  });

  test("un endpoint privado no entrega datos después del logout", async ({
    page,
  }) => {
    await iniciarSesion(page);
    await page.getByRole("button", { name: "Cerrar sesión" }).click();
    await expect(page).toHaveURL(/\/iniciar-sesion$/);

    const respuesta = await page.request.post("/api/reportes/exportar", {
      data: { filtros: { periodo: "semanal" }, graficos: [] },
      maxRedirects: 0,
    });
    expect([302, 303, 307, 308, 401, 403]).toContain(respuesta.status());
  });
});
