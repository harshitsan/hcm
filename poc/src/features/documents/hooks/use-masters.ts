import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  seedCertificates,
  seedCustodians,
  seedDocumentTypes,
  seedPolicies,
  type CustodianMapping,
  type DocumentType,
  type PolicyDocument,
  type RequiredCertificate,
} from '../data/masters'

export type DocumentTypeDraft = Omit<DocumentType, 'id'>
export type CertificateDraft = Omit<RequiredCertificate, 'id'>
export type CustodianDraft = Omit<CustodianMapping, 'id'>
export type PolicyDraft = Omit<PolicyDocument, 'id'>

const newId = (prefix: string) =>
  `${prefix}-${crypto.randomUUID().slice(0, 8)}`

/**
 * In-memory stores for the Kensium document masters: Document Types,
 * Required Certificates, Document Custodians, and Policy Documents.
 * All tenant-scoped; CRUD mutates local state only.
 */
export function useMasters() {
  const [documentTypes, setDocumentTypes] =
    useState<DocumentType[]>(seedDocumentTypes)
  const [certificates, setCertificates] =
    useState<RequiredCertificate[]>(seedCertificates)
  const [custodians, setCustodians] =
    useState<CustodianMapping[]>(seedCustodians)
  const [policies, setPolicies] = useState<PolicyDocument[]>(seedPolicies)

  const addDocumentType = useCallback((draft: DocumentTypeDraft) => {
    setDocumentTypes((prev) => [...prev, { ...draft, id: newId('dt') }])
    toast.success(`Document type "${draft.name}" saved`)
  }, [])

  const updateDocumentType = useCallback(
    (id: string, draft: DocumentTypeDraft) => {
      setDocumentTypes((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...draft } : t))
      )
      toast.success(
        `Document type "${draft.name}" updated — existing documents keep their association`
      )
    },
    []
  )

  const addCertificate = useCallback((draft: CertificateDraft) => {
    setCertificates((prev) => [...prev, { ...draft, id: newId('rc') }])
    toast.success(`Certificate "${draft.certificateName}" registered`)
  }, [])

  const deleteCertificate = useCallback((id: string) => {
    setCertificates((prev) => prev.filter((c) => c.id !== id))
    toast.success('Certificate removed')
  }, [])

  const addCustodian = useCallback((draft: CustodianDraft) => {
    setCustodians((prev) => [...prev, { ...draft, id: newId('cu') }])
    toast.success(
      `Custodian assigned: ${draft.custodianPosition} for ${draft.documentTypeName}`
    )
  }, [])

  const updateCustodian = useCallback((id: string, draft: CustodianDraft) => {
    setCustodians((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...draft } : c))
    )
    toast.success('Custodian mapping updated')
  }, [])

  const deleteCustodian = useCallback((id: string) => {
    setCustodians((prev) => prev.filter((c) => c.id !== id))
    toast.success('Custodian mapping removed')
  }, [])

  const addPolicy = useCallback((draft: PolicyDraft) => {
    setPolicies((prev) => [{ ...draft, id: newId('pol') }, ...prev])
    toast.success(`Policy "${draft.name}" published`)
  }, [])

  const updatePolicy = useCallback((id: string, draft: PolicyDraft) => {
    setPolicies((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...draft } : p))
    )
    toast.success(`Policy "${draft.name}" updated`)
  }, [])

  const deletePolicy = useCallback((id: string) => {
    setPolicies((prev) => prev.filter((p) => p.id !== id))
    toast.success('Policy removed')
  }, [])

  return {
    documentTypes,
    addDocumentType,
    updateDocumentType,
    certificates,
    addCertificate,
    deleteCertificate,
    custodians,
    addCustodian,
    updateCustodian,
    deleteCustodian,
    policies,
    addPolicy,
    updatePolicy,
    deletePolicy,
  }
}

export type MastersStore = ReturnType<typeof useMasters>
