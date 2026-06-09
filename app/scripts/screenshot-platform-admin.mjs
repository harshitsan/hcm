/**
 * Playwright UX-review screenshotter — captures every screen the Platform /
 * Provider Admin (persona p1, "Anita Rao") can see, full-page, into
 *   <repo>/role-ux-review/platform-admin/NN-<screen>.png
 *
 * The app is a HashRouter SPA gated by RequireAuth; we "log in" by seeding
 * localStorage (shr.persona / shr.company / shr.theme) then driving the hash.
 *
 * Run (dev server must be up — `npm run dev` in app/):
 *   cd app
 *   npm i -D playwright          # once
 *   npx playwright install chromium   # once
 *   node scripts/screenshot-platform-admin.mjs
 *
 * Options (env):
 *   BASE_URL=https://sattelite-hr.vercel.app   # screenshot the deploy instead of localhost
 *   THEME=dark                                 # capture dark mode
 */
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BASE = (process.env.BASE_URL || 'http://localhost:5173').replace(/\/$/, '')
const THEME = process.env.THEME === 'dark' ? 'dark' : 'light'
const OUT = path.resolve(__dirname, '../../role-ux-review/platform-admin')

const PERSONA = 'p1' // Anita Rao — Platform / Provider Admin
const COMPANY = 'c1' // start context: Kensium Pvt Ltd

// name → route. Every route a Platform Admin can reach (see app/src/App.tsx).
const ROUTES = [
  ['home', '/'],
  ['portfolio', '/portfolio'],
  ['profile', '/me/profile'],
  ['notifications', '/me/notifications'],
  ['directory', '/people/directory'],
  ['org-chart', '/people/org-chart'],
  ['employees', '/people/employees'],
  ['assets', '/people/assets'],
  ['letters', '/people/letters'],
  ['leave', '/time/leave'],
  ['attendance', '/time/attendance'],
  ['requisitions', '/hiring/requisitions'],
  ['candidates', '/hiring/candidates'],
  ['interviews', '/hiring/interviews'],
  ['onboarding', '/lifecycle/onboarding'],
  ['performance', '/lifecycle/performance'],
  ['transfers-exit', '/lifecycle/transfers-exit'],
  ['announcements', '/comms/announcements'],
  ['feedback', '/comms/feedback'],
  ['policies', '/policies'],
  ['documents', '/documents'],
  ['reports', '/reports'],
  ['companies', '/admin/companies'],
  ['company-setup', '/admin/company-setup'],
  ['org-data', '/admin/org-data'],
  ['workflow-builder', '/admin/workflow-builder'],
  ['roles', '/admin/roles'],
  ['custom-fields', '/admin/custom-fields'],
  ['data-import-export', '/admin/data'],
  ['audit', '/admin/audit'],
]

async function run() {
  await mkdir(OUT, { recursive: true })
  const browser = await chromium.launch()
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  })
  const page = await ctx.newPage()

  // 1) load the origin, then seed the "session" and reload so the app mounts logged-in
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
  await page.evaluate(
    ([persona, company, theme]) => {
      localStorage.setItem('shr.persona', persona)
      localStorage.setItem('shr.company', company)
      localStorage.setItem('shr.theme', theme)
    },
    [PERSONA, COMPANY, THEME],
  )
  await page.reload({ waitUntil: 'networkidle' })

  // 2) walk every screen
  let i = 0
  for (const [name, route] of ROUTES) {
    i += 1
    const num = String(i).padStart(2, '0')
    await page.evaluate((r) => { window.location.hash = r }, route)
    await page.waitForLoadState('networkidle').catch(() => {})
    await page.waitForTimeout(900) // let charts/photos/animations settle
    const file = path.join(OUT, `${num}-${name}.png`)
    await page.screenshot({ path: file, fullPage: true })
    console.log(`✓ ${num}  ${route.padEnd(26)} → ${path.relative(process.cwd(), file)}`)
  }

  await browser.close()
  console.log(`\nDone — ${ROUTES.length} screens (${THEME}) in ${OUT}`)
}

run().catch((err) => {
  console.error('Screenshot run failed:', err)
  process.exit(1)
})
