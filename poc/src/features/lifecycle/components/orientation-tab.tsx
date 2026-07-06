import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { type OrientationStore } from '../hooks/use-orientation'
import { OrientationConfig } from './orientation-config'
import { OrientationPrograms } from './orientation-programs'

interface OrientationTabProps {
  store: OrientationStore
}

/**
 * Orientation tab — scheduled programs plus the configuration wizard
 * (setup, notification rules, venues, presenter panels, question bank and
 * communication templates).
 */
export function OrientationTab({ store }: OrientationTabProps) {
  return (
    <Tabs defaultValue='programs' className='w-full'>
      <TabsList className='mb-2'>
        <TabsTrigger variant='ghost' value='programs'>
          Programs
        </TabsTrigger>
        <TabsTrigger variant='ghost' value='configuration'>
          Configuration
        </TabsTrigger>
      </TabsList>
      <TabsContent value='programs'>
        <OrientationPrograms store={store} />
      </TabsContent>
      <TabsContent value='configuration'>
        <OrientationConfig store={store} />
      </TabsContent>
    </Tabs>
  )
}
