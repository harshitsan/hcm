/**
 * Build a compact capability digest of the crawled Kensium HRMS for design work.
 * Reads app/.auth/{pages,menu-tree}.json → writes a concise module → screens →
 * (entities/actions) outline to the path given as argv[2] (or stdout).
 */
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const { baseUrl, pages } = JSON.parse(await readFile(path.join(__dirname, '..', '.auth', 'pages.json'), 'utf8'))
const origin = baseUrl.replace(/\/$/, '')

// reuse the doc generator's module mapping
const CTRL_MAP = [
  [/PreExitQuestionnaries|\/Exit\/|ExitManagement|NoticePeriod|Layoff/i, 'Exit'], [/SalaryRevision/i, 'Salary Revision'],
  [/Disciplinary/i, 'Disciplinary'], [/EmployeeManagement|EmployeeTimeline|EmployeeJoiningFormalities|Acknowledgement|UserDefinedField|CustodianDocument|ChangeApprovers|QuadrantRating|Appreciation|EmployeeLifeEvent|EmployeeDependant|EmployeeVerification/i, 'Employee Management'],
  [/AttendanceConfiguration|AuditPannel|AuditConfigurationSettings/i, 'Attendance Tracking'], [/\/Leave\/|LeaveType|HolidayCalendar|\/Calendar\?|FMLA/i, 'Time Off / Leave'],
  [/Confirmation/i, 'Confirmation'], [/TrainingManagement/i, 'Learning Management'], [/Induction|IPParticipantRule/i, 'Orientation'],
  [/PerformanceReview|KRAPerformance|PerformanceManagement/i, 'Performance Review'], [/ResourceManagementConfiguration/i, 'Resource Management'],
  [/TimesheetManagement/i, 'Time Management'], [/SurveyConfig/i, 'Surveys'], [/TravelManagement/i, 'Travel Management'],
  [/BenefitManagement/i, 'Benefits'], [/FeedbackConfiguration/i, 'Feedback / Grievance'], [/AssetManagement/i, 'Asset Tracking'],
  [/KTManagement/i, 'Knowledge Transfer'], [/HRBudget/i, 'HR Budget'], [/Finance/i, 'Tax Planning / Finance'],
  [/AlertConfiguration/i, 'Alerts'], [/VendorManagementConfiguration/i, 'Vendor Management'], [/AccumaticaIntegration|WrikeIntegration|Integration/i, 'Integrations'],
  [/CalendarSetting/i, 'Calendar'], [/ImportData/i, 'Data Import'], [/Compensation/i, 'Compensation'], [/Security|PasswordPolicy/i, 'Security'], [/Agreement/i, 'Agreement'],
  [/LocalizationSettings|\/IOMS\/Organization|EmployeeClassification|LoginPageImages|\/Location|\/Group|\/Role|\/User\/|ThoughtOftheDay|InductionVenue|ConfigureSeries|\/Announcement|PolicyDocument|SupportTeam|DocumentType|MasterCertification|ScheduleJob|\/Vendor\b/i, 'Organization'],
]
const TPL_MAP = { Leave: 'Time Off / Leave', Confirmation: 'Confirmation', Attendance: 'Attendance Tracking', Recruitment: 'Recruitment', Induction: 'Orientation', EmployeeManagement: 'Employee Management', Exit: 'Exit', DisciplinaryAction: 'Disciplinary', Employee: 'Employee Management', TemplateType: 'Recruitment', NotificationTemplates: 'Recruitment', Agreement: 'Agreement' }
function cfgModule(url) {
  let p, seg; try { p = new URL(url, origin).pathname; seg = p.split('/').filter(Boolean) } catch { return 'General' }
  const ti = seg.findIndex(s => s === 'Templates')
  if (ti >= 0 && seg[ti + 1]) return TPL_MAP[seg[ti + 1].replace(/(Email|Notification|Letter)?Templates?$/i, '')] || 'Templates'
  for (const [re, g] of CTRL_MAP) if (re.test(p)) return g
  if (/\/IOMS\//i.test(p)) return 'Organization'
  if (/\/Configuration\/Configuration\//i.test(p)) return 'Recruitment'
  return 'General'
}

const trim = (arr, n) => (arr || []).slice(0, n)
const screenLine = p => {
  const leaf = p.path[p.path.length - 1]
  const cols = trim(p.gridColumns, 8)
  const flds = trim(p.fields, 10)
  const btns = trim(p.buttons, 8)
  const bits = []
  if (cols.length) bits.push(`grid[${cols.join(', ')}]`)
  if (flds.length) bits.push(`fields[${flds.join(', ')}]`)
  if (btns.length) bits.push(`actions[${btns.join(', ')}]`)
  return `  - ${leaf}${bits.length ? ' — ' + bits.join('; ') : ''}`
}

// group: operational sections + configuration modules
const groups = new Map()
for (const p of pages) {
  let g
  if (p.section === 'Configuration' && p.path.length > 2) g = 'CONFIG · ' + cfgModule(p.url)
  else g = (p.section || p.path[0])
  if (!groups.has(g)) groups.set(g, [])
  groups.get(g).push(p)
}

let out = `# Kensium HRMS — Capability Digest (for design)\n\n`
out += `Source: live crawl of ${origin}, ${pages.length} screens. Format: module → screens with detected grid columns (entities), form fields, and actions.\n\n`
const order = ['Home', 'Organization', 'Recruitment', 'Employee Management', 'Leave Management', 'More']
const keys = [...groups.keys()]
const sorted = [...order.filter(k => groups.has(k)), ...keys.filter(k => k.startsWith('CONFIG')).sort(), ...keys.filter(k => !order.includes(k) && !k.startsWith('CONFIG'))]
for (const g of sorted) {
  const arr = groups.get(g)
  out += `## ${g} (${arr.length})\n`
  for (const p of arr) out += screenLine(p) + '\n'
  out += '\n'
}
process.stdout.write(out)
