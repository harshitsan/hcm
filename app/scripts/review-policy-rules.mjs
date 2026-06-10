import { chromium } from 'playwright'
import { mkdirSync } from 'fs'

const BASE = 'http://localhost:5174'
const OUT = '/tmp/review-shots'
mkdirSync(OUT, { recursive: true })
const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1500, height: 950 }, deviceScaleFactor: 1.5 })).newPage()
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))

const shot = async (name, full = false) => {
  await page.waitForTimeout(350)
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full })
  console.log('shot:', name)
}
const scrollDrawer = async (frac = 1) => {
  await page.locator('.animate-slide-in .overflow-y-auto').last().evaluate((el, f) => { el.scrollTop = el.scrollHeight * f }, frac)
  await page.waitForTimeout(300)
}
async function become(name) {
  await page.locator('aside button').last().click(); await page.waitForTimeout(250)
  await page.getByRole('button', { name: new RegExp(name) }).first().click(); await page.waitForTimeout(600)
}
const openCard = (text) => page.locator('main div.cursor-pointer', { hasText: text }).first().click({ position: { x: 24, y: 22 } })

await page.goto(BASE); await page.waitForTimeout(1000)

/* ════════ POLICIES (David — portfolio) ════════ */
await become('David Chen')
await page.goto(BASE + '/#/rules'); await page.waitForTimeout(600)
await shot('01-policies-list', true)

// Remote & Hybrid Work detail — top + scrolled
await openCard('Remote & Hybrid Work'); await page.waitForTimeout(500)
await shot('02-policy-detail-top')
await scrollDrawer(0.5); await shot('03-policy-detail-mid')
await scrollDrawer(1); await shot('04-policy-detail-bottom')
// new version drawer
const nv = page.locator('.animate-slide-in').getByRole('button', { name: /New version/ })
if (await nv.count()) { await nv.first().click(); await page.waitForTimeout(500); await shot('05-new-version'); await scrollDrawer(1); await shot('06-new-version-preview'); await page.keyboard.press('Escape'); await page.waitForTimeout(250) }
await page.keyboard.press('Escape'); await page.waitForTimeout(300)

// Payroll India detail (jurisdiction + per-company rows)
await openCard('Payroll & Statutory Calendar — India'); await page.waitForTimeout(500)
await shot('07-policy-payroll-india')
await page.keyboard.press('Escape'); await page.waitForTimeout(300)

/* generator: gallery → coverage (worked state) → clause engine → publish */
await page.getByRole('button', { name: /New policy/ }).click(); await page.waitForTimeout(500)
await shot('08-gen-gallery'); await scrollDrawer(1); await shot('09-gen-gallery-bottom')
await page.locator('.animate-slide-in').getByText('Respect at Work (POSH)', { exact: true }).first().click()
await page.waitForTimeout(450)
await page.locator('.animate-slide-in').getByRole('button', { name: 'Your portfolio' }).click(); await page.waitForTimeout(300)
await page.locator('.animate-slide-in').getByRole('button', { name: /Gamma Retail/ }).first().click(); await page.waitForTimeout(300)
const jur = page.locator('.animate-slide-in').getByRole('button', { name: /and… jurisdiction/i })
if (await jur.count()) { await jur.click(); await page.waitForTimeout(300) }
const addBtn = page.locator('.animate-slide-in').getByRole('button', { name: /^Add$/ })
if (await addBtn.count()) {
  await page.locator('.animate-slide-in input').last().fill('Not during client onboarding weeks')
  await addBtn.first().click(); await page.waitForTimeout(300)
}
await shot('10-gen-coverage-top'); await scrollDrawer(1); await shot('11-gen-coverage-panel')
await page.locator('.animate-slide-in').getByRole('button', { name: /Next|Continue/i }).first().click()
await page.waitForTimeout(400)
await shot('12-gen-clause-engine'); await scrollDrawer(1); await shot('13-gen-publish-footer')
await page.keyboard.press('Escape'); await page.waitForTimeout(300)

/* Sara: locked parent policies */
await become('Sara Iyer')
await page.goto(BASE + '/#/rules'); await page.waitForTimeout(600)
await shot('14-policies-sara', true)

/* ════════ RULES ════════ */
await page.getByRole('button', { name: 'Rules', exact: true }).click(); await page.waitForTimeout(450)
await shot('15-rules-list-sara', true)

// rule composer: trigger builder + conflict + steps + simulation
await page.getByRole('button', { name: /New rule/ }).click(); await page.waitForTimeout(500)
await page.locator('.animate-slide-in').getByRole('button', { name: 'It fires on a trigger' }).click()
await page.waitForTimeout(250)
await page.locator('.animate-slide-in select').first().selectOption('Documents'); await page.waitForTimeout(300)
await shot('16-rcomp-trigger-conflict')
await page.locator('.animate-slide-in').getByRole('button', { name: 'It sets a number' }).click()
await page.waitForTimeout(250)
await shot('17-rcomp-number')
await page.locator('.animate-slide-in').getByRole('button', { name: 'Build the steps' }).click()
await page.waitForTimeout(300)
await scrollDrawer(0.45); await shot('18-rcomp-stepbuilder')
await scrollDrawer(1); await shot('19-rcomp-simulation')
await page.keyboard.press('Escape'); await page.waitForTimeout(300)

// Maya: matrix + platform rules + hat drawer + detail + history
await become('Maya Kapoor')
await page.goto(BASE + '/#/rules'); await page.waitForTimeout(600)
await page.getByRole('button', { name: 'Rules', exact: true }).click(); await page.waitForTimeout(450)
await shot('20-rules-operator', true)
const hat = page.locator('main').getByRole('button', { name: 'HR', exact: true })
if (await hat.count()) { await hat.first().click(); await page.waitForTimeout(450); await shot('21-hat-drawer'); await page.keyboard.press('Escape'); await page.waitForTimeout(250) }
await openCard('Global data protection'); await page.waitForTimeout(500)
await shot('22-rule-detail-signatures'); await scrollDrawer(1); await shot('23-rule-detail-bottom')
await page.keyboard.press('Escape'); await page.waitForTimeout(250)
const hist = page.getByRole('button', { name: /History/ })
if (await hist.count()) { await hist.nth(1).click(); await page.waitForTimeout(450); await shot('24-rule-history'); await page.keyboard.press('Escape'); await page.waitForTimeout(250) }

/* ════════ FLOWS ════════ */
await page.getByRole('button', { name: 'Approval flows' }).click(); await page.waitForTimeout(500)
await shot('25-flows-operator', true)
await page.getByRole('button', { name: /New flow/ }).click(); await page.waitForTimeout(500)
await scrollDrawer(0.4); await shot('26-fcomp-steps')
await scrollDrawer(1); await shot('27-fcomp-outcomes-preview')
await page.keyboard.press('Escape')

console.log('CONSOLE ERRORS:', errors.length ? errors.slice(0, 10) : 'none')
await browser.close()
