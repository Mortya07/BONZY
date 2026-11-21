import { test, expect } from "@playwright/test";
test("a demo purchase unlocks a brand reward and its coupon persists", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Открыть AULA", exact: true }).click();
  await page
    .getByRole("button", { name: "Добавить Авокадо тост", exact: true })
    .click();
  await page.getByRole("button", { name: /К заказу/ }).click();
  await page.getByTestId("checkout").click();
  await expect(page.getByText("Начислено 320 бонусов")).toBeVisible();
  await page.getByRole("button", { name: "Закрыть", exact: true }).click();
  await page.getByRole("tab", { name: "Мои бонусы", exact: true }).click();
  await page
    .getByRole("button", { name: "Обменять на подарок", exact: true })
    .click();
  await expect(page.getByText("Мои подарки", { exact: true })).toBeVisible();
  await expect(page.getByText(/AULA · DEMO-/)).toBeVisible();
  await page.reload();
  await page.getByRole("tab", { name: "Мои бонусы", exact: true }).click();
  await expect(page.getByText(/AULA · DEMO-/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Обменять на подарок", exact: true }),
  ).toHaveCount(0);
});
