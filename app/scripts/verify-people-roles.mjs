import { chromium } from 'playwright'

const BASE = 'http://localhost:5174'
const OUT = '/tmp/op-shots'
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

/* ── 1. wizard: roles block on Teams & roles step ── */
await become('Maya Kapoor')
await page.goto(BASE + '/#/companies/new'); await page.waitForTimeout(500)
await page.getByText('Indian IT services').first().click(); await page.waitForTimeout(400)
await page.getByRole('button', { name: /^Next/ }).click(); await page.waitForTimeout(250)
await page.getByRole('button', { name: /^Next/ }).click(); await page.waitForTimeout(300)
let t = await text()
console.log('WIZARD roles chips:', t.includes('HR admin') && t.includes('People manager'))
console.log('WIZARD catalog caption:', t.toLowerCase().includes('cloned from the platform catalog'))
await page.screenshot({ path: `${OUT}/r1-wizard-roles.png`, fullPage: true })
// Employee role must refuse removal
const empChip = page.getByRole('button', { name: /Remove Employee/i })
if (await empChip.count()) {
  await empChip.click(); await page.waitForTimeout(300)
  console.log('EMPLOYEE role protected:', (await text()).includes('floor, not optional'))
} else {
  // fall back: find ✕ inside the Employee chip text
  console.log('EMPLOYEE role protected: (no labeled remove button — check screenshot)')
}
// preflight roles row
for (let i = 0; i < 4; i++) { await page.getByRole('button', { name: /^Next/ }).click(); await page.waitForTimeout(200) }
t = await text()
console.log('PREFLIGHT roles row:', t.includes('roles ready'))

/* ── 2. people: table view + filters ── */
await become('David Chen')
await page.goto(BASE + '/#/people'); await page.waitForTimeout(500)
await page.getByRole('button', { name: 'Table', exact: true }).click(); await page.waitForTimeout(400)
t = await text()
console.log('TABLE renders rows:', t.includes('Farhan Ali') && t.includes('Ananya Rao'))
console.log('TABLE company column:', t.includes('Beta Foods'))
await page.screenshot({ path: `${OUT}/r2-people-table.png`, fullPage: true })
// location filter
const selects = page.locator('main select')
await selects.first().selectOption({ label: 'Mumbai' }).catch(() => selects.nth(0).selectOption('Mumbai'))
await page.waitForTimeout(400)
t = await text()
console.log('LOCATION filter (Mumbai only):', t.includes('Farhan Ali') && !t.includes('Ananya Rao'))
await selects.first().selectOption({ index: 0 }).catch(() => {})
await page.waitForTimeout(300)

/* ── 3. org chart: named + switchable company ── */
await page.getByRole('button', { name: 'Org chart', exact: true }).click(); await page.waitForTimeout(400)
t = await text()
console.log('ORG named header:', t.includes('— org chart') || /org chart/i.test(t))
console.log('ORG default Acme:', t.includes('Ananya Rao'))
await page.screenshot({ path: `${OUT}/r3-org-acme.png`, fullPage: true })
// switch to Beta
await page.locator('main').getByRole('button', { name: /Beta Foods/ }).last().click()
await page.waitForTimeout(400)
t = await text()
console.log('ORG Beta tree (Farhan root):', t.includes('Farhan Ali') && t.includes('Lakshmi Iyer'))
await page.screenshot({ path: `${OUT}/r4-org-beta.png`, fullPage: true })

console.log('CONSOLE ERRORS:', errors.length ? errors.slice(0, 8) : 'none')
await browser.close()
