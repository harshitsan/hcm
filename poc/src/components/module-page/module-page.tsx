import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { cn } from '@/utils/helpers'

/**
 * Canonical module page chrome (scaffold kit §3): CommonHeader with the
 * bg-blue-150 band + fluid Main on bg-neutral-200 + a single w-full body div.
 * Promotes what workflows and leave already do.
 */
export function ModulePage({
  title,
  endComponent,
  className,
  children,
}: {
  title: string
  endComponent?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <>
      <CommonHeader title={title} className='bg-blue-150' endComponent={endComponent} />
      <Main fluid className='bg-neutral-200'>
        <div className={cn('w-full', className)}>{children}</div>
      </Main>
    </>
  )
}
