import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/helpers'

const buttonVariants = cva(
  "inline-flex  items-center  justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          'bg-primary focus-visible:ring-[1px] focus-visible:border-ring focus-visible:ring-ring/50 text-primary-foreground shadow-xs hover:bg-primary/90 active:shadow-[inset_0px_2px_2px_0px_#1A1A1A33,inset_1px_0px_2px_0px_#1A1A1A1F,inset_-1px_0px_2px_0px_#1A1A1A1F] shadow-[inset_0_1px_0_0_#E3E3E3,inset_1px_0_0_0_#E3E3E3,inset_-1px_0_0_0_#E3E3E3,inset_0_-1px_0_0_#B5B5B5] hover:!shadow-[inset_0px_1px_0px_0px_#EBEBEB,inset_-1px_0px_0px_0px_#EBEBEB,inset_1px_0px_0px_0px_#EBEBEB,inset_0px_-2px_0px_0px_#CCCCCC] focus-visible:shadow-[0px_0px_0px_2px_#1F5ADB] focus-visible:ring-[1px] active:shadow-[inset_0px_2px_2px_0px_#1A1A1A33,inset_1px_0px_2px_0px_#1A1A1A1F,inset_-1px_0px_2px_0px_#1A1A1A1F]',

        destructive:
          'bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20',
        outline:
          'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground active:shadow-[inset_0px_2px_2px_0px_#1A1A1A33,inset_1px_0px_2px_0px_#1A1A1A1F,inset_-1px_0px_2px_0px_#1A1A1A1F] shadow-[inset_0_1px_0_0_#E3E3E3,inset_1px_0_0_0_#E3E3E3,inset_-1px_0_0_0_#E3E3E3,inset_0_-1px_0_0_#B5B5B5] hover:!shadow-[inset_0px_1px_0px_0px_#EBEBEB,inset_-1px_0px_0px_0px_#EBEBEB,inset_1px_0px_0px_0px_#EBEBEB,inset_0px_-2px_0px_0px_#CCCCCC] focus-visible:shadow-[0px_0px_0px_2px_#1F5ADB] focus-visible:ring-[1px] active:shadow-[inset_0px_2px_2px_0px_#1A1A1A33,inset_1px_0px_2px_0px_#1A1A1A1F,inset_-1px_0px_2px_0px_#1A1A1A1F] focus-visible:ring-[1px] focus-visible:border-ring focus-visible:ring-ring/50',
        secondary:
          'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
        ghost:
          'hover:bg-transparent hover:text-accent-foreground hover:shadow-none',
        header:
          '!hover:bg-transparent text-paragraph-sm font-medium hover:text-accent-foreground hover:shadow-none flex !h-7 !py-0 w-full justify-between !rounded-none !ps-0 !pe-3 text-left first:border-l-0',
        link: 'text-primary underline-offset-4 hover:underline',
        icon: 'bg-transparent hover:bg-transparent !p-0 !h-auto',
        icon2:
          'bg-primary focus-visible:ring-[1px] focus-visible:border-ring focus-visible:ring-ring/50 text-primary-foreground shadow-xs hover:bg-primary/90 active:shadow-[inset_0px_2px_2px_0px_#1A1A1A33,inset_1px_0px_2px_0px_#1A1A1A1F,inset_-1px_0px_2px_0px_#1A1A1A1F] shadow-[inset_0_1px_0_0_#E3E3E3,inset_1px_0_0_0_#E3E3E3,inset_-1px_0_0_0_#E3E3E3,inset_0_-1px_0_0_#B5B5B5] hover:!shadow-[inset_0px_1px_0px_0px_#EBEBEB,inset_-1px_0px_0px_0px_#EBEBEB,inset_1px_0px_0px_0px_#EBEBEB,inset_0px_-2px_0px_0px_#CCCCCC] focus-visible:shadow-[0px_0px_0px_2px_#1F5ADB] focus-visible:ring-[1px] active:shadow-[inset_0px_2px_2px_0px_#1A1A1A33,inset_1px_0px_2px_0px_#1A1A1A1F,inset_-1px_0px_2px_0px_#1A1A1A1F] bg-transparent hover:bg-transparent ',
        red: 'bg-primary focus-visible:ring-[1px] focus-visible:border-ring focus-visible:ring-ring/50 text-primary-foreground shadow-xs hover:bg-primary/90 active:shadow-[inset_0px_2px_2px_0px_#1A1A1A33,inset_1px_0px_2px_0px_#1A1A1A1F,inset_-1px_0px_2px_0px_#1A1A1A1F] shadow-[inset_0_1px_0_0_#E3E3E3,inset_1px_0_0_0_#E3E3E3,inset_-1px_0_0_0_#E3E3E3,inset_0_-1px_0_0_#B5B5B5] shadow-[inset_0px_1px_0px_0px_#B83F24,_inset_0px_-1px_0px_1px_#B83F24,_inset_-2px_0px_0px_0px_#FFFFFF33,_inset_2px_0px_0px_0px_#FFFFFF33,_inset_0px_2px_0px_0px_#FFFFFF33] bg-[linear-gradient(180deg,rgba(255,255,255,0.07)_82.14%,rgba(255,255,255,0.15)_94.44%)] focus-visible:shadow-[0px_0px_0px_2px_#1F5ADB] focus-visible:ring-[1px] active:shadow-[inset_0px_2px_2px_0px_#1A1A1A33,inset_1px_0px_2px_0px_#1A1A1A1F,inset_-1px_0px_2px_0px_#1A1A1A1F] bg-transparent hover:bg-transparent px-1.5',
        download:
          'text-paragraph-sm active:shadow-[inset_0px_2px_2px_0px_#1A1A1A33,inset_1px_0px_2px_0px_#1A1A1A1F,inset_-1px_0px_2px_0px_#1A1A1A1F] shadow-[inset_0_1px_0_0_#E3E3E3,inset_1px_0_0_0_#E3E3E3,inset_-1px_0_0_0_#E3E3E3,inset_0_-1px_0_0_#B5B5B5] hover:!shadow-[inset_0px_1px_0px_0px_#EBEBEB,inset_-1px_0px_0px_0px_#EBEBEB,inset_1px_0px_0px_0px_#EBEBEB,inset_0px_-2px_0px_0px_#CCCCCC] focus-visible:shadow-[0px_0px_0px_2px_#1F5ADB] focus-visible:ring-[1px] active:shadow-[inset_0px_2px_2px_0px_#1A1A1A33,inset_1px_0px_2px_0px_#1A1A1A1F,inset_-1px_0px_2px_0px_#1A1A1A1F] focus-visible:ring-[1px] focus-visible:border-ring focus-visible:ring-ring/50 rounded-md border bg-neutral-200 !px-1.5 py-2 font-medium text-black transition-colors hover:bg-neutral-200 shadow-[inset_0_1px_0_0_#E3E3E3,inset_1px_0_0_0_#E3E3E3,inset_-1px_0_0_0_#E3E3E3,inset_0_-1px_0_0_#B5B5B5]',
        configure:
          'rounded-[6px] bg-neutral-150 text-paragraph-sm font-semibold text-neutral-1800 [box-shadow:0px_1px_0px_0px_#E3E3E3_inset,1px_0px_0px_0px_#E3E3E3_inset,-1px_0px_0px_0px_#E3E3E3_inset,0px_-1px_0px_0px_#B5B5B5_inset]',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot='button'
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
