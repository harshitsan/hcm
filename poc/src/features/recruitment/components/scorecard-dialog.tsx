import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type { Application, Scorecard } from '../data/candidates'
import type { ScorecardCriterion } from '../data/config'

interface ScorecardDialogProps {
  application: Application | null
  onOpenChange: (open: boolean) => void
  /** Configured evaluation criteria — the scorecard renders exactly these (TA-09, TA-16). */
  criteria: ScorecardCriterion[]
  criteriaVersion: number
  interviewer: string
  onSubmit: (
    applicationId: string,
    scorecard: Omit<Scorecard, 'id' | 'submittedAt'>
  ) => void
}

/**
 * Structured interview scorecard (TA-09, TA-44) — per-round feedback against
 * the configured criteria, attributed to the interviewer and timestamped.
 */
export function ScorecardDialog({
  application: app,
  onOpenChange,
  criteria,
  criteriaVersion,
  interviewer,
  onSubmit,
}: ScorecardDialogProps) {
  const activeCriteria = criteria.filter((c) => c.active)
  const [round, setRound] = useState('1')
  const [scores, setScores] = useState<Record<string, number>>({})
  const [comments, setComments] = useState('')
  const [recommendation, setRecommendation] =
    useState<Scorecard['recommendation']>('advance')

  useEffect(() => {
    if (!app) return
    setRound(String(app.interviews.find((iv) => iv.status === 'scheduled')?.round ?? 1))
    setScores({})
    setComments('')
    setRecommendation('advance')
  }, [app])

  if (!app) return null

  const complete = activeCriteria.every((c) => scores[c.id] !== undefined)

  const submit = () => {
    onSubmit(app.id, {
      round: Number(round),
      interviewer,
      ratings: activeCriteria.map((c) => ({
        criterionId: c.id,
        criterion: c.name,
        score: scores[c.id],
      })),
      comments,
      recommendation,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={Boolean(app)} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[460px]'>
        <DialogHeader>
          <DialogTitle>
            Scorecard — {app.candidateName} ({app.requisitionTitle})
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-3'>
          <div className='flex items-center gap-2'>
            <p className='text-sm font-medium'>Interview round</p>
            <Select value={round} onValueChange={setRound}>
              <SelectTrigger className='h-7 w-[180px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(app.interviews.length > 0
                  ? app.interviews.map((iv) => ({
                      value: String(iv.round),
                      label: `Round ${iv.round} — ${iv.roundName}`,
                    }))
                  : [{ value: '1', label: 'Round 1' }]
                ).map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className='text-paragraph-sm text-neutral-1000'>
            Rendered from scorecard configuration v{criteriaVersion} — completed
            scorecards retain the criteria in effect at submission.
          </p>

          {/* Exactly the configured criteria and scales (TA-09) */}
          <div className='space-y-2'>
            {activeCriteria.map((c) => (
              <div
                key={c.id}
                className='flex items-center justify-between rounded border border-gray-200 px-3 py-1.5'
              >
                <span className='text-sm'>
                  {c.name}
                  <span className='text-paragraph-sm text-neutral-1000'>
                    {' '}
                    ({c.weight}% weight)
                  </span>
                </span>
                <div className='flex items-center gap-1'>
                  {Array.from({ length: c.scaleMax }, (_, i) => i + 1).map(
                    (n) => (
                      <Button
                        key={n}
                        variant={scores[c.id] === n ? 'default' : 'outline'}
                        className='h-6 w-6 p-0 text-xs'
                        onClick={() =>
                          setScores((prev) => ({ ...prev, [c.id]: n }))
                        }
                      >
                        {n}
                      </Button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>

          <Textarea
            placeholder='Comments — visible side by side with other panel evaluations'
            value={comments}
            onChange={(e) => setComments(e.target.value)}
            rows={2}
          />

          <div className='flex items-center gap-2'>
            <p className='text-sm font-medium'>Recommendation</p>
            <Select
              value={recommendation}
              onValueChange={(v) =>
                setRecommendation(v as Scorecard['recommendation'])
              }
            >
              <SelectTrigger className='h-7 w-[140px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['advance', 'hold', 'reject'] as const).map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!complete} onClick={submit}>
            Submit scorecard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
