import { chromium } from 'playwright'
const browser = await chromium.launch()
const page = await (await browser.newContext({ viewport: { width: 1500, height: 950 }, deviceScaleFactor: 1.5 })).newPage()
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))
const text = () => page.locator('body').innerText()
await page.goto('http://localhost:5174'); await page.waitForTimeout(900)
await page.locator('aside button').last().click(); await page.waitForTimeout(250)
await page.getByRole('button', { name: /Maya Kapoor/ }).first().click(); await page.waitForTimeout(600)

// walk to go-live, save as template
await page.goto('http://localhost:5174/#/companies/new'); await page.waitForTimeout(500)
await page.getByText('Indian IT services').first().click(); await page.waitForTimeout(400)
await page.getByPlaceholder(/Northwind/).fill('Juniper Works')
for (let i = 0; i < 6; i++) { await page.getByRole('button', { name: /^Next/ }).click(); await page.waitForTimeout(200) }
let t = await text()
console.log('SAVE button on go-live:', t.includes('Save this setup as a template'))
await page.getByRole('button', { name: /Save this setup as a template/ }).click(); await page.waitForTimeout(400)
t = await text()
console.log('MODAL summarizes setup:', /\d+ teams, \d+ roles/.test(t))
await page.getByPlaceholder(/Juniper Works setup/).fill('Juniper standard setup')
await page.screenshot({ path: '/tmp/op-shots/s1-save-template.png' })
await page.getByRole('button', { name: 'Save to the gallery' }).click(); await page.waitForTimeout(400)
console.log('TOAST confirms:', (await text()).includes('is in the gallery for the next company'))

// back out to the gallery — the new template must be there with a "Yours" tag
await page.getByRole('button', { name: /^Back$/ }).click(); await page.waitForTimeout(150)
for (let i = 0; i < 6; i++) { await page.getByRole('button', { name: /^Back$/ }).click(); await page.waitForTimeout(120) }
await page.waitForTimeout(400)
t = await text()
console.log('GALLERY has new template:', t.includes('Juniper standard setup'))
console.log('GALLERY Yours tag:', t.includes('Yours'))
await page.screenshot({ path: '/tmp/op-shots/s2-gallery-yours.png', fullPage: true })

// the save landed in the activity log
await page.goto('http://localhost:5174/#/activity'); await page.waitForTimeout(500)
console.log('ACTIVITY logged save:', (await text()).includes('Saved “Juniper standard setup” as a template'))

console.log('CONSOLE ERRORS:', errors.length ? errors.slice(0, 8) : 'none')
await browser.close()
