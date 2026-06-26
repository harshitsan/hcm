/**
 * Stage 2 — crawl every page in the nav tree (+ the Configuration mega-page's
 * items) and extract its features. Reads app/.auth/menu-tree.json, writes
 * app/.auth/pages.json (one record per page).
 *
 *   node scripts/kensium-crawl.mjs
 *   LIMIT=20 node scripts/kensium-crawl.mjs        # crawl only first 20 (smoke test)
 */
import { getContext, performLogin, CONFIG } from './kensium-session.mjs'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const TREE = path.join(__dirname, '..', '.auth', 'menu-tree.json')
const OUT  = path.join(__dirname, '..', '.auth', 'pages.json')
const LIMIT = Number(process.env.LIMIT || 0)

const isReal = h => h && h !== '#' && !/^javascript:/i.test(h)
const abs = h => new URL(h, CONFIG.url).href

// derive a config item's module group from its URL (DOM has no group headers)
function moduleFromHref(href) {
  let seg
  try { seg = new URL(href, CONFIG.url).pathname.split('/').filter(Boolean) } catch { return 'General' }
  const map = {
    Exit: 'Exit', PreExitQuestionnaries: 'Exit', EmployeeManagement: 'Employee Mgmt',
    EmployeeTimeline: 'Employee Mgmt', EmployeeJoiningFormalities: 'Employee Mgmt', Acknowledgement: 'Employee Mgmt',
    SalaryRevisionConfig: 'Salary Revision', AttendanceConfiguration: 'Attendance', AuditPannel: 'Attendance',
    AuditConfigurationSettings: 'Attendance', Leave: 'Leave', LeaveType: 'Leave', HolidayCalendar: 'Leave',
    Calendar: 'Leave', Confirmation: 'Confirmation', ConfirmationQuestion: 'Confirmation',
    TrainingManagement: 'Training', Induction: 'Orientation', InductionTopics: 'Orientation',
    InductionQuestion: 'Orientation', InductionSpeakerPanel: 'Orientation', IPParticipantRule: 'Orientation',
    Compensation: 'Compensation', Security: 'Security', PasswordPolicy: 'Security',
    InterviewAssessmentQuestions: 'Recruitment', LocalizationSettings: 'Organization', Organization: 'Organization',
    EmployeeClassification: 'Organization', Location: 'Organization', Group: 'Organization', Role: 'Organization',
    User: 'Organization', ThoughtOftheDay: 'Organization', InductionVenue: 'Organization', ConfigureSeries: 'Organization',
    Announcement: 'Organization', PolicyDocument: 'Organization', SupportTeam: 'Organization', DocumentType: 'Organization',
    MasterCertification: 'Organization', ScheduleJob: 'Organization', Vendor: 'Organization',
  }
  const ti = seg.findIndex(s => s === 'Templates')
  if (ti >= 0 && seg[ti + 1]) {
    const act = seg[ti + 1].replace(/(Email|Notification|Letter)?Templates?$/, '')
    const tm = { Leave: 'Leave', Confirmation: 'Confirmation', Attendance: 'Attendance', Recruitment: 'Recruitment',
      Induction: 'Orientation', EmployeeManagement: 'Employee Mgmt', Exit: 'Exit', DisciplinaryAction: 'Disciplinary',
      Employee: 'Employee Mgmt', TemplateType: 'Recruitment', NotificationTemplates: 'Recruitment' }
    return tm[act] || (act ? act.replace(/([a-z])([A-Z])/g, '$1 $2') : 'Templates')
  }
  if (map[seg[2]]) return map[seg[2]]
  if (map[seg[1]]) return map[seg[1]]
  if (seg[0] === 'IOMS') return 'Organization'
  if (seg[1] === 'Configuration') return 'Recruitment'   // generic /Configuration/Configuration/* = recruitment setup
  return 'General'
}

