import { cn } from '@/utils/helpers'
import {
  getDeterministicColor,
  getInitials,
  lightenHex,
} from '@/utils/ui-helpers'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

type DetailOverlayRow = {
  leadName: string
  id?: string
  contactNumber: string
}
interface OverlayHeaderProps {
  readonly className?: string
  readonly row?: DetailOverlayRow | null
}

export function OverlayHeader({ className, row }: OverlayHeaderProps) {
  const name = row?.leadName || 'Unknown'
  const imageUrl = null
  const contactNumber = row?.contactNumber

  const id = row?.id
  const isNumericIndex = typeof id === 'string' && /^\d+$/.test(id)
  const displayId = id && !isNumericIndex ? id : ''

  const initials = getInitials(name)
  const baseColor = getDeterministicColor(name)
  const lightBgColor = lightenHex(baseColor, 0.82)
  const textColor = baseColor

  return (
    <div
      className={cn(
        'bg-neutral-2400 flex items-center justify-between border-b-2 px-6 py-4',
        className
      )}
    >
      <div className='min-w-0'>
        {displayId ? (
          <div className='text-grey-1200 truncate text-xs font-medium'>
            {displayId}
          </div>
        ) : null}
        <div className='mt-2 flex items-center gap-4'>
          <Avatar className='size-20'>
            {imageUrl ? <AvatarImage src={imageUrl} alt={name} /> : null}
            <AvatarFallback
              className={`font-inter text-h1 font-semibold`}
              style={{
                backgroundColor: lightBgColor,
                color: textColor,
              }}
            >
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className='flex flex-col gap-0.5'>
            <div className='flex items-center gap-2'>
              <h2 className='text-neutral-1700 text-xl font-semibold'>
                {name}
              </h2>
            </div>
            <p className='text-grey-1100 text-sm font-medium'>
              {contactNumber}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
