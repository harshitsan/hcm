/**
 * Kensium HRMS — login CLI.
 *
 * Thin wrapper over kensium-session.mjs: ensures a valid authenticated session
 * exists (reusing the saved one, logging in only if needed), screenshots the
 * landing page, and saves the session to app/.auth/kensium.json.
 *
 * Run (from app/):
 *   npm run login
 *   HEADLESS=0 SLOWMO=400 npm run login          # watch it
 *   KENSIUM_PASS='…' npm run login               # override secret from env
 *   node scripts/kensium-login.mjs --fresh       # force a fresh login
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { getContext, CONFIG } from './kensium-session.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SHOT = process.env.KENSIUM_SHOT || path.join(__dirname, '..', '.auth', 'kensium-after-login.png')
const fresh = process.argv.includes('--fresh')

const { browser, page, authed, reused } = await getContext({ fresh })

if (authed) {
  console.log(`→ ${reused ? 'reused saved session ✅' : 'logged in fresh ✅'}`)
  console.log(`→ at: ${page.url()}`)
  await page.screenshot({ path: SHOT, fullPage: true }).catch(() => {})
  console.log(`→ screenshot: ${SHOT}`)
  console.log(`→ session:    ${CONFIG.storage}`)
} else {
  console.log('→ authentication FAILED ❌ (check KENSIUM_USER / KENSIUM_PASS)')
}

await browser.close()
process.exit(authed ? 0 : 1)
