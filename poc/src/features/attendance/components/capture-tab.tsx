import { useState } from 'react'
import { CloudArrowDown, FileArrowUp, Plus, Table } from 'phosphor-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LOCATIONS } from '../data/shared'
import { type AttendanceStore } from '../hooks/use-attendance'
import { type AttendanceConfigStore } from '../hooks/use-attendance-config'
import { StatusBadge } from './badges'
import { ManualSheetOverlay } from './manual-sheet-overlay'
import { TrackingModeDialog } from './tracking-mode-dialog'

/**
 * Capture desk (TNA-02/03/04/40/41/46): tracking devices at entry/exit
 * points, tracking modes with reconciliation + reminders, biometric/API
 * ingestion simulation, CSV/XLS import and the bulk manual sheet.
 */
export function CaptureTab({
  attendance,
  config,
}: {
  attendance: AttendanceStore
  config: AttendanceConfigStore
}) {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [deviceOpen, setDeviceOpen] = useState(false)
  const [modeOpen, setModeOpen] = useState(false)
  const [fileName, setFileName] = useState('july-attendance.xlsx')
  const [devName, setDevName] = useState('')
  const [devLocation, setDevLocation] = useState<string>('Hyderabad')
  const [devArea, setDevArea] = useState('')
  const [devPoint, setDevPoint] = useState<'entry' | 'exit' | 'entry-exit'>('entry-exit')
  const [devMode, setDevMode] = useState('Fingerprint')
  const [devEmail, setDevEmail] = useState('')

  const saveDevice = () => {
    if (!devName.trim() || !devArea.trim() || !devEmail.includes('@')) {
      toast.error('Device name, work area and a valid alert email are required')
      return
    }
    config.addDevice({
      name: devName,
      location: devLocation,
      workArea: devArea,
      pointType: devPoint,
      mode: devMode,
      alertEmail: devEmail,
    })
    setDeviceOpen(false)
    setDevName('')
    setDevArea('')
    setDevEmail('')
  }

  return (
    <div className='w-full space-y-5'>
      {/* Ingestion simulators + import (TNA-02/03/04) */}
      <div className='grid gap-3 lg:grid-cols-3'>
        <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
          <h3 className='text-sm font-medium'>Biometric device feed</h3>
          <p className='text-paragraph-sm text-neutral-1000 pt-1'>
            Punches arrive with exact device timestamps, tagged source
            “biometric”. Unknown badges are flagged unmatched for resolution.
          </p>
          <Button
            variant='outline'
            className='mt-3 h-7 gap-1'
            onClick={() => attendance.simulateIngestion('biometric')}
          >
            <CloudArrowDown size={14} weight='bold' />
            Simulate Device Punch
          </Button>
        </div>
        <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
          <h3 className='text-sm font-medium'>Third-party API</h3>
          <p className='text-paragraph-sm text-neutral-1000 pt-1'>
            External systems post attendance via API. Malformed rows are
            rejected with an error reason; valid rows are still ingested.
          </p>
          <Button
            variant='outline'
            className='mt-3 h-7 gap-1'
            onClick={() => attendance.simulateIngestion('api')}
          >
            <CloudArrowDown size={14} weight='bold' />
            Simulate API Payload
          </Button>
        </div>
        <div className='rounded-[8px] border border-gray-200 bg-white p-4'>
          <h3 className='text-sm font-medium'>CSV / XLS file import</h3>
          <div className='mt-2 flex items-center gap-2'>
            <Input
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className='h-8'
            />
            <Button
              variant='outline'
              className='h-8 gap-1'
              disabled={!/\.(csv|xls|xlsx)$/i.test(fileName)}
              onClick={() => attendance.importFile(fileName)}
            >
              <FileArrowUp size={14} weight='bold' />
              Import
            </Button>
          </div>
          <p className='text-paragraph-sm text-neutral-1000 pt-2'>
            Imports report a success/failure summary; invalid rows are rejected
            with clear errors and valid rows still land, tagged “import”.
          </p>
        </div>
      </div>

      {/* Bulk manual sheet (TNA-46) */}
      <div className='flex items-center justify-between rounded-[8px] border border-gray-200 bg-white p-4'>
        <div>
          <h3 className='text-sm font-medium'>Manual attendance sheet</h3>
          <p className='text-paragraph-sm text-neutral-1000 pt-1'>
            Record punches for many employees at once, scoped by location,
            department and position, with in/out comments per row.
          </p>
        </div>
        <Button variant='outline' className='h-7 gap-1' onClick={() => setSheetOpen(true)}>
          <Table size={14} weight='bold' />
          Open Sheet
        </Button>
      </div>

      {/* Devices (TNA-40) */}
      <div>
        <div className='mb-2 flex items-center justify-between'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            Tracking Devices ({config.devices.length})
            <span className='text-neutral-1000 ml-2 text-xs'>
              entry/exit readers — device failures alert the configured email
            </span>
          </h3>
          <Button variant='outline' className='h-7 gap-1' onClick={() => setDeviceOpen(true)}>
            <Plus size={12} weight='bold' />
            New Device
          </Button>
        </div>
        <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-neutral-1000 border-b text-left text-xs'>
                <th className='py-2 pr-3 font-medium'>Device</th>
                <th className='px-2 font-medium'>Location</th>
                <th className='px-2 font-medium'>Work area</th>
                <th className='px-2 font-medium'>Point</th>
                <th className='px-2 font-medium'>Mode</th>
                <th className='px-2 font-medium'>Alert email</th>
                <th className='px-2 font-medium'>Status</th>
              </tr>
            </thead>
            <tbody>
              {config.devices.map((d) => (
                <tr key={d.id} className='border-b last:border-0'>
                  <td className='py-2 pr-3 font-medium'>{d.name}</td>
                  <td className='px-2'>{d.location}</td>
                  <td className='px-2'>{d.workArea}</td>
                  <td className='px-2 capitalize'>{d.pointType}</td>
                  <td className='px-2'>{d.mode}</td>
                  <td className='text-neutral-1000 px-2'>{d.alertEmail}</td>
                  <td className='px-2'>
                    <StatusBadge status={d.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tracking modes (TNA-41) */}
      <div>
        <div className='mb-2 flex items-center justify-between'>
          <h3 className='text-neutral-1600 text-sm font-medium'>
            Tracking Modes & Reconciliation ({config.trackingModes.length})
            <span className='text-neutral-1000 ml-2 text-xs'>
              multi-source records consolidate by priority or grace period;
              reminders go out before the payroll cutoff
            </span>
          </h3>
          <Button variant='outline' className='h-7 gap-1' onClick={() => setModeOpen(true)}>
            <Plus size={12} weight='bold' />
            New Mode
          </Button>
        </div>
        <div className='rounded-[8px] border border-gray-200 bg-white p-3'>
          <table className='w-full text-sm'>
            <thead>
              <tr className='text-neutral-1000 border-b text-left text-xs'>
                <th className='py-2 pr-3 font-medium'>Mode</th>
                <th className='px-2 font-medium'>Locations</th>
                <th className='px-2 font-medium'>Reconciliation</th>
                <th className='px-2 font-medium'>Grace</th>
                <th className='px-2 font-medium'>Min break</th>
                <th className='px-2 font-medium'>Reminders</th>
              </tr>
            </thead>
            <tbody>
              {config.trackingModes.map((m) => (
                <tr key={m.id} className='border-b last:border-0'>
                  <td className='py-2 pr-3'>
                    <span className='font-medium'>{m.name}</span>
                    <span className='text-neutral-1000 block text-xs'>{m.description}</span>
                  </td>
                  <td className='px-2'>{m.locations.join(', ')}</td>
                  <td className='px-2 capitalize'>{m.reconciliation}</td>
                  <td className='px-2'>{m.graceMinutes}m</td>
                  <td className='px-2'>{m.minBreakMinutes}m</td>
                  <td className='px-2'>
                    {[m.remindEmail && 'Email', m.remindSms && 'SMS'].filter(Boolean).join(' + ') || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ManualSheetOverlay open={sheetOpen} onOpenChange={setSheetOpen} attendance={attendance} />
      <TrackingModeDialog open={modeOpen} onOpenChange={setModeOpen} config={config} />

      <Dialog open={deviceOpen} onOpenChange={setDeviceOpen}>
        <DialogContent className='sm:max-w-[420px]'>
          <DialogHeader>
            <DialogTitle>Register tracking device</DialogTitle>
          </DialogHeader>
          <div className='space-y-3'>
            <div className='flex flex-col gap-1'>
              <Label className='text-xs'>Device name</Label>
              <Input value={devName} onChange={(e) => setDevName(e.target.value)} placeholder='PUN-Gate-1' />
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div className='flex flex-col gap-1'>
                <Label className='text-xs'>Office location</Label>
                <Select value={devLocation} onValueChange={setDevLocation}>
                  <SelectTrigger variant='secondary' className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATIONS.map((l) => (
                      <SelectItem key={l} value={l}>
                        {l}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='flex flex-col gap-1'>
                <Label className='text-xs'>Work area</Label>
                <Input value={devArea} onChange={(e) => setDevArea(e.target.value)} placeholder='Main lobby' />
              </div>
            </div>
            <div className='grid grid-cols-2 gap-3'>
              <div className='flex flex-col gap-1'>
                <Label className='text-xs'>Entry / exit</Label>
                <Select value={devPoint} onValueChange={(v) => setDevPoint(v as typeof devPoint)}>
                  <SelectTrigger variant='secondary' className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='entry'>Entry</SelectItem>
                    <SelectItem value='exit'>Exit</SelectItem>
                    <SelectItem value='entry-exit'>Entry + Exit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className='flex flex-col gap-1'>
                <Label className='text-xs'>Tracking mode</Label>
                <Select value={devMode} onValueChange={setDevMode}>
                  <SelectTrigger variant='secondary' className='w-full'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='Fingerprint'>Fingerprint</SelectItem>
                    <SelectItem value='Face recognition'>Face recognition</SelectItem>
                    <SelectItem value='Badge reader'>Badge reader</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className='flex flex-col gap-1'>
              <Label className='text-xs'>Alert email</Label>
              <Input
                type='email'
                value={devEmail}
                onChange={(e) => setDevEmail(e.target.value)}
                placeholder='facilities@satellitehr.in'
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setDeviceOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveDevice}>Register Device</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
