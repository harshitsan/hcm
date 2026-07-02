import { useCallback, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  CURRENCIES,
  PIN_CODE_FORMATS,
  seedDocuments,
  seedHeadOffice,
  seedLocalization,
  type Branding,
  type HeadOfficeProfile,
  type LocalizationSettings,
  type OrgDocument,
  type PayrollSettings,
  type RegisteredContact,
} from '../data/organization'

export type OrgDocumentDraft = Omit<OrgDocument, 'id'>

/**
 * In-memory organization store: head-office profile, payroll schedule,
 * registered contact, branding, compliance documents and localization
 * settings (Kensium: Organization > Head Office / Localization Settings).
 */
export function useOrganization() {
  const [profile, setProfile] = useState<HeadOfficeProfile>(seedHeadOffice.profile)
  const [payroll, setPayroll] = useState<PayrollSettings>(seedHeadOffice.payroll)
  const [contact, setContact] = useState<RegisteredContact>(seedHeadOffice.contact)
  const [branding, setBranding] = useState<Branding>(seedHeadOffice.branding)
  const [documents, setDocuments] = useState<OrgDocument[]>(seedDocuments)
  const [localization, setLocalization] =
    useState<LocalizationSettings>(seedLocalization)

  const saveProfile = useCallback((next: HeadOfficeProfile) => {
    setProfile(next)
    toast.success('Head office profile saved')
  }, [])

  const savePayroll = useCallback((next: PayrollSettings) => {
    setPayroll(next)
    toast.success('Payroll schedule saved')
  }, [])

  const saveContact = useCallback((next: RegisteredContact) => {
    setContact(next)
    toast.success('Registered address & contact details saved')
  }, [])

  const saveBranding = useCallback((next: Branding) => {
    setBranding(next)
    toast.success('Branding logos saved')
  }, [])

  const addDocument = useCallback((draft: OrgDocumentDraft) => {
    const doc: OrgDocument = {
      ...draft,
      id: `DOC-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
    }
    setDocuments((prev) => [doc, ...prev])
    toast.success(`${draft.type} document added`)
  }, [])

  const updateDocument = useCallback((id: string, draft: OrgDocumentDraft) => {
    setDocuments((prev) => prev.map((d) => (d.id === id ? { ...d, ...draft } : d)))
    toast.success(`${draft.type} document updated`)
  }, [])

  const deleteDocument = useCallback((id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id))
    toast.success('Document removed')
  }, [])

  const saveLocalization = useCallback((next: LocalizationSettings) => {
    setLocalization(next)
    toast.success('Localization settings saved — applied across the application')
  }, [])

  /* -------- derived localization helpers (LOC-17, LOC-27, LOC-29) -------- */

  const currency = useMemo(
    () => CURRENCIES.find((c) => c.id === localization.currencyId) ?? CURRENCIES[0],
    [localization.currencyId]
  )

  const pinCodeFormat = useMemo(
    () =>
      PIN_CODE_FORMATS.find((f) => f.id === localization.pinCodeFormatId) ??
      PIN_CODE_FORMATS[0],
    [localization.pinCodeFormatId]
  )

  const validatePinCode = useCallback(
    (value: string) => new RegExp(pinCodeFormat.pattern).test(value),
    [pinCodeFormat]
  )

  return {
    profile,
    payroll,
    contact,
    branding,
    documents,
    localization,
    currency,
    pinCodeFormat,
    validatePinCode,
    saveProfile,
    savePayroll,
    saveContact,
    saveBranding,
    addDocument,
    updateDocument,
    deleteDocument,
    saveLocalization,
  }
}

export type OrganizationStore = ReturnType<typeof useOrganization>
