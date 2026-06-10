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

/* ── David: the festive-bonus rule must answer "whose Finance?" ── */
await become('David Chen')
await page.goto(BASE + '/#/rules')
await page.waitForTimeout(500)
let t = await text()
console.log('RESOLUTION line (hats filled by each company):', /hats filled by each company/i.test(t))
console.log('CENTRAL line on platform rule:', /one desk for everyone/i.test(t))
console.log('CANT-RUN warning for Gamma:', t.includes("Can't run in") && t.includes('Gamma Retail'))
await page.screenshot({ path: `${OUT}/h1-rules-resolution.png`, fullPage: true })

// click the Finance hat on Festive bonus letters
await page.locator('main').getByRole('button', { name: 'Finance', exact: true }).first().click()
await page.waitForTimeout(450)
t = await text()
console.log('HAT drawer title:', t.includes('Who wears the Finance hat?'))
console.log('HAT Acme ready (Isha):', t.includes('Isha Reddy'))
console.log('HAT Beta ready (Joseph):', t.includes('Joseph K'))
console.log('HAT Gamma empty:', t.includes('no one yet'))
await page.screenshot({ path: `${OUT}/h2-hat-drawer.png` })
await page.keyboard.press('Escape')

/* ── flows: resolution lines + central on platform flow ── */
await page.getByRole('button', { name: 'Approval flows' }).click()
await page.waitForTimeout(450)
t = await text()
console.log('FLOW central line (rule changes):', /one desk for everyone/i.test(t))
await page.screenshot({ path: `${OUT}/h3-flows-resolution.png`, fullPage: true })

/* ── composer: whose-people picker on a platform rule (Maya) ── */
await become('Maya Kapoor')
await page.goto(BASE + '/#/rules')
await page.waitForTimeout(500)
await page.getByRole('button', { name: /New rule/ }).click()
await page.waitForTimeout(450)
// pick Platform level
await page.getByRole('button', { name: 'Platform', exact: true }).click()
await page.waitForTimeout(300)
// the picker only appears once there are hats to fill — add a step
await page.getByRole('button', { name: /Add step/ }).click()
await page.waitForTimeout(300)
t = await text()
console.log('COMPOSER whose-people picker:', t.includes('Whose people decide?') || t.toLowerCase().includes('their own people'))
await page.screenshot({ path: `${OUT}/h4-composer-resolution.png` })

console.log('CONSOLE ERRORS:', errors.length ? errors.slice(0, 10) : 'none')
await browser.close()
