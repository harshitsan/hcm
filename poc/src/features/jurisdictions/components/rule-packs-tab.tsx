import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { RoleGate, useRole } from '@/context/role-context'
import { type Jurisdiction } from '../data/jurisdictions'
import { type JurisdictionRulePack } from '../data/rule-packs'
import { type AssignmentsStore } from '../hooks/use-assignments'
import { type RulePacksStore } from '../hooks/use-rule-packs'
import { RulePackStatusBadge } from './jurisdiction-badges'
import { RulesSimulator } from './rules-simulator'

interface RulePacksTabProps {
  store: RulePacksStore
  assignments: AssignmentsStore
  catalog: Jurisdiction[]
}

/**
 * Versioned, effective-dated jurisdiction rule-packs (JUR-13) plus the
 * Rules engine simulator (JUR-14). Publishing a version supersedes the
 * prior one but retains it for audit/revert; engines re-read the effective
 * pack on each evaluation — no code deployment.
 */
export function RulePacksTab({ store, assignments, catalog }: RulePacksTabProps) {
  const { hasRole } = useRole()
  const [publishing, setPublishing] = useState<JurisdictionRulePack | null>(null)
  const [effectiveFrom, setEffectiveFrom] = useState('')
  const [changeNote, setChangeNote] = useState('')

  const catalogById = useMemo(
    () => new Map(catalog.map((j) => [j.id, j])),
    [catalog]
  )

  const sorted = useMemo(
    () =>
      [...store.packs].sort(
        (a, b) =>
          a.packKey.localeCompare(b.packKey) || b.version - a.version
      ),
    [store.packs]
  )

  const openPublish = (pack: JurisdictionRulePack) => {
    setPublishing(pack)
    setEffectiveFrom(new Date().toISOString().slice(0, 10))
    setChangeNote('')
  }

  const publish = () => {
    if (!publishing || !effectiveFrom || changeNote.trim().length < 5) return
    store.publishVersion(publishing.id, effectiveFrom, changeNote.trim())
    setPublishing(null)
  }

  return (
    <div className='w-full space-y-4'>
      <div>
        <h2 className='text-neutral-1600 text-paragraph-md mb-1 font-medium'>
          Jurisdiction rule-packs ({store.packs.length} versions)
        </h2>
        <p className='text-paragraph-sm text-neutral-1000'>
          Tax/fee and policy-applicability rules are governed, versioned
          config — not code. The engines apply the version effective on the
          evaluation date; prior versions are retained per tenant for audit
          and revert.
        </p>
      </div>

      <div className='rounded-md border border-gray-200 bg-white'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rule-pack</TableHead>
              <TableHead>Jurisdiction</TableHead>
              <TableHead>Kind</TableHead>
              <TableHead>Version</TableHead>
              <TableHead>Effective from</TableHead>
              <TableHead>Rules</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Change note</TableHead>
              <TableHead className='w-[150px]' />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((pack) => (
              <TableRow key={pack.id}>
                <TableCell className='font-medium'>{pack.name}</TableCell>
                <TableCell>
                  <Badge variant='open'>
                    {catalogById.get(pack.jurisdictionId)?.name ?? '—'}
                  </Badge>
                </TableCell>
                <TableCell className='text-neutral-1000'>{pack.kind}</TableCell>
                <TableCell>
                  <Badge variant='pending'>v{pack.version}</Badge>
                </TableCell>
                <TableCell className='text-neutral-1000'>
                  {pack.effectiveFrom}
                </TableCell>
                <TableCell>{pack.ruleCount}</TableCell>
                <TableCell>
                  <RulePackStatusBadge status={pack.status} />
                </TableCell>
                <TableCell className='text-neutral-1000 max-w-[220px] truncate'>
                  {pack.changeNote}
                  {pack.publishedBy !== '—' && (
                    <span className='block text-xs'>
                      {pack.publishedBy} · {pack.publishedAt}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <RoleGate roles={['Platform Admin']}>
                    {pack.status === 'published' || pack.status === 'draft' ? (
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => openPublish(pack)}
                      >
                        Publish new version
                      </Button>
                    ) : (
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => store.revertToVersion(pack.id)}
                      >
                        Revert to this
                      </Button>
                    )}
                  </RoleGate>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {!hasRole('Platform Admin') && (
        <p className='text-paragraph-sm text-neutral-1000'>
          Rule-packs are governed config maintained by the Platform Admin;
          shown here so you can trace which version drives each outcome.
        </p>
      )}

      <RulesSimulator
        assignments={assignments}
        rulePacks={store}
        catalog={catalog}
      />

      <Dialog
        open={publishing !== null}
        onOpenChange={(o) => !o && setPublishing(null)}
      >
        <DialogContent className='sm:max-w-[420px]'>
          <DialogHeader>
            <DialogTitle>
              {publishing?.name} — publish v{(publishing?.version ?? 0) + 1}
            </DialogTitle>
            <DialogDescription>
              The current version is retained as superseded; engines apply the
              new version from its effective date without a code deployment.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='space-y-1'>
              <Label>Effective from</Label>
              <Input
                type='date'
                value={effectiveFrom}
                onChange={(e) => setEffectiveFrom(e.target.value)}
              />
            </div>
            <div className='space-y-1'>
              <Label>Change note (required for audit)</Label>
              <Textarea
                value={changeNote}
                onChange={(e) => setChangeNote(e.target.value)}
                placeholder='What changed in this version and why'
              />
              {changeNote.trim().length < 5 && (
                <p className='text-paragraph-sm text-neutral-1000'>
                  Enter at least a short note — versions are audited.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setPublishing(null)}>
              Cancel
            </Button>
            <Button
              onClick={publish}
              disabled={!effectiveFrom || changeNote.trim().length < 5}
            >
              Publish new version
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
