import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/utils/helpers'

const inputVariants = cva(
  'file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground flex w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-base transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:shadow-[0px_0px_0px_2px_#1F5ADB] focus-visible:ring-[1px] aria-invalid:border-red-1400 aria-invalid:ring-destructive/20 aria-invalid:bg-red-1300',
  {
    variants: {
      variant: {
        default:
          'hover:bg-neutral-2400 border-neutral-2500 disabled:bg-[#0E0E0E14]',
        outline:
          'border-input bg-white rounded hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-9 px-3 py-2',
        sm: 'h-8 px-2 text-sm',
        lg: 'h-10 px-4 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface InputProps
  extends Omit<React.ComponentProps<'input'>, 'size'>,
    VariantProps<typeof inputVariants> {}

function Input({ className, type, variant, size, ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot='input'
      className={cn(inputVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Input, inputVariants }
