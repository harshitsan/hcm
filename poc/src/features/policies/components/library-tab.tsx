import { useMemo, useState } from 'react'
import { BellRinging, FileText, MagnifyingGlass } from 'phosphor-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useRole } from '@/context/role-context'
import { POLICY_CATEGORIES, type Policy } from '../data/policies'
import {
  evaluatePolicyForWorker,
  formatDate,
  scopeSummary,
  todayIso,
  versionInForceOn,
} from '../data/policy-utils'
import { SELF_WORKER_ID, seedWorkers } from '../data/workers'
import { type PoliciesStore } from '../hooks/use-policies'
import { PolicyTypeBadge } from './policy-badges'
import { PolicyPreviewDialog } from './policy-preview-dialog'

/** Persona used for the self-service view — a non-user worker for that role. */
const NON_USER_WORKER_ID = 'w-08'

/**
 * Self-service policy library (POL-09/20/30): the signed-in worker sees only
 * the in-force policies applicable to their scope, searchable by keyword and
 * category; restricted or out-of-scope policies are never surfaced. Policies
 * that exclude the worker's position level are called out (POL-23/30), and
 * policy-change notifications for their scope are listed (POL-18).
 */
export function LibraryTab({ store }: { store: PoliciesStore }) {
  const { role } = useRole()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [readPolicy, setReadPolicy] = useState<Policy | null>(null)

  const personaId =
    role === 'Employee (Non-User)' ? NON_USER_WORKER_ID : SELF_WORKER_ID
  const persona =
    seedWorkers.find((w) => w.id === personaId) ?? seedWorkers[0]
  const today = todayIso()

  const evaluated = useMemo(
    () =>
      store.policies.map((policy) => ({
        policy,
        evaluation: evaluatePolicyForWorker(policy, persona, today),
      })),
    [store.policies, persona, today]
  )

  const applicable = evaluated.filter(({ policy, evaluation }) => {
    if (!evaluation.applies) return false
    if (category !== 'all' && policy.category !== category) return false
    if (!search) return true
    const q = search.toLowerCase()
    const inForce = versionInForceOn(policy, today)
    return (
      policy.name.toLowerCase().includes(q) ||
      policy.category.toLowerCase().includes(q) ||
      (inForce?.content.toLowerCase().includes(q) ?? false)
    )
  })

  const excludedForMe = evaluated.filter((e) => e.evaluation.excludedByLevel)
  const myNotifications = store.notifications.filter((n) =>
    n.workerIds.includes(persona.id)
  )

  return (
    <div className='w-full space-y-4'>
      <div className='rounded-[6px] bg-white px-3 py-2'>
        <p className='text-paragraph-sm text-neutral-1000'>
          Viewing as <span className='font-medium'>{persona.name}</span> —{' '}
          {persona.company} · {persona.department} · {persona.positionLevel} ·{' '}
          {persona.employmentType}.{' '}
          {role === 'Employee (Non-User)'
            ? 'This worker has no login: this view shows what an authorized admin administers on their behalf (POL-12).'
            : 'Only the version currently in force for your scope is shown; restricted policies never appear here.'}
        </p>
      </div>

      <div className='flex flex-wrap items-center gap-2'>
        <div className='relative'>
          <MagnifyingGlass
            size={14}
            className='text-neutral-1000 absolute top-1/2 left-2.5 -translate-y-1/2'
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder='Search my policies…'
            className='h-8 w-64 bg-white pl-8'
          />
        </div>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger variant='secondary' className='h-8! w-56 bg-white'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All categories</SelectItem>
            {POLICY_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className='text-paragraph-sm text-neutral-1000 ml-auto'>
          {applicable.length} policy(ies) apply to you
        </span>
      </div>

      {applicable.length === 0 ? (
        <div className='rounded-[6px] border border-dashed border-neutral-400 bg-white px-4 py-8 text-center'>
          <p className='text-paragraph-sm text-neutral-1000'>
            No policies match your search within your visibility scope.
          </p>
        </div>
      ) : (
        <div className='grid grid-cols-1 gap-3 lg:grid-cols-2'>
          {applicable.map(({ policy }) => {
            const inForce = versionInForceOn(policy, today)
            if (!inForce) return null
            return (
              <div
                key={policy.id}
                className='border-gray-200 flex flex-col gap-1.5 rounded-[6px] border bg-white p-3'
              >
                <div className='flex items-center justify-between gap-2'>
                  <div className='flex items-center gap-2'>
                    <FileText size={16} className='text-neutral-1000' />
                    <span className='text-neutral-1600 text-sm font-medium'>
                      {inForce.editionName}
                    </span>
                  </div>
                  <PolicyTypeBadge type={policy.type} />
                </div>
                <p className='text-paragraph-sm text-neutral-1000'>
                  {policy.category} · in force{' '}
                  {formatDate(inForce.effectiveFrom)} →{' '}
                  {inForce.effectiveTill
                    ? formatDate(inForce.effectiveTill)
                    : 'open-ended'}
                </p>
                <p className='text-paragraph-sm text-neutral-1900 line-clamp-2'>
                  {inForce.content}
                </p>
                <p className='text-paragraph-sm text-neutral-1000'>
                  {scopeSummary(policy.scope)}
                </p>
                <div className='mt-1'>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setReadPolicy(policy)}
                  >
                    Read policy
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {excludedForMe.length > 0 && (
        <div className='rounded-[6px] bg-white p-3'>
          <p className='text-neutral-1600 mb-2 text-sm font-medium'>
            Policies that exclude your position level
          </p>
          <div className='space-y-1.5'>
            {excludedForMe.map(({ policy, evaluation }) => (
              <div key={policy.id} className='flex items-center gap-2'>
                <Badge variant='dropped'>Excluded</Badge>
                <span className='text-neutral-1900 text-sm'>{policy.name}</span>
                <span className='text-paragraph-sm text-neutral-1000'>
                  {evaluation.failReason}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className='rounded-[6px] bg-white p-3'>
        <p className='text-neutral-1600 mb-2 flex items-center gap-1.5 text-sm font-medium'>
          <BellRinging size={16} />
          Policy notifications for you
        </p>
        {myNotifications.length === 0 ? (
          <p className='text-paragraph-sm text-neutral-1000'>
            No policy-change notifications for your scope yet.
          </p>
        ) : (
          <div className='space-y-2'>
            {myNotifications.map((n) => (
              <div key={n.id} className='border-gray-200 rounded-[6px] border p-2.5'>
                <p className='text-neutral-1900 text-sm'>{n.message}</p>
                <p className='text-paragraph-sm text-neutral-1000'>
                  {n.policyName} · sent {formatDate(n.sentOn)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <PolicyPreviewDialog
        open={readPolicy !== null}
        onOpenChange={(o) => {
          if (!o) setReadPolicy(null)
        }}
        policy={readPolicy}
      />
    </div>
  )
}
