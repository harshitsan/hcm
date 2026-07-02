import CommonHeader from '@/components/layout/common-header'
import { Main } from '@/components/layout/main'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useRole } from '@/context/role-context'
import { ConfigurationTab } from './components/configuration-tab'
import { GovernanceTab } from './components/governance-tab'
import { HiringPipelineTab } from './components/hiring-pipeline-tab'
import { OffersTab } from './components/offers-tab'
import { PortalTab } from './components/portal-tab'
import { RequisitionsTab } from './components/requisitions-tab'
import { RecruitmentSummary } from './components/summary-cards'
import { TalentPoolTab } from './components/talent-pool-tab'
import { VacanciesTab } from './components/vacancies-tab'
import { useCandidates } from './hooks/use-candidates'
import { useOffers } from './hooks/use-offers'
import { useRecruitmentConfig } from './hooks/use-recruitment-config'
import { useRequisitions } from './hooks/use-requisitions'
import { useVacancies } from './hooks/use-vacancies'

const today = () => new Date().toISOString().slice(0, 10)

/**
 * Recruitment / Talent Acquisition module (TA-01…TA-56) — requisition desk,
 * vacancies & postings, talent pool, end-to-end hiring pipeline, offer
 * lifecycle, candidate self-service portal, configuration metadata and
 * platform/group/portfolio governance. All state is in-memory (POC).
 */
export function Recruitment() {
  const { role, hasRole } = useRole()

  // Config first — it owns the shared engine log + notification dispatcher
  // that the domain stores write into (TA-27…TA-30).
  const config = useRecruitmentConfig()

  const requisitions = useRequisitions({
    actor: role,
    nonBudgetedApprover: config.nonBudgetedApprover,
    logEngine: config.logEngine,
    notify: config.notify,
  })

  const candidates = useCandidates({
    actor: role,
    logEngine: config.logEngine,
    notify: config.notify,
  })

  const vacancies = useVacancies({
    assignmentMethod: config.assignmentMethod,
    postingApproverRules: config.postingApproverRules,
    logEngine: config.logEngine,
    notify: config.notify,
  })

  const offers = useOffers({
    actor: role,
    offerApproverRules: config.offerApproverRules,
    outOfBandApprover: config.outOfBandApprover,
    logEngine: config.logEngine,
    notify: config.notify,
    // TA-14: conversion marks the application hired + requisition filled.
    onConverted: (applicationId, requisitionId) => {
      candidates.patchApp(applicationId, (a) => ({
        ...a,
        status: 'hired',
        stageHistory: [
          ...a.stageHistory,
          { at: today(), actor: role, from: String(a.status), to: 'hired' },
        ],
      }))
      requisitions.setStatus(
        requisitionId,
        'filled',
        'Requisition filled via candidate conversion'
      )
    },
    // TA-47: company-side withdrawal closes the candidature as cancelled.
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
    // TA-47: refusal is recorded while the candidate is retained in history.
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
  const showConfig = hasRole(
    'Company Admin',
    'Group Company Admin',
    'Platform Admin'
  )
  const showGovernance = hasRole(
    'Platform Admin',
    'Portfolio Admin',
    'Group Company Admin',
    'Company Admin'
  )

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

          <Tabs defaultValue='requisitions' className='w-full'>
            <TabsList className='mb-2 flex-wrap'>
              <TabsTrigger value='requisitions' variant='primary'>
                Requisitions
              </TabsTrigger>
              <TabsTrigger value='vacancies' variant='primary'>
                Vacancies &amp; Postings
              </TabsTrigger>
              <TabsTrigger value='talent-pool' variant='primary'>
                Talent Pool
              </TabsTrigger>
              <TabsTrigger value='pipeline' variant='primary'>
                Hiring Pipeline
              </TabsTrigger>
              <TabsTrigger value='offers' variant='primary'>
                Offers &amp; Letters
              </TabsTrigger>
              <TabsTrigger value='portal' variant='primary'>
                Candidate Portal
              </TabsTrigger>
              {showConfig && (
                <TabsTrigger value='configuration' variant='primary'>
                  Configuration
                </TabsTrigger>
              )}
              {showGovernance && (
                <TabsTrigger value='governance' variant='primary'>
                  Governance
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value='requisitions'>
              <RequisitionsTab
                store={requisitions}
                customFields={config.customFields}
                applications={candidates.applications}
              />
            </TabsContent>

            <TabsContent value='vacancies'>
              <VacanciesTab
                store={vacancies}
                postingChannels={config.postingChannels}
                assignmentMethod={config.assignmentMethod}
              />
            </TabsContent>

            <TabsContent value='talent-pool'>
              <TalentPoolTab
                store={candidates}
                requisitions={requisitions.requisitions}
                mailboxEnabled={config.mailbox.enabled && isCompanyAdmin}
              />
            </TabsContent>

            <TabsContent value='pipeline'>
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
              />
            </TabsContent>

            <TabsContent value='offers'>
              <OffersTab
                store={offers}
                applications={candidates.applications}
                checklistQuestions={config.checklistQuestions}
              />
            </TabsContent>

            <TabsContent value='portal'>
              <PortalTab
                candidatesStore={candidates}
                offersStore={offers}
                requisitions={requisitions.requisitions}
                letterTemplates={config.letterTemplates}
              />
            </TabsContent>

            {showConfig && (
              <TabsContent value='configuration'>
                <ConfigurationTab config={config} />
              </TabsContent>
            )}

            {showGovernance && (
              <TabsContent value='governance'>
                <GovernanceTab config={config} />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </Main>
    </>
  )
}
