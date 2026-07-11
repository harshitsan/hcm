import { useState } from 'react'
import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRole } from '@/context/role-context'
import { EngineArtifactsPanel } from '@/features/workflows/components/engine-artifacts-panel'
import { takeRequestedTab } from '@/features/workflows/data/module-nav'
import { ConfigurationTab } from './components/configuration-tab'
import { GovernanceTab } from './components/governance-tab'
import { HiringPipelineTab } from './components/hiring-pipeline-tab'
import { OffersTab } from './components/offers-tab'
import { PortalTab } from './components/portal-tab'
import { RecruitmentReportsTab } from './components/reports-tab'
import { RequisitionsTab } from './components/requisitions-tab'
import { RecruitmentSummary } from './components/summary-cards'
import { TalentPoolTab } from './components/talent-pool-tab'
import { VacanciesTab } from './components/vacancies-tab'
import { hireFromOffer } from './data/hire-bridge'
import { useCandidateDocuments } from './hooks/use-candidate-documents'
import { useCandidates } from './hooks/use-candidates'
import { useOffers } from './hooks/use-offers'
import { useRecruitmentConfig } from './hooks/use-recruitment-config'
import { useRequisitions } from './hooks/use-requisitions'
import { useVacancies } from './hooks/use-vacancies'

const today = () => new Date().toISOString().slice(0, 10)

