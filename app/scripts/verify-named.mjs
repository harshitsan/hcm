import { chromium } from 'playwright'
const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1500, height: 950 }, deviceScaleFactor: 1.5 })).newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
await page.goto('http://localhost:5174')
await page.waitForTimeout(900)
await page.locator('aside button').last().click(); await page.waitForTimeout(250)
await page.getByRole('button', { name: /David Chen/ }).first().click(); await page.waitForTimeout(600)
await page.goto('http://localhost:5174/#/rules'); await page.waitForTimeout(500)
// seed: POSH history names the original 3
await page.getByRole('button', { name: /History/ }).first().click(); await page.waitForTimeout(450)
let t = await page.locator('body').innerText()
console.log('SEED named:', t.includes('Acme Tech, Beta Foods & Epsilon Studios'))
await page.screenshot({ path: '/tmp/op-shots/n1-history-named.png' })
await page.keyboard.press('Escape'); await page.waitForTimeout(300)
// live: approve & run the portfolio draft → event must name his 3 companies
await page.getByRole('button', { name: /Send for approval/ }).first().click(); await page.waitForTimeout(400)
await page.getByRole('button', { name: /Approve & run/ }).first().click(); await page.waitForTimeout(400)
// open festive bonus history (it's the portfolio rule)
const hist = page.getByRole('button', { name: /History/ })
const n = await hist.count()
for (let i = 0; i < n; i++) {
  await hist.nth(i).click(); await page.waitForTimeout(350)
  t = await page.locator('.animate-slide-in').last().innerText()  // the drawer panel only
  if (t.includes('Festive bonus letters')) break
  await page.keyboard.press('Escape'); await page.waitForTimeout(250)
}
console.log('LIVE named (3 portfolio companies):', t.includes('Acme Tech, Beta Foods, Gamma Retail'))
await page.screenshot({ path: '/tmp/op-shots/n2-live-named.png' })
console.log('PAGE ERRORS:', errors.length ? errors : 'none')
await browser.close()
