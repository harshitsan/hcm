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
import {
  ASSIGNMENT_METHODS,
  APPROVER_DIRECTORY,
  type AssignmentMethod,
  type PostingChannel,
} from '../data/config'
import { RECRUITERS } from '../data/requisitions'
import type { RecruitmentConfigStore } from '../hooks/use-recruitment-config'
import { StatusBadge } from './badges'

const METHOD_HELP: Record<AssignmentMethod, string> = {
  manual: 'An authorised user assigns each vacancy to a recruiter directly.',
  'round-robin':
    'New vacancies distribute sequentially to recruiters by functional location.',
  workload:
    "New vacancies assign based on each recruiter's current open-vacancy capacity.",
}

/**
 * Sourcing configuration — vacancy assignment method, posting channels,
 * posting-source approvers, talent-pool mailbox import and recruiter
 * strengths (TA-35, TA-37, TA-38, TA-40, TA-56).
 */
export function ConfigSourcing({ config }: { config: RecruitmentConfigStore }) {
  const [channelOpen, setChannelOpen] = useState(false)
  const [chDraft, setChDraft] = useState({
    name: '',
    channel: '',
    type: 'Job Board' as PostingChannel['type'],
    postingMode: 'External' as PostingChannel['postingMode'],
    applicability: 'All departments',
  })
  const [ruleOpen, setRuleOpen] = useState(false)
  const [ruleMode, setRuleMode] =
    useState<PostingChannel['postingMode']>('External')
  const [ruleApprover, setRuleApprover] = useState<string>(APPROVER_DIRECTORY[0])
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
          <Button
            variant='outline'
            className='h-7 gap-1 text-xs'
            onClick={() => setChannelOpen(true)}
          >
            <Plus size={12} /> Add channel
          </Button>
        </div>
        <div className='rounded-[8px] border border-gray-200 bg-white'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Posting mode</TableHead>
                <TableHead>Applicability</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className='text-right'>Active</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {config.postingChannels.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className='font-medium'>{c.name}</TableCell>
                  <TableCell className='text-sm'>{c.channel}</TableCell>
                  <TableCell className='text-sm'>{c.type}</TableCell>
                  <TableCell className='text-sm'>{c.postingMode}</TableCell>
                  <TableCell className='text-sm'>{c.applicability}</TableCell>
                  <TableCell>
                    <StatusBadge status={c.active ? 'active' : 'inactive'} />
                  </TableCell>
                  <TableCell className='text-right'>
                    <Switch
                      checked={c.active}
                      onCheckedChange={() => config.togglePostingChannel(c.id)}
                    />
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
        </div>
        <Button
          className='mt-3 h-7 text-xs'
          onClick={() => config.saveMailbox(mailboxDraft)}
        >
          Save mailbox settings
        </Button>
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

      {/* Add channel dialog */}
      <Dialog open={channelOpen} onOpenChange={setChannelOpen}>
        <DialogContent className='sm:max-w-[420px]'>
          <DialogHeader>
            <DialogTitle>Add posting channel</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
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
            <div className='grid grid-cols-2 gap-3'>
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
            </div>
            <Input
              placeholder='Applicability'
              value={chDraft.applicability}
              onChange={(e) =>
                setChDraft((d) => ({ ...d, applicability: e.target.value }))
              }
            />
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setChannelOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!chDraft.name || !chDraft.channel}
              onClick={() => {
                config.addPostingChannel(chDraft)
                setChannelOpen(false)
                setChDraft((d) => ({ ...d, name: '', channel: '' }))
              }}
            >
              Save channel
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
    </div>
  )
}
