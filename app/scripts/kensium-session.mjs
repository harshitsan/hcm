/**
 * Kensium HRMS — reusable authenticated session.
 *
 * This is the foundation every other Kensium script should build on. It reuses
 * the saved Playwright storageState (app/.auth/kensium.json) when it's still
 * valid, and only performs a real login when there's no session or it expired.
 *
 * Use it:
 *   import { withSession } from './kensium-session.mjs'
 *   await withSession(async ({ page }) => {
 *     await page.goto('https://ithrms.kensium.com/Configuration/Index')
 *     // …you're already logged in as admin…
 *   })
 *
 * Or manage the lifecycle yourself:
 *   import { getContext } from './kensium-session.mjs'
 *   const { browser, ctx, page, reused } = await getContext()
 *   // …do work…
 *   await browser.close()
 *
 * Config (all env-overridable):
 *   KENSIUM_URL · KENSIUM_USER · KENSIUM_PASS · KENSIUM_REMEMBER=1
 *   KENSIUM_STORAGE (storageState path) · KENSIUM_TIMEOUT
 *   HEADLESS=0 (headed) · SLOWMO=400
 *
 * ⚠️  Prefer KENSIUM_PASS via env; do not commit real passwords.
 */
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export const CONFIG = {
  url:      (process.env.KENSIUM_URL || 'https://ithrms.kensium.com').replace(/\/+$/, '') + '/',
  user:     process.env.KENSIUM_USER || 'admin',
  pass:     process.env.KENSIUM_PASS || '',                  // set via env: KENSIUM_PASS=... (never hardcode)
  remember: process.env.KENSIUM_REMEMBER === '1',
  storage:  process.env.KENSIUM_STORAGE || path.join(__dirname, '..', '.auth', 'kensium.json'),
  timeout:  Number(process.env.KENSIUM_TIMEOUT || 60000),
}

// A protected route bounces unauthenticated users back to the login form.
const PROTECTED = CONFIG.url + 'Home/Home'
const APP_NAV = /Configuration|Organization|Recruitment|Employee Management|Leave Management|Logout|Sign out/i

/** True when the current page is an authenticated app page (not the login form). */
export async function isAuthenticated(page) {
  if (await page.locator('#Password, #userName').count()) return false
  const body = await page.locator('body').innerText().catch(() => '')
  return APP_NAV.test(body || '')
}

/** Fill + submit the login form on the current page. Returns whether it worked. */
export async function performLogin(page, { user = CONFIG.user, pass = CONFIG.pass, remember = CONFIG.remember } = {}) {
  const userField = page.locator('#userName').or(page.getByPlaceholder('Username'))
  const passField = page.locator('#Password').or(page.getByPlaceholder('Password'))
  await userField.waitFor({ state: 'visible', timeout: CONFIG.timeout })
  await userField.fill(user)
  await passField.fill(pass)
  if (remember) await page.locator('#RememberMe').check().catch(() => {})

  const submit = page.locator('#btnSubmit').or(page.getByRole('button', { name: /log\s*in/i }))
  await Promise.all([
    // this app keeps connections open, so wait for the post-login navigation, NOT networkidle
    page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 20000 }).catch(() => {}),
    submit.click(),
  ])
  await page.waitForTimeout(1200)
  return isAuthenticated(page)
}

/**
 * Returns an authenticated { browser, ctx, page, authed, reused }.
 * - Reuses the saved storageState when valid (reused: true, no login performed).
 * - Otherwise logs in and re-saves the session.
 * Caller must close the browser — or use withSession() which does it for you.
 *
 * @param {object} [o]
 * @param {boolean} [o.headless]  default: true (HEADLESS=0 to watch)
 * @param {number}  [o.slowMo]    default: 0   (SLOWMO ms)
 * @param {boolean} [o.fresh]     ignore the saved session and force a login
 */
export async function getContext({ headless = process.env.HEADLESS !== '0', slowMo = Number(process.env.SLOWMO || 0), fresh = false } = {}) {
  await mkdir(path.dirname(CONFIG.storage), { recursive: true })

  const browser = await chromium.launch({ headless, slowMo })
  const haveState = !fresh && existsSync(CONFIG.storage)
  const ctx = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    ...(haveState ? { storageState: CONFIG.storage } : {}),
  })
  const page = await ctx.newPage()

  await page.goto(PROTECTED, { waitUntil: 'domcontentloaded', timeout: CONFIG.timeout })
  let authed = await isAuthenticated(page)
  const reused = authed && haveState   // captured BEFORE any re-login

  if (!authed) {
    if (!CONFIG.pass) {
      await browser.close()
      throw new Error('No valid saved session and KENSIUM_PASS is not set. Run: KENSIUM_PASS=... npm run login')
    }
    if (!(await page.locator('#userName, #Password').count())) {
      await page.goto(CONFIG.url, { waitUntil: 'domcontentloaded', timeout: CONFIG.timeout })
    }
    authed = await performLogin(page)
    if (authed) await ctx.storageState({ path: CONFIG.storage })
  }

  return { browser, ctx, page, authed, reused }
}

/** Run `fn({ browser, ctx, page, authed, reused })` with an authenticated session, then always close. */
export async function withSession(fn, opts) {
  const s = await getContext(opts)
  try {
    if (!s.authed) throw new Error('Kensium authentication failed (check KENSIUM_USER / KENSIUM_PASS)')
    return await fn(s)
  } finally {
    await s.browser.close()
  }
}