// Flatten nav tree → [{ path:[...], url }]
function flatten(nodes, prefix = []) {
  const out = []
  for (const n of nodes) {
    const here = [...prefix, n.text]
    if (isReal(n.href)) out.push({ path: here, url: abs(n.href), section: prefix[0] || n.text })
    if (n.children?.length) out.push(...flatten(n.children, here))
  }
  return out
}

// The in-page feature extractor (runs in the browser).
const EXTRACT = () => {
  const norm = t => (t || '').replace(/\s+/g, ' ').trim()
  const uniq = a => [...new Set(a.filter(Boolean))]
  const texts = (sel, max = 80) => uniq([...document.querySelectorAll(sel)].map(e => norm(e.textContent || e.value)).filter(t => t && t.length <= max))
  // also capture the value text of dropdowns (selected option) so full text includes them
  const out = {
    loginForm: !!document.querySelector('#Password, #userName'),
    breadcrumb: norm(document.querySelector('.breadcrumbs, .breadcrumb, #breadcrumb')?.textContent),
    title: norm(document.querySelector('.content-header h1, h1, .page-title, .panel-title, h2')?.textContent),
    tabs: texts('.nav-tabs a, ul.tabs a, [role=tab], .k-tabstrip-items .k-link, .tabs a, .tab a', 40),
    buttons: texts('button, input[type=submit], input[type=button], a.btn, .btn, .k-button', 40),
    gridColumns: texts('table thead th, .k-grid-header th, .grid-header th, .dataTables_scrollHead th', 50),
    fields: texts('label', 60),
    sections: texts('h3, h4, legend, .panel-heading, .box-title, .widget-title, fieldset > legend', 80),
    questions: uniq([...document.querySelectorAll('label, span, td, p')].map(e => norm(e.textContent)).filter(t => /\?\s*$/.test(t) && t.length <= 140)).slice(0, 12),
    bodyLen: (document.body?.innerText || '').length,
  }
  // Full visible text of the page content — strip repeated chrome (nav/header/sidebar/footer) first.
  try {
    document.querySelectorAll([
      'header', 'footer', '#footer', '#header', '.header', '.header-right', 'nav',
      'ul.main-navigation', '.main-navigation', '#left_f_w', '.left-nav',
      '.drp', '.subnav', '.dropdown', '.custom-dropdown',
      '.t-window', '#SearchWindow', '#ConfigurationWindow', '#FavoriteWindow', '#AlertsWindow',
      'script', 'style', 'noscript', '.k-loading-mask',
    ].join(', ')).forEach(e => e.remove())
  } catch {}
  out.fullText = (document.body?.innerText || '')
    .replace(/\r/g, '')
    .split('\n').map(l => l.replace(/[ \t]+$/, '')).join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  return out
}

const sleep = ms => new Promise(r => setTimeout(r, ms))

// resilient navigation — retry on transient network suspension/timeouts
async function gotoRetry(page, url, tries = 3) {
  let last
  for (let a = 1; a <= tries; a++) {
    try { return await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 }) }
    catch (e) { last = e; await sleep(1500 * a) }
  }
  throw last
}

// acquire an authenticated session, retrying if the network is momentarily suspended
let session
for (let a = 1; ; a++) {
  try { session = await getContext(); break }
  catch (e) { if (a >= 4) throw e; console.log(`session retry ${a}: ${e.message.split('\n')[0]}`); await sleep(4000) }
}

