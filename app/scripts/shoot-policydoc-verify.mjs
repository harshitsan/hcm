import { chromium } from 'playwright'

const BASE = 'http://localhost:5174'
const OUT = '/tmp/op-shots'
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1500, height: 950 }, deviceScaleFactor: 1.5 })
const page = await ctx.newPage()
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))

const drawer = () => page.locator('.animate-slide-in').last().innerText()
async function become(name) {
  await page.locator('aside button').last().click()
  await page.waitForTimeout(250)
  await page.getByRole('button', { name: new RegExp(name) }).first().click()
  await page.waitForTimeout(600)
}

await page.goto(BASE)
await page.waitForTimeout(900)

/* ── Maya: full platform analytics (5 companies) ── */
await become('Maya Kapoor')
await page.goto(BASE + '/#/rules')
await page.waitForTimeout(500)
await page.locator('main div.cursor-pointer', { hasText: 'Respect at work (POSH)' }).first().click({ position: { x: 24, y: 22 } })
await page.waitForTimeout(500)
let t = await drawer()
console.log('DOC sections render:', t.includes('What counts') && t.includes('How to raise it'))
console.log('SIGNED aggregate:', /\d+% /.test(t.replace(/\n/g, ' ')) || t.includes('signed across'))
console.log('MAYA sees all 5 companies:', t.includes('Delta Health') && t.includes('Epsilon Studios'))
await page.screenshot({ path: `${OUT}/p1-policy-operator.png` })
await page.getByRole('button', { name: /Nudge/ }).first().click()
await page.waitForTimeout(300)
console.log('NUDGE toast:', (await page.locator('body').innerText()).includes('Reminder queued'))
await page.keyboard.press('Escape')
await page.waitForTimeout(300)

/* ── the changed policy: amber what-changed panel ── */
await page.locator('main div.cursor-pointer', { hasText: 'Global data protection' }).first().click({ position: { x: 24, y: 22 } })
await page.waitForTimeout(500)
t = await drawer()
console.log('WHAT-CHANGED panel:', t.includes('New in May'))
console.log('AI section:', t.includes('AI tools at work'))
await page.screenshot({ path: `${OUT}/p2-policy-changed.png` })
await page.keyboard.press('Escape')
await page.waitForTimeout(300)

/* ── David: analytics scoped to HIS 3 ── */
await become('David Chen')
await page.goto(BASE + '/#/rules')
await page.waitForTimeout(500)
await page.locator('main div.cursor-pointer', { hasText: 'Respect at work (POSH)' }).first().click({ position: { x: 24, y: 22 } })
await page.waitForTimeout(500)
t = await drawer()
console.log('DAVID 3 companies only (no Delta):', t.includes('Gamma Retail') && !t.includes('Delta Health'))
console.log('DAVID scoped caption:', t.includes('your 3 companies'))
await page.screenshot({ path: `${OUT}/p3-policy-portfolio.png` })
await page.keyboard.press('Escape')
await page.waitForTimeout(300)

/* ── Sara: team split inside her company ── */
await become('Sara Iyer')
await page.goto(BASE + '/#/rules')
await page.waitForTimeout(500)
await page.locator('main div.cursor-pointer', { hasText: 'Respect at work (POSH)' }).first().click({ position: { x: 24, y: 22 } })
await page.waitForTimeout(500)
t = await drawer()
console.log('SARA team split:', t.includes('Engineering') && t.includes('Sales'))
console.log('SARA no other companies:', !t.includes('Beta Foods') && !t.includes('Delta Health'))
await page.screenshot({ path: `${OUT}/p4-policy-hradmin.png` })
await page.keyboard.press('Escape')
await page.waitForTimeout(300)

/* ── composer: write a policy + sign toggle ── */
await page.getByRole('button', { name: /New rule/ }).click()
await page.waitForTimeout(450)
t = await drawer()
console.log('COMPOSER policy section:', /the policy itself/i.test(t))
// the sign toggle appears once there's a policy to sign
await page.locator('.animate-slide-in textarea').fill('No customer data in public AI tools, ever.')
await page.waitForTimeout(300)
t = await drawer()
console.log('COMPOSER sign toggle:', t.includes('Every employee must sign it'))
await page.screenshot({ path: `${OUT}/p5-composer-policy.png` })

console.log('CONSOLE ERRORS:', errors.length ? errors.slice(0, 10) : 'none')
await browser.close()