function SegmentedSelector<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className='mb-4 flex gap-1 rounded-lg border border-neutral-200 bg-neutral-100 p-1 w-fit'>
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={[
            'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
            value === o.value
              ? 'bg-white text-blue-1200 shadow-sm'
              : 'text-neutral-1000 hover:text-neutral-1400',
          ].join(' ')}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Recruitment() {
  const { role, hasRole } = useRole()

  const config = useRecruitmentConfig()

  const vacancies = useVacancies({
    assignmentMethod: config.assignmentMethod,
    postingApproverRules: config.postingApproverRules,
    logEngine: config.logEngine,
    notify: config.notify,
  })

  const requisitions = useRequisitions({
    actor: role,
    nonBudgetedApprover: config.nonBudgetedApprover,
    logEngine: config.logEngine,
    notify: config.notify,
    // Kensium: the final RRF approval spawns a vacancy for recruiter assignment.
    onFinalApproval: (req) => {
      vacancies.addVacancy({
        rrfId: req.id,
        position: req.title,
        workLocation: req.location,
        employeeClass: req.employeeClass,
        vacancies: req.headcount,
        closingDate: req.closingDate,
      })
    },
  })

  const candidates = useCandidates({
    actor: role,
    logEngine: config.logEngine,
    notify: config.notify,
  })

  const candidateDocuments = useCandidateDocuments()

  const offers = useOffers({
    actor: role,
    offerApproverRules: config.offerApproverRules,
    outOfBandApprover: config.outOfBandApprover,
    logEngine: config.logEngine,
    notify: config.notify,
    onConverted: (offer, mode) => {
      candidates.patchApp(offer.applicationId, (a) => ({
        ...a,
        status: 'hired',
        stageHistory: [
          ...a.stageHistory,
          { at: today(), actor: role, from: String(a.status), to: 'hired' },
        ],
      }))
      requisitions.setStatus(
        offer.requisitionId,
        'filled',
        'Requisition filled via candidate conversion'
      )
      // BRD 6.13.6 — the conversion creates a real employee record and an
      // onboarding case cross-module (visible in /employees and /lifecycle).
      const app = candidates.applications.find(
        (a) => a.id === offer.applicationId
      )
      const cand = candidates.candidates.find((c) => c.id === app?.candidateId)
      const req = requisitions.requisitions.find(
        (r) => r.id === offer.requisitionId
      )
      return hireFromOffer({
        offerId: offer.id,
        applicationId: offer.applicationId,
        requisitionId: offer.requisitionId,
        candidateName: offer.candidateName,
        email: app?.candidateEmail ?? '',
        phone: cand?.phone,
        gender: cand?.gender || undefined,
        position: offer.requisitionTitle,
        department: req?.department ?? 'Engineering',
        location: offer.location,
        employeeClass: req?.employeeClass,
        positionLevel: req?.positionLevel,
        hiringManager: req?.hiringManager ?? undefined,
        annualCtc: offer.annualCtc,
        breakup: offer.breakup,
        joinDate: offer.expectedDoj,
        hasUserAccount: mode === 'employee-user',
      })
    },
    onOfferCancelled: (applicationId) => {
      candidates.patchApp(applicationId, (a) => ({
        ...a,
        status: 'cancelled',
        rejectionReason: 'Offer withdrawn by the company',
        stageHistory: [
          ...a.stageHistory,
          {
            at: today(),
            actor: role,
            from: String(a.status),
            to: 'cancelled',
            note: 'Offer cancelled by the company',
          },
        ],
      }))
    },
    onOfferRefused: (applicationId) => {
      candidates.patchApp(applicationId, (a) => ({
        ...a,
        stageHistory: [
          ...a.stageHistory,
          {
            at: today(),
            actor: role,
            from: String(a.status),
            to: String(a.status),
            note: 'Offer refused by candidate — retained in history',
          },
        ],
      }))
    },
  })

  const isCompanyAdmin = hasRole('Company Admin', 'Group Company Admin')
  const showConfig = hasRole('Company Admin', 'Group Company Admin', 'Platform Admin')
  const showGovernance = hasRole(
    'Platform Admin',
    'Portfolio Admin',
    'Group Company Admin',
    'Company Admin'
  )
  const showAdmin = showConfig || showGovernance

  const isEmployee = hasRole('Employee (User)', 'Employee (Non-User)')
  const defaultTab = isEmployee ? 'portal' : 'openings'

  const [openingsView, setOpeningsView] = useState<'requisitions' | 'vacancies'>('requisitions')
  const [candidatesView, setCandidatesView] = useState<'pipeline' | 'talent-pool'>('pipeline')

  return (
    <>
      <CommonHeader title='Recruitment' className='bg-blue-150' />
      <Main fluid className='bg-neutral-200'>
        <div className='w-full'>
          <RecruitmentSummary
            requisitions={requisitions.requisitions}
            applications={candidates.applications}
            offers={offers.offers}
          />

          <Tabs defaultValue={takeRequestedTab('/recruitment') ?? defaultTab} className='w-full'>
            <TabsList className='mb-2 flex-wrap bg-transparent p-0 h-auto justify-start gap-2 rounded-none'>
              <TabsTrigger value='portal' variant='primary'>
                Candidate Portal
              </TabsTrigger>
              <TabsTrigger value='openings' variant='primary'>
                Job Openings
              </TabsTrigger>
              <TabsTrigger value='candidates' variant='primary'>
                Candidates
              </TabsTrigger>
              <TabsTrigger value='offers' variant='primary'>
                Offers
              </TabsTrigger>
              {showGovernance && (
                <TabsTrigger value='reports' variant='primary'>
                  Reports
                </TabsTrigger>
              )}
              {showAdmin && (
                <TabsTrigger value='admin' variant='primary'>
                  Admin
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value='portal'>
              <PortalTab
                candidatesStore={candidates}
                offersStore={offers}
                requisitions={requisitions.requisitions}
                letterTemplates={config.letterTemplates}
              />
            </TabsContent>

            <TabsContent value='openings'>
              <SegmentedSelector
                options={[
                  { value: 'requisitions', label: 'Job Requests' },
                  { value: 'vacancies', label: 'Postings' },
                ]}
                value={openingsView}
                onChange={setOpeningsView}
              />
              {openingsView === 'requisitions' && (
                <RequisitionsTab
                  store={requisitions}
                  customFields={config.customFields}
                  applications={candidates.applications}
                />
              )}
              {openingsView === 'vacancies' && (
                <VacanciesTab
                  store={vacancies}
                  postingChannels={config.postingChannels}
                  assignmentMethod={config.assignmentMethod}
                />
              )}
            </TabsContent>

            <TabsContent value='candidates'>
              <SegmentedSelector
                options={[
                  { value: 'pipeline', label: 'Hiring Pipeline' },
                  { value: 'talent-pool', label: 'Talent Pool' },
                ]}
                value={candidatesView}
                onChange={setCandidatesView}
              />
              {candidatesView === 'pipeline' && (
                <HiringPipelineTab
                  store={candidates}
                  offersStore={offers}
                  panels={config.panels}
                  roundsConfigs={config.roundsConfigs}
                  checklistQuestions={config.checklistQuestions}
                  criteria={config.criteria}
                  criteriaVersion={config.criteriaVersion}
                  letterTemplates={config.letterTemplates}
                  offerApproverRules={config.offerApproverRules}
                  outOfBandApprover={config.outOfBandApprover}
                  referenceQuestions={config.refQuestions}
                />
              )}
              {candidatesView === 'talent-pool' && (
                <TalentPoolTab
                  store={candidates}
                  requisitions={requisitions.requisitions}
                  mailboxEnabled={config.mailbox.enabled && isCompanyAdmin}
                  vacancies={vacancies.vacancies}
                />
              )}
            </TabsContent>

            <TabsContent value='offers'>
              <OffersTab
                store={offers}
                applications={candidates.applications}
                checklistQuestions={config.checklistQuestions}
                documentsStore={candidateDocuments}
                requiredDocuments={config.requiredDocuments}
              />
            </TabsContent>

            {showGovernance && (
              <TabsContent value='reports'>
                <RecruitmentReportsTab
                  applications={candidates.applications}
                  candidates={candidates.candidates}
                  offers={offers.offers}
                  requisitions={requisitions.requisitions}
                  documents={candidateDocuments.submissions}
                />
              </TabsContent>
            )}

            {showAdmin && (
              <TabsContent value='admin'>
                <div className='flex flex-col gap-8'>
                  <section>
                    <h3 className='text-paragraph-md text-neutral-1400 mb-3 font-semibold'>
                      Engine Features
                    </h3>
                    <EngineArtifactsPanel module='Recruitment' />
                  </section>
                  {showConfig && (
                    <section>
                      <h3 className='text-paragraph-md text-neutral-1400 mb-3 font-semibold'>
                        Settings
                      </h3>
                      <ConfigurationTab config={config} />
                    </section>
                  )}
                  {showGovernance && (
                    <section>
                      <h3 className='text-paragraph-md text-neutral-1400 mb-3 font-semibold'>
                        Company &amp; Platform Policies
                      </h3>
                      <GovernanceTab config={config} />
                    </section>
                  )}
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </Main>
    </>
  )
}
