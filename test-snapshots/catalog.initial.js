const { test, expect } = require('@playwright/test');

const APPLE = 'Apple Juice (1000ml)';
const BANANA = 'Banana Juice (1000ml)';
const cards = (page) => page.getByRole('article');
const apple = (page) => cards(page).filter({ hasText: APPLE });
const dialog = (page) => page.getByRole('dialog').filter({
  has: page.getByRole('heading', { name: APPLE, exact: true }),
});

async function search(page, text) {
  await test.step(`Поиск: ${text || '(пустая строка)'}`, async () => {
    const field = page.getByRole('textbox');
    if (!(await field.isVisible())) {
      await page.getByRole('button', { name: 'Open search', exact: true }).click();
    }
    await field.fill(text);
    await field.press('Enter');
  });
}

async function openApple(page) {
  await test.step('Открыть карточку Apple Juice', async () => {
    await apple(page).getByRole('button', {
      name: 'Click for more information about the product',
    }).click();
    await expect(dialog(page)).toBeVisible();
  });
}

test.beforeEach(async ({ page }) => {
  await test.step('Подготовка: открыть каталог и закрыть стартовые сообщения', async () => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Close Welcome Banner' }).click();
    await page.getByRole('button', { name: 'dismiss cookie message' }).click();
    await expect(page.getByText(APPLE, { exact: true })).toBeVisible();
  });
});

test.describe('Каталог', () => {
  test('C01 Первая страница содержит 15 товаров', async ({ page }) => {
    // Отдельный учебный прогон сохраняет диагностику неверного ожидания.
    const expected = process.env.DEMO_FAILURE === '1' ? 16 : 15;
    await test.step(`Проверить количество карточек: ${expected}`, async () => {
      await expect(cards(page)).toHaveCount(expected);
    });
  });

  test('C02 Карточка показывает цену Apple Juice', async ({ page }) => {
    await expect(apple(page).locator('.price')).toHaveText('1.99¤');
  });

  test('C03 Изображение товара загружено', async ({ page }) => {
    const image = apple(page).getByRole('img', { name: APPLE, exact: true });
    await expect(image).toBeVisible();
    await expect.poll(() => image.evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
  });
});

test.describe('Карточка товара', () => {
  test('D01 Открытие показывает название выбранного товара', async ({ page }) => {
    await openApple(page);
    await expect(dialog(page).getByRole('heading', { level: 1 })).toHaveText(APPLE);
  });

  test('D02 В диалоге показано описание товара', async ({ page }) => {
    await openApple(page);
    await expect(dialog(page).getByText('The all-time classic.', { exact: true })).toBeVisible();
  });

  test('D03 Цена в диалоге совпадает с карточкой', async ({ page }) => {
    const price = (await apple(page).locator('.price').innerText()).trim();
    await openApple(page);
    await expect(dialog(page).getByRole('paragraph')).toHaveText(price);
  });

  test('D04 Кнопка Close закрывает диалог', async ({ page }) => {
    await openApple(page);
    await dialog(page).getByRole('button', { name: 'Close Dialog' }).click();
    await expect(dialog(page)).toHaveCount(0);
  });
});

test.describe('Поиск', () => {
  test('S01 Поиск по полному названию находит товар', async ({ page }) => {
    await search(page, BANANA);
    await expect(cards(page)).toHaveCount(1);
    await expect(cards(page).getByText(BANANA, { exact: true })).toBeVisible();
  });

  test('S02 Поиск по части названия находит товар', async ({ page }) => {
    await search(page, 'Banan');
    await expect(cards(page)).toHaveCount(1);
    await expect(cards(page).getByText(BANANA, { exact: true })).toBeVisible();
  });

  test('S03 Поиск не зависит от регистра', async ({ page }) => {
    await search(page, 'bAnAnA jUiCe');
    await expect(cards(page)).toHaveCount(1);
    await expect(cards(page).getByText(BANANA, { exact: true })).toBeVisible();
  });

  test('S04 Несуществующее название даёт пустую выдачу', async ({ page }) => {
    await search(page, 'zzpr7nomatchzz');
    await expect(cards(page)).toHaveCount(0);
    await expect(page.getByText('No results found', { exact: true })).toBeVisible();
  });

  test('S05 Очистка поиска возвращает каталог', async ({ page }) => {
    await search(page, BANANA);
    await expect(cards(page)).toHaveCount(1);
    await search(page, '');
    await expect(cards(page)).toHaveCount(15);
    await expect(page.getByText(APPLE, { exact: true })).toBeVisible();
  });
});

test.describe('Пагинация', () => {
  test('P01 На первой странице Previous недоступна', async ({ page }) => {
    await expect(page.getByRole('button', { name: 'Previous page' })).toBeDisabled();
  });

  test('P02 Next открывает вторую страницу', async ({ page }) => {
    await page.getByRole('button', { name: 'Next page' }).click();
    await expect(page.getByRole('status')).toHaveText(/16\s*[–-]\s*30 of 46/);
    await expect(cards(page).getByText(APPLE, { exact: true })).toHaveCount(0);
  });

  test('P03 Previous возвращает первую страницу', async ({ page }) => {
    await page.getByRole('button', { name: 'Next page' }).click();
    await expect(page.getByRole('status')).toHaveText(/16\s*[–-]\s*30 of 46/);
    await page.getByRole('button', { name: 'Previous page' }).click();
    await expect(page.getByRole('status')).toHaveText(/1\s*[–-]\s*15 of 46/);
    await expect(page.getByText(APPLE, { exact: true })).toBeVisible();
  });

  test('P04 Выбор размера 30 показывает 30 товаров', async ({ page }) => {
    await page.getByRole('combobox', { name: 'Items per page:' }).click();
    await page.getByRole('option', { name: '30', exact: true }).click();
    await expect(cards(page)).toHaveCount(30);
  });
});
