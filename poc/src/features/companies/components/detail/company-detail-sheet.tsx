import { useRole } from '@/context/role-context'
import { FloatingSheetContent } from '@/components/ui/floating-sheet-content'
import { Sheet, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { type ModuleName } from '../../data/companies'
import {
  currentVersion,
  type SubscriptionPackage,
} from '../../data/subscriptions'
import { editLevel, type CompaniesStore } from '../../hooks/use-companies'
import { CompanyStatusBadge, OperatingModelBadge } from '../company-badges'
import { ConfigurationTab } from './configuration-tab'
import { HistoryTab } from './history-tab'
import { JurisdictionsTab } from './jurisdictions-tab'
import { ProfileTab } from './profile-tab'

interface CompanyDetailSheetProps {
  companyId: string | null
  onOpenChange: (open: boolean) => void
  store: CompaniesStore
  packages: SubscriptionPackage[]
}

/**
 * COMP-FR — metadata-driven company profile screen (§5.2): business, legal,
 * contact, jurisdiction and configuration sections plus View History.
 */
export function CompanyDetailSheet({
  companyId,
  onOpenChange,
  store,
  packages,
}: CompanyDetailSheetProps) {
  const { role } = useRole()
  const company = store.companies.find((c) => c.id === companyId) ?? null
  if (!company) return null

  const level = editLevel(company, role)
  const pkg = packages.find((p) => p.id === company.packageId)
  const packageModules: ModuleName[] = pkg ? currentVersion(pkg).modules : []

  return (
    <Sheet open={Boolean(companyId)} onOpenChange={onOpenChange}>
      <FloatingSheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[760px]'>
        <SheetHeader className='border-gray-200 border-b px-5 py-4'>
          <SheetTitle className='text-neutral-1600 text-paragraph-md flex items-center gap-2 font-semibold'>
            {company.primaryColor && (
              <span
                className='inline-block h-3.5 w-3.5 shrink-0 rounded-full'
                style={{ backgroundColor: company.primaryColor }}
                aria-hidden
              />
            )}
            {company.legalName}
            <CompanyStatusBadge status={company.status} />
            <OperatingModelBadge model={company.operatingModel} />
          </SheetTitle>
          <p className='text-paragraph-sm text-neutral-1000'>
            {company.code} · viewing as {role}
          </p>
        </SheetHeader>

        <div className='min-h-0 flex-1 overflow-y-auto px-5 py-4'>
          <Tabs defaultValue='profile'>
            <TabsList className='mb-3 bg-transparent p-0 h-auto justify-start gap-2 rounded-none'>
              <TabsTrigger value='profile' variant='primary'>
                Profile
              </TabsTrigger>
              <TabsTrigger value='jurisdictions' variant='primary'>
                Jurisdictions ({company.jurisdictions.length})
              </TabsTrigger>
              <TabsTrigger value='configuration' variant='primary'>
                Configuration
              </TabsTrigger>
              <TabsTrigger value='history' variant='primary'>
                View History
              </TabsTrigger>
            </TabsList>

            <TabsContent value='profile'>
              <ProfileTab company={company} store={store} editLevel={level} />
            </TabsContent>
            <TabsContent value='jurisdictions'>
              <JurisdictionsTab
                company={company}
                store={store}
                canEdit={level === 'full' && company.status === 'active'}
              />
            </TabsContent>
            <TabsContent value='configuration'>
              <ConfigurationTab
                company={company}
                store={store}
                canEdit={level === 'full' && company.status === 'active'}
                packageModules={packageModules}
              />
            </TabsContent>
            <TabsContent value='history'>
              <HistoryTab company={company} history={store.history} />
            </TabsContent>
          </Tabs>
        </div>
      </FloatingSheetContent>
    </Sheet>
  )
}
