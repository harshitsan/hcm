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

/* ── 1. Policies is the default view; the list reads ── */
await become('David Chen')
await page.goto(BASE + '/#/rules'); await page.waitForTimeout(600)
let t = await text()
console.log('LIST default policies view:', t.includes('Remote & Hybrid Work') && t.includes('Onboarding & Day-1'))
console.log('LIST version + effective:', t.includes('v2') && t.includes('1 Jul 2026'))
console.log('LIST waiting policy:', t.includes('Payroll & Statutory Calendar — India'))
await page.screenshot({ path: `${OUT}/ps1-list.png`, fullPage: true })

/* ── 2. detail drawer: clauses, sensors, versions, evidence ── */
await page.locator('main div.cursor-pointer', { hasText: 'Remote & Hybrid Work' }).first().click({ position: { x: 24, y: 22 } })
await page.waitForTimeout(500)
t = await drawer()
console.log('DETAIL camera clause + binding:', t.includes('Cameras on in client meetings') && /person reports it/i.test(t))
console.log('DETAIL number clause value:', t.includes('₹2,500'))
console.log('DETAIL versions diff:', t.includes('₹2,000 → ₹2,500'))
console.log('DETAIL repeat threshold:', t.includes('3 concerns in a quarter'))
await page.screenshot({ path: `${OUT}/ps2-detail.png` })
const ev = page.getByRole('button', { name: /Audit evidence pack/ })
if (await ev.count()) { await ev.click(); await page.waitForTimeout(300); console.log('EVIDENCE toast:', (await text()).includes('Bundled in the real thing')) }
await page.keyboard.press('Escape'); await page.waitForTimeout(300)

/* ── 3. generator: template → scope → clause sensor → publish ── */
await page.getByRole('button', { name: /New policy/ }).click(); await page.waitForTimeout(500)
t = await drawer()
console.log('GEN gallery full + light:', t.includes('Respect at Work (POSH)') && t.includes('outline only'))
console.log('GEN country variants:', t.includes('India') && t.includes('Mexico'))
await page.screenshot({ path: `${OUT}/ps3-gallery.png` })
await page.locator('.animate-slide-in').getByText('Hiring Service Levels', { exact: true }).first().click()
await page.waitForTimeout(400)
// template click lands on step 2 — check the scope sentence FIRST
t = await drawer()
console.log('GEN scope sentence:', t.includes('all employees'))
const nexts = page.locator('.animate-slide-in').getByRole('button', { name: /Next|Continue/i })
if (await nexts.count()) { await nexts.first().click(); await page.waitForTimeout(350) }
t = await drawer()
console.log('GEN sensor question:', /platform sees it|person reports it/i.test(t))
console.log('GEN e-sign stubbed:', t.includes('DocuSign') && t.includes('Phase II'))
await page.screenshot({ path: `${OUT}/ps4-clause-engine.png` })
const saveDraft = page.locator('.animate-slide-in').getByRole('button', { name: /Save draft/ })
if (await saveDraft.count()) { await saveDraft.click(); await page.waitForTimeout(500) }
t = await text()
console.log('GEN draft in list:', t.includes('Hiring Service Levels'))

/* ── 4. observation round trip: concern → ticket with repeat note ── */
await page.goto(BASE + '/#/people'); await page.waitForTimeout(500)
await page.locator('main').getByText('Dev Patel', { exact: true }).first().click(); await page.waitForTimeout(450)
await page.getByRole('button', { name: /Report something/ }).click(); await page.waitForTimeout(450)
t = await drawer()
console.log('REPORT form fields:', t.includes('a concern') && t.includes('something good'))
await page.screenshot({ path: `${OUT}/ps5-report-form.png` })
await page.locator('.animate-slide-in textarea').last().fill('Camera off again in the Friday client call.')
await page.getByRole('button', { name: /Send it/ }).click(); await page.waitForTimeout(500)
console.log('REPORT toast routes:', (await text()).toLowerCase().includes('on the record'))
// close the still-open person drawer before switching personas
await page.keyboard.press('Escape'); await page.waitForTimeout(300)
await page.keyboard.press('Escape'); await page.waitForTimeout(300)
// the ticket lands in Arjun's inbox
await become('Arjun Mehta')
await page.goto(BASE + '/#/inbox'); await page.waitForTimeout(500)
t = await text()
console.log('TICKET in inbox:', t.includes('a concern was raised'))
console.log('TICKET source policy:', t.includes('Remote & Hybrid Work'))
await page.screenshot({ path: `${OUT}/ps6-ticket.png`, fullPage: true })

/* ── 5. conditional routing renders ── */
await page.goto(BASE + '/#/rules'); await page.waitForTimeout(500)
await page.getByRole('button', { name: 'Approval flows' }).click(); await page.waitForTimeout(450)
t = await text()
console.log('FLOW onlyWhen:', t.includes('only when the offer is above ₹20L'))

/* ── 6. publish the waiting policy → lands in Documents ── */
await become('David Chen')
await page.goto(BASE + '/#/rules'); await page.waitForTimeout(600)
const pub = page.getByRole('button', { name: /Approve & publish/ })
if (await pub.count()) { await pub.first().click(); await page.waitForTimeout(500) }
console.log('PUBLISH toast:', (await text()).includes('lands in Documents'))
await become('Priya Nair')
await page.goto(BASE + '/#/documents'); await page.waitForTimeout(500)
t = await text()
console.log('DOCS new policy to sign:', t.includes('Payroll & Statutory Calendar — India'))
await page.screenshot({ path: `${OUT}/ps7-docs.png`, fullPage: true })

console.log('CONSOLE ERRORS:', errors.length ? errors.slice(0, 8) : 'none')
await browser.close()
