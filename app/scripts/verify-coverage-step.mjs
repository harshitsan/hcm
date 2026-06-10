import { chromium } from 'playwright'

const BASE = 'http://localhost:5174'
const OUT = '/tmp/op-shots'
const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1500, height: 950 }, deviceScaleFactor: 1.5 })).newPage()
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))
const drawer = () => page.locator('.animate-slide-in').last().innerText()
async function become(name) {
  await page.locator('aside button').last().click(); await page.waitForTimeout(250)
  await page.getByRole('button', { name: new RegExp(name) }).first().click(); await page.waitForTimeout(600)
}
await page.goto(BASE); await page.waitForTimeout(900)

/* ── David (portfolio): the full coverage step ── */
await become('David Chen')
await page.goto(BASE + '/#/rules'); await page.waitForTimeout(600)
await page.getByRole('button', { name: /New policy/ }).click(); await page.waitForTimeout(500)
await page.locator('.animate-slide-in').getByText('Remote & Hybrid Work', { exact: true }).first().click()
await page.waitForTimeout(450)
// portfolio level → child-control + company chips appear
await page.locator('.animate-slide-in').getByRole('button', { name: 'Your portfolio' }).click()
await page.waitForTimeout(350)
let t = await drawer()
console.log('STEP2 child-control:', t.includes('Use as-is') && t.includes('Can adjust'))
console.log('COMPANIES chips:', t.includes('Acme Tech') && t.includes('Gamma Retail'))
console.log('COMPANIES caption:', /lands in 3 of 3/i.test(t))
const totalBefore = (t.match(/→\s*([\d,]+)\s/) || [])[1]
// leave Gamma out → total drops, row marked
await page.locator('.animate-slide-in').getByRole('button', { name: /Gamma Retail/ }).first().click()
await page.waitForTimeout(350)
t = await drawer()
console.log('EXCLUDE updates caption:', /lands in 2 of 3/i.test(t))
console.log('EXCLUDE left-out row:', /left out/i.test(t))
const totalAfter = (t.match(/→\s*([\d,]+)\s/) || [])[1]
console.log('TOTAL drops:', Number(String(totalAfter).replace(/,/g, '')) < Number(String(totalBefore).replace(/,/g, '')), `(${totalBefore} → ${totalAfter})`)
// and… jurisdiction clause
await page.locator('.animate-slide-in').getByRole('button', { name: /and… jurisdiction/i }).click()
await page.waitForTimeout(350)
t = await drawer()
console.log('JURISDICTION clause:', t.includes('under Indian law'))
// exception chip
const exInput = page.locator('.animate-slide-in input[placeholder*="intern" i], .animate-slide-in input').last()
await page.locator('.animate-slide-in input').nth(0).fill('Not for interns').catch(() => {})
// find the Except input more robustly: type into the input nearest the "Add" button
const addBtn = page.locator('.animate-slide-in').getByRole('button', { name: /^Add$/ })
if (await addBtn.count()) {
  const exField = page.locator('.animate-slide-in input').last()
  await exField.fill('Not for interns')
  await addBtn.first().click()
  await page.waitForTimeout(300)
  t = await drawer()
  console.log('EXCEPT chip:', t.includes('Not for interns'))
} else {
  console.log('EXCEPT chip: (no Add button found)')
}
console.log('ITEMIZED rows:', t.includes('Acme Tech') && /people/.test(t))
await page.screenshot({ path: `${OUT}/cv1-coverage-step.png` })
void exInput
await page.keyboard.press('Escape'); await page.waitForTimeout(300)

/* ── read side: pol3 shows the jurisdiction clause; pol2 its exception ── */
await page.locator('main div.cursor-pointer', { hasText: 'Payroll & Statutory Calendar — India' }).first().click({ position: { x: 24, y: 22 } })
await page.waitForTimeout(500)
t = await drawer()
console.log('DETAIL pol3 jurisdiction:', t.includes('under Indian law'))
console.log('DETAIL per-company rows:', t.includes('Beta Foods'))
await page.screenshot({ path: `${OUT}/cv2-detail-coverage.png` })
await page.keyboard.press('Escape'); await page.waitForTimeout(300)
await page.locator('main div.cursor-pointer', { hasText: 'Onboarding & Day-1 Readiness' }).first().click({ position: { x: 24, y: 22 } })
await page.waitForTimeout(500)
t = await drawer()
console.log('DETAIL pol2 exception:', t.includes('re-hires'))
await page.keyboard.press('Escape')

console.log('CONSOLE ERRORS:', errors.length ? errors.slice(0, 8) : 'none')
await browser.close()
