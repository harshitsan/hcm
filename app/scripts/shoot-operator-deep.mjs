import { chromium } from 'playwright'

const BASE = 'http://localhost:5174'
const OUT = '/tmp/op-shots'
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1500, height: 950 }, deviceScaleFactor: 1.5 })
const page = await ctx.newPage()
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))

const shot = async (name, full = false) => {
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full })
  console.log('shot:', name)
}

await page.goto(BASE)
await page.waitForTimeout(1000)

// become Maya (operator)
await page.locator('aside button').last().click()
await page.waitForTimeout(250)
await page.getByRole('button', { name: /Maya Kapoor/ }).first().click()
await page.waitForTimeout(600)

await shot('op-01-home', true)

// switcher open
await page.getByRole('button', { name: /All 5 companies/ }).click()
await shot('op-02-switcher')
// work in a single company (Delta Health — operator-only)
await page.getByRole('button', { name: /Delta Health/ }).first().click()
await page.waitForTimeout(500)
await shot('op-03-home-in-delta')
await page.goto(BASE + '/#/reports')
await shot('op-04-reports-delta', true)
// back to global
await page.getByRole('button', { name: /Delta Health/ }).first().click()
await page.waitForTimeout(300)
await page.getByRole('button', { name: /All companies/ }).first().click()
await page.waitForTimeout(400)
await shot('op-05-reports-global', true)

// companies
await page.goto(BASE + '/#/companies')
await shot('op-06-companies', true)

// add company — gallery
await page.goto(BASE + '/#/companies/new')
await shot('op-07-gallery', true)

// wizard, step by step
await page.getByText('Indian IT services').first().click()
await page.waitForTimeout(400)
await page.getByPlaceholder(/Northwind/).fill('Juniper Works')
const cityInput = page.locator('input').nth(1)
await cityInput.fill('Jaipur').catch(() => {})
await shot('op-08-step1-profile', true)

const next = () => page.getByRole('button', { name: /^Next/ }).click()
await next(); await shot('op-09-step2-locations', true)
await next(); await shot('op-10-step3-teams', true)
await next(); await shot('op-11-step4-timeoff', true)
await next(); await shot('op-12-step5-flows', true)
await next(); await shot('op-13-step6-people', true)
const testBtn = page.getByRole('button', { name: /Run a test/ })
if (await testBtn.count()) { await testBtn.click(); await shot('op-14-step6-tested') }
await next(); await shot('op-15-step7-preflight', true)

// success
await page.getByRole('button', { name: /Bring .* online/ }).click()
await page.waitForTimeout(500)
await shot('op-16-success', true)

// companies after
await page.goto(BASE + '/#/companies')
await shot('op-17-companies-after', true)

// cmdk as operator
await page.keyboard.press('Meta+k')
await page.waitForTimeout(350)
await shot('op-18-cmdk')
await page.keyboard.press('Escape')

console.log('CONSOLE ERRORS:', errors.length ? errors.slice(0, 10) : 'none')
await browser.close()
