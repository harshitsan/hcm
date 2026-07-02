export function MaintenanceError() {
  return (
    <div className='h-svh'>
      <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-0'>
        <div>
          <img src='/svg/maintenance.svg' alt='maintenance' />
        </div>
        <div className='space-y-1'>
          <h1 className='text-paragraph-md text-center font-medium'>
            System maintenance in progress.
          </h1>
          <p className='text-muted-foreground text-paragraph-sm text-center font-normal'>
            Access is temporarily unavailable.
          </p>
        </div>
      </div>
    </div>
  )
}
