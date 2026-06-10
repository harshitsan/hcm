import { chromium } from 'playwright'

const BASE = 'http://localhost:5174'
const OUT = '/tmp/proto-shots'
const browser = await chromium.launch()
const ctx = await browser.newContext({ viewport: { width: 1500, height: 950 }, deviceScaleFactor: 1.5 })
const page = await ctx.newPage()
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message))

// shots: [name, route, personaIndexToClick?]
// persona switching is via the sidebar persona card (bottom-left) menu.
const PERSONA_NAMES = ['Priya Nair', 'Arjun Mehta', 'Sara Iyer', 'David Chen', 'Maya Kapoor']

async function switchPersona(name) {
  // open persona menu (bottom dark card in sidebar) and pick
  await page.locator('aside button').last().click()
  await page.waitForTimeout(250)
  await page.getByRole('button', { name: new RegExp(name) }).first().click()
  await page.waitForTimeout(500)
}

async function shot(name, route) {
  await page.goto(BASE + '/#' + route)
  await page.waitForTimeout(650)
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true })
  console.log('shot:', name)
}

await page.goto(BASE)
await page.waitForTimeout(1200)

// employee (default persona)
await shot('01-home-employee', '/')
await shot('02-timeoff', '/time-off')
await shot('03-documents', '/documents')
await shot('04-people', '/people')

// manager
await switchPersona('Arjun Mehta')
await shot('05-home-manager', '/')
await shot('06-inbox', '/inbox')

// hr admin
await switchPersona('Sara Iyer')
await shot('07-home-admin', '/')
await shot('08-rules', '/rules')
await shot('09-reports', '/reports')

// portfolio
await switchPersona('David Chen')
await shot('10-home-portfolio', '/')
await shot('11-companies-portfolio', '/companies')

// operator
await switchPersona('Maya Kapoor')
await shot('12-home-operator', '/')
await shot('13-companies', '/companies')
await shot('14-add-company', '/companies/new')

console.log('CONSOLE ERRORS:', errors.length ? errors.slice(0, 10) : 'none')
await browser.close()
