import { chromium } from 'playwright'

const BASE = 'http://localhost:5174'
const OUT = '/tmp/proto-shots'
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1500, height: 950 }, deviceScaleFactor: 1.5 })
const page = await ctx.newPage()
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))

async function switchPersona(name) {
  await page.locator('aside button').last().click()
  await page.waitForTimeout(250)
  await page.getByRole('button', { name: new RegExp(name) }).first().click()
  await page.waitForTimeout(500)
}

await page.goto(BASE)
await page.waitForTimeout(1000)

/* ── Flow 1: employee requests leave (live math + send) ─────────────── */
await page.goto(BASE + '/#/time-off')
await page.waitForTimeout(500)
await page.getByRole('button', { name: /^18$/ }).first().click()
await page.waitForTimeout(200)
await page.getByRole('button', { name: /^19$/ }).first().click()
await page.waitForTimeout(300)
await page.screenshot({ path: `${OUT}/f1-timeoff-selected.png`, fullPage: false })
const mathText = await page.locator('body').innerText()
console.log('LIVE MATH shows "This uses":', mathText.includes('This uses'))
await page.getByRole('button', { name: /Send to Arjun/ }).click()
await page.waitForTimeout(400)
await page.screenshot({ path: `${OUT}/f2-timeoff-sent.png`, fullPage: false })
console.log('TOAST after send:', (await page.locator('body').innerText()).includes('Arjun usually replies'))

/* ── Flow 2: manager clears queue (bulk approve + inline) ───────────── */
await switchPersona('Arjun Mehta')
await page.goto(BASE + '/#/inbox')
await page.waitForTimeout(500)
await page.getByRole('button', { name: /Approve all/ }).click()
await page.waitForTimeout(400)
await page.screenshot({ path: `${OUT}/f3-inbox-bulk.png`, fullPage: true })
const inboxText = await page.locator('body').innerText()
console.log('DONE TODAY section:', inboxText.includes('Done today'))

/* ── Flow 3: HR admin opens rule composer (sentence + simulate) ─────── */
await switchPersona('Sara Iyer')
await page.goto(BASE + '/#/rules')
await page.waitForTimeout(500)
await page.getByRole('button', { name: /New rule/ }).click()
await page.waitForTimeout(400)
await page.screenshot({ path: `${OUT}/f4-rule-composer.png`, fullPage: false })
const composerText = await page.locator('body').innerText()
console.log('COMPOSER live headcount:', /→\s*\d+\s*people/.test(composerText))
console.log('COMPOSER simulate panel:', composerText.includes('Try it before'))
await page.keyboard.press('Escape')

/* ── Flow 4: portfolio switches company → accent changes ────────────── */
await switchPersona('David Chen')
await page.waitForTimeout(300)
await page.getByRole('button', { name: /Work in Beta Foods/ }).click()
await page.waitForTimeout(600)
const accent = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim())
console.log('ACCENT after switch (should be 224 138 99):', accent)
await page.screenshot({ path: `${OUT}/f5-beta-accent.png`, fullPage: false })

/* ── Flow 5: operator adds a company end-to-end ─────────────────────── */
await switchPersona('Maya Kapoor')
await page.goto(BASE + '/#/companies/new')
await page.waitForTimeout(500)
await page.getByText('Indian IT services').first().click()
await page.waitForTimeout(400)
await page.getByPlaceholder(/Northwind/).fill('Sunrise Labs')
await page.screenshot({ path: `${OUT}/f6-wizard-step1.png`, fullPage: false })
for (let i = 0; i < 5; i++) {
  await page.getByRole('button', { name: /^Next/ }).click()
  await page.waitForTimeout(250)
}
// step 6 (Add people): run the import test, then Next
const testBtn = page.getByRole('button', { name: /Run a test/ })
if (await testBtn.count()) {
  await testBtn.click()
  await page.waitForTimeout(300)
  await page.screenshot({ path: `${OUT}/f7-wizard-import.png`, fullPage: false })
  await page.getByRole('button', { name: /^Next/ }).click()
  await page.waitForTimeout(300)
}
await page.screenshot({ path: `${OUT}/f8-wizard-golive.png`, fullPage: true })
const goText = await page.locator('body').innerText()
console.log('PREFLIGHT amber warning:', goText.includes('No approver') || goText.includes('no approver'))
await page.getByRole('button', { name: /Bring .* online/ }).click()
await page.waitForTimeout(500)
await page.screenshot({ path: `${OUT}/f9-success.png`, fullPage: false })
console.log('SUCCESS screen:', (await page.locator('body').innerText()).includes('is live'))
await page.goto(BASE + '/#/companies')
await page.waitForTimeout(400)
console.log('NEW COMPANY in list:', (await page.locator('body').innerText()).includes('Sunrise Labs'))

/* ── Flow 6: ⌘K palette ─────────────────────────────────────────────── */
await page.keyboard.press('Meta+k')
await page.waitForTimeout(300)
await page.keyboard.type('beta')
await page.waitForTimeout(300)
await page.screenshot({ path: `${OUT}/f10-cmdk.png`, fullPage: false })
console.log('CMDK switch option:', (await page.locator('body').innerText()).includes('Switch to Beta Foods'))
await page.keyboard.press('Escape')
await page.waitForTimeout(300)

/* ── Flow 7: employee confirms a document ───────────────────────────── */
await switchPersona('Priya Nair')
await page.goto(BASE + '/#/documents')
await page.waitForTimeout(400)
await page.getByRole('button', { name: /Read & confirm/ }).first().click()
await page.waitForTimeout(400)
await page.screenshot({ path: `${OUT}/f11-ack-drawer.png`, fullPage: false })
await page.getByRole('button', { name: /I've read this/ }).click()
await page.waitForTimeout(400)
console.log('ACK done count rose:', (await page.locator('body').innerText()).includes('2 of 3 done') || (await page.locator('body').innerText()).includes('1 to go'))

console.log('CONSOLE ERRORS:', errors.length ? errors.slice(0, 10) : 'none')
await browser.close()
