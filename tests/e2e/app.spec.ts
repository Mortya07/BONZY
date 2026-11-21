import { test, expect } from "@playwright/test";
test("staff awards an in-person purchase to a second guest device", async ({
  page,
  browser,
  baseURL,
}, testInfo) => {
  const guest = await browser.newPage({ baseURL });
  try {
    await guest.goto("/");
    await guest.getByRole("button", { name: "Мой QR", exact: true }).click();
    const card = await guest.getByText(/^[0-9A-F]{12}$/).innerText();
    await page.getByRole("tab", { name: "Профиль", exact: true }).click();
    await page.getByRole("button", { name: "Я сотрудник" }).click();
    await page.getByLabel("Код заведения").fill("AULA");
    await page.getByRole("button", { name: "Найти заведение" }).click();
    const mobile = testInfo.project.name === "mobile";
    await page
      .getByRole("button", { name: mobile ? "Аяна" : "Тимур", exact: true })
      .click();
    await page.getByLabel("Личный PIN").fill(mobile ? "2468" : "1357");
    await page.getByRole("button", { name: "Войти в смену" }).click();
    await page.getByRole("button", { name: "Сканировать QR гостя" }).click();
    await page.getByRole("button", { name: "Ввести номер карты" }).click();
    await page.getByLabel("Номер карты гостя").fill(card);
    await page.getByRole("button", { name: "Найти карту" }).click();
    const receipt = "TEST-" + card;
    await page.getByLabel("Номер чека").fill(receipt);
    await page.getByLabel("Оплачено, ₸").fill("8500");
    await page.getByRole("button", { name: "Подтвердить начисление" }).click();
    await expect(
      page.getByText("Чек " + receipt + " · начислено 850 бонусов"),
    ).toBeVisible();
    await expect(
      guest.getByText("Последнее начисление AULA: +850 б. · чек " + receipt),
    ).toBeVisible({ timeout: 12000 });
    await page.getByRole("button", { name: "История смены" }).click();
    await expect(page.getByText("Карта выбрана вручную").first()).toBeVisible();
  } finally {
    await guest.close();
  }
});
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
  await expect(page.getByText(/^[0-9A-F]{12}$/)).toBeVisible();
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
