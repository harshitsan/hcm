type AuthLayoutProps = {
  children: React.ReactNode
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className='relative container grid h-svh max-w-none items-center justify-center overflow-hidden bg-gradient-to-b from-[#d8d5f0] via-[#e8e6f4] to-[#f5f4f0]'>
      {/* Dotted background pattern */}
      <div className='absolute inset-0 [background-image:radial-gradient(circle,#a8a29e_1.5px,transparent_1.5px)] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,black_0%,rgba(0,0,0,0.7)_40%,rgba(0,0,0,0.3)_70%,transparent_100%)] [background-size:20px_20px]' />
      <div className='relative z-10 mx-auto flex w-full flex-col justify-center py-8 sm:w-[480px] sm:p-8'>
        <div className='mb-2 flex items-center justify-center'>
          <img
            src='/images/mls-logo.png'
            alt='MLS logo'
            className='h-20 w-auto object-contain'
          />
        </div>
        {children}
      </div>
    </div>
  )
}
