import { useState } from 'react'
import { ArrowsClockwise, PencilSimple, Plus } from 'phosphor-react'
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
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
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
import {
  ASSIGNMENT_METHODS,
  APPROVER_DIRECTORY,
  DEFAULT_POST_TEMPLATE,
  PUBLISH_MODES,
  RECRUITMENT_POSITIONS,
  type AssignmentMethod,
  type PostingApproverRule,
  type PostingChannel,
  type PublishMode,
} from '../data/config'
import { DEPARTMENTS, LOCATIONS, RECRUITERS } from '../data/requisitions'
import type { RecruitmentConfigStore } from '../hooks/use-recruitment-config'
import { StatusBadge } from './badges'

const METHOD_HELP: Record<AssignmentMethod, string> = {
  manual: 'An authorised user assigns each vacancy to a recruiter directly.',
  'round-robin':
    'New vacancies distribute sequentially to recruiters by functional location.',
  workload:
    "New vacancies assign based on each recruiter's current open-vacancy capacity.",
}

/** Channel types that integrate through an app key/secret (per the PDF). */
const CREDENTIALED_TYPES: Array<PostingChannel['type']> = ['Social', 'Job Board']

/** Sample values substituted into the post-template preview. */
const POST_SAMPLE_VALUES: Record<string, string> = {
  position: 'Senior Backend Engineer',
  department: 'Engineering',
  location: 'Bengaluru',
  apply_link: 'careers.satellitehr.in/jobs/vac-1024',
}

function renderPostTemplate(template: string) {
  return template.replace(
    /\{\{(\w+)\}\}/g,
    (m, key: string) => POST_SAMPLE_VALUES[key] ?? m
  )
}

