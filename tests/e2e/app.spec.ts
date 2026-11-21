import { test, expect } from "@playwright/test";
test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Хороший день, Алижан")).toBeVisible();
});
test("find a place, order at a table, spend points, persist and cancel", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.getByRole("button", { name: "Открыть AULA", exact: true }).click();
  await page
    .getByRole("button", { name: "Добавить Авокадо тост", exact: true })
    .click();
  await page.getByRole("button", { name: /К заказу/ }).click();
  await page.getByRole("button", { name: "В заведении", exact: true }).click();
  await page.getByTestId("checkout").click();
  await expect(page.getByText("Укажите номер стола от 1 до 999")).toBeVisible();
  await page.getByRole("textbox", { name: "Номер стола" }).fill("12");
  await page.getByRole("switch", { name: "Использовать бонусы" }).click();
  await page.getByTestId("checkout").click();
  await expect(page.getByText("Готовим хорошее настроение")).toBeVisible();
  await expect(page.getByText("Начислено 224 бонусов")).toBeVisible();
  await page.getByRole("button", { name: "Закрыть", exact: true }).click();
  await page.reload();
  await page.getByRole("tab", { name: "Заказы", exact: true }).click();
  await page.getByRole("button", { name: /^Заказ BZ-/ }).click();
  await expect(page.getByText("В заведении · стол 12")).toBeVisible();
  await page.getByRole("button", { name: "Отменить демозаказ" }).click();
  await expect(page.getByText("Бонусные операции отменены")).toBeVisible();
  await page.getByRole("button", { name: "Закрыть", exact: true }).click();
  await page.getByRole("tab", { name: "Мои бонусы", exact: true }).click();
  await expect(
    page
      .getByText("1 250", { exact: false })
      .or(page.getByText("1250", { exact: false }))
      .first(),
  ).toBeVisible();
  expect(errors).toEqual([]);
});
test("search, empty state, categories and favorite persistence", async ({
  page,
}) => {
  await page
    .getByRole("textbox", { name: "Найти ресторан или кухню" })
    .fill("несуществующее");
  await expect(page.getByText("Пока ничего не нашлось")).toBeVisible();
  await page.getByRole("button", { name: "Очистить поиск" }).click();
  await page.getByRole("button", { name: "Кофе", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Открыть bloom coffee", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Открыть AULA", exact: true }),
  ).toHaveCount(0);
  await page
    .getByRole("button", { name: "В избранное bloom coffee", exact: true })
    .click();
  await page.reload();
  await page.getByRole("tab", { name: "Избранное", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Открыть bloom coffee", exact: true }),
  ).toBeVisible();
});
test("QR, profile and changing brands without losing cart accidentally", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Мой QR", exact: true }).click();
  await expect(page.getByText("BZ · 000 142")).toBeVisible();
  await page.getByRole("button", { name: "Закрыть", exact: true }).click();
  await page.getByRole("tab", { name: "Профиль", exact: true }).click();
  await page.getByRole("button", { name: "Изменить имя" }).click();
  await page.getByRole("textbox", { name: "Имя", exact: true }).fill("Друг");
  await page.getByRole("button", { name: "Сохранить", exact: true }).click();
  await page.getByRole("tab", { name: "Открывать", exact: true }).click();
  await expect(page.getByText("Хороший день, Друг")).toBeVisible();
  await page.getByRole("button", { name: "Открыть AULA", exact: true }).click();
  await page
    .getByRole("button", { name: "Добавить Авокадо тост", exact: true })
    .click();
  await page.getByRole("button", { name: "Закрыть", exact: true }).click();
  await page
    .getByRole("button", { name: "Открыть bloom coffee", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Добавить Флэт уайт", exact: true })
    .click();
  await expect(
    page.getByText("Другое заведение", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Заменить корзину", exact: true })
    .click();
  await page.getByRole("button", { name: /К заказу/ }).click();
  await expect(page.getByText("Флэт уайт", { exact: true })).toBeVisible();
  await expect(page.getByText("Авокадо тост", { exact: true })).toHaveCount(0);
});
