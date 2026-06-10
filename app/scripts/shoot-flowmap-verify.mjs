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

/* ── Maya: flow map + named company pills + grouped list ── */
await become('Maya Kapoor')
await page.goto(BASE + '/#/rules')
await page.waitForTimeout(500)
// rules view: company rules must name their owner
let t = await text()
console.log('RULES named owner pill (no "This company"):', t.includes('Acme Tech') && !t.includes('This company'))
await page.getByRole('button', { name: 'Approval flows' }).click()
await page.waitForTimeout(450)
await page.screenshot({ path: `${OUT}/m1-flowmap-operator.png`, fullPage: true })
t = await text()
console.log('MAP present:', t.includes("Who's covered, at a glance"))
console.log('MAP own-flow cells:', t.includes('✓ own flow'))
console.log('MAP inherited cells:', t.includes('from platform'))
console.log('MAP gap cells:', t.includes('none yet'))
console.log('LIST grouped by company:', t.includes('its own flows') && t.includes('Beta Foods') && t.includes('Delta Health'))

/* ── close a gap from the map: Gamma has no time-off flow ── */
const gaps = page.getByRole('button', { name: /none yet/ })
const gapCount = await gaps.count()
console.log('GAP count > 4 (gamma+epsilon rows):', gapCount >= 4)
await gaps.first().click()
await page.waitForTimeout(450)
t = await text()
console.log('GAP composer prefilled:', t.includes('Closing a gap'))
await page.screenshot({ path: `${OUT}/m2-gap-composer.png` })
await page.getByRole('button', { name: 'Turn it on' }).last().click()
await page.waitForTimeout(500)
t = await text()
const gapsAfter = await page.getByRole('button', { name: /none yet/ }).count()
console.log('GAP closed (one fewer amber cell):', gapsAfter === gapCount - 1)
await page.screenshot({ path: `${OUT}/m3-gap-closed.png`, fullPage: true })

/* ── David: map scopes to HIS 3 companies only ── */
await become('David Chen')
await page.goto(BASE + '/#/rules')
await page.waitForTimeout(500)
await page.getByRole('button', { name: 'Approval flows' }).click()
await page.waitForTimeout(450)
t = await text()
console.log('DAVID map has his 3 (no Delta):', t.includes('Gamma Retail') && !t.includes('Delta Health'))
await page.screenshot({ path: `${OUT}/m4-flowmap-portfolio.png`, fullPage: true })

/* ── Sara: never sees a sibling company's flows ── */
await become('Sara Iyer')
await page.goto(BASE + '/#/rules')
await page.waitForTimeout(500)
await page.getByRole('button', { name: 'Approval flows' }).click()
await page.waitForTimeout(450)
t = await text()
console.log('SARA no map (single company):', !t.includes("Who's covered, at a glance"))
console.log('SARA no sibling flows (no Beta/Delta):', !t.includes('Beta Foods') && !t.includes('Delta Health'))

console.log('CONSOLE ERRORS:', errors.length ? errors.slice(0, 10) : 'none')
await browser.close()
