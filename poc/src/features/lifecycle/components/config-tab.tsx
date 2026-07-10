import { useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { RoleGate, useRole } from '@/context/role-context'
import { type LifecycleConfigStore } from '../hooks/use-lifecycle-config'
import { ConfigApprovals } from './config-approvals'
import { ConfigExit } from './config-exit'
import { ConfigExitFlow } from './config-exit-flow'
import { ConfigOnboarding } from './config-onboarding'
import { ConfigProbation } from './config-probation'
import { ConfigTemplates } from './config-templates'
import { SectionCard } from './config-widgets'

interface ConfigTabProps {
  config: LifecycleConfigStore
}

const SECTIONS = [
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'probation', label: 'Probation & Confirmation' },
  { value: 'exit', label: 'Exit' },
  { value: 'exit-flow', label: 'Exit Routing & Tasks' },
  { value: 'approvals', label: 'Approvals' },
  { value: 'templates', label: 'Letter Templates' },
] as const

type SectionValue = (typeof SECTIONS)[number]['value']

/**
 * Governed lifecycle configuration — versioned templates, decision tables,
 * approver graphs, exit rule-packs and communication templates. Platform
 * Admins additionally control tenant-level module enablement. The sections
 * double as a setup wizard: Save & Next walks each step in sequence.
 */
export function ConfigTab({ config }: ConfigTabProps) {
  const { role } = useRole()
  const [section, setSection] = useState<SectionValue>('onboarding')

  // CS-02/CS-03 — module enablement is drafted locally and only applied on
  // Save & Next; Cancel discards the unsaved change.
  const [setupDraft, setSetupDraft] = useState<boolean | null>(null)
  const moduleEnabled =
    setupDraft ?? config.settings.confirmationModuleEnabled
  const setupDirty =
    setupDraft !== null &&
    setupDraft !== config.settings.confirmationModuleEnabled

  const stepIndex = SECTIONS.findIndex((s) => s.value === section)
  const isLastStep = stepIndex === SECTIONS.length - 1

  const goToStep = (index: number) => {
    const next = SECTIONS[Math.min(Math.max(index, 0), SECTIONS.length - 1)]
    setSection(next.value)
  }

  const saveAndNext = () => {
    const current = SECTIONS[stepIndex]
    config.logConfigChange(
      `Configuration step saved (${current.label})`,
      'Lifecycle setup wizard'
    )
    if (isLastStep) {
      toast.success('Lifecycle configuration setup complete')
      return
    }
    toast.success(`${current.label} saved — moving to ${SECTIONS[stepIndex + 1].label}`)
    goToStep(stepIndex + 1)
  }

  const cancelSetup = () => {
    setSetupDraft(null)
    toast.info('Changes discarded — configuration left unchanged')
  }

  return (
    <div className='w-full'>
      <RoleGate roles={['Platform Admin']}>
        <SectionCard
          title='Confirmation Management Module (platform setup)'
          description='When disabled, confirmation, peer review and periodic review screens are not accessible to this tenant. Changes here are drafted — use Save & Next to apply, or Cancel to discard.'
          actions={
            setupDirty ? (
              <Badge variant='outline' className='text-[11px]'>
                Unsaved changes
              </Badge>
            ) : undefined
          }
        >
          <div className='flex items-center justify-between'>
            <Label>Do you want to enable the Confirmation Management Module?</Label>
            <Switch
              checked={moduleEnabled}
              onCheckedChange={(v) => setSetupDraft(v)}
            />
          </div>
          <div className='mt-3 flex justify-end gap-2'>
            <Button
              size='sm'
              variant='outline'
              disabled={!setupDirty}
              onClick={cancelSetup}
            >
              Cancel
            </Button>
            <Button
              size='sm'
              onClick={() => {
                if (setupDirty) {
                  config.updateSettings(
                    { confirmationModuleEnabled: moduleEnabled },
                    'Confirmation Management Module'
                  )
                }
                setSetupDraft(null)
                setSection('probation')
              }}
            >
              Save & Next
            </Button>
          </div>
        </SectionCard>
      </RoleGate>

      <RoleGate roles={['Group Company Admin']}>
        <SectionCard
          title='Group configuration standards'
          description='Settings governed here apply consistently across the companies in your group; company admins inherit these standards.'
        >
          <p className='text-neutral-1000 text-xs'>
            Viewing as {role}: Aurora Software India, Aurora Software US and
            Helix Manufacturing follow the shared lifecycle configuration
            below.
          </p>
        </SectionCard>
      </RoleGate>

      <Tabs
        value={section}
        onValueChange={(v) => setSection(v as SectionValue)}
        className='w-full'
      >
        <TabsList className='mb-2 bg-transparent p-0 h-auto justify-start gap-2 rounded-none'>
          {SECTIONS.map((s) => (
            <TabsTrigger key={s.value} variant='primary' value={s.value}>
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value='onboarding'>
          <ConfigOnboarding config={config} />
        </TabsContent>
        <TabsContent value='probation'>
          <ConfigProbation config={config} />
        </TabsContent>
        <TabsContent value='exit'>
          <ConfigExit config={config} />
        </TabsContent>
        <TabsContent value='exit-flow'>
          <ConfigExitFlow config={config} />
        </TabsContent>
        <TabsContent value='approvals'>
          <ConfigApprovals config={config} />
        </TabsContent>
        <TabsContent value='templates'>
          <ConfigTemplates config={config} />
        </TabsContent>
      </Tabs>

      {/* Setup wizard footer — walks the configuration steps in sequence. */}
      <div className='mt-2 flex flex-wrap items-center justify-between gap-2 rounded-[6px] border border-gray-200 bg-white p-3'>
        <p className='text-neutral-1000 text-xs'>
          Setup step {stepIndex + 1} of {SECTIONS.length} ·{' '}
          {SECTIONS[stepIndex].label}
        </p>
        <div className='flex gap-2'>
          <Button
            size='sm'
            variant='outline'
            disabled={stepIndex === 0}
            onClick={() => goToStep(stepIndex - 1)}
          >
            Back
          </Button>
          <Button size='sm' variant='outline' onClick={cancelSetup}>
            Cancel
          </Button>
          <Button size='sm' onClick={saveAndNext}>
            {isLastStep ? 'Save & Finish' : 'Save & Next'}
          </Button>
        </div>
      </div>
    </div>
  )
}
