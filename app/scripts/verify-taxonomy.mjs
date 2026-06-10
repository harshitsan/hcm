import { chromium } from 'playwright'
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
await page.goto('http://localhost:5174'); await page.waitForTimeout(900)

// matrix: full names, transposed
await become('Maya Kapoor')
await page.goto('http://localhost:5174/#/rules'); await page.waitForTimeout(500)
let t = await page.locator('body').innerText()
console.log('MATRIX full names:', t.includes('Gamma Retail') && t.includes('Epsilon Studios'))
await page.screenshot({ path: '/tmp/op-shots/t1-matrix-names.png', fullPage: true })

// trigger rule card
console.log('TRIGGER card:', t.includes('Late check-in') && /Fired 3/.test(t))
console.log('NUMBER card (HRA):', t.includes('House rent allowance') && t.includes('50% of basic pay'))
console.log('ABSCOND card:', t.includes('When someone absconds'))

// HRA detail drawer
await page.locator('main div.cursor-pointer', { hasText: 'House rent allowance' }).first().click({ position: { x: 24, y: 22 } })
await page.waitForTimeout(500)
t = await drawer()
console.log('HRA variants + feeds:', t.includes('Metro cities') && t.includes('Payroll (Phase II)'))
await page.screenshot({ path: '/tmp/op-shots/t2-hra-drawer.png' })
await page.keyboard.press('Escape'); await page.waitForTimeout(300)

// absconding playbook drawer
await page.locator('main div.cursor-pointer', { hasText: 'When someone absconds' }).first().click({ position: { x: 24, y: 22 } })
await page.waitForTimeout(500)
t = await drawer()
console.log('ABSCOND playbook steps:', t.includes('Day 3') && t.includes('Day 10'))
await page.screenshot({ path: '/tmp/op-shots/t3-abscond-drawer.png' })
await page.keyboard.press('Escape'); await page.waitForTimeout(300)

// rule-created tickets in Arjun's inbox
await become('Arjun Mehta')
await page.goto('http://localhost:5174/#/inbox'); await page.waitForTimeout(500)
t = await page.locator('body').innerText()
console.log('TICKET source pills:', t.includes('Auto-created by the rule') && t.includes('Late check-in → half day'))
console.log('ABSCOND ticket:', t.includes('Day 3, no contact'))
await page.screenshot({ path: '/tmp/op-shots/t4-inbox-tickets.png', fullPage: true })

console.log('CONSOLE ERRORS:', errors.length ? errors.slice(0, 8) : 'none')
await browser.close()
