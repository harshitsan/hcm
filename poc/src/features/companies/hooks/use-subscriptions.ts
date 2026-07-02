import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { type Company, type ModuleName } from '../data/companies'
import {
  currentVersion,
  seedPackages,
  type EntitlementAction,
  type EntitlementDecision,
  type PackageVersion,
  type SubscriptionPackage,
} from '../data/subscriptions'

export interface PackageVersionDraft {
  companyLimit: number
  employeeLimit: number
  modules: ModuleName[]
  pricePerEmployeeMonth: number
  effectiveDate: string
}

/**
 * Governed subscription-package config store (FR 6.2.5). Package changes are
 * versioned + effective-dated; the "Rules engine" evaluates entitlements from
 * the current version — never from hard-coded limits.
 */
export function useSubscriptions(actor: string) {
  const [packages, setPackages] = useState<SubscriptionPackage[]>(seedPackages)

  /** CMP-19 — save a new package version; prior versions stay auditable. */
  const addPackageVersion = useCallback(
    (packageId: string, draft: PackageVersionDraft) => {
      setPackages((prev) =>
        prev.map((pkg) => {
          if (pkg.id !== packageId) return pkg
          const nextVersion: PackageVersion = {
            ...draft,
            version: Math.max(...pkg.versions.map((v) => v.version)) + 1,
            status: 'current',
            changedBy: actor,
          }
          return {
            ...pkg,
            versions: [
              nextVersion,
              ...pkg.versions.map((v) => ({
                ...v,
                status: 'superseded' as const,
              })),
            ],
          }
        })
      )
      toast.success('Package version published — engines pick it up on next evaluation')
    },
    [actor]
  )

  /**
   * CMP-20 — Rules-engine simulation: evaluate a request against the package
   * decision table read from current config.
   */
  const evaluateEntitlement = useCallback(
    (
      action: EntitlementAction,
      company: Company,
      allCompanies: Company[],
      module?: ModuleName
    ): EntitlementDecision => {
      const pkg = packages.find((p) => p.id === company.packageId)
      if (!pkg)
        return {
          decision: 'DENY',
          rule: 'PKG_MISSING',
          reason: 'No subscription package configured for this company',
        }
      const limits = currentVersion(pkg)

      if (action === 'create-company') {
        const used = allCompanies.filter(
          (c) =>
            c.packageId === company.packageId &&
            c.status !== 'archived' &&
            c.status !== 'cancelled'
        ).length
        return used >= limits.companyLimit
          ? {
              decision: 'DENY',
              rule: `companyLimit=${limits.companyLimit} (pkg ${pkg.name} v${limits.version})`,
              reason: `${used}/${limits.companyLimit} companies already provisioned on this package`,
            }
          : {
              decision: 'ALLOW',
              rule: `companyLimit=${limits.companyLimit} (pkg ${pkg.name} v${limits.version})`,
              reason: `${used}/${limits.companyLimit} companies in use`,
            }
      }

      if (action === 'add-employee') {
        if (company.employeeCount >= limits.employeeLimit)
          return {
            decision: 'DENY',
            rule: `employeeLimit=${limits.employeeLimit} (pkg ${pkg.name} v${limits.version})`,
            reason: `${company.employeeCount}/${limits.employeeLimit} employees — limit reached`,
          }
        if (company.employeeCount >= limits.employeeLimit * 0.9)
          return {
            decision: 'FLAG',
            rule: `employeeLimit=${limits.employeeLimit} (pkg ${pkg.name} v${limits.version})`,
            reason: `${company.employeeCount}/${limits.employeeLimit} employees — above the 90% soft threshold`,
          }
        return {
          decision: 'ALLOW',
          rule: `employeeLimit=${limits.employeeLimit} (pkg ${pkg.name} v${limits.version})`,
          reason: `${company.employeeCount}/${limits.employeeLimit} employees in use`,
        }
      }

      // access-module
      if (!module)
        return {
          decision: 'DENY',
          rule: 'MODULE_REQUIRED',
          reason: 'No module specified',
        }
      const inPackage = limits.modules.includes(module)
      const toggledOn = company.config.modules[module]
      if (!inPackage)
        return {
          decision: 'DENY',
          rule: `moduleSet (pkg ${pkg.name} v${limits.version})`,
          reason: `"${module}" is not in the subscribed module set`,
        }
      if (!toggledOn)
        return {
          decision: 'DENY',
          rule: `tenant module config v${company.config.modulesVersion}`,
          reason: `"${module}" is toggled off for ${company.tradeName || company.legalName}`,
        }
      return {
        decision: 'ALLOW',
        rule: `moduleSet + tenant config v${company.config.modulesVersion}`,
        reason: `"${module}" is subscribed and enabled`,
      }
    },
    [packages]
  )

  return { packages, addPackageVersion, evaluateEntitlement }
}

export type SubscriptionsStore = ReturnType<typeof useSubscriptions>
