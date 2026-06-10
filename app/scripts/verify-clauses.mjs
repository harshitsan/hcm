import { chromium } from 'playwright'
const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1500, height: 950 }, deviceScaleFactor: 1.5 })).newPage()
const errors = []
page.on('pageerror', (e) => errors.push(e.message))
const drawer = () => page.locator('.animate-slide-in').last().innerText()
await page.goto('http://localhost:5174'); await page.waitForTimeout(900)
await page.locator('aside button').last().click(); await page.waitForTimeout(250)
await page.getByRole('button', { name: /Sara Iyer/ }).first().click(); await page.waitForTimeout(600)
await page.goto('http://localhost:5174/#/rules'); await page.waitForTimeout(500)

// seeded clause on the Work-from-anywhere card
let t = await page.locator('body').innerText()
console.log('SEEDED clause on card:', t.includes('who have been here over a year'))
console.log('SEEDED narrowed count (40):', /→ 40 people/.test(t))

// composer: add clauses, watch the count narrow
await page.getByRole('button', { name: /New rule/ }).click(); await page.waitForTimeout(450)
t = await drawer()
const base = t.match(/→ 1 company · (\d+) people/)?.[1]
console.log('BASE count:', base)
await page.getByRole('button', { name: /and… employment type/i }).click(); await page.waitForTimeout(300)
t = await drawer()
console.log('CLAUSE added to sentence:', t.includes('who are full-time'))
const narrowed = t.match(/→ 1 company · (\d+) people/)?.[1]
console.log('COUNT narrowed:', Number(narrowed) < Number(base), `(${base} → ${narrowed})`)
await page.getByRole('button', { name: /and… tenure/i }).click(); await page.waitForTimeout(300)
t = await drawer()
const narrowed2 = t.match(/→ 1 company · (\d+) people/)?.[1]
console.log('SECOND clause narrows more:', Number(narrowed2) < Number(narrowed), `(${narrowed} → ${narrowed2})`)
// cycle the tenure chip
await page.locator('.animate-slide-in').getByRole('button', { name: 'who joined in the last 6 months' }).click()
await page.waitForTimeout(300)
t = await drawer()
console.log('CHIP cycles:', t.includes('who have been here over a year'))
await page.screenshot({ path: '/tmp/op-shots/c1-clauses.png' })
// remove a clause
await page.locator('.animate-slide-in').getByRole('button', { name: /Remove Employment type/ }).click()
await page.waitForTimeout(300)
t = await drawer()
console.log('CLAUSE removable:', !t.includes('who are full-time'))
console.log('PAGE ERRORS:', errors.length ? errors : 'none')
await browser.close()
