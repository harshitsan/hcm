import React from 'react'
import { cn } from '@/utils/helpers'
import { SheetContent } from './sheet'

// Define the props interface based on SheetContent props
interface FloatingSheetContentProps
  extends React.ComponentProps<typeof SheetContent> {
  /** Optional override for height class */
  heightOverride?: string
  /** Optional override for top class */
  topOverride?: string
  /** Whether to apply the floating behavior (default: true) */
  floating?: boolean
  /** Whether to show close button (default: true) */
  showCloseButton?: boolean
}

/**
 * FloatingSheetContent component that provides floating behavior
 * with customizable height and positioning.
 */
const FloatingSheetContent = React.forwardRef<
  React.ComponentRef<typeof SheetContent>,
  FloatingSheetContentProps
>(
  (
    {
      className,
      heightOverride,
      topOverride,
      floating = true,
      showCloseButton = true,
      children,
      ...props
    },
    ref
  ) => {
    // Default floating styles
    const defaultFloatingStyles = floating
      ? 'top-0 md:top-6 md:bottom-6 bottom-0 right-0 md:right-5 md:!h-[calc(100vh-3rem)] !h-[100vh] overflow-hidden'
      : '!top-0 !bottom-0 !h-full !inset-y-0'

    // Use overrides if provided, otherwise use default floating behavior
    const finalHeightClass = heightOverride || (floating ? '' : '')
    const finalTopClass = topOverride || (floating ? '' : '')

    return (
      <SheetContent
        ref={ref}
        className={cn(
          // Apply floating or full-screen behavior
          floating
            ? defaultFloatingStyles
            : '!inset-y-0 !top-0 !bottom-0 !h-full overflow-hidden',
          // Apply custom overrides
          finalHeightClass,
          finalTopClass,
          // Additional positioning for right sidebars
          'right-0 md:right-5',
          // Ensure proper z-index and styling
          'z-50 rounded-[0px] border-l border-gray-200 shadow-lg md:rounded-[0.5rem]',
          // Hide close button if not needed
          !showCloseButton && '[&>button]:hidden',
          className
        )}
        {...props}
      >
        {children}
      </SheetContent>
    )
  }
)

FloatingSheetContent.displayName = 'FloatingSheetContent'

/**
 * FloatingSheetContentNoClose component that automatically applies floating behavior
 * without a close button.
 */
const FloatingSheetContentNoClose = React.forwardRef<
  React.ComponentRef<typeof SheetContent>,
  FloatingSheetContentProps
>(
  (
    {
      className,
      heightOverride,
      topOverride,
      floating = true,
      children,
      ...props
    },
    ref
  ) => {
    // Default floating styles
    const defaultFloatingStyles = floating
      ? 'top-5 bottom-5 !h-[calc(100vh-10rem)]'
      : '!top-0 !bottom-0 !h-full !inset-y-0'

    // Use overrides if provided, otherwise use default floating behavior
    const finalHeightClass = heightOverride || (floating ? '' : '')
    const finalTopClass = topOverride || (floating ? '' : '')

    return (
      <SheetContent
        ref={ref}
        className={cn(
          // Apply floating or full-screen behavior
          floating
            ? defaultFloatingStyles
            : '!inset-y-0 !top-0 !bottom-0 !h-full',
          // Apply custom overrides
          finalHeightClass,
          finalTopClass,
          // Additional positioning for right sidebars
          'right-0',
          // Ensure proper z-index and styling
          'z-50 border-l border-gray-200 shadow-lg',
          // Hide close button
          '[&>button]:hidden',
          className
        )}
        {...props}
      >
        {children}
      </SheetContent>
    )
  }
)

FloatingSheetContentNoClose.displayName = 'FloatingSheetContentNoClose'

export { FloatingSheetContent, FloatingSheetContentNoClose }
