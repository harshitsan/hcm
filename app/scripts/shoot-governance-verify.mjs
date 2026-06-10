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

/* ── 1. Flows: parallel steps, deadlines, escalation, turn-on ── */
await become('Sara Iyer')
await page.goto(BASE + '/#/rules')
await page.waitForTimeout(500)
await page.getByRole('button', { name: 'Approval flows' }).click()
await page.waitForTimeout(450)
await page.screenshot({ path: `${OUT}/g1-flows.png`, fullPage: true })
let t = await text()
console.log('FLOWS parallel mode label:', /all of them/i.test(t))
console.log('FLOWS deadline shown:', t.includes('within 2 days'))
console.log('FLOWS escalation shown:', t.toLowerCase().includes('quiet'))
console.log('FLOWS platform flow locked for Sara:', t.includes('Set above you'))
// turn on the draft Exit clearance flow
const turnOn = page.getByRole('button', { name: /Turn it on/ })
if (await turnOn.count()) {
  await turnOn.first().click()
  await page.waitForTimeout(400)
  console.log('FLOW turned on:', (await text()).includes('routes from the next request'))
}

/* ── 2. Coverage matrix (operator) ── */
await become('Maya Kapoor')
await page.goto(BASE + '/#/rules')
await page.waitForTimeout(500)
t = await text()
console.log('COVERAGE card present:', t.includes('Where they land'))
console.log('COVERAGE adjusted state:', t.toLowerCase().includes('adjusted'))
await page.screenshot({ path: `${OUT}/g2-coverage.png`, fullPage: true })

/* ── 3. Access: roles by level, clone, toggle → activity ── */
await page.goto(BASE + '/#/access')
await page.waitForTimeout(500)
await page.screenshot({ path: `${OUT}/g3-access.png`, fullPage: true })
t = await text()
console.log('ACCESS levels present:', t.includes('Platform operator') && t.includes('People manager'))
console.log('ACCESS people counts:', t.includes('470'))
// open a built-in role, clone it
await page.locator('main').getByText('Platform operator', { exact: true }).first().click()
await page.waitForTimeout(450)
await page.screenshot({ path: `${OUT}/g4-role-drawer.png` })
const clone = page.getByRole('button', { name: /Clone this role/ })
if (await clone.count()) {
  await clone.click()
  await page.waitForTimeout(450)
  console.log('CLONE created:', (await text()).includes('(copy)'))
}
await page.keyboard.press('Escape')

/* ── 4. Activity: stream + live event from the clone above ── */
await page.goto(BASE + '/#/activity')
await page.waitForTimeout(500)
await page.screenshot({ path: `${OUT}/g5-activity.png`, fullPage: true })
t = await text()
console.log('ACTIVITY page header:', t.includes('Everything, on the record'))
console.log('ACTIVITY live clone event (just now):', t.includes('just now') && t.includes('(copy)'))
console.log('ACTIVITY inherited event:', t.includes('inherited 2 platform rules'))

/* ── 5. cross-feature: pause a company → lands in activity ── */
await page.goto(BASE + '/#/companies')
await page.waitForTimeout(500)
await page.getByText('Delta Health').first().click()
await page.waitForTimeout(400)
await page.getByRole('button', { name: /^Pause Delta Health$/ }).click()
await page.waitForTimeout(300)
await page.getByPlaceholder('Delta Health').fill('Delta Health')
await page.getByRole('button', { name: 'Pause the company' }).click()
await page.waitForTimeout(500)
await page.goto(BASE + '/#/activity')
await page.waitForTimeout(500)
t = await text()
console.log('ACTIVITY pause event logged:', t.includes('Paused Delta Health'))
await page.screenshot({ path: `${OUT}/g6-activity-live.png` })

/* ── 6. employee action → manager-visible log (Sara scope) ── */
await become('Arjun Mehta')
await page.goto(BASE + '/#/inbox')
await page.waitForTimeout(500)
await page.getByRole('button', { name: /Approve all/ }).click()
await page.waitForTimeout(400)
await become('Sara Iyer')
await page.goto(BASE + '/#/activity')
await page.waitForTimeout(500)
t = await text()
console.log('ACTIVITY bulk-approve visible to Sara:', t.includes('routine requests'))
console.log('ACTIVITY Sara does NOT see Delta pause:', !t.includes('Paused Delta Health'))

console.log('CONSOLE ERRORS:', errors.length ? errors.slice(0, 10) : 'none')
await browser.close()