/** Toggle-chip multi-pick where 'All' is exclusive of specific values. */
function ChipPicker({
  label,
  options,
  selected,
  onChange,
}: {
  label: string
  options: readonly string[]
  selected: string[]
  onChange: (next: string[]) => void
}) {
  const toggle = (opt: string) => {
    if (opt === 'All') return onChange(['All'])
    const without = selected.filter((s) => s !== 'All' && s !== opt)
    onChange(
      selected.includes(opt)
        ? without.length
          ? without
          : ['All']
        : [...without, opt]
    )
  }
  return (
    <div>
      <p className='text-paragraph-sm text-neutral-1000 mb-1.5'>{label}</p>
      <div className='flex flex-wrap gap-1.5'>
        {['All', ...options].map((opt) => {
          const active = selected.includes(opt)
          return (
            <button
              key={opt}
              type='button'
              onClick={() => toggle(opt)}
              className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                active
                  ? 'border-blue-1200 bg-blue-150 text-blue-1400 font-medium'
                  : 'border-gray-200 bg-white text-neutral-1000 hover:border-gray-300'
              }`}
            >
              {opt}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Sourcing configuration — vacancy assignment method, posting channels,
 * posting-source approvers, talent-pool mailbox import and recruiter
 * strengths (TA-35, TA-37, TA-38, TA-40, TA-56).
 */
export function ConfigSourcing({ config }: { config: RecruitmentConfigStore }) {
  const [channelOpen, setChannelOpen] = useState(false)
  // PCH-02: the same dialog adds a new channel or edits an existing one
  const [editingChannel, setEditingChannel] = useState<PostingChannel | null>(
    null
  )
  const [chDraft, setChDraft] = useState({
    name: '',
    channel: '',
    type: 'Job Board' as PostingChannel['type'],
    postingMode: 'External' as PostingChannel['postingMode'],
    publishMode: 'Real Time' as PublishMode,
    appKey: '',
    appSecret: '',
    applicableLocations: ['All'] as string[],
    applicableDepartments: ['All'] as string[],
    applicablePositions: ['All'] as string[],
  })

  const openChannelForm = (c: PostingChannel | null) => {
    setEditingChannel(c)
    setChDraft(
      c
        ? {
            name: c.name,
            channel: c.channel,
            type: c.type,
            postingMode: c.postingMode,
            publishMode: c.publishMode ?? 'Manual',
            appKey: c.credentials?.appKey ?? '',
            appSecret: c.credentials?.appSecret ?? '',
            applicableLocations: c.applicableLocations ?? ['All'],
            applicableDepartments: c.applicableDepartments ?? ['All'],
            applicablePositions: c.applicablePositions ?? ['All'],
          }
        : {
            name: '',
            channel: '',
            type: 'Job Board',
            postingMode: 'External',
            publishMode: 'Real Time',
            appKey: '',
            appSecret: '',
            applicableLocations: ['All'],
            applicableDepartments: ['All'],
            applicablePositions: ['All'],
          }
    )
    setChannelOpen(true)
  }

  const saveChannel = () => {
    const payload = {
      name: chDraft.name,
      channel: chDraft.channel,
      type: chDraft.type,
      postingMode: chDraft.postingMode,
      publishMode: chDraft.publishMode,
      // Legacy display string migrated from the structured applicability
      applicability: chDraft.applicableDepartments.includes('All')
        ? 'All departments'
        : chDraft.applicableDepartments.join(', '),
      credentials: CREDENTIALED_TYPES.includes(chDraft.type)
        ? { appKey: chDraft.appKey, appSecret: chDraft.appSecret }
        : undefined,
      applicableLocations: chDraft.applicableLocations,
      applicableDepartments: chDraft.applicableDepartments,
      applicablePositions: chDraft.applicablePositions,
    }
    if (editingChannel) config.updatePostingChannel(editingChannel.id, payload)
    else config.addPostingChannel({ ...payload, postTemplate: DEFAULT_POST_TEMPLATE })
    setChannelOpen(false)
  }

  // Post template edit + preview dialog
  const [templateChannel, setTemplateChannel] = useState<PostingChannel | null>(
    null
  )
  const [postTemplateDraft, setPostTemplateDraft] = useState('')

  // Mailbox change-password dialog (nothing is stored)
  const [pwdOpen, setPwdOpen] = useState(false)
  const [pwdDraft, setPwdDraft] = useState({ next: '', confirm: '' })
  const [ruleOpen, setRuleOpen] = useState(false)
  const [ruleMode, setRuleMode] =
    useState<PostingChannel['postingMode']>('External')
  const [ruleApprover, setRuleApprover] = useState<string>(APPROVER_DIRECTORY[0])
  // PSA-02: edit an existing posting-source approver rule
  const [_editingRule, setEditingRule] = useState<PostingApproverRule | null>(
    null
  )
  const [_editRuleDraft, setEditRuleDraft] = useState({
    postingMode: 'External' as PostingChannel['postingMode'],
    location: 'All',
    approvers: '',
  })
  const [mailboxDraft, setMailboxDraft] = useState(config.mailbox)
  const [strengthOpen, setStrengthOpen] = useState(false)
  const [strengthDraft, setStrengthDraft] = useState({
    recruiter: RECRUITERS[0] as string,
    strengths: '',
    applicability: '',
  })

  return (
    <div className='w-full space-y-5'>
      {/* TA-35: vacancy assignment method */}
      <section className='rounded-[8px] border border-gray-200 bg-white p-4'>
        <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
          Vacancy-to-recruiter assignment method
        </h3>
        <RadioGroup
          value={config.assignmentMethod}
          onValueChange={(v) => config.setAssignmentMethod(v as AssignmentMethod)}
          className='space-y-1.5'
        >
          {ASSIGNMENT_METHODS.map((m) => (
            <div key={m} className='flex items-start gap-2'>
              <RadioGroupItem value={m} id={`am-${m}`} className='mt-0.5' />
              <Label htmlFor={`am-${m}`} className='flex flex-col items-start'>
                <span className='capitalize'>{m.replace('-', ' ')}</span>
                <span className='text-paragraph-sm text-neutral-1000 font-normal'>
                  {METHOD_HELP[m]}
                </span>
              </Label>
            </div>
          ))}
        </RadioGroup>
        <p className='text-paragraph-sm text-neutral-1000 mt-2'>
          Changing the method affects subsequent assignments only; existing
          assignments are unaffected.
        </p>
      </section>

      {/* TA-37: posting channels */}
      <section>
        <div className='mb-2 flex items-center justify-between'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            Posting channels ({config.postingChannels.length})
          </h3>
          <div className='flex items-center gap-2'>
            {/* PCH-03: refresh the posting channel list */}
            <Button
              variant='outline'
              className='h-7 gap-1 text-xs'
              onClick={() =>
                toast.success(
                  'Posting channel list refreshed — showing the latest channels'
                )
              }
            >
              <ArrowsClockwise size={12} weight='bold' /> Refresh
            </Button>
            <Button
              variant='outline'
              className='h-7 gap-1 text-xs'
              onClick={() => openChannelForm(null)}
            >
              <Plus size={12} /> Add channel
            </Button>
          </div>
        </div>
        <div className='rounded-[8px] border border-gray-200 bg-white'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Posting mode</TableHead>
                <TableHead>Publish</TableHead>
                <TableHead>Applicability</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {config.postingChannels.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className='font-medium'>{c.name}</TableCell>
                  <TableCell className='text-sm'>{c.channel}</TableCell>
                  <TableCell className='text-sm'>{c.type}</TableCell>
                  <TableCell className='text-sm'>{c.postingMode}</TableCell>
                  <TableCell className='text-sm'>
                    {c.publishMode ?? 'Manual'}
                  </TableCell>
                  <TableCell className='text-sm'>{c.applicability}</TableCell>
                  <TableCell>
                    <StatusBadge status={c.active ? 'active' : 'inactive'} />
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={c.active}
                      onCheckedChange={() => config.togglePostingChannel(c.id)}
                    />
                  </TableCell>
                  <TableCell className='text-right'>
                    <div className='flex justify-end gap-1'>
                      {/* Post template edit + preview */}
                      <Button
                        variant='outline'
                        className='h-6 px-2 text-xs'
                        onClick={() => {
                          setTemplateChannel(c)
                          setPostTemplateDraft(
                            c.postTemplate ?? DEFAULT_POST_TEMPLATE
                          )
                        }}
                      >
                        Post template
                      </Button>
                      {/* PCH-02: view / edit the channel configuration */}
                      <Button
                        variant='outline'
                        className='h-6 gap-1 px-2 text-xs'
                        onClick={() => openChannelForm(c)}
                      >
                        <PencilSimple size={12} /> View / edit
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className='text-paragraph-sm text-neutral-1000 mt-1.5'>
          Deactivated channels are not selectable when creating a posting.
        </p>
      </section>

      {/* TA-38: posting-source approvers */}
      <section>
        <div className='mb-2 flex items-center justify-between'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            Posting-source approvers ({config.postingApproverRules.length})
          </h3>
          <Button
            variant='outline'
            className='h-7 gap-1 text-xs'
            onClick={() => setRuleOpen(true)}
          >
            <Plus size={12} /> Add rule
          </Button>
        </div>
        <div className='rounded-[8px] border border-gray-200 bg-white'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Posting mode</TableHead>
                <TableHead>Employee class</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Approver(s)</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {config.postingApproverRules.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className='font-medium'>{r.postingMode}</TableCell>
                  <TableCell className='text-sm'>{r.employeeClass}</TableCell>
                  <TableCell className='text-sm'>{r.location}</TableCell>
                  <TableCell className='text-sm'>
                    {r.approvers.join(', ')}
                  </TableCell>
                  <TableCell className='text-right'>
                    {/* PSA-02: edit the approver rule */}
                    <Button
                      variant='outline'
                      className='h-6 gap-1 px-2 text-xs'
                      onClick={() => {
                        setEditingRule(r)
                        setEditRuleDraft({
                          postingMode: r.postingMode,
                          location: r.location,
                          approvers: r.approvers.join(', '),
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
      </section>

      {/* TA-40: talent pool mailbox import */}
      <section className='rounded-[8px] border border-gray-200 bg-white p-4'>
        <div className='mb-2 flex items-center justify-between'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            Talent pool email import
          </h3>
          <Switch
            checked={mailboxDraft.enabled}
            onCheckedChange={(v) =>
              setMailboxDraft((d) => ({ ...d, enabled: v }))
            }
          />
        </div>
        <div className='grid grid-cols-2 gap-3 lg:grid-cols-4'>
          <div>
            <p className='mb-1 text-xs font-medium'>Server</p>
            <Input
              className='h-7'
              value={mailboxDraft.server}
              onChange={(e) =>
                setMailboxDraft((d) => ({ ...d, server: e.target.value }))
              }
            />
          </div>
          <div>
            <p className='mb-1 text-xs font-medium'>Username</p>
            <Input
              className='h-7'
              value={mailboxDraft.username}
              onChange={(e) =>
                setMailboxDraft((d) => ({ ...d, username: e.target.value }))
              }
            />
          </div>
          <div>
            <p className='mb-1 text-xs font-medium'>Port</p>
            <Input
              className='h-7'
              type='number'
              value={mailboxDraft.port}
              onChange={(e) =>
                setMailboxDraft((d) => ({ ...d, port: Number(e.target.value) }))
              }
            />
          </div>
          <div>
            <p className='mb-1 text-xs font-medium'>Encryption</p>
            <Select
              value={mailboxDraft.encryption}
              onValueChange={(v) =>
                setMailboxDraft((d) => ({
                  ...d,
                  encryption: v as typeof d.encryption,
                }))
              }
            >
              <SelectTrigger className='h-7 w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['SSL', 'TLS', 'None'] as const).map((x) => (
                  <SelectItem key={x} value={x}>
                    {x}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className='mb-1 text-xs font-medium'>Checking interval (mins)</p>
            <Input
              className='h-7'
              type='number'
              value={mailboxDraft.checkingIntervalMins}
              onChange={(e) =>
                setMailboxDraft((d) => ({
                  ...d,
                  checkingIntervalMins: Number(e.target.value),
                }))
              }
            />
          </div>
          <div>
            <p className='mb-1 text-xs font-medium'>Timeout (secs)</p>
            <Input
              className='h-7'
              type='number'
              value={mailboxDraft.timeoutSecs}
              onChange={(e) =>
                setMailboxDraft((d) => ({
                  ...d,
                  timeoutSecs: Number(e.target.value),
                }))
              }
            />
          </div>
          <div className='flex items-center gap-2 pt-4'>
            <Switch
              checked={mailboxDraft.deleteAfterImport}
              onCheckedChange={(v) =>
                setMailboxDraft((d) => ({ ...d, deleteAfterImport: v }))
              }
            />
            <span className='text-xs'>Delete after import</span>
          </div>
          <div className='flex items-center gap-2 pt-4'>
            <Switch
              checked={mailboxDraft.notifyNonShortlisted}
              onCheckedChange={(v) =>
                setMailboxDraft((d) => ({ ...d, notifyNonShortlisted: v }))
              }
            />
            <span className='text-xs'>Notify non-shortlisted</span>
          </div>
          <div className='flex items-center gap-2 pt-4'>
            <Switch
              checked={mailboxDraft.emailAsUsername}
              onCheckedChange={(v) =>
                setMailboxDraft((d) => ({ ...d, emailAsUsername: v }))
              }
            />
            <span className='text-xs'>Email address as username</span>
          </div>
          <div className='flex items-center gap-2 pt-4'>
            <Switch
              checked={mailboxDraft.noNewInstanceWhileRunning}
              onCheckedChange={(v) =>
                setMailboxDraft((d) => ({ ...d, noNewInstanceWhileRunning: v }))
              }
            />
            <span className='text-xs'>No new instance while running</span>
          </div>
          <div>
            <p className='mb-1 text-xs font-medium'>Ignore subject words</p>
            <Input
              className='h-7'
              placeholder='Comma separated'
              value={mailboxDraft.ignoreSubjectWords}
              onChange={(e) =>
                setMailboxDraft((d) => ({
                  ...d,
                  ignoreSubjectWords: e.target.value,
                }))
              }
            />
          </div>
          <div>
            <p className='mb-1 text-xs font-medium'>Ignore sender ids</p>
            <Input
              className='h-7'
              placeholder='Comma separated'
              value={mailboxDraft.ignoreSenderIds}
              onChange={(e) =>
                setMailboxDraft((d) => ({
                  ...d,
                  ignoreSenderIds: e.target.value,
                }))
              }
            />
          </div>
        </div>
        <div className='mt-3 flex items-center gap-2'>
          <Button
            className='h-7 text-xs'
            onClick={() => config.saveMailbox(mailboxDraft)}
          >
            Save mailbox settings
          </Button>
          <Button
            variant='outline'
            className='h-7 text-xs'
            onClick={() => {
              setPwdDraft({ next: '', confirm: '' })
              setPwdOpen(true)
            }}
          >
            Change password
          </Button>
        </div>
      </section>

      {/* TA-56: recruiter strengths */}
      <section>
        <div className='mb-2 flex items-center justify-between'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            Recruiter strengths ({config.recruiterStrengths.length})
          </h3>
          <Button
            variant='outline'
            className='h-7 gap-1 text-xs'
            onClick={() => setStrengthOpen(true)}
          >
            <Plus size={12} /> Add strengths
          </Button>
        </div>
        <div className='rounded-[8px] border border-gray-200 bg-white'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recruiter</TableHead>
                <TableHead>Strengths</TableHead>
                <TableHead>Applicability</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {config.recruiterStrengths.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className='font-medium'>{s.recruiter}</TableCell>
                  <TableCell className='text-sm'>{s.strengths}</TableCell>
                  <TableCell className='text-sm'>{s.applicability}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <p className='text-paragraph-sm text-neutral-1000 mt-1.5'>
          Strengths inform which recruiter is best suited when vacancies are
          matched.
        </p>
      </section>

      {/* Add / edit channel dialog */}
      <Dialog open={channelOpen} onOpenChange={setChannelOpen}>
        <DialogContent className='sm:max-w-[480px]'>
          <DialogHeader>
            <DialogTitle>
              {editingChannel
                ? `Edit posting channel — ${editingChannel.name}`
                : 'Add posting channel'}
            </DialogTitle>
          </DialogHeader>
          <div className='max-h-[440px] space-y-3 overflow-y-auto pr-1'>
            <Input
              placeholder='Channel name'
              value={chDraft.name}
              onChange={(e) => setChDraft((d) => ({ ...d, name: e.target.value }))}
            />
            <Input
              placeholder='Channel (e.g. linkedin.com)'
              value={chDraft.channel}
              onChange={(e) =>
                setChDraft((d) => ({ ...d, channel: e.target.value }))
              }
            />
            <div className='grid grid-cols-3 gap-3'>
              <Select
                value={chDraft.type}
                onValueChange={(v) =>
                  setChDraft((d) => ({ ...d, type: v as PostingChannel['type'] }))
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['Job Board', 'Social', 'Internal', 'Agency'] as const).map(
                    (t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
              <Select
                value={chDraft.postingMode}
                onValueChange={(v) =>
                  setChDraft((d) => ({
                    ...d,
                    postingMode: v as PostingChannel['postingMode'],
                  }))
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(['Internal', 'External', 'Both'] as const).map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={chDraft.publishMode}
                onValueChange={(v) =>
                  setChDraft((d) => ({ ...d, publishMode: v as PublishMode }))
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PUBLISH_MODES.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* App key/secret — Social & Job Board integrations only (PDF) */}
            {CREDENTIALED_TYPES.includes(chDraft.type) && (
              <div className='grid grid-cols-2 gap-3'>
                <Input
                  placeholder='App key'
                  value={chDraft.appKey}
                  onChange={(e) =>
                    setChDraft((d) => ({ ...d, appKey: e.target.value }))
                  }
                />
                <Input
                  type='password'
                  placeholder='App secret'
                  value={chDraft.appSecret}
                  onChange={(e) =>
                    setChDraft((d) => ({ ...d, appSecret: e.target.value }))
                  }
                />
              </div>
            )}
            <ChipPicker
              label='Applicable locations'
              options={LOCATIONS}
              selected={chDraft.applicableLocations}
              onChange={(next) =>
                setChDraft((d) => ({ ...d, applicableLocations: next }))
              }
            />
            <ChipPicker
              label='Applicable departments'
              options={DEPARTMENTS}
              selected={chDraft.applicableDepartments}
              onChange={(next) =>
                setChDraft((d) => ({ ...d, applicableDepartments: next }))
              }
            />
            <ChipPicker
              label='Applicable positions'
              options={RECRUITMENT_POSITIONS}
              selected={chDraft.applicablePositions}
              onChange={(next) =>
                setChDraft((d) => ({ ...d, applicablePositions: next }))
              }
            />
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setChannelOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!chDraft.name || !chDraft.channel}
              onClick={saveChannel}
            >
              {editingChannel ? 'Save changes' : 'Save channel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Post template edit + preview */}
      <Dialog
        open={templateChannel !== null}
        onOpenChange={(o) => !o && setTemplateChannel(null)}
      >
        <DialogContent className='sm:max-w-[480px]'>
          <DialogHeader>
            <DialogTitle>Post template — {templateChannel?.name}</DialogTitle>
          </DialogHeader>
          <div className='space-y-2'>
            <Textarea
              rows={3}
              placeholder='Post body — merge fields like {{position}} supported'
              value={postTemplateDraft}
              onChange={(e) => setPostTemplateDraft(e.target.value)}
            />
            <p className='text-paragraph-sm text-neutral-1000'>
              Merge fields:{' '}
              {Object.keys(POST_SAMPLE_VALUES)
                .map((f) => `{{${f}}}`)
                .join(' ')}
            </p>
            <div className='rounded-[8px] border border-gray-200 bg-neutral-100 p-3'>
              <p className='mb-1 text-xs font-medium'>Preview</p>
              <p className='text-sm whitespace-pre-wrap'>
                {renderPostTemplate(postTemplateDraft)}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setTemplateChannel(null)}>
              Cancel
            </Button>
            <Button
              disabled={!postTemplateDraft}
              onClick={() => {
                if (templateChannel)
                  config.updatePostingChannel(templateChannel.id, {
                    postTemplate: postTemplateDraft,
                  })
                setTemplateChannel(null)
              }}
            >
              Save template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add posting approver rule dialog */}
      <Dialog open={ruleOpen} onOpenChange={setRuleOpen}>
        <DialogContent className='sm:max-w-[380px]'>
          <DialogHeader>
            <DialogTitle>Add posting-source approver rule</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <Select
              value={ruleMode}
              onValueChange={(v) =>
                setRuleMode(v as PostingChannel['postingMode'])
              }
            >
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['Internal', 'External', 'Both'] as const).map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={ruleApprover} onValueChange={setRuleApprover}>
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
            <Button variant='outline' onClick={() => setRuleOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                config.addPostingApproverRule({
                  postingMode: ruleMode,
                  employeeClass: 'All',
                  location: 'All',
                  approvers: [ruleApprover],
                })
                setRuleOpen(false)
              }}
            >
              Save rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add recruiter strengths dialog */}
      <Dialog open={strengthOpen} onOpenChange={setStrengthOpen}>
        <DialogContent className='sm:max-w-[400px]'>
          <DialogHeader>
            <DialogTitle>Add recruiter strengths</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <Select
              value={strengthDraft.recruiter}
              onValueChange={(v) =>
                setStrengthDraft((d) => ({ ...d, recruiter: v }))
              }
            >
              <SelectTrigger className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RECRUITERS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder='Strengths'
              value={strengthDraft.strengths}
              onChange={(e) =>
                setStrengthDraft((d) => ({ ...d, strengths: e.target.value }))
              }
            />
            <Input
              placeholder='Applicability (departments)'
              value={strengthDraft.applicability}
              onChange={(e) =>
                setStrengthDraft((d) => ({
                  ...d,
                  applicability: e.target.value,
                }))
              }
            />
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setStrengthOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!strengthDraft.strengths}
              onClick={() => {
                config.addRecruiterStrength(strengthDraft)
                setStrengthOpen(false)
                setStrengthDraft((d) => ({ ...d, strengths: '', applicability: '' }))
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change mailbox password — demo only, nothing is stored */}
      <Dialog open={pwdOpen} onOpenChange={setPwdOpen}>
        <DialogContent className='sm:max-w-[360px]'>
          <DialogHeader>
            <DialogTitle>Change mailbox password</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <Input
              type='password'
              placeholder='New password'
              value={pwdDraft.next}
              onChange={(e) =>
                setPwdDraft((d) => ({ ...d, next: e.target.value }))
              }
            />
            <Input
              type='password'
              placeholder='Confirm new password'
              value={pwdDraft.confirm}
              onChange={(e) =>
                setPwdDraft((d) => ({ ...d, confirm: e.target.value }))
              }
            />
            {pwdDraft.confirm && pwdDraft.next !== pwdDraft.confirm && (
              <p className='text-paragraph-sm text-red-600'>
                Passwords do not match.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setPwdOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!pwdDraft.next || pwdDraft.next !== pwdDraft.confirm}
              onClick={() => {
                toast.success('Mailbox password updated')
                setPwdOpen(false)
              }}
            >
              Update password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