try {
  const { page, ctx } = session
  const data = JSON.parse(await readFile(TREE, 'utf8'))

  // 1) nav-tree leaves
  let targets = flatten(data.tree)

  // 2) Configuration mega-page items — flat <a.t-link.t-in> list; module derived from URL
  if (data.configUrl) {
    await gotoRetry(page, data.configUrl)
    await page.waitForSelector('a.t-link.t-in', { timeout: 15000 }).catch(() => {})
    await page.waitForTimeout(800)
    const cfgItems = await page.evaluate(() => {
      const norm = t => (t || '').replace(/\s+/g, ' ').trim()
      const navTexts = new Set([...document.querySelectorAll('ul.main-navigation a, .drp a, .dropdown a, header a, .subnav a')].map(a => norm(a.textContent)))
      const seen = new Set(), items = []
      for (const a of document.querySelectorAll('a[href]')) {
        const text = norm(a.textContent), href = a.getAttribute('href')
        if (!text || text.length < 2 || text === 'HRMS' || navTexts.has(text)) continue
        if (!href || href === '#' || /^javascript:/i.test(href)) continue
        const key = text + '|' + href
        if (seen.has(key)) continue; seen.add(key)
        items.push({ text, href: new URL(href, location.origin).href })
      }
      return items
    }).catch(() => [])
    console.log(`config items found: ${cfgItems.length}`)
    for (const it of cfgItems) targets.push({ path: ['Configuration', 'HRMS', moduleFromHref(it.href), it.text], url: it.href, section: 'Configuration' })
  }

  // de-dup by url, keep first (shortest) breadcrumb path
  const byUrl = new Map()
  for (const t of targets) if (!byUrl.has(t.url)) byUrl.set(t.url, t)
  targets = [...byUrl.values()]
  if (LIMIT) targets = targets.slice(0, LIMIT)

  // extract from the main frame AND any iframes (the app loads modules async / in frames)
  async function extractAllFrames(pg) {
    const m = { loginForm: false, breadcrumb: '', title: '', tabs: [], buttons: [], gridColumns: [], fields: [], sections: [], questions: [], bodyLen: 0 }
    const ft = []
    for (const fr of pg.frames()) {
      let r
      try { r = await fr.evaluate(EXTRACT) } catch { continue }
      m.loginForm ||= r.loginForm
      m.breadcrumb ||= r.breadcrumb
      m.title ||= r.title
      m.bodyLen = Math.max(m.bodyLen, r.bodyLen || 0)
      for (const k of ['tabs', 'buttons', 'gridColumns', 'fields', 'sections', 'questions'])
        m[k] = [...new Set([...m[k], ...(r[k] || [])])]
      if (r.fullText) ft.push(r.fullText)
    }
    for (const k of ['buttons', 'fields', 'sections']) m[k] = m[k].slice(0, 40)
    m.fullText = [...new Set(ft)].join('\n\n').slice(0, 20000)
    return m
  }

  console.log(`crawling ${targets.length} pages…`)
  const pages = []
  let i = 0
  for (const t of targets) {
    i++
    let rec = { ...t, error: null }
    try {
      const resp = await gotoRetry(page, t.url)
      await page.waitForTimeout(1500)   // fixed settle — this app never reaches networkidle
      rec.status = resp ? resp.status() : null
      rec.finalUrl = page.url()
      Object.assign(rec, await extractAllFrames(page))
      // session expired mid-crawl → re-login once and retry this page
      if (rec.loginForm && CONFIG.pass) {
        await page.goto(CONFIG.url, { waitUntil: 'domcontentloaded' }).catch(() => {})
        const ok = await performLogin(page).catch(() => false)
        if (ok) {
          await ctx.storageState({ path: CONFIG.storage }).catch(() => {})
          await gotoRetry(page, t.url)
          await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {})
          await page.waitForTimeout(500)
          rec = { ...t, error: null, finalUrl: page.url(), reloggedIn: true }
          Object.assign(rec, await extractAllFrames(page))
        }
      }
    } catch (e) {
      rec.error = e.message.slice(0, 120)
    }
    pages.push(rec)
    if (i % 10 === 0 || i === targets.length) console.log(`  [${i}/${targets.length}] ${t.path.join(' > ')}`)
  }

  await writeFile(OUT, JSON.stringify({ baseUrl: CONFIG.url, crawledAt: new Date().toISOString().slice(0, 19), count: pages.length, pages }, null, 2))
  console.log('wrote', OUT, '·', pages.length, 'pages')
  console.log('errors:', pages.filter(p => p.error).length, '· login-bounced:', pages.filter(p => p.loginForm).length)
} finally {
  await session.browser.close()
}
