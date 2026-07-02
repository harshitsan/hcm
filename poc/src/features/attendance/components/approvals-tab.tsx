import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { type AttendanceStore } from '../hooks/use-attendance'
import { type RequestsStore } from '../hooks/use-requests'
import { type ShiftsStore } from '../hooks/use-shifts'
import { ApprovalsCorrections } from './approvals-corrections'
import { ApprovalsOther } from './approvals-other'
import { ApprovalsSwapsOt } from './approvals-swaps-ot'
import { MassApproval } from './mass-approval'
import { SummaryCards } from './summary-cards'

/**
 * Company Admin team functions: change requests + escalations (TNA-15/44),
 * shift swaps (TNA-14), overtime authorization (TNA-10), comp off / out time
 * / WFH decisions and daily mass approval (TNA-45).
 */
export function ApprovalsTab({
  attendance,
  requests,
  shifts,
  actor,
}: {
  attendance: AttendanceStore
  requests: RequestsStore
  shifts: ShiftsStore
  actor: string
}) {
  const pendingCorrections = requests.corrections.filter(
    (c) => c.status === 'pending' || c.status === 'escalated'
  ).length
  const pendingSwaps = shifts.swaps.filter((s) => s.status === 'pending').length
  const pendingOt = requests.overtime.filter((o) => o.status === 'pending').length
  const pendingOther =
    requests.compOff.filter((c) => c.status === 'pending').length +
    requests.outTime.filter((o) => o.status === 'pending').length +
    requests.wfh.filter((w) => w.status === 'pending').length

  return (
    <div className='w-full'>
      <SummaryCards
        title='Team Functions — pending queue'
        items={[
          { label: 'Change requests', value: pendingCorrections },
          { label: 'Shift swaps', value: pendingSwaps },
          { label: 'Overtime requests', value: pendingOt },
          { label: 'Comp off / Out time / WFH', value: pendingOther },
        ]}
      />

      <Tabs defaultValue='corrections'>
        <TabsList className='mb-2 flex-wrap'>
          <TabsTrigger value='corrections'>Change Requests</TabsTrigger>
          <TabsTrigger value='swaps-ot'>Swaps & Overtime</TabsTrigger>
          <TabsTrigger value='other'>Comp Off · Out Time · WFH</TabsTrigger>
          <TabsTrigger value='mass'>Mass Approval</TabsTrigger>
        </TabsList>

        <TabsContent value='corrections'>
          <ApprovalsCorrections requests={requests} actor={actor} />
        </TabsContent>
        <TabsContent value='swaps-ot'>
          <ApprovalsSwapsOt shifts={shifts} requests={requests} />
        </TabsContent>
        <TabsContent value='other'>
          <ApprovalsOther requests={requests} />
        </TabsContent>
        <TabsContent value='mass'>
          <MassApproval attendance={attendance} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
