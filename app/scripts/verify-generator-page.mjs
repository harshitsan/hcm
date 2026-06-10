import { chromium } from 'playwright'

const BASE = 'http://localhost:5174'
const OUT = '/tmp/review-shots'
const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1500, height: 950 }, deviceScaleFactor: 1.5 })).newPage()
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))
const text = () => page.locator('body').innerText()
async function become(name) {
  await page.locator('aside button').last().click(); await page.waitForTimeout(250)
  await page.getByRole('button', { name: new RegExp(name) }).first().click(); await page.waitForTimeout(600)
}
await page.goto(BASE); await page.waitForTimeout(900)

/* ── button navigates to the dedicated page (no drawer) ── */
await become('David Chen')
await page.goto(BASE + '/#/rules'); await page.waitForTimeout(600)
await page.getByRole('button', { name: /New policy/ }).click(); await page.waitForTimeout(600)
console.log('NAVIGATES to page:', page.url().includes('/policies/new'))
let t = await text()
console.log('NO drawer overlay:', (await page.locator('.animate-slide-in').count()) === 0)
console.log('RAIL three steps:', t.includes('Start from') && t.includes('Who it covers') && t.includes('Make each clause work'))
console.log('GALLERY full width:', t.includes('Respect at Work (POSH)') && t.includes('outline only'))
await page.screenshot({ path: `${OUT}/g1-page-gallery.png`, fullPage: true })

/* ── walk the wizard end to end on the page ── */
await page.locator('main').getByText('Remote & Hybrid Work', { exact: true }).first().click()
await page.waitForTimeout(450)
await page.getByRole('button', { name: 'Your portfolio' }).click(); await page.waitForTimeout(350)
t = await text()
console.log('STEP2 on page (coverage blocks):', t.includes('Covers') && /which companies/i.test(t))
console.log('RAIL summary card:', t.includes('4 clauses') || /clauses/.test(t))
await page.screenshot({ path: `${OUT}/g2-page-coverage.png`, fullPage: true })
await page.getByRole('button', { name: /Continue/ }).click(); await page.waitForTimeout(450)
t = await text()
console.log('STEP3 clause engine:', /how do we know/i.test(t) && t.includes('DocuSign'))
await page.screenshot({ path: `${OUT}/g3-page-clauses.png`, fullPage: true })
await page.getByRole('button', { name: /Save draft/ }).click(); await page.waitForTimeout(700)
console.log('RETURNS to policies:', page.url().includes('/rules'))
t = await text()
console.log('DRAFT in list:', (t.match(/Remote & Hybrid Work/g) || []).length >= 2)

/* ── back button from step 1 returns cleanly ── */
await page.getByRole('button', { name: /New policy/ }).click(); await page.waitForTimeout(500)
await page.getByRole('button', { name: /Back to policies|^Back$/ }).first().click(); await page.waitForTimeout(500)
console.log('BACK returns:', page.url().includes('/rules'))

console.log('CONSOLE ERRORS:', errors.length ? errors.slice(0, 8) : 'none')
await browser.close()
