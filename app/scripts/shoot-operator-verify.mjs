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

await page.goto(BASE)
await page.waitForTimeout(900)
await page.locator('aside button').last().click()
await page.waitForTimeout(250)
await page.getByRole('button', { name: /Maya Kapoor/ }).first().click()
await page.waitForTimeout(600)

// 1. detail drawer
await page.goto(BASE + '/#/companies')
await page.waitForTimeout(500)
await page.getByText('Acme Tech').first().click()
await page.waitForTimeout(450)
await page.screenshot({ path: `${OUT}/v1-detail-drawer.png` })
const t1 = await text()
console.log('DRAWER code:', t1.includes('COMP-2026-0041'))
console.log('DRAWER story:', t1.includes('Its story so far'))

// 2. pause flow with typed confirmation
await page.getByRole('button', { name: /^Pause Acme Tech$/ }).click()
await page.waitForTimeout(400)
await page.screenshot({ path: `${OUT}/v2-pause-modal.png` })
const t2 = await text()
console.log('CONSEQUENCES listed:', t2.includes('lose sign-in right away') && t2.includes('get an email'))
const pauseBtn = page.getByRole('button', { name: 'Pause the company' })
console.log('CONFIRM disabled before typing:', await pauseBtn.isDisabled())
await page.getByPlaceholder('Acme Tech').fill('Acme Tech')
console.log('CONFIRM enabled after typing:', !(await pauseBtn.isDisabled()))
await pauseBtn.click()
await page.waitForTimeout(500)
await page.screenshot({ path: `${OUT}/v3-after-pause.png` })
console.log('ACME NOW PAUSED in list:', (await text()).includes("People can't sign in while paused"))

// 3. resume actually flips status
await page.getByRole('button', { name: /^Resume$/ }).first().click()
await page.waitForTimeout(400)
console.log('ACME RESUMED (Work in back):', (await text()).includes('Work in Acme Tech'))

// 4. context strip on operator home when inside one company
await page.getByRole('button', { name: /Work in Delta Health/ }).click()
await page.waitForTimeout(400)
await page.goto(BASE + '/#/')
await page.waitForTimeout(500)
await page.screenshot({ path: `${OUT}/v4-home-context-strip.png` })
const t4 = await text()
console.log('CONTEXT STRIP:', t4.includes("You're working in Delta Health — this overview is still the whole platform"))
await page.getByRole('button', { name: /Back to the big picture/ }).click()
await page.waitForTimeout(400)
console.log('BACK TO GLOBAL:', (await text()).includes('All 5 companies'))

// 5. reports scale with company
await page.goto(BASE + '/#/reports')
await page.waitForTimeout(400)
const tg = await text()
console.log('GLOBAL reports 508 + answered:', tg.includes('508') && tg.includes('457 of 508 answered'))

// 6. cmdk operator actions filtered
await page.keyboard.press('Meta+k')
await page.waitForTimeout(350)
const tk = await text()
console.log('NO employee actions for operator:', !tk.includes('Request time off') && !tk.includes('Read pending documents'))
console.log('HAS Add a company:', tk.includes('Add a company'))
await page.keyboard.press('Escape')

console.log('CONSOLE ERRORS:', errors.length ? errors.slice(0, 10) : 'none')
await browser.close()
