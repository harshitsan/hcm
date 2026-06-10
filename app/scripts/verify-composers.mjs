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

/* ── 1. the tiered expense flow renders its full sophistication ── */
await become('Sara Iyer')
await page.goto(BASE + '/#/rules'); await page.waitForTimeout(600)
await page.getByRole('button', { name: 'Approval flows' }).click(); await page.waitForTimeout(450)
let t = await text()
console.log('TIER quorum label:', /any 2 of 3/i.test(t))
console.log('TIER conditions:', t.includes('only when the claim is above ₹50,000') && t.includes('₹2,00,000'))
console.log('LADDER rungs:', /Dept head after 1 day, then HR after 3 days/.test(t.replace(/\n/g, ' ')))
console.log('NUDGES:', t.includes('nudges at 50/75%'))
console.log('OUTCOMES pills:', t.includes('back to the requester') && t.includes('auto-approved'))
await page.screenshot({ path: `${OUT}/sc1-expense-flow.png`, fullPage: true })

/* ── 2. flow composer: ladder + structured tier + outcomes ── */
await page.getByRole('button', { name: /New flow/ }).click(); await page.waitForTimeout(500)
t = await drawer()
console.log('FCOMP ladder builder:', /add a rung/i.test(t))
console.log('FCOMP structured condition:', /only when/i.test(t) && /is above/i.test(t))
console.log('FCOMP outcomes:', /if someone rejects/i.test(t) && /stays? quiet/i.test(t))
await page.screenshot({ path: `${OUT}/sc2-flow-composer.png` })
await page.keyboard.press('Escape'); await page.waitForTimeout(300)

/* ── 3. rules: attached flow + lifecycle badges render ── */
await page.getByRole('button', { name: 'Rules', exact: true }).click(); await page.waitForTimeout(450)
t = await text()
console.log('RULE attached flow:', t.includes('routes via the “Time-off approvals” flow') || t.includes('Time-off approvals'))
console.log('RULE effective pill:', t.includes('from 1 Aug 2026'))
console.log('RULE exceptions:', t.includes('Not for interns'))
console.log('RULE review cadence:', t.includes('every 12 months'))
await page.screenshot({ path: `${OUT}/sc3-rules-cards.png`, fullPage: true })

/* ── 4. rule composer: kind picker, flow attach, conflict, simulation ── */
await page.getByRole('button', { name: /New rule/ }).click(); await page.waitForTimeout(500)
t = await drawer()
console.log('RCOMP kind picker:', t.includes('It fires on a trigger') && t.includes('It sets a number'))
console.log('RCOMP who-says-yes modes:', t.includes('Use a flow') && t.includes('Build the steps'))
// trigger builder
await page.locator('.animate-slide-in').getByRole('button', { name: 'It fires on a trigger' }).click()
await page.waitForTimeout(300)
t = await drawer()
console.log('RCOMP trigger builder:', /when does it fire/i.test(t))
// conflict preview: category Documents (Global data protection sits at Platform)
await page.locator('.animate-slide-in select').first().selectOption('Documents')
await page.waitForTimeout(300)
t = await drawer()
console.log('RCOMP conflict warning:', /Respect at work|Global data protection/.test(t) && /stay quiet|sits above/i.test(t))
// attach a flow
await page.locator('.animate-slide-in').getByRole('button', { name: 'Use a flow' }).click()
await page.waitForTimeout(300)
t = await drawer()
console.log('RCOMP flow attach select:', t.includes('Expense approvals') || t.includes('Time-off approvals'))
// simulation richness
console.log('RCOMP simulation person:', /try it/i.test(t))
await page.screenshot({ path: `${OUT}/sc4-rule-composer.png` })
await page.keyboard.press('Escape'); await page.waitForTimeout(300)

/* ── 5. David: portfolio level now available in flow composer ── */
await become('David Chen')
await page.goto(BASE + '/#/rules'); await page.waitForTimeout(500)
await page.getByRole('button', { name: 'Approval flows' }).click(); await page.waitForTimeout(400)
await page.getByRole('button', { name: /New flow/ }).click(); await page.waitForTimeout(450)
t = await drawer()
console.log('FCOMP portfolio level:', t.includes('Your portfolio'))

console.log('CONSOLE ERRORS:', errors.length ? errors.slice(0, 8) : 'none')
await browser.close()
