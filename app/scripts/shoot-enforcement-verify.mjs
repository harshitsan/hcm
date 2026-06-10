import { chromium } from 'playwright'

const BASE = 'http://localhost:5174'
const OUT = '/tmp/op-shots'
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1500, height: 950 }, deviceScaleFactor: 1.5 })
const page = await ctx.newPage()
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))

const text = () => page.locator('body').innerText()
async function become(name) {
  await page.locator('aside button').last().click()
  await page.waitForTimeout(250)
  await page.getByRole('button', { name: new RegExp(name) }).first().click()
  await page.waitForTimeout(600)
}

await page.goto(BASE)
await page.waitForTimeout(900)

/* ── Maya: platform rules + live reach + history audit ── */
await become('Maya Kapoor')
await page.goto(BASE + '/#/rules')
await page.waitForTimeout(500)
await page.screenshot({ path: `${OUT}/e1-rules-operator.png`, fullPage: true })
let t = await text()
console.log('OPERATOR sees Platform-wide pill:', t.includes('Platform-wide'))
console.log('OPERATOR reach line (5 companies):', /Runs in\s*5\s*companies/i.test(t.replace(/\n/g, ' ')))
console.log('OPERATOR locked badge:', t.toLowerCase().includes('use it as-is'))
// history drawer on the global data protection rule
const histBtns = page.getByRole('button', { name: /History/ })
await histBtns.nth(1).click()
await page.waitForTimeout(450)
await page.screenshot({ path: `${OUT}/e2-history-audit.png` })
t = await text()
console.log('AUDIT inherited-automatically event:', t.includes('inherited automatically'))
console.log('AUDIT change event with re-approval:', t.includes('AI-tools clause'))
await page.keyboard.press('Escape')

/* ── Sara: "From above" read-only section ── */
await become('Sara Iyer')
await page.goto(BASE + '/#/rules')
await page.waitForTimeout(500)
await page.screenshot({ path: `${OUT}/e3-rules-hradmin.png`, fullPage: true })
t = await text()
console.log('SARA From above section:', t.includes('From above'))
console.log('SARA set-above-you lock text:', t.includes('Set above you'))

/* ── David: people identity (company chips, filter, group) ── */
await become('David Chen')
await page.goto(BASE + '/#/people')
await page.waitForTimeout(500)
await page.screenshot({ path: `${OUT}/e4-people-global.png`, fullPage: true })
t = await text()
console.log('PEOPLE beta person visible:', t.includes('Farhan Ali'))
console.log('PEOPLE company on card:', t.includes('Beta Foods'))
console.log('PEOPLE group shown:', t.includes('Meridian Group'))
// filter to Gamma only
await page.getByRole('button', { name: /Gamma Retail/ }).first().click()
await page.waitForTimeout(400)
t = await text()
console.log('FILTER gamma-only (Ritu yes, Priya no):', t.includes('Ritu Sharma') && !t.includes('Priya Nair'))
await page.screenshot({ path: `${OUT}/e5-people-gamma-filter.png` })

/* ── born-compliant: preflight + success mention inherited rules ── */
await become('Maya Kapoor')
await page.goto(BASE + '/#/companies/new')
await page.waitForTimeout(500)
await page.getByText('Indian IT services').first().click()
await page.waitForTimeout(400)
for (let i = 0; i < 6; i++) { await page.getByRole('button', { name: /^Next/ }).click(); await page.waitForTimeout(200) }
t = await text()
console.log('PREFLIGHT inherited row:', t.includes('apply automatically'))
await page.screenshot({ path: `${OUT}/e6-preflight-inherited.png`, fullPage: true })
await page.getByRole('button', { name: /Bring .* online/ }).click()
await page.waitForTimeout(500)
t = await text()
console.log('SUCCESS enforcement line:', t.includes('enforced the moment'))
// the new company should bump the live reach of platform rules (6 companies now)
await page.goto(BASE + '/#/rules')
await page.waitForTimeout(500)
t = (await text()).replace(/\n/g, ' ')
console.log('REACH grew to 6 companies (dynamic!):', /Runs in\s*6\s*companies/i.test(t))
await page.screenshot({ path: `${OUT}/e7-rules-after-newco.png`, fullPage: true })

console.log('CONSOLE ERRORS:', errors.length ? errors.slice(0, 10) : 'none')
await browser.close()
