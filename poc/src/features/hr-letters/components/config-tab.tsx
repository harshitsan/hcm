import { useState } from 'react'
import { useRole } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { APPROVAL_WORKFLOWS, type ApprovalWorkflow } from '../data/catalogs'
import {
  EVENT_DOC_TYPE,
  SIGNING_AUTHORITIES,
  WORKFLOW_EVENTS,
} from '../data/hr-letters'
import {
  type EndOfRetentionPolicy,
  type LetterConfigStore,
} from '../hooks/use-letter-config'
import { ConfigGovernance } from './config-governance'
import { ConfigPlatform } from './config-platform'

/**
 * Governed configuration (role-aware):
 * - Company Admin: auto-generation triggers (HLC-04), decision tables
 *   (HLC-20), notification-engine distribution settings (HLC-21), and the
 *   7-year retention rule (HLC-11) — all applied without code deployment.
 * - Group Company Admin: cross-company governance (HLC-15/38).
 * - Platform Admin: tenant data-model + immutable history posture (HLC-16/17).
 */
export function ConfigTab({ config }: { config: LetterConfigStore }) {
  const { role } = useRole()
  const [message, setMessage] = useState(config.settings.deliveryMessageTemplate)

  if (role === 'Platform Admin') return <ConfigPlatform config={config} />
  if (role === 'Group Company Admin') return <ConfigGovernance config={config} />

  return (
    <div className='space-y-4'>
      {/* Auto-generation triggers (HLC-04) */}
      <div className='rounded-[6px] border border-gray-200 bg-white p-4'>
        <h3 className='text-neutral-1600 mb-1 font-medium'>
          Automated generation on workflow events
        </h3>
        <p className='text-paragraph-sm text-neutral-1000 mb-3'>
          When a workflow event fires, the matching document is generated as a
          PDF from the effective template version and enters its approval
          workflow before finalization.
        </p>
        <div className='grid gap-2 sm:grid-cols-2 lg:grid-cols-3'>
          {WORKFLOW_EVENTS.map((event) => (
            <label
              key={event}
              className='flex items-center justify-between rounded-[6px] border border-gray-200 px-3 py-2'
            >
              <span className='text-sm'>
                {event} → {EVENT_DOC_TYPE[event]}
              </span>
              <Switch
                checked={config.settings.autoTriggers[event]}
                onCheckedChange={() => config.toggleAutoTrigger(event)}
              />
            </label>
          ))}
        </div>
      </div>

      {/* Decision tables (HLC-20) */}
      <div className='rounded-[6px] border border-gray-200 bg-white p-4'>
        <h3 className='text-neutral-1600 mb-1 font-medium'>
          Decision tables — template, approval &amp; signing selection
        </h3>
        <p className='text-paragraph-sm text-neutral-1000 mb-3'>
          The rules engine evaluates these rows per document type and context.
          Edits apply to the next generated document — no code change. The
          default row handles unmatched contexts instead of failing silently.
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Document type</TableHead>
              <TableHead>Context</TableHead>
              <TableHead>Template version</TableHead>
              <TableHead>Approval workflow</TableHead>
              <TableHead>Signing authority</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {config.decisionRules.map((rule) => (
              <TableRow key={rule.id}>
                <TableCell className='font-medium'>
                  {rule.docType}{' '}
                  {rule.isDefault && <Badge variant='pending'>Default</Badge>}
                </TableCell>
                <TableCell className='text-sm'>{rule.context}</TableCell>
                <TableCell className='text-sm'>{rule.templateVersionRule}</TableCell>
                <TableCell>
                  <Select
                    value={rule.approvalWorkflow}
                    onValueChange={(value) =>
                      config.updateDecisionRule(rule.id, {
                        approvalWorkflow: value as ApprovalWorkflow,
                      })
                    }
                  >
                    <SelectTrigger variant='secondary' className='h-7 w-[190px]'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {APPROVAL_WORKFLOWS.map((w) => (
                        <SelectItem key={w} value={w}>
                          {w}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Select
                    value={rule.signingAuthority}
                    onValueChange={(value) =>
                      config.updateDecisionRule(rule.id, { signingAuthority: value })
                    }
                  >
                    <SelectTrigger variant='secondary' className='h-7 w-[230px]'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SIGNING_AUTHORITIES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Notification engine (HLC-21) */}
      <div className='rounded-[6px] border border-gray-200 bg-white p-4'>
        <h3 className='text-neutral-1600 mb-1 font-medium'>
          Notification engine — distribution &amp; tracking
        </h3>
        <p className='text-paragraph-sm text-neutral-1000 mb-3'>
          Finalized documents are dispatched through the enabled channels with
          a per-channel delivery outcome recorded (sent / delivered / failed).
          Documents that have not cleared approval are never dispatched.
        </p>
        <div className='mb-3 flex flex-wrap gap-4'>
          {[
            {
              label: 'Email',
              checked: config.settings.channelEmail,
              set: (checked: boolean) =>
                config.updateSettings({ channelEmail: checked }),
            },
            {
              label: 'In-app',
              checked: config.settings.channelInApp,
              set: (checked: boolean) =>
                config.updateSettings({ channelInApp: checked }),
            },
            {
              label: 'Print',
              checked: config.settings.channelPrint,
              set: (checked: boolean) =>
                config.updateSettings({ channelPrint: checked }),
            },
          ].map((channel) => (
            <label key={channel.label} className='flex items-center gap-2 text-sm'>
              <Switch checked={channel.checked} onCheckedChange={channel.set} />
              {channel.label} channel
            </label>
          ))}
        </div>
        <p className='text-paragraph-sm mb-1 font-medium'>
          Delivery message template
        </p>
        <Textarea
          rows={2}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <Button
          size='sm'
          className='mt-2'
          disabled={message.trim().length < 10}
          onClick={() => config.updateSettings({ deliveryMessageTemplate: message.trim() })}
        >
          Save delivery template
        </Button>
      </div>

      {/* Retention (HLC-11) */}
      <div className='rounded-[6px] border border-gray-200 bg-white p-4'>
        <h3 className='text-neutral-1600 mb-1 font-medium'>Retention policy</h3>
        <div className='flex flex-wrap items-center gap-3'>
          <Badge variant='badge_active'>
            {config.settings.retentionYears}-year retention (compliance rule)
          </Badge>
          <span className='text-sm'>At end of retention:</span>
          <Select
            value={config.settings.endOfRetentionPolicy}
            onValueChange={(value) =>
              config.updateSettings({
                endOfRetentionPolicy: value as EndOfRetentionPolicy,
              })
            }
          >
            <SelectTrigger variant='secondary' className='h-7 w-[220px]'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='archive'>Archive to cold storage</SelectItem>
              <SelectItem value='purge'>Purge permanently</SelectItem>
              <SelectItem value='legal-review'>Hold for legal review</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className='text-neutral-1000 mt-2 text-xs'>
          Documents stay searchable and retrievable for the full retention
          window; each grid row shows its retained-until date.
        </p>
      </div>
    </div>
  )
}
