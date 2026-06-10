import { chromium } from 'playwright'
const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1500, height: 950 }, deviceScaleFactor: 1.5 })).newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
await page.goto('http://localhost:5174'); await page.waitForTimeout(900)
await page.locator('aside button').last().click(); await page.waitForTimeout(250)
await page.getByRole('button', { name: /Sara Iyer/ }).first().click(); await page.waitForTimeout(600)
await page.goto('http://localhost:5174/#/rules'); await page.waitForTimeout(500)
await page.getByRole('button', { name: /New rule/ }).click(); await page.waitForTimeout(450)
// add all six clauses — worst case for wrapping
for (const dim of ['employment type', 'tenure', 'grade', 'shift', 'probation', 'group company']) {
  await page.getByRole('button', { name: new RegExp('and… ' + dim, 'i') }).click()
  await page.waitForTimeout(150)
}
// no horizontal overflow in the drawer
const overflow = await page.evaluate(() => {
  const d = document.querySelector('.animate-slide-in')
  return d ? d.scrollWidth - d.clientWidth : -1
})
console.log('NO horizontal overflow (0 expected):', overflow)
const t = await page.locator('.animate-slide-in').last().innerText()
console.log('GRAMMAR 1 person:', /1 person\b/.test(t) || !/1 people/.test(t))
await page.screenshot({ path: '/tmp/op-shots/w1-wrap-fixed.png' })
console.log('PAGE ERRORS:', errors.length ? errors : 'none')
await browser.close()
