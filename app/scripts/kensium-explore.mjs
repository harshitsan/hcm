/**
 * Example — build on the saved Kensium session.
 *
 * Reuses app/.auth/kensium.json (logs in only if missing/expired), prints the
 * top-nav available to this user, and screenshots one or more pages. Copy this
 * as the template for any new Kensium automation.
 *
 * Run (from app/):
 *   node scripts/kensium-explore.mjs
 *   PAGES='Home/Home,Configuration/Index,Organization/PositionList' node scripts/kensium-explore.mjs
 *   HEADLESS=0 node scripts/kensium-explore.mjs
 */
import path from 'node:path'
import { mkdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { withSession, CONFIG } from './kensium-session.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT = process.env.KENSIUM_OUT || path.join(__dirname, '..', '.auth', 'shots')
const PAGES = (process.env.PAGES || 'Home/Home').split(',').map(s => s.trim()).filter(Boolean)

await mkdir(OUT, { recursive: true })

await withSession(async ({ page, reused }) => {
  console.log(`→ session ${reused ? 'reused (no login) ✅' : 'fresh login ✅'}`)

  // what can this user reach? (top navigation)
  const nav = await page.locator('header a, nav a, .navbar a, #menu a').allInnerTexts().catch(() => [])
  const links = [...new Set(nav.map(s => s.trim()).filter(Boolean))]
  console.log('→ top-nav:', links.slice(0, 24).join(' · ') || '(none found — adjust selector)')

  for (const p of PAGES) {
    const url = CONFIG.url + p.replace(/^\/+/, '')
    await page.goto(url, { waitUntil: 'domcontentloaded' }).catch(() => {})
    await page.waitForTimeout(800)
    const file = path.join(OUT, p.replace(/[\\/]/g, '_') + '.png')
    await page.screenshot({ path: file, fullPage: true }).catch(() => {})
    console.log(`  shot ${page.url()} -> ${file}`)
  }
})
