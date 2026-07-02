import { CommonHeader } from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'

interface ComingSoonProps {
  title?: string
}

export function ComingSoon({ title = 'Coming Soon' }: ComingSoonProps) {
  return (
    <>
      <CommonHeader title={title} />
      <Main className='pt-1.5'>
        <div className='flex h-[calc(100vh-12rem)] flex-col items-center justify-center'>
          <h2 className='text-h2 text-neutral-1600 mb-4 font-semibold'>
            {title}
          </h2>
          <p className='text-muted-foreground text-center text-lg'>
            This feature is under development and will be available soon.
          </p>
        </div>
      </Main>
    </>
  )
}
