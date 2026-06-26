/**
 * Stage 3 — render the full Kensium HRMS feature documentation.
 * Reads app/.auth/menu-tree.json (navigation) + app/.auth/pages.json (crawled
 * features) and writes kensiumhr-features.md at the repo root.
 *
 *   node scripts/kensium-doc.mjs
 */
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PAGES = path.join(__dirname, '..', '.auth', 'pages.json')
const TREE  = path.join(__dirname, '..', '.auth', 'menu-tree.json')
const OUT   = path.join(__dirname, '..', '..', 'kensiumhr-features.md')

const SECTION_ORDER = ['Home', 'Configuration', 'Organization', 'Recruitment', 'Employee Management', 'Leave Management', 'More']
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
const isReal = h => h && h !== '#' && !/^javascript:/i.test(h)
const clean = s => (s || '').replace(/\s+/g, ' ').trim()
const line = (label, arr) => (arr && arr.length) ? `- **${label}:** ${arr.join(' · ')}\n` : ''

const { baseUrl, crawledAt, pages } = JSON.parse(await readFile(PAGES, 'utf8'))
const tree = JSON.parse(await readFile(TREE, 'utf8')).tree || []
const origin = baseUrl.replace(/\/$/, '')

// ── authoritative Configuration module-group derivation from item URL ────────
const CTRL_MAP = [
  [/PreExitQuestionnaries|\/Exit\/|ExitManagement|NoticePeriod|Layoff/i, 'Exit'],
  [/SalaryRevision/i, 'Salary Revision'],
  [/Disciplinary/i, 'Disciplinary'],
  [/EmployeeManagement|EmployeeTimeline|EmployeeJoiningFormalities|Acknowledgement|UserDefinedField|CustodianDocument|ChangeApprovers|QuadrantRating|Appreciation|EmployeeLifeEvent|EmployeeDependant|EmployeeVerification/i, 'Employee Management'],
  [/AttendanceConfiguration|AuditPannel|AuditConfigurationSettings/i, 'Attendance Tracking'],
  [/\/Leave\/|LeaveType|HolidayCalendar|\/Calendar\?|FMLA/i, 'Time Off / Leave'],
  [/Confirmation/i, 'Confirmation'],
  [/TrainingManagement/i, 'Learning Management'],
  [/Induction|IPParticipantRule/i, 'Orientation'],
  [/PerformanceReview|KRAPerformance|PerformanceManagement/i, 'Performance Review'],
  [/ResourceManagementConfiguration/i, 'Resource Management'],
  [/TimesheetManagement/i, 'Time Management'],
  [/SurveyConfig/i, 'Surveys'],
  [/TravelManagement/i, 'Travel Management'],
  [/BenefitManagement/i, 'Benefits'],
  [/FeedbackConfiguration/i, 'Feedback / Grievance'],
  [/AssetManagement/i, 'Asset Tracking'],
  [/KTManagement/i, 'Knowledge Transfer'],
  [/HRBudget/i, 'HR Budget'],
  [/Finance/i, 'Tax Planning / Finance'],
  [/AlertConfiguration/i, 'Alerts'],
  [/VendorManagementConfiguration/i, 'Vendor Management'],
  [/AccumaticaIntegration|WrikeIntegration|Integration/i, 'Integrations'],
  [/CalendarSetting/i, 'Calendar'],
  [/ImportData/i, 'Data Import'],
  [/Compensation/i, 'Compensation'],
  [/Security|PasswordPolicy/i, 'Security'],
  [/Agreement/i, 'Agreement'],
  [/LocalizationSettings|\/IOMS\/Organization|EmployeeClassification|LoginPageImages|\/Location|\/Group|\/Role|\/User\/|ThoughtOftheDay|InductionVenue|ConfigureSeries|\/Announcement|PolicyDocument|SupportTeam|DocumentType|MasterCertification|ScheduleJob|\/Vendor\b/i, 'Organization'],
]
const TPL_MAP = { Leave: 'Time Off / Leave', Confirmation: 'Confirmation', Attendance: 'Attendance Tracking', Recruitment: 'Recruitment', Induction: 'Orientation', EmployeeManagement: 'Employee Management', Exit: 'Exit', DisciplinaryAction: 'Disciplinary', Employee: 'Employee Management', TemplateType: 'Recruitment', NotificationTemplates: 'Recruitment', Agreement: 'Agreement' }
function cfgModule(url) {
  let p, seg
  try { p = new URL(url, origin).pathname; seg = p.split('/').filter(Boolean) } catch { return 'General' }
  const ti = seg.findIndex(s => s === 'Templates')
  if (ti >= 0 && seg[ti + 1]) return TPL_MAP[seg[ti + 1].replace(/(Email|Notification|Letter)?Templates?$/i, '')] || 'Templates'
  for (const [re, g] of CTRL_MAP) if (re.test(p)) return g
  if (/\/IOMS\//i.test(p)) return 'Organization'
  if (/\/Configuration\/Configuration\//i.test(p)) return 'Recruitment'
  return 'General'
}

// ── normalize: fix config groups, drop footer junk ──────────────────────────
const cleaned = []
for (const p of pages) {
  if (p.section === 'Configuration' && Array.isArray(p.path) && p.path.length > 2) {
    p.path[2] = cfgModule(p.url)
    const leaf = p.path[p.path.length - 1]
    let pn = ''; try { pn = new URL(p.url, origin).pathname } catch {}
    if (leaf === 'Kensium Solutions' || pn === '/' || pn === '') continue
  }
  cleaned.push(p)
}

const bySection = new Map(SECTION_ORDER.map(s => [s, []]))
for (const p of cleaned) {
  const sec = p.section || p.path[0] || 'Other'
  if (!bySection.has(sec)) bySection.set(sec, [])
  bySection.get(sec).push(p)
}
const cfgPages = bySection.get('Configuration') || []
cfgPages.sort((a, b) => (a.path[2] || '').localeCompare(b.path[2] || '') || (a.path[3] || '').localeCompare(b.path[3] || ''))

const hasFeatures = p => ['tabs', 'gridColumns', 'buttons', 'fields', 'sections', 'questions'].some(k => p[k]?.length)

// ── build the document ──────────────────────────────────────────────────────
let md = ''
md += `# Kensium HRMS — Complete Feature Documentation\n\n`
md += `_Auto-generated from a live authenticated crawl of **${baseUrl}** on ${crawledAt} (KensiumHR v6)._\n`
md += `_Covers **${cleaned.length} pages**: 7 top menus, their sub-menus and sub-sub-menus, and every Configuration screen._\n\n`

md += `## How to read this document\n\n`
md += `Every screen is documented as a **breadcrumb** — \`Top Menu > Sub-item > Sub-sub-item\` — followed by the controls detected on it:\n\n`
md += `- **Tabs** — in-page tab strip\n`
md += `- **List view columns** — columns of the page's data grid\n`
md += `- **Actions / buttons** — buttons & action links (Save, Add new, Search, Export, …)\n`
md += `- **Form fields / inputs** — labelled inputs on the page\n`
md += `- **Configuration questions** — yes/no & policy toggles (mostly on Configuration screens)\n`
md += `- **Sections / panels** — headings dividing the page\n\n`
md += `Configuration items are grouped by **module** (Exit, Time Off / Leave, Attendance Tracking, …), derived from each screen's URL. Pages marked _(no detail captured)_ are dashboards, redirects, or widget-only screens.\n\n`
md += `---\n\n`

// 1. Navigation map (outline from the live menu tree)
md += `## 1. Navigation map\n\n`
md += `The full top-navigation hierarchy as it appears in the app:\n\n`
function outline(nodes, depth = 0) {
  let s = ''
  for (const n of nodes) {
    if (!n.text) continue
    s += `${'  '.repeat(depth)}- ${n.text}\n`
    if (n.children?.length) s += outline(n.children, depth + 1)
  }
  return s
}
md += outline(tree) + '\n'

// Configuration module index
const cfgByModule = new Map()
for (const p of cfgPages) {
  const m = p.path[2] || 'General'
  cfgByModule.set(m, (cfgByModule.get(m) || 0) + 1)
}
md += `**Configuration → HRMS** is a separate mega-page of ${cfgPages.length} settings screens across these modules:\n\n`
md += [...cfgByModule.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([m, n]) => `\`${m}\` (${n})`).join(' · ') + '\n\n'
md += `---\n\n`

// 2. Feature inventory
md += `## 2. Feature inventory\n\n`
md += `| Section | Pages | With features |\n|---|---:|---:|\n`
for (const [sec, arr] of bySection) if (arr.length) md += `| [${sec}](#${slug(sec)}) | ${arr.length} | ${arr.filter(hasFeatures).length} |\n`
md += `\n---\n\n`

for (const [sec, arr] of bySection) {
  if (!arr.length) continue
  md += `## ${sec}\n\n`
  let lastModule = null
  for (const p of arr) {
    if (sec === 'Configuration' && p.path[2] && p.path[2] !== lastModule) {
      lastModule = p.path[2]
      md += `### ▸ ${p.path[2]}\n\n`
    }
    const crumb = p.path.join(' > ')
    md += (sec === 'Configuration' ? '#### ' : '### ') + crumb + '\n\n'
    const rel = (p.finalUrl || p.url || '').replace(origin, '')
    if (rel) md += `\`${rel}\`\n\n`

    if (p.error) { md += `- ⚠️ _crawl error: ${clean(p.error)}_\n\n`; continue }
    if (p.loginForm) { md += `- ⚠️ _session bounced to login (not captured)_\n\n`; continue }

    let body = ''
    body += line('Tabs', p.tabs)
    body += line('List view columns', p.gridColumns)
    body += line('Actions / buttons', p.buttons)
    body += line('Form fields / inputs', p.fields)
    body += line('Configuration questions', p.questions)
    body += line('Sections / panels', p.sections)
    md += (body || `- _(no detail captured — dashboard, redirect, or widget-only screen)_\n`) + '\n'
  }
  md += `---\n\n`
}

// Appendix
const noDetail = cleaned.filter(p => !hasFeatures(p) && !p.error && !p.loginForm)
const probs = cleaned.filter(p => p.error || p.loginForm)
md += `## Appendix — crawl notes\n\n`
md += `- **Pages with no captured detail (${noDetail.length}):** dashboards/redirects/widget screens — listed inline above.\n`
md += `- **Pages needing attention (${probs.length}):**\n`
for (const p of probs) md += `  - ${p.path.join(' > ')} — ${p.error ? 'error: ' + clean(p.error) : 'bounced to login'}\n`
md += `\n_Generated by \`app/scripts/kensium-doc.mjs\` from \`app/.auth/{menu-tree,pages}.json\`. Refresh with \`npm run kensium:map\`._\n`

await writeFile(OUT, md)
console.log('wrote', OUT, '·', md.length, 'chars ·', cleaned.length, 'pages')
