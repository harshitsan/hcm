import { useState } from 'react'
import { ArrowsClockwise, Copy, Eye, PencilSimple, Plus } from 'phosphor-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { useRole } from '@/context/role-context'
import {
  APPROVER_DIRECTORY,
  LETTER_SAMPLE_VALUES,
  type LetterTemplate,
  type OfferApproverRule,
  type RequisitionApproverRule,
} from '../data/config'
import { DEPARTMENTS, EMPLOYEE_CLASSES, LOCATIONS } from '../data/requisitions'
import { POSITION_LEVELS } from '../data/vacancies'
import type { RecruitmentConfigStore } from '../hooks/use-recruitment-config'
import { StatusBadge } from './badges'

/** Substitute {{merge_fields}} with sample values for the letter preview. */
function renderLetter(text: string) {
  return text.replace(
    /\{\{(\w+)\}\}/g,
    (_, field: string) => LETTER_SAMPLE_VALUES[field] ?? `{{${field}}}`
  )
}

/**
 * Approval governance — resource-requisition approver rules with the
 * non-budgeted route, location-based offer approvers with out-of-band salary
 * sign-off, versioned approver-graph publications and recruitment letter
 * templates (TA-15, TA-25, TA-46, TA-48, TA-52, TA-53).
 */
export function ConfigApprovals({
  config,
}: {
  config: RecruitmentConfigStore
}) {
  const { role } = useRole()
  const [reqRuleOpen, setReqRuleOpen] = useState(false)
  const [reqTemplate, setReqTemplate] = useState('')
  const [reqApprover, setReqApprover] = useState<string>(APPROVER_DIRECTORY[0])
  // RRA: reporting-manager hierarchy levels auto-included in the chain
  const [reqRmLevels, setReqRmLevels] = useState('')
  const [offerRuleOpen, setOfferRuleOpen] = useState(false)
  const [offerLocation, setOfferLocation] = useState<string>(LOCATIONS[0])
  const [offerApprover, setOfferApprover] = useState<string>(
    APPROVER_DIRECTORY[0]
  )
  // OFA: hiring-manager hierarchy levels + named additional approvers
  const [offerHmLevels, setOfferHmLevels] = useState('')
  const [offerAdditional, setOfferAdditional] = useState('')
  const [publishOpen, setPublishOpen] = useState(false)
  const [publishSummary, setPublishSummary] = useState('')
  const [viewTemplate, setViewTemplate] = useState<LetterTemplate | null>(null)
  const [templateContent, setTemplateContent] = useState('')
  // LTT: header/footer blocks (logo renders in the header) + sample preview
  const [templateHeader, setTemplateHeader] = useState('')
  const [templateFooter, setTemplateFooter] = useState('')
  const [previewTemplate, setPreviewTemplate] = useState<LetterTemplate | null>(
    null
  )

  // RRA-03/04: multi-criteria filters on requisition approver rules
  const [raClass, setRaClass] = useState('all')
  const [raLocation, setRaLocation] = useState('all')
  const [raDept, setRaDept] = useState('all')
  const [raPosition, setRaPosition] = useState('all')
  const raFiltered = config.requisitionApproverRules.filter(
    (r) =>
      (raClass === 'all' ||
        r.employeeClass === 'All' ||
        r.employeeClass === raClass) &&
      (raLocation === 'all' ||
        r.location === 'All' ||
        r.location === raLocation) &&
      (raDept === 'all' ||
        r.department === 'All' ||
        r.department === raDept) &&
      (raPosition === 'all' ||
        r.position === 'All' ||
        r.position === raPosition)
  )
  const resetRaFilters = () => {
    setRaClass('all')
    setRaLocation('all')
    setRaDept('all')
    setRaPosition('all')
  }

  // RRA-05: edit an existing requisition approver rule
  const [editingReqRule, setEditingReqRule] =
    useState<RequisitionApproverRule | null>(null)
  const [reqRuleDraft, setReqRuleDraft] = useState({
    template: '',
    employeeClass: 'All',
    location: 'All',
    department: 'All',
    position: 'All',
    approvers: '',
    rmLevels: '',
  })

  // OFA-03: edit an existing offer approver rule
  const [editingOfferRule, setEditingOfferRule] =
    useState<OfferApproverRule | null>(null)
  const [offerRuleDraft, setOfferRuleDraft] = useState({
    locations: '',
    employeeClass: 'All',
    approvers: '',
    hmLevels: '',
    additionalApprovers: '',
  })

  return (
    <div className='w-full space-y-5'>
      {/* TA-52: resource-requisition approvers incl. non-budgeted */}
      <section>
        <div className='mb-2 flex items-center justify-between'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            Resource-requisition approvers ({raFiltered.length})
          </h3>
          <Button
            variant='outline'
            className='h-7 gap-1 text-xs'
            onClick={() => setReqRuleOpen(true)}
          >
            <Plus size={12} /> Add rule
          </Button>
        </div>
        {/* RRA-03/04: filter by class / location / department / position */}
        <div className='mb-2 flex flex-wrap items-center gap-2'>
          <Select value={raClass} onValueChange={setRaClass}>
            <SelectTrigger className='h-7 w-[150px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All classes</SelectItem>
              {EMPLOYEE_CLASSES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={raLocation} onValueChange={setRaLocation}>
            <SelectTrigger className='h-7 w-[160px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All locations</SelectItem>
              {LOCATIONS.map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={raDept} onValueChange={setRaDept}>
            <SelectTrigger className='h-7 w-[160px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All departments</SelectItem>
              {DEPARTMENTS.map((d) => (
                <SelectItem key={d} value={d}>
                  {d}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={raPosition} onValueChange={setRaPosition}>
            <SelectTrigger className='h-7 w-[150px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All position levels</SelectItem>
              {POSITION_LEVELS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant='outline'
            className='h-7 px-2 text-xs'
            onClick={resetRaFilters}
          >
            Reset filters
          </Button>
        </div>
        <div className='rounded-[8px] border border-gray-200 bg-white'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template</TableHead>
                <TableHead>Employee class</TableHead>
                <TableHead>Location / Dept / Position</TableHead>
                <TableHead>Approver(s)</TableHead>
                <TableHead>RM levels</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {raFiltered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className='font-medium'>{r.template}</TableCell>
                  <TableCell className='text-sm'>{r.employeeClass}</TableCell>
                  <TableCell className='text-sm'>
                    {r.location} / {r.department} / {r.position}
                  </TableCell>
                  <TableCell className='text-sm'>
                    {r.approvers.join(' → ')}
                  </TableCell>
                  <TableCell className='text-sm'>
                    {r.reportingManagerHierarchyLevels ?? '—'}
                  </TableCell>
                  <TableCell className='text-right'>
                    <Button
                      variant='outline'
                      className='h-6 gap-1 px-2 text-xs'
                      onClick={() => {
                        setEditingReqRule(r)
                        setReqRuleDraft({
                          template: r.template,
                          employeeClass: r.employeeClass,
                          location: r.location,
                          department: r.department,
                          position: r.position,
                          approvers: r.approvers.join(', '),
                          rmLevels:
                            r.reportingManagerHierarchyLevels != null
                              ? String(r.reportingManagerHierarchyLevels)
                              : '',
                        })
                      }}
                    >
                      <PencilSimple size={12} /> View / edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className='mt-2 flex items-center gap-2'>
          <span className='text-sm'>Non-budgeted position approver:</span>
          <Select
            value={config.nonBudgetedApprover}
            onValueChange={config.setNonBudgetedApprover}
          >
            <SelectTrigger className='h-7 w-[200px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {APPROVER_DIRECTORY.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className='text-paragraph-sm text-neutral-1000'>
            Non-budgeted requisitions route here in addition to the standard
            chain.
          </span>
        </div>
      </section>

      {/* TA-46: offer approvers by location + out-of-band */}
      <section>
        <div className='mb-2 flex items-center justify-between'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            Offer approvers by location ({config.offerApproverRules.length})
          </h3>
          <Button
            variant='outline'
            className='h-7 gap-1 text-xs'
            onClick={() => setOfferRuleOpen(true)}
          >
            <Plus size={12} /> Add rule
          </Button>
        </div>
        <div className='rounded-[8px] border border-gray-200 bg-white'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location(s)</TableHead>
                <TableHead>Employee class</TableHead>
                <TableHead>Approver(s)</TableHead>
                <TableHead>HM levels</TableHead>
                <TableHead>Additional approvers</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {config.offerApproverRules.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className='font-medium'>
                    {r.locations.join(', ')}
                  </TableCell>
                  <TableCell className='text-sm'>{r.employeeClass}</TableCell>
                  <TableCell className='text-sm'>
                    {r.approvers.join(' → ')}
                  </TableCell>
                  <TableCell className='text-sm'>
                    {r.hiringManagerHierarchyLevels ?? '—'}
                  </TableCell>
                  <TableCell className='text-sm'>
                    {r.additionalApprovers?.length
                      ? r.additionalApprovers.join(', ')
                      : '—'}
                  </TableCell>
                  <TableCell className='text-right'>
                    <Button
                      variant='outline'
                      className='h-6 gap-1 px-2 text-xs'
                      onClick={() => {
                        setEditingOfferRule(r)
                        setOfferRuleDraft({
                          locations: r.locations.join(', '),
                          employeeClass: r.employeeClass,
                          approvers: r.approvers.join(', '),
                          hmLevels:
                            r.hiringManagerHierarchyLevels != null
                              ? String(r.hiringManagerHierarchyLevels)
                              : '',
                          additionalApprovers: (
                            r.additionalApprovers ?? []
                          ).join(', '),
                        })
                      }}
                    >
                      <PencilSimple size={12} /> Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className='mt-2 flex items-center gap-2'>
          <span className='text-sm'>Out-of-band salary approver:</span>
          <Select
            value={config.outOfBandApprover}
            onValueChange={config.setOutOfBandApprover}
          >
            <SelectTrigger className='h-7 w-[200px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {APPROVER_DIRECTORY.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className='text-paragraph-sm text-neutral-1000'>
            Above-band offers additionally route here before release.
          </span>
        </div>
      </section>

      {/* TA-53: pre-joining HR and network approvers */}
      <section className='rounded-[8px] border border-gray-200 bg-white p-4'>
        <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
          Pre-joining approvers
        </h3>
        <div className='grid gap-3 md:grid-cols-2'>
          <div className='flex items-center gap-2'>
            <span className='text-sm'>HR tasks:</span>
            <Select
              value={config.preJoiningHrApprovers[0]}
              onValueChange={(v) => config.setPreJoiningHrApprovers([v])}
            >
              <SelectTrigger className='h-7 w-[200px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {APPROVER_DIRECTORY.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className='flex items-center gap-2'>
            <span className='text-sm'>IT / network tasks:</span>
            <Select
              value={config.preJoiningNetworkApprovers[0]}
              onValueChange={(v) => config.setPreJoiningNetworkApprovers([v])}
            >
              <SelectTrigger className='h-7 w-[200px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {APPROVER_DIRECTORY.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className='text-paragraph-sm text-neutral-1000 mt-2'>
          HR-side and IT/network pre-joining tasks route to their respective
          approvers; updates apply to subsequent tasks.
        </p>
      </section>

      {/* TA-25: approver graph versions */}
      <section>
        <div className='mb-2 flex items-center justify-between'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            Approver graph — versioned, effective-dated
          </h3>
          <Button className='h-7 text-xs' onClick={() => setPublishOpen(true)}>
            Publish new version
          </Button>
        </div>
        <div className='rounded-[8px] border border-gray-200 bg-white'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Version</TableHead>
                <TableHead>Summary</TableHead>
                <TableHead>Author</TableHead>
                <TableHead>Effective from</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {config.approverGraphVersions
                .slice()
                .sort((a, b) => b.version - a.version)
                .map((v) => (
                  <TableRow key={v.version}>
                    <TableCell className='font-medium'>v{v.version}</TableCell>
                    <TableCell className='text-sm'>{v.summary}</TableCell>
                    <TableCell className='text-sm'>{v.author}</TableCell>
                    <TableCell className='text-sm'>{v.effectiveFrom}</TableCell>
                    <TableCell>
                      <StatusBadge status={v.status} />
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
        <p className='text-paragraph-sm text-neutral-1000 mt-1.5'>
          Subsequent submissions follow the new routing; in-flight approvals
          retain the version they started under.
        </p>
      </section>

      {/* TA-15, TA-48: letter templates by letter type */}
      <section>
        <div className='mb-2 flex items-center justify-between'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            Letter templates ({config.letterTemplates.length})
          </h3>
          {/* LTT-03: refresh the letter template list */}
          <Button
            variant='outline'
            className='h-7 gap-1 text-xs'
            onClick={() =>
              toast.success(
                'Letter template list refreshed — showing the latest templates'
              )
            }
          >
            <ArrowsClockwise size={12} weight='bold' /> Refresh
          </Button>
        </div>
        <div className='rounded-[8px] border border-gray-200 bg-white'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Template ID</TableHead>
                <TableHead>Letter type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Merge fields</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {config.letterTemplates.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className='font-medium'>{t.id}</TableCell>
                  <TableCell className='text-sm'>{t.letterType}</TableCell>
                  <TableCell className='text-sm'>{t.description}</TableCell>
                  <TableCell className='text-paragraph-sm text-neutral-1000'>
                    {t.mergeFields.map((f) => `{{${f}}}`).join(' ')}
                  </TableCell>
                  <TableCell className='text-sm'>v{t.version}</TableCell>
                  <TableCell>
                    <Switch
                      checked={t.active}
                      onCheckedChange={() => config.toggleLetterTemplate(t.id)}
                    />
                  </TableCell>
                  <TableCell className='text-right'>
                    <div className='flex justify-end gap-1'>
                      {/* LTT: preview with sample merge values */}
                      <Button
                        variant='outline'
                        className='h-6 gap-1 px-2 text-xs'
                        onClick={() => setPreviewTemplate(t)}
                      >
                        <Eye size={12} /> Preview
                      </Button>
                      {/* LTT: clone as the starting point for a new template */}
                      <Button
                        variant='outline'
                        className='h-6 gap-1 px-2 text-xs'
                        onClick={() => config.cloneLetterTemplate(t.id)}
                      >
                        <Copy size={12} /> Clone
                      </Button>
                      <Button
                        variant='outline'
                        className='h-6 px-2 text-xs'
                        onClick={() => {
                          setViewTemplate(t)
                          setTemplateContent(t.content)
                          setTemplateHeader(t.header ?? '')
                          setTemplateFooter(t.footer ?? '')
                        }}
                      >
                        View / edit
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className='text-paragraph-sm text-neutral-1000 mt-1.5'>
          Inactive templates are not selectable when generating letters;
          existing generated offers retain the version they were created from.
        </p>
      </section>

      {/* Add requisition approver rule */}
      <Dialog open={reqRuleOpen} onOpenChange={setReqRuleOpen}>
        <DialogContent className='sm:max-w-[380px]'>
          <DialogHeader>
            <DialogTitle>Add resource-requisition approver rule</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <Input
              placeholder='Template name'
              value={reqTemplate}
              onChange={(e) => setReqTemplate(e.target.value)}
            />
            <Select value={reqApprover} onValueChange={setReqApprover}>
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {APPROVER_DIRECTORY.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* RRA: N levels of the requester's reporting-manager chain */}
            <Input
              type='number'
              min={0}
              placeholder='Reporting-manager hierarchy levels (blank = none)'
              value={reqRmLevels}
              onChange={(e) => setReqRmLevels(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setReqRuleOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!reqTemplate}
              onClick={() => {
                config.addRequisitionApproverRule({
                  template: reqTemplate,
                  employeeClass: 'All',
                  location: 'All',
                  department: 'All',
                  position: 'All',
                  approvers: [reqApprover],
                  reportingManagerHierarchyLevels:
                    reqRmLevels === '' ? null : Number(reqRmLevels),
                })
                setReqRuleOpen(false)
                setReqTemplate('')
                setReqRmLevels('')
              }}
            >
              Save rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add offer approver rule */}
      <Dialog open={offerRuleOpen} onOpenChange={setOfferRuleOpen}>
        <DialogContent className='sm:max-w-[380px]'>
          <DialogHeader>
            <DialogTitle>Add offer approver rule</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <Select value={offerLocation} onValueChange={setOfferLocation}>
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOCATIONS.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={offerApprover} onValueChange={setOfferApprover}>
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {APPROVER_DIRECTORY.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* OFA: N levels of the hiring-manager chain approve first */}
            <Input
              type='number'
              min={0}
              placeholder='Hiring-manager hierarchy levels (blank = none)'
              value={offerHmLevels}
              onChange={(e) => setOfferHmLevels(e.target.value)}
            />
            <Input
              placeholder='Additional approvers, comma separated'
              value={offerAdditional}
              onChange={(e) => setOfferAdditional(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setOfferRuleOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                config.addOfferApproverRule({
                  locations: [offerLocation],
                  employeeClass: 'All',
                  approvers: [offerApprover],
                  hiringManagerHierarchyLevels:
                    offerHmLevels === '' ? null : Number(offerHmLevels),
                  additionalApprovers: offerAdditional
                    .split(',')
                    .map((a) => a.trim())
                    .filter(Boolean),
                })
                setOfferRuleOpen(false)
                setOfferHmLevels('')
                setOfferAdditional('')
              }}
            >
              Save rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Publish approver graph version */}
      <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
        <DialogContent className='sm:max-w-[420px]'>
          <DialogHeader>
            <DialogTitle>Publish approver graph version</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder='Summary of routing changes (levels, thresholds, approvers)'
            value={publishSummary}
            onChange={(e) => setPublishSummary(e.target.value)}
            rows={3}
          />
          <DialogFooter>
            <Button variant='outline' onClick={() => setPublishOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!publishSummary}
              onClick={() => {
                config.publishApproverGraph(publishSummary, role)
                setPublishOpen(false)
                setPublishSummary('')
              }}
            >
              Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View / edit letter template — header, body, footer + merge chips */}
      <Dialog
        open={viewTemplate !== null}
        onOpenChange={(o) => !o && setViewTemplate(null)}
      >
        <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-[520px]'>
          <DialogHeader>
            <DialogTitle>
              {viewTemplate?.name} ({viewTemplate?.letterType}, v
              {viewTemplate?.version})
            </DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div>
              <p className='text-paragraph-sm text-neutral-1000 mb-1'>
                Header — the company logo renders inside this block
              </p>
              <Textarea
                value={templateHeader}
                onChange={(e) => setTemplateHeader(e.target.value)}
                rows={2}
              />
            </div>
            <div>
              <p className='text-paragraph-sm text-neutral-1000 mb-1'>Body</p>
              <Textarea
                value={templateContent}
                onChange={(e) => setTemplateContent(e.target.value)}
                rows={5}
              />
            </div>
            <div>
              <p className='text-paragraph-sm text-neutral-1000 mb-1'>Footer</p>
              <Textarea
                value={templateFooter}
                onChange={(e) => setTemplateFooter(e.target.value)}
                rows={2}
              />
            </div>
            {/* Click a merge field to append it to the body */}
            <div>
              <p className='text-paragraph-sm text-neutral-1000 mb-1.5'>
                Merge fields — click to insert into the body
              </p>
              <div className='flex flex-wrap gap-1.5'>
                {viewTemplate?.mergeFields.map((f) => (
                  <button
                    key={f}
                    type='button'
                    onClick={() =>
                      setTemplateContent((prev) =>
                        `${prev}${prev && !prev.endsWith(' ') ? ' ' : ''}{{${f}}}`
                      )
                    }
                    className='text-neutral-1000 rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-xs transition-colors hover:border-gray-300'
                  >
                    {`{{${f}}}`}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setViewTemplate(null)}>
              Close
            </Button>
            <Button
              disabled={
                templateContent === viewTemplate?.content &&
                templateHeader === (viewTemplate?.header ?? '') &&
                templateFooter === (viewTemplate?.footer ?? '')
              }
              onClick={() => {
                if (viewTemplate)
                  config.updateLetterTemplate(viewTemplate.id, templateContent, {
                    header: templateHeader,
                    footer: templateFooter,
                  })
                setViewTemplate(null)
              }}
            >
              Save as new version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* LTT: preview a letter template with sample merge values */}
      <Dialog
        open={previewTemplate !== null}
        onOpenChange={(o) => !o && setPreviewTemplate(null)}
      >
        <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-[520px]'>
          <DialogHeader>
            <DialogTitle>Preview — {previewTemplate?.name}</DialogTitle>
          </DialogHeader>
          {previewTemplate && (
            <div className='rounded-[8px] border border-gray-200 bg-white'>
              {previewTemplate.header && (
                <p className='text-paragraph-sm text-neutral-1000 border-b border-gray-200 px-4 py-2'>
                  {renderLetter(previewTemplate.header)}
                </p>
              )}
              <p className='px-4 py-3 text-sm whitespace-pre-wrap'>
                {renderLetter(previewTemplate.content)}
              </p>
              {previewTemplate.footer && (
                <p className='text-paragraph-sm text-neutral-1000 border-t border-gray-200 px-4 py-2'>
                  {renderLetter(previewTemplate.footer)}
                </p>
              )}
            </div>
          )}
          <p className='text-paragraph-sm text-neutral-1000'>
            Rendered with sample values — actual letters substitute the
            candidate's real details.
          </p>
          <DialogFooter>
            <Button variant='outline' onClick={() => setPreviewTemplate(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* RRA-05: view / edit requisition approver rule */}
      <Dialog
        open={editingReqRule !== null}
        onOpenChange={(o) => !o && setEditingReqRule(null)}
      >
        <DialogContent className='sm:max-w-[440px]'>
          <DialogHeader>
            <DialogTitle>Edit resource-requisition approver rule</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <Input
              placeholder='Template name'
              value={reqRuleDraft.template}
              onChange={(e) =>
                setReqRuleDraft((d) => ({ ...d, template: e.target.value }))
              }
            />
            <div className='grid grid-cols-2 gap-3'>
              <Select
                value={reqRuleDraft.employeeClass}
                onValueChange={(v) =>
                  setReqRuleDraft((d) => ({ ...d, employeeClass: v }))
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['All', ...EMPLOYEE_CLASSES].map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={reqRuleDraft.location}
                onValueChange={(v) =>
                  setReqRuleDraft((d) => ({ ...d, location: v }))
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['All', ...LOCATIONS].map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={reqRuleDraft.department}
                onValueChange={(v) =>
                  setReqRuleDraft((d) => ({ ...d, department: v }))
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['All', ...DEPARTMENTS].map((x) => (
                    <SelectItem key={x} value={x}>
                      {x}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={reqRuleDraft.position}
                onValueChange={(v) =>
                  setReqRuleDraft((d) => ({ ...d, position: v }))
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['All', ...POSITION_LEVELS].map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              placeholder='Approvers, comma separated (in order)'
              value={reqRuleDraft.approvers}
              onChange={(e) =>
                setReqRuleDraft((d) => ({ ...d, approvers: e.target.value }))
              }
            />
            {/* RRA: N levels of the requester's reporting-manager chain */}
            <Input
              type='number'
              min={0}
              placeholder='Reporting-manager hierarchy levels (blank = none)'
              value={reqRuleDraft.rmLevels}
              onChange={(e) =>
                setReqRuleDraft((d) => ({ ...d, rmLevels: e.target.value }))
              }
            />
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setEditingReqRule(null)}>
              Cancel
            </Button>
            <Button
              disabled={!reqRuleDraft.template || !reqRuleDraft.approvers}
              onClick={() => {
                if (editingReqRule)
                  config.updateRequisitionApproverRule(editingReqRule.id, {
                    template: reqRuleDraft.template,
                    employeeClass: reqRuleDraft.employeeClass,
                    location: reqRuleDraft.location,
                    department: reqRuleDraft.department,
                    position: reqRuleDraft.position,
                    approvers: reqRuleDraft.approvers
                      .split(',')
                      .map((a) => a.trim())
                      .filter(Boolean),
                    reportingManagerHierarchyLevels:
                      reqRuleDraft.rmLevels === ''
                        ? null
                        : Number(reqRuleDraft.rmLevels),
                  })
                setEditingReqRule(null)
              }}
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* OFA-03: edit offer approver rule */}
      <Dialog
        open={editingOfferRule !== null}
        onOpenChange={(o) => !o && setEditingOfferRule(null)}
      >
        <DialogContent className='sm:max-w-[420px]'>
          <DialogHeader>
            <DialogTitle>Edit offer approver rule</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <Input
              placeholder='Locations, comma separated'
              value={offerRuleDraft.locations}
              onChange={(e) =>
                setOfferRuleDraft((d) => ({ ...d, locations: e.target.value }))
              }
            />
            <Select
              value={offerRuleDraft.employeeClass}
              onValueChange={(v) =>
                setOfferRuleDraft((d) => ({ ...d, employeeClass: v }))
              }
            >
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['All', ...EMPLOYEE_CLASSES].map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder='Approvers, comma separated (in order)'
              value={offerRuleDraft.approvers}
              onChange={(e) =>
                setOfferRuleDraft((d) => ({ ...d, approvers: e.target.value }))
              }
            />
            {/* OFA: N levels of the hiring-manager chain approve first */}
            <Input
              type='number'
              min={0}
              placeholder='Hiring-manager hierarchy levels (blank = none)'
              value={offerRuleDraft.hmLevels}
              onChange={(e) =>
                setOfferRuleDraft((d) => ({ ...d, hmLevels: e.target.value }))
              }
            />
            <Input
              placeholder='Additional approvers, comma separated'
              value={offerRuleDraft.additionalApprovers}
              onChange={(e) =>
                setOfferRuleDraft((d) => ({
                  ...d,
                  additionalApprovers: e.target.value,
                }))
              }
            />
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setEditingOfferRule(null)}>
              Cancel
            </Button>
            <Button
              disabled={!offerRuleDraft.locations || !offerRuleDraft.approvers}
              onClick={() => {
                if (editingOfferRule)
                  config.updateOfferApproverRule(editingOfferRule.id, {
                    locations: offerRuleDraft.locations
                      .split(',')
                      .map((l) => l.trim())
                      .filter(Boolean),
                    employeeClass: offerRuleDraft.employeeClass,
                    approvers: offerRuleDraft.approvers
                      .split(',')
                      .map((a) => a.trim())
                      .filter(Boolean),
                    hiringManagerHierarchyLevels:
                      offerRuleDraft.hmLevels === ''
                        ? null
                        : Number(offerRuleDraft.hmLevels),
                    additionalApprovers: offerRuleDraft.additionalApprovers
                      .split(',')
                      .map((a) => a.trim())
                      .filter(Boolean),
                  })
                setEditingOfferRule(null)
              }}
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
