import { ChevronDown, ChevronRight, Network, X } from 'lucide-react'
import type { Branch, ContainerStep } from '../core/model'
import { countChildren, removeBranch, toggleCollapse } from '../core/ops'
import { getDef } from '../core/registry'
import { useStore } from '../state/store'
import { Sequence } from './Sequence'
import { StepMenu } from './StepMenu'

function BranchLane({ branch, container }: { branch: Branch; container: ContainerStep }) {
  const select = useStore(s => s.select)
  const apply = useStore(s => s.apply)
  const selected = useStore(s => s.selection?.id === branch.id)
  const def = getDef(container.kind)
  const removable = def.branchSpec?.addable?.def.key === branch.key
  return (
    <div className="lane">
      <div className="lane-rail"><span className="lane-stub" /></div>
      <button
        className={`branch-pill ${selected ? 'selected' : ''}`}
        onClick={e => { e.stopPropagation(); select({ type: 'branch', id: branch.id }) }}
      >
        <Network size={11} />
        {branch.label}
        {removable && (
          <span
            className="branch-remove" role="button" aria-label={`Remove ${branch.label}`}
            onClick={e => { e.stopPropagation(); apply(d => removeBranch(d, branch.id)) }}
          ><X size={10} /></span>
        )}
      </button>
      <Sequence branchId={branch.id} steps={branch.steps} />
      <div className="lane-fill" />
      <div className="lane-rail lane-rail-bottom"><span className="lane-stub" /></div>
    </div>
  )
}

export function ContainerNode({ step }: { step: ContainerStep }) {
  const apply = useStore(s => s.apply)
  const select = useStore(s => s.select)
  const selected = useStore(s => s.selection?.id === step.id)
  const runStatus = useStore(s => s.run?.statuses[step.id])
  const def = getDef(step.kind)
  const Icon = def.icon
  const kids = countChildren(step)
  const Chevron = step.collapsed ? ChevronRight : ChevronDown

  const header = (
    <div
      className={`container-pill ${selected ? 'selected' : ''} ${runStatus ?? ''}`}
      onClick={e => { e.stopPropagation(); select({ type: 'step', id: step.id }) }}
    >
      <Icon size={13} />
      <span className="container-label">{step.label}</span>
      {step.collapsed && kids > 0 && <span className="count-badge">{kids}</span>}
      <button
        aria-label={step.collapsed ? 'Expand' : 'Collapse'} className="icon-btn"
        onClick={e => { e.stopPropagation(); apply(d => toggleCollapse(d, step.id)) }}
      ><Chevron size={13} /></button>
      <StepMenu step={step} />
    </div>
  )

  if (step.collapsed) return header

  return (
    <div className="container-node">
      {header}
      <div className="container-drop" />
      <div className="lanes">
        {step.branches.map(b => <BranchLane key={b.id} branch={b} container={step} />)}
      </div>
    </div>
  )
}
