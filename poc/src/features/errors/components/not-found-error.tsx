import { useNavigate, useRouter } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'

export function NotFoundError() {
  const navigate = useNavigate()
  const { history } = useRouter()
  return (
    <div className='h-svh'>
      <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2'>
        <div>
          <img src='/svg/404.svg' alt='404' />
        </div>
        <div className='space-y-1'>
          <h1 className='text-paragraph-md text-center font-medium'>
            Nothing here.
          </h1>
          <p className='text-muted-foreground text-paragraph-sm text-center font-normal'>
            The page you’re looking for isn’t available
          </p>
        </div>
        <div className='mt-3 flex gap-4'>
          <Button variant='outline' onClick={() => history.go(-1)}>
            Go Back
          </Button>
          <Button onClick={() => navigate({ to: '/' })}>Back to Home</Button>
        </div>
      </div>
    </div>
  )
}
