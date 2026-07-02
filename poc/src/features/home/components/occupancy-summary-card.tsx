import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { HelpButton } from '@/components/common/help-button'
import { MultiSegmentProgress } from '@/components/common/multi-segment-progress'
import { chartColors, occupancySummary } from '../data/analytics'

const numberFmt = new Intl.NumberFormat('en-US')

const boxes = [
  {
    label: 'Occupied',
    value: occupancySummary.occupied,
    dot: chartColors.blue,
  },
  {
    label: 'Pre-leased',
    value: occupancySummary.preLeased,
    dot: chartColors.teal,
  },
  {
    label: 'Vacant',
    value: occupancySummary.vacant,
    dot: chartColors.neutral,
  },
]

/**
 * Portfolio occupancy snapshot — a segmented bar (occupied / pre-leased /
 * vacant) over three count boxes, mirroring the leads summary card.
 */
export function OccupancySummaryCard() {
  const segments = [
    {
      value: occupancySummary.occupied,
      color: chartColors.blue,
      label: 'Occupied',
    },
    {
      value: occupancySummary.preLeased,
      color: chartColors.teal,
      label: 'Pre-leased',
    },
    {
      value: occupancySummary.vacant,
      color: chartColors.neutral,
      label: 'Vacant',
    },
  ]

  return (
    <Card className='relative w-full gap-2 px-3 py-2'>
      <CardHeader className='flex items-center justify-between px-0 pb-2'>
        <CardTitle className='text-paragraph-sm font-semibold'>
          Occupancy Summary
        </CardTitle>
        <HelpButton
          tooltipContent={
            <p>
              How the {numberFmt.format(occupancySummary.total)} units split
              across occupied, pre-leased and vacant.
            </p>
          }
        />
      </CardHeader>
      <CardContent className='p-0 pt-0'>
        <div className='space-y-4'>
          <MultiSegmentProgress segments={segments} showTooltips />

          <div className='mt-auto grid grid-cols-3 gap-3'>
            {boxes.map((box) => (
              <div
                key={box.label}
                className='flex h-[54px] cursor-pointer items-center rounded-[4px] border border-gray-200 bg-white px-3'
              >
                <div>
                  <div className='mb-0.5 flex items-center gap-[3px]'>
                    <div
                      className='h-2.5 w-1.5 rounded-full'
                      style={{ backgroundColor: box.dot }}
                    />
                    <span className='text-paragraph-sm text-neutral-1800 font-medium'>
                      {box.label}
                    </span>
                  </div>
                  <div className='text-paragraph-md text-neutral-1600 font-medium'>
                    {numberFmt.format(box.value)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
