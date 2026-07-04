import { Fragment } from 'react'
import { ArrowRight } from 'phosphor-react'

export type EngineLayer = 'author' | 'govern' | 'consume'

const LAYERS: { id: EngineLayer; title: string; caption: string }[] = [
  { id: 'author', title: 'Author', caption: 'Designer canvas & builder forms' },
  { id: 'govern', title: 'Govern', caption: 'Scope matrix, versions & history' },
  { id: 'consume', title: 'Consume', caption: 'Modules read their enabled artifacts' },
]

/**
 * The engine's three layers, with the active one highlighted: business logic
 * is AUTHORED once (Designer / builder), GOVERNED per tenant scope (catalog),
 * and CONSUMED by the target module (the module-filtered catalog view).
 */
export function LayerBanner({ active }: { active: EngineLayer }) {
  return (
    <div className='mb-3 flex flex-wrap items-center gap-2'>
      {LAYERS.map((layer, i) => (
        <Fragment key={layer.id}>
          {i > 0 && (
            <ArrowRight size={12} className='text-neutral-1000 shrink-0' />
          )}
          <div
            className={`flex items-center gap-2 rounded-md border px-2.5 py-1 ${
              active === layer.id
                ? 'bg-blue-150 border-blue-1300'
                : 'border-gray-200 bg-white opacity-70'
            }`}
          >
            <span className='text-neutral-1600 text-sm font-medium'>
              {i + 1}. {layer.title}
            </span>
            <span className='text-neutral-1000 text-xs'>{layer.caption}</span>
          </div>
        </Fragment>
      ))}
    </div>
  )
}
