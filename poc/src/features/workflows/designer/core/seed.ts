import { makeId } from './model'
import type { WorkflowDoc } from './model'
import { createStep, getDef } from './registry'

export function seedDoc(): WorkflowDoc {
  const transform = createStep('transform')
  transform.config.expression = 'input' // non-empty so the seed doc validates and can Activate
  return {
    id: makeId('wf'),
    name: 'Persist Payloads',
    status: 'draft',
    trigger: {
      id: makeId('t'), kind: 'scheduler', label: 'Scheduler',
      config: structuredClone(getDef('scheduler').defaultConfig),
    },
    body: [transform],
  }
}
