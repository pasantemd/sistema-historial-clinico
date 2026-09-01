import { expect, type Page } from "@playwright/test";

export const credencialesE2E = {
  correo: process.env.PLAYWRIGHT_EMAIL,
  contrasena: process.env.PLAYWRIGHT_PASSWORD,
};

export const hayCredencialesE2E = Boolean(
  credencialesE2E.correo && credencialesE2E.contrasena,
);

export async function iniciarSesionE2E(page: Page) {
  if (!hayCredencialesE2E) throw new Error("No se configuraron credenciales E2E.");
  await page.goto("/iniciar-sesion");
  await page.locator("#correo").fill(credencialesE2E.correo!);
  await page.locator("#contrasena").fill(credencialesE2E.contrasena!);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(/\/inicio/, { timeout: 15000 });
}
