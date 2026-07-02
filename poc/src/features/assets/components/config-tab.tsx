import { useState } from 'react'
import { useRole } from '@/context/role-context'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { type Asset } from '../data/assets'
import { TRANSITION_RULES } from '../data/config'
import { COMPANIES, EMPLOYEES, HOME_COMPANY } from '../data/org'
import { type AssetConfigStore } from '../hooks/use-asset-config'
import { ConfigCategories } from './config-categories'
import { ConfigQuestionnaire } from './config-questionnaire'

interface ConfigTabProps {
  config: AssetConfigStore
  assets: Asset[]
}

/**
 * Governed configuration surface: module enablement (ASM-40),
 * acknowledgement & overdue policy (ASM-21), approval routing (ASM-43),
 * category taxonomy (ASM-19/37), condition questionnaire (ASM-20), the
 * lifecycle decision table (ASM-23) and the Platform Admin tenant-isolation
 * panel (ASM-18).
 */
export function ConfigTab({ config, assets }: ConfigTabProps) {
  const { role } = useRole()
  const isPlatformAdmin = role === 'Platform Admin'
  const isCompanyAdmin = role === 'Company Admin'

  const [tab, setTab] = useState(isCompanyAdmin ? 'general' : 'governance')
  const [moduleDraft, setModuleDraft] = useState(config.moduleEnabled)
  const [rulesDraft, setRulesDraft] = useState({
    receiptAckRequired: config.ackRules.receiptAckRequired,
    returnAckRequired: config.ackRules.returnAckRequired,
    expectedReturnDays: config.ackRules.expectedReturnDays,
    overdueAfterDays: config.ackRules.overdueAfterDays,
    reminderEveryDays: config.ackRules.reminderEveryDays,
  })

  const approverOptions = EMPLOYEES.filter(
    (e) => e.company === HOME_COMPANY && e.hasSystemAccess && e.active
  )

  return (
    <div className='w-full'>
      <Tabs value={tab} onValueChange={setTab} className='w-full'>
        <TabsList className='mb-3 bg-transparent p-0'>
          {isCompanyAdmin && (
            <>
              <TabsTrigger variant='ghost' value='general'>
                Setup & Policy
              </TabsTrigger>
              <TabsTrigger variant='ghost' value='categories'>
                Categories
              </TabsTrigger>
              <TabsTrigger variant='ghost' value='questionnaire'>
                Condition Form
              </TabsTrigger>
            </>
          )}
          <TabsTrigger variant='ghost' value='governance'>
            Rules Engine & Governance
          </TabsTrigger>
        </TabsList>

        {isCompanyAdmin && (
          <TabsContent value='general' className='space-y-4'>
            <div className='border-grey-200 rounded-[6px] border bg-white p-4'>
              <h3 className='text-neutral-1600 mb-1 text-sm font-medium'>
                Asset tracking setup
              </h3>
              <p className='text-paragraph-sm text-neutral-1000 mb-3'>
                Do you want to enable the asset module for this company? When set to No,
                requisition, issuance, arrival and outbound screens are hidden across the
                tenant.
              </p>
              <div className='flex items-center gap-3'>
                <Select
                  value={moduleDraft ? 'yes' : 'no'}
                  onValueChange={(v) => setModuleDraft(v === 'yes')}
                >
                  <SelectTrigger className='h-7! w-[100px]'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='yes'>Yes</SelectItem>
                    <SelectItem value='no'>No</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  className='h-7 rounded-[6px] px-2.5'
                  onClick={() => config.setModuleEnabled(moduleDraft)}
                >
                  Save & next
                </Button>
                <Button
                  variant='outline'
                  className='h-7 rounded-[6px] px-2.5'
                  onClick={() => setModuleDraft(config.moduleEnabled)}
                >
                  Cancel
                </Button>
              </div>
            </div>

            <div className='border-grey-200 rounded-[6px] border bg-white p-4'>
              <div className='mb-2 flex items-center gap-2'>
                <h3 className='text-neutral-1600 text-sm font-medium'>
                  Acknowledgement & overdue policy
                </h3>
                <Badge variant='open'>
                  v{config.ackRules.version} · effective {config.ackRules.effectiveFrom}
                </Badge>
              </div>
              <div className='flex flex-wrap items-end gap-5'>
                <div className='flex items-center gap-2'>
                  <Switch
                    id='cfg-receipt'
                    checked={rulesDraft.receiptAckRequired}
                    onCheckedChange={(receiptAckRequired) =>
                      setRulesDraft({ ...rulesDraft, receiptAckRequired })
                    }
                  />
                  <Label htmlFor='cfg-receipt' className='text-paragraph-sm'>
                    Receipt acknowledgement mandatory
                  </Label>
                </div>
                <div className='flex items-center gap-2'>
                  <Switch
                    id='cfg-return'
                    checked={rulesDraft.returnAckRequired}
                    onCheckedChange={(returnAckRequired) =>
                      setRulesDraft({ ...rulesDraft, returnAckRequired })
                    }
                  />
                  <Label htmlFor='cfg-return' className='text-paragraph-sm'>
                    Return acknowledgement mandatory
                  </Label>
                </div>
                <div className='flex flex-col gap-1'>
                  <Label className='text-paragraph-sm'>Expected-return window (days)</Label>
                  <Input
                    type='number'
                    min={1}
                    value={rulesDraft.expectedReturnDays}
                    onChange={(e) =>
                      setRulesDraft({ ...rulesDraft, expectedReturnDays: Number(e.target.value) })
                    }
                    className='h-7 w-[110px]'
                  />
                </div>
                <div className='flex flex-col gap-1'>
                  <Label className='text-paragraph-sm'>Overdue after (days)</Label>
                  <Input
                    type='number'
                    min={0}
                    value={rulesDraft.overdueAfterDays}
                    onChange={(e) =>
                      setRulesDraft({ ...rulesDraft, overdueAfterDays: Number(e.target.value) })
                    }
                    className='h-7 w-[110px]'
                  />
                </div>
                <div className='flex flex-col gap-1'>
                  <Label className='text-paragraph-sm'>Reminder every (days)</Label>
                  <Input
                    type='number'
                    min={1}
                    value={rulesDraft.reminderEveryDays}
                    onChange={(e) =>
                      setRulesDraft({ ...rulesDraft, reminderEveryDays: Number(e.target.value) })
                    }
                    className='h-7 w-[110px]'
                  />
                </div>
                <Button
                  className='h-7 rounded-[6px] px-2.5'
                  onClick={() => config.saveAckRules(rulesDraft)}
                >
                  Save policy
                </Button>
              </div>
            </div>

            <div className='border-grey-200 rounded-[6px] border bg-white p-4'>
              <h3 className='text-neutral-1600 mb-2 text-sm font-medium'>
                Approval routing (requisitions · arrivals · outbound)
              </h3>
              <div className='space-y-2'>
                {config.routing.map((route) => (
                  <div key={route.requestType} className='flex flex-wrap items-center gap-3'>
                    <span className='text-paragraph-sm w-[100px] font-medium'>
                      {route.requestType}
                    </span>
                    <Select
                      value={route.approvers[0]}
                      onValueChange={(approver) =>
                        config.saveRouting(route.requestType, [
                          approver,
                          ...route.approvers.slice(1),
                        ])
                      }
                    >
                      <SelectTrigger className='h-7! w-[190px]'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {approverOptions.map((e) => (
                          <SelectItem key={e.id} value={e.name}>
                            {e.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className='text-paragraph-sm text-neutral-1000'>
                      then {route.approvers.slice(1).join(', ') || 'auto-complete'} · v
                      {route.version} · effective {route.effectiveFrom}
                    </span>
                  </div>
                ))}
              </div>
              <p className='text-paragraph-sm text-neutral-1000 mt-2'>
                Subsequent requests route to the configured approver as “Pending with me”
                items and advance only on their decision.
              </p>
            </div>
          </TabsContent>
        )}

        {isCompanyAdmin && (
          <TabsContent value='categories'>
            <ConfigCategories config={config} assets={assets} />
          </TabsContent>
        )}

        {isCompanyAdmin && (
          <TabsContent value='questionnaire'>
            <ConfigQuestionnaire config={config} />
          </TabsContent>
        )}

        <TabsContent value='governance' className='space-y-4'>
          <div className='border-grey-200 rounded-[6px] border bg-white p-4'>
            <h3 className='text-neutral-1600 mb-1 text-sm font-medium'>
              Lifecycle transition decision table
            </h3>
            <p className='text-paragraph-sm text-neutral-1000 mb-2'>
              Every transaction is evaluated against this governed table before it
              executes; denials return the blocking rule and allowed transitions are
              logged in the asset history with the matched rule id.
            </p>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rule</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Permitted from</TableHead>
                  <TableHead>Resulting state</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {TRANSITION_RULES.map((rule) => (
                  <TableRow key={rule.id}>
                    <TableCell className='text-sm font-medium'>{rule.id}</TableCell>
                    <TableCell className='text-sm'>{rule.action}</TableCell>
                    <TableCell className='text-paragraph-sm'>{rule.from.join(', ')}</TableCell>
                    <TableCell className='text-sm'>{rule.to}</TableCell>
                    <TableCell className='text-paragraph-sm text-neutral-1000'>
                      {rule.description}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {isPlatformAdmin && (
            <div className='border-grey-200 rounded-[6px] border bg-white p-4'>
              <h3 className='text-neutral-1600 mb-1 text-sm font-medium'>
                Tenant isolation & identity uniqueness (Platform Admin)
              </h3>
              <ul className='text-paragraph-sm text-neutral-1000 list-disc space-y-1 ps-5'>
                <li>
                  Asset identifiers (tag/serial) are validated as unique within the owning
                  company — duplicates are rejected at save with a clear message.
                </li>
                <li>
                  Row-level tenant isolation: every query, report and transaction is scoped
                  to the caller's tenant boundary; cross-tenant references are denied.
                </li>
                <li>
                  Employee-to-asset links enforce referential integrity — both must belong
                  to the same tenant.
                </li>
              </ul>
              <div className='mt-3'>
                <h4 className='text-paragraph-sm text-neutral-1600 mb-1 font-medium'>
                  Tenants on this platform
                </h4>
                <div className='flex flex-wrap gap-2'>
                  {COMPANIES.map((c) => (
                    <Badge key={c.id} variant='open'>
                      {c.name} · {c.group}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
