import { chromium } from 'playwright'
const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1500, height: 950 } })).newPage()
await page.goto('http://localhost:5174'); await page.waitForTimeout(900)
await page.locator('aside button').last().click(); await page.waitForTimeout(250)
await page.getByRole('button', { name: /Sara Iyer/ }).first().click(); await page.waitForTimeout(600)
await page.goto('http://localhost:5174/#/rules'); await page.waitForTimeout(500)
await page.getByRole('button', { name: /New rule/ }).click(); await page.waitForTimeout(500)
const selects = page.locator('.animate-slide-in select')
const n = await selects.count()
console.log('SELECT COUNT:', n)
for (let i = 0; i < n; i++) {
  const opts = await selects.nth(i).locator('option').allInnerTexts()
  console.log(`select[${i}]:`, opts.slice(0, 6).join(' | '))
}
// set the one containing Documents option
for (let i = 0; i < n; i++) {
  const opts = await selects.nth(i).locator('option').allInnerTexts()
  if (opts.includes('Documents')) { await selects.nth(i).selectOption('Documents'); console.log('SET select', i); break }
}
await page.waitForTimeout(400)
const t = await page.locator('.animate-slide-in').last().innerText()
const idx = t.indexOf('Global data protection')
console.log('PANEL TEXT:', idx >= 0 ? t.slice(Math.max(0, idx - 120), idx + 200).replace(/\n/g, ' | ') : 'NOT FOUND')
await browser.close()
