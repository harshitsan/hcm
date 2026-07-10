import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
  CUSTODIAN_TODAY,
  seedReceipts,
  type DocumentReceipt,
  type ReceiptReturnDetails,
} from '../data/receipts'

export type ReceiptDraft = Omit<
  DocumentReceipt,
  'id' | 'status' | 'returnDetails' | 'acknowledgement'
>

/**
 * In-memory store for custodian receipts & returns. Recording a receipt puts
 * the document "with custodian"; returning it moves it to a temporary or
 * permanent return awaiting the employee's acknowledgement. Receipts holding
 * a physical original can never be deleted from the register.
 */
export function useReceipts() {
  const [receipts, setReceipts] = useState<DocumentReceipt[]>(seedReceipts)

  const addReceipt = useCallback((draft: ReceiptDraft) => {
    const receipt: DocumentReceipt = {
      ...draft,
      id: `rcpt-${crypto.randomUUID().slice(0, 8)}`,
      status: 'with-custodian',
    }
    setReceipts((prev) => [receipt, ...prev])
    toast.success(
      `Receipt recorded — ${draft.documentName} of ${draft.employeeName} is now with the custodian`
    )
  }, [])

  const deleteReceipt = useCallback(
    (id: string) => {
      const receipt = receipts.find((r) => r.id === id)
      if (!receipt) return
      if (receipt.hasPhysicalCopy) {
        toast.error(
          'Receipts with a physical copy in custody cannot be deleted'
        )
        return
      }
      setReceipts((prev) => prev.filter((r) => r.id !== id))
      toast.success('Receipt removed from the custodian register')
    },
    [receipts]
  )

  const returnReceipt = useCallback(
    (id: string, details: ReceiptReturnDetails) => {
      setReceipts((prev) =>
        prev.map((r) =>
          r.id === id
            ? {
                ...r,
                status:
                  details.returnType === 'Temporary'
                    ? 'returned-temporary'
                    : 'returned-permanent',
                returnDetails: details,
                acknowledgement: undefined,
              }
            : r
        )
      )
      toast.success(
        `Document returned to employee (${details.returnType.toLowerCase()}) — awaiting acknowledgement`
      )
    },
    []
  )

  const acknowledgeReceipt = useCallback((id: string, comments: string) => {
    setReceipts((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'acknowledged',
              acknowledgement: {
                acknowledgedOn: CUSTODIAN_TODAY,
                comments,
              },
            }
          : r
      )
    )
    toast.success('Return acknowledged — the custodian has been notified')
  }, [])

  return {
    receipts,
    addReceipt,
    deleteReceipt,
    returnReceipt,
    acknowledgeReceipt,
  }
}

export type ReceiptsStore = ReturnType<typeof useReceipts>
