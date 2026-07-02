import { useState } from 'react'
import { Plus } from 'phosphor-react'
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
import { APPROVER_DIRECTORY, type LetterTemplate } from '../data/config'
import { LOCATIONS } from '../data/requisitions'
import type { RecruitmentConfigStore } from '../hooks/use-recruitment-config'
import { StatusBadge } from './badges'

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
  const [offerRuleOpen, setOfferRuleOpen] = useState(false)
  const [offerLocation, setOfferLocation] = useState<string>(LOCATIONS[0])
  const [offerApprover, setOfferApprover] = useState<string>(
    APPROVER_DIRECTORY[0]
  )
  const [publishOpen, setPublishOpen] = useState(false)
  const [publishSummary, setPublishSummary] = useState('')
  const [viewTemplate, setViewTemplate] = useState<LetterTemplate | null>(null)
  const [templateContent, setTemplateContent] = useState('')

  return (
    <div className='w-full space-y-5'>
      {/* TA-52: resource-requisition approvers incl. non-budgeted */}
      <section>
        <div className='mb-2 flex items-center justify-between'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            Resource-requisition approvers ({config.requisitionApproverRules.length})
          </h3>
          <Button
            variant='outline'
            className='h-7 gap-1 text-xs'
            onClick={() => setReqRuleOpen(true)}
          >
            <Plus size={12} /> Add rule
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {config.requisitionApproverRules.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className='font-medium'>{r.template}</TableCell>
                  <TableCell className='text-sm'>{r.employeeClass}</TableCell>
                  <TableCell className='text-sm'>
                    {r.location} / {r.department} / {r.position}
                  </TableCell>
                  <TableCell className='text-sm'>
                    {r.approvers.join(' → ')}
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
        <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
          Letter templates ({config.letterTemplates.length})
        </h3>
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
                    <Button
                      variant='outline'
                      className='h-6 px-2 text-xs'
                      onClick={() => {
                        setViewTemplate(t)
                        setTemplateContent(t.content)
                      }}
                    >
                      View / edit
                    </Button>
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
                })
                setReqRuleOpen(false)
                setReqTemplate('')
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
                })
                setOfferRuleOpen(false)
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

      {/* View / edit letter template */}
      <Dialog
        open={viewTemplate !== null}
        onOpenChange={(o) => !o && setViewTemplate(null)}
      >
        <DialogContent className='sm:max-w-[480px]'>
          <DialogHeader>
            <DialogTitle>
              {viewTemplate?.name} ({viewTemplate?.letterType}, v
              {viewTemplate?.version})
            </DialogTitle>
          </DialogHeader>
          <Textarea
            value={templateContent}
            onChange={(e) => setTemplateContent(e.target.value)}
            rows={5}
          />
          <p className='text-paragraph-sm text-neutral-1000'>
            Merge fields:{' '}
            {viewTemplate?.mergeFields.map((f) => `{{${f}}}`).join(' ')}
          </p>
          <DialogFooter>
            <Button variant='outline' onClick={() => setViewTemplate(null)}>
              Close
            </Button>
            <Button
              disabled={templateContent === viewTemplate?.content}
              onClick={() => {
                if (viewTemplate)
                  config.updateLetterTemplate(viewTemplate.id, templateContent)
                setViewTemplate(null)
              }}
            >
              Save as new version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
