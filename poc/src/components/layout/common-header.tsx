// import { ConfigDrawer } from '../config-drawer'
// import { ThemeSwitch } from '../theme-switch'
import { cn } from '@/utils/helpers'
import BackButton from '../common/back-button'
import { SidebarTrigger } from '../ui/sidebar'
import { Header } from './header'
import { Main } from './main'

interface CommonHeaderProps {
  title: string
  className?: string
  backButton?: boolean
  endComponent?: React.ReactNode
}

export const CommonHeader = ({
  title,
  className,
  backButton = false,
  endComponent,
}: CommonHeaderProps) => {
  return (
    <Header fixed className={cn(className)}>
      <Main className='flex w-full items-center justify-between gap-x-2'>
        <div className='flex items-center gap-x-2'>
          <SidebarTrigger variant='ghost' className='size-8' />
          {backButton && <BackButton />}
          <h1 className='text-h3 text-neutral-1600 font-medium'>{title}</h1>
        </div>
        {endComponent && endComponent}
      </Main>
    </Header>
  )
}

export default CommonHeader
