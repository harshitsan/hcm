import * as React from 'react'
import * as SwitchPrimitive from '@radix-ui/react-switch'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/helpers'

const switchVariants = cva(
  'peer inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-all duration-200 ease-in-out outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'data-[state=checked]:bg-primary data-[state=unchecked]:bg-input focus-visible:border-ring focus-visible:ring-ring/50 border border-transparent',
        blue: 'data-[state=checked]:bg-blue-1900 data-[state=unchecked]:bg-grey-1700 border border-blue-1600 data-[state=checked]:border-grey-1700',
      },
    },
    defaultVariants: {
      variant: 'blue',
    },
  }
)

const switchThumbVariants = cva(
  'pointer-events-none block h-3.5 w-3.5 rounded-full ring-0 transition-transform duration-200 ease-in-out data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0 rtl:data-[state=checked]:-translate-x-4',
  {
    variants: {
      variant: {
        default: 'bg-background',
        blue: 'data-[state=unchecked]:bg-blue-1900 data-[state=checked]:bg-white shadow-sm ml-0.5',
      },
    },
    defaultVariants: {
      variant: 'blue',
    },
  }
)

export interface SwitchProps
  extends React.ComponentProps<typeof SwitchPrimitive.Root>,
    VariantProps<typeof switchVariants> {}

function Switch({ className, variant, ...props }: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      data-slot='switch'
      className={cn(switchVariants({ variant }), className)}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot='switch-thumb'
        className={cn(switchThumbVariants({ variant }))}
      />
    </SwitchPrimitive.Root>
  )
}

export { Switch }
