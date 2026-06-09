/**
 * Playwright UX-review screenshotter — captures every screen for EACH role into
 *   <repo>/role-ux-review/<role>/NN-<screen>.png
 *
 * The app is a HashRouter SPA gated by RequireAuth + scope; we "log in" by
 * seeding localStorage (shr.persona / shr.company / shr.scope) then driving the
 * hash through each route that role can reach.
 *
 * Run (dev server up — `npm run dev` in app/):
 *   cd app && npm run shots         # all roles
 *   ROLE=hr-admin npm run shots     # just one
 *   BASE_URL=https://… THEME=dark npm run shots
 */
import { chromium } from 'playwright'
import { mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BASE = (process.env.BASE_URL || 'http://localhost:5173').replace(/\/$/, '')
const THEME = process.env.THEME === 'dark' ? 'dark' : 'light'
const OUT_ROOT = path.resolve(__dirname, '../../role-ux-review')
const ONLY = process.env.ROLE // optional slug filter

const R = {
  me: [['profile', '/me/profile'], ['notifications', '/me/notifications']],
}
const PLATFORM = [
  ['home', '/'], ['portfolio', '/portfolio'], ['companies', '/admin/companies'], ['company-setup', '/admin/company-setup'],
  ['shared-policies', '/admin/shared-policies'], ['org-data', '/admin/org-data'], ['roles', '/admin/roles'],
  ['import-export', '/admin/data'], ['audit', '/admin/audit'], ...R.me,
]

const ROLES = [
  { slug: 'platform-admin', persona: 'p1', scope: 'platform', company: 'c1', routes: PLATFORM },
  { slug: 'portfolio-manager', persona: 'p2', scope: 'platform', company: 'c1', routes: PLATFORM },
  { slug: 'hr-admin', persona: 'p3', scope: 'company', company: 'c1', routes: [
    ['home', '/'], ...R.me,
    ['directory', '/people/directory'], ['org-chart', '/people/org-chart'], ['employees', '/people/employees'], ['assets', '/people/assets'], ['letters', '/people/letters'],
    ['leave', '/time/leave'], ['attendance', '/time/attendance'],
    ['requisitions', '/hiring/requisitions'], ['candidates', '/hiring/candidates'], ['interviews', '/hiring/interviews'],
    ['onboarding', '/lifecycle/onboarding'], ['performance', '/lifecycle/performance'], ['transfers-exit', '/lifecycle/transfers-exit'],
    ['announcements', '/comms/announcements'], ['feedback', '/comms/feedback'],
    ['policies', '/policies'], ['documents', '/documents'], ['reports', '/reports'],
    ['company-setup', '/admin/company-setup'], ['org-data', '/admin/org-data'], ['workflow-builder', '/admin/workflow-builder'],
    ['roles', '/admin/roles'], ['custom-fields', '/admin/custom-fields'], ['import-export', '/admin/data'], ['audit', '/admin/audit'],
  ] },
  { slug: 'people-manager', persona: 'p4', scope: 'company', company: 'c1', routes: [
    ['home', '/'], ...R.me,
    ['directory', '/people/directory'], ['org-chart', '/people/org-chart'],
    ['leave', '/time/leave'], ['attendance', '/time/attendance'],
    ['requisitions', '/hiring/requisitions'], ['candidates', '/hiring/candidates'], ['interviews', '/hiring/interviews'],
    ['onboarding', '/lifecycle/onboarding'], ['performance', '/lifecycle/performance'],
    ['announcements', '/comms/announcements'], ['feedback', '/comms/feedback'],
    ['policies', '/policies'], ['documents', '/documents'], ['reports', '/reports'],
  ] },
  { slug: 'employee', persona: 'p5', scope: 'company', company: 'c1', routes: [
    ['home', '/'], ...R.me,
    ['directory', '/people/directory'], ['org-chart', '/people/org-chart'], ['assets', '/people/assets'], ['letters', '/people/letters'],
    ['leave', '/time/leave'], ['attendance', '/time/attendance'],
    ['announcements', '/comms/announcements'], ['feedback', '/comms/feedback'],
    ['policies', '/policies'], ['documents', '/documents'],
  ] },
]

async function shootRole(browser, role) {
  const out = path.join(OUT_ROOT, role.slug)
  await rm(out, { recursive: true, force: true })
  await mkdir(out, { recursive: true })
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 })
  const page = await ctx.newPage()
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
  await page.evaluate(([persona, company, theme, scope]) => {
    localStorage.setItem('shr.persona', persona)
    localStorage.setItem('shr.company', company)
    localStorage.setItem('shr.theme', theme)
    localStorage.setItem('shr.scope', scope)
  }, [role.persona, role.company, THEME, role.scope])
  await page.reload({ waitUntil: 'networkidle' })

  let i = 0
  for (const [name, route] of role.routes) {
    i += 1
    const num = String(i).padStart(2, '0')
    await page.evaluate((r) => { window.location.hash = r }, route)
    await page.waitForLoadState('networkidle').catch(() => {})
    await page.waitForTimeout(800)
    await page.screenshot({ path: path.join(out, `${num}-${name}.png`), fullPage: true })
  }
  await ctx.close()
  console.log(`✓ ${role.slug.padEnd(18)} ${role.routes.length} screens`)
}

async function run() {
  const browser = await chromium.launch()
  for (const role of ROLES) {
    if (ONLY && role.slug !== ONLY) continue
    await shootRole(browser, role)
  }
  await browser.close()
  console.log(`\nDone (${THEME}) → ${OUT_ROOT}`)
}
run().catch((e) => { console.error(e); process.exit(1) })
