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

/* ── David: Waiting policy gets Edit; Published does not ── */
await become('David Chen')
await page.goto(BASE + '/#/rules'); await page.waitForTimeout(600)
let t = await text()
const editCount = await page.getByRole('button', { name: /^Edit$/ }).count()
console.log('EDIT on non-published only (1 expected, pol3):', editCount === 1)
await page.getByRole('button', { name: /^Edit$/ }).first().click(); await page.waitForTimeout(600)
console.log('NAVIGATES to edit page:', page.url().includes('/policies/edit/'))
t = await text()
console.log('EDIT title + seeded:', t.includes('Edit policy') && t.includes('under Indian law'))
console.log('STARTS on step 2 (coverage):', /which companies/i.test(t) || t.includes('Covers'))
await page.screenshot({ path: `${OUT}/e1-edit-coverage.png`, fullPage: true })

/* ── step 1 in edit mode: the policy card, no gallery ── */
await page.getByRole('button', { name: /The policy/ }).first().click(); await page.waitForTimeout(400)
t = await text()
console.log('STEP1 no gallery:', !t.includes('outline only') && t.includes('clauses are yours now'))
const nameInput = page.locator('main input').first()
await nameInput.fill('Payroll & Statutory Calendar — India v1.1')
await page.screenshot({ path: `${OUT}/e2-edit-step1.png`, fullPage: true })

/* ── walk to step 3, save changes ── */
await page.getByRole('button', { name: /Continue/ }).click(); await page.waitForTimeout(400)
await page.getByRole('button', { name: /Continue/ }).click(); await page.waitForTimeout(400)
t = await text()
console.log('STEP3 save actions:', t.includes('Save changes') && t.includes('Send for approval') === false)
await page.screenshot({ path: `${OUT}/e3-edit-step3.png`, fullPage: true })
await page.getByRole('button', { name: /Save changes/ }).click(); await page.waitForTimeout(700)
console.log('RETURNS to list:', page.url().includes('/rules'))
t = await text()
console.log('RENAMED in list:', t.includes('v1.1'))

/* ── history records the change ── */
await page.locator('main div.cursor-pointer', { hasText: 'v1.1' }).first().click({ position: { x: 24, y: 22 } })
await page.waitForTimeout(500)
t = await page.locator('.animate-slide-in').last().innerText()
console.log('HISTORY change event:', t.includes('Changed: name, who it covers, or clauses'))
await page.keyboard.press('Escape')

/* ── create mode unchanged ── */
await page.goto(BASE + '/#/policies/new'); await page.waitForTimeout(600)
t = await text()
console.log('CREATE still gallery:', t.includes('outline only') && t.includes('New policy'))

console.log('CONSOLE ERRORS:', errors.length ? errors.slice(0, 8) : 'none')
await browser.close()
