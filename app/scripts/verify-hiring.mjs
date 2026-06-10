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

/* ── Sara: hiring board ── */
await become('Sara Iyer')
let t = await text()
console.log('NAV has Hiring tile:', t.includes('Hiring'))
await page.goto(BASE + '/#/hiring'); await page.waitForTimeout(500)
t = await text()
console.log('BOARD stages:', t.includes('Applied') && t.includes('Interviewing') && t.includes('Offer') && t.includes('Joining'))
console.log('BOARD candidates:', t.includes('Rhea Kapoor') && t.includes('Sana Qureshi'))
console.log('BOARD overflow note:', t.includes('92 more'))
await page.screenshot({ path: `${OUT}/h5-hiring-board.png`, fullPage: true })

/* ── conversion: mark Sana joined → she appears in People ── */
await page.getByRole('button', { name: /Mark joined/ }).first().click()
await page.waitForTimeout(500)
t = await text()
console.log('CONVERT toast:', t.includes('employee record created'))
await page.goto(BASE + '/#/people'); await page.waitForTimeout(500)
t = await text()
console.log('SANA in People:', t.includes('Sana Qureshi'))
await page.goto(BASE + '/#/activity'); await page.waitForTimeout(500)
t = await text()
console.log('ACTIVITY hired event:', t.includes('Hired Sana Qureshi'))

/* ── add someone manually ── */
await page.goto(BASE + '/#/people'); await page.waitForTimeout(500)
await page.getByRole('button', { name: /Add someone/ }).click(); await page.waitForTimeout(450)
await page.getByPlaceholder(/Payroll Specialist/).fill('Payroll Lead')
const nameInput = page.locator('.animate-slide-in input').first()
await nameInput.fill('Asha Verma')
await page.getByRole('button', { name: /Add them/ }).click(); await page.waitForTimeout(500)
t = await text()
console.log('ADDED person visible:', t.includes('Asha Verma'))
await page.screenshot({ path: `${OUT}/h6-person-added.png`, fullPage: true })

/* ── employee persona must NOT see Add someone ── */
await become('Priya Nair')
await page.goto(BASE + '/#/people'); await page.waitForTimeout(500)
t = await text()
console.log('EMPLOYEE cannot add:', !t.includes('Add someone'))
console.log('EMPLOYEE no hiring tile:', !(await page.locator('aside').innerText()).includes('Hiring'))

console.log('CONSOLE ERRORS:', errors.length ? errors.slice(0, 8) : 'none')
await browser.close()
