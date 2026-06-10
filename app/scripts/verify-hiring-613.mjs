import { chromium } from 'playwright'

const BASE = 'http://localhost:5174'
const OUT = '/tmp/op-shots'
const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1500, height: 950 }, deviceScaleFactor: 1.5 })).newPage()
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))
const text = () => page.locator('body').innerText()
const drawer = () => page.locator('.animate-slide-in').last().innerText()
async function become(name) {
  await page.locator('aside button').last().click(); await page.waitForTimeout(250)
  await page.getByRole('button', { name: new RegExp(name) }).first().click(); await page.waitForTimeout(600)
}
await page.goto(BASE); await page.waitForTimeout(900)
await become('Sara Iyer')
await page.goto(BASE + '/#/hiring'); await page.waitForTimeout(500)

/* ── openings strip: ownership + requisition approval ── */
let t = await text()
console.log('OPENINGS strip:', t.includes('The openings') && t.includes('Payroll Specialist'))
console.log('OPENINGS dual ownership:', t.includes('recruits') && t.includes('hires'))
await page.screenshot({ path: `${OUT}/x1-openings.png`, fullPage: true })
await page.getByRole('button', { name: /Approve & open/ }).click(); await page.waitForTimeout(400)
t = await text()
console.log('REQUISITION approved:', t.includes('sourcing starts now'))

/* ── new opening composer ── */
await page.getByRole('button', { name: /New opening/ }).click(); await page.waitForTimeout(450)
await page.locator('.animate-slide-in input').first().fill('Security Engineer')
await page.getByRole('button', { name: /Draft the opening/ }).click(); await page.waitForTimeout(450)
t = await text()
console.log('DRAFT opening appears + waits approval:', t.includes('Security Engineer'))

/* ── candidate drawer: panel, scorecard, references, offer ── */
await page.locator('main').getByText('Sana Qureshi', { exact: true }).first().click({ position: { x: 20, y: 10 } })
await page.waitForTimeout(500)
t = await drawer()
console.log('DRAWER source + resume:', t.includes('Referral — Sara Iyer') && t.includes('CV · 2 pages'))
console.log('DRAWER references verified:', t.includes('rehire in a heartbeat') && t.includes('verified'))
console.log('DRAWER offer template:', t.includes('Senior offer letter · v3'))
await page.screenshot({ path: `${OUT}/x2-candidate-sana.png` })
await page.keyboard.press('Escape'); await page.waitForTimeout(300)

await page.locator('main').getByText('Rhea Kapoor', { exact: true }).first().click({ position: { x: 20, y: 10 } })
await page.waitForTimeout(500)
t = await drawer()
console.log('DRAWER panel of 3:', t.includes('Arjun Mehta') && t.includes('Meera Pillai'))
console.log('DRAWER schedule:', t.includes('Thu 11:00'))
console.log('DRAWER scorecard rows:', t.includes('Problem solving') && t.includes('Communication'))
await page.screenshot({ path: `${OUT}/x3-candidate-rhea.png` })
await page.keyboard.press('Escape')

/* ── activity trail ── */
await page.goto(BASE + '/#/activity'); await page.waitForTimeout(500)
t = await text()
console.log('ACTIVITY opening events:', t.includes('Opened the Payroll Specialist role') && t.includes('Drafted an opening: Security Engineer'))

console.log('CONSOLE ERRORS:', errors.length ? errors.slice(0, 8) : 'none')
await browser.close()
