import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/helpers'

const badgeVariants = cva(
  'inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90',
        destructive:
          'border-transparent bg-destructive text-white [a&]:hover:bg-destructive/90 focus-visible:ring-destructive/20',
        outline:
          'text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground',
        disqualified: 'bg-red-1300 text-red-1400 rounded-[6px]',
        qualified: 'bg-green-1200 text-green-1300 rounded-[6px]',
        pending: 'bg-neutral-2000 text-neutral-1900 rounded-[6px]',
        hotLead:
          'bg-orange-1300 text-[11px] text-orange-1200 rounded-full px-1.5',
        active:
          'bg-green-1400 text-green-1300 rounded-[10px] border border-green-1500  text-sm font-semibold',
        overlay_open:
          'bg-blue-1800 text-blue-1700 rounded-[4px] border-0 text-xs font-medium',
        overlay_complete:
          'bg-green-1400 text-green-1300 rounded-[4px] border-0 text-xs font-medium',
        overlay_overdue:
          'bg-red-1300 text-red-1400 rounded-[4px] border-0 text-xs font-medium',
        overdue:
          'bg-vanilla-400 border border-vanilla-400 text-vanilla-500 rounded-[6px]',
        open: 'bg-blue-150 border border-blue-150 text-blue-1400 rounded-[6px]',
        completed:
          'bg-green-200 text-green-1300 border border-green-200 rounded-[6px]',
        dropped: 'bg-red-1300 text-red-1400 rounded-[6px]',
        live: 'bg-green-1400 text-green-1300 rounded-[6px]',
        booked:
          'bg-blue-150 border border-blue-150 text-blue-1400 rounded-[6px]',
        badge_active:
          'bg-green-1200 text-green-1300 rounded-[10px] border-none text-xs font-medium',
        badge_inactive:
          'bg-grey-1500 text-grey-1200 rounded-[10px] border-none text-xs font-medium',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<'span'> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'span'

  return (
    <Comp
      data-slot='badge'
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
