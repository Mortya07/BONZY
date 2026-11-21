import { chromium } from "@playwright/test";
import fs from "node:fs/promises";
await fs.mkdir("previews", { recursive: true });
const browser = await chromium.launch();
for (const [name, viewport] of [
  ["desktop", { width: 1440, height: 1050 }],
  ["mobile", { width: 390, height: 844 }],
]) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });
  await page.goto(process.env.BONZY_PREVIEW_URL || "http://localhost:4173");
  await page.getByText("Хороший день, Алижан").waitFor();
  await page.waitForFunction(() =>
    [...document.images].every(
      (image) => image.complete && image.naturalWidth > 0,
    ),
  );
  await page.screenshot({ path: `previews/${name}.png` });
  if (name === "mobile") {
    await page
      .getByRole("button", { name: "Открыть AULA", exact: true })
      .click();
    await page.waitForTimeout(400);
    await page.waitForFunction(() =>
      [...document.images].every(
        (image) => image.complete && image.naturalWidth > 0,
      ),
    );
    await page.screenshot({ path: "previews/menu.png" });
    await page.getByRole("button", { name: "Закрыть", exact: true }).click();
    await page.waitForTimeout(400);
    await page.getByRole("tab", { name: "Мои бонусы", exact: true }).click();
    await page.screenshot({ path: "previews/bonuses.png" });
  }
  console.log(
    `${name}: horizontal overflow`,
    await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    ),
  );
  await page.close();
}
await browser.close();
