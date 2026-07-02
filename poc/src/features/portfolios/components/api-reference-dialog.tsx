import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const CREATE_REQUEST = `POST /api/v1/portfolios
Authorization: Bearer <platform-admin-token>

{
  "portfolioName": "Shared Services West",
  "description": "Western operating companies",
  "portfolioManagerId": "mgr-02",
  "companyIds": ["co-04", "co-10"]
}`

const CREATE_RESPONSE = `201 Created
{
  "portfolioId": "pf-9f21c3aa",
  "portfolioCode": "PORT-2026-003",
  "portfolioName": "Shared Services West",
  "status": "Active",
  "companies": [
    { "companyId": "co-04", "addedDate": "2026-07-02" },
    { "companyId": "co-10", "addedDate": "2026-07-02" }
  ],
  "createdDate": "2026-07-02"
}

409 Conflict — { "error": "PORT_001", "message": "Portfolio name exists" }
409 Conflict — { "error": "PORT_002", "message": "Company already in another portfolio" }`

const SWITCH_REQUEST = `POST /api/v1/users/switch-company

{ "targetCompanyId": "co-02" }`

const SWITCH_RESPONSE = `200 OK
{
  "success": true,
  "previousCompany": "Meridian Technologies",
  "currentCompany": "Northline Logistics",
  "sessionToken": "eyJhbGciOiJIUzI1NiJ9…",
  "permissions": ["employees.read", "reports.run"],
  "configuration": {
    "currency": "INR",
    "timeZone": "Asia/Kolkata",
    "dateFormat": "DD/MM/YYYY"
  }
}

403 Forbidden — { "error": "AUTH_002", "message": "Context switch not permitted" }`

function Endpoint({
  title,
  request,
  response,
}: {
  title: string
  request: string
  response: string
}) {
  return (
    <div className='space-y-2'>
      <div className='flex items-center gap-2'>
        <Badge variant='open'>{title}</Badge>
      </div>
      <pre className='overflow-x-auto rounded-md border border-gray-200 bg-neutral-100 p-3 font-mono text-xs whitespace-pre-wrap'>
        {request}
      </pre>
      <pre className='overflow-x-auto rounded-md border border-gray-200 bg-neutral-100 p-3 font-mono text-xs whitespace-pre-wrap'>
        {response}
      </pre>
    </div>
  )
}

/**
 * API contracts for programmatic provisioning (PORT-11 §6.2.1) and
 * programmatic context switching (PORT-16 §6.2.2). The POC has no backend —
 * these mirror the in-memory behavior of the module exactly.
 */
export function ApiReferenceDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[85vh] overflow-y-auto sm:max-w-[640px]'>
        <DialogHeader>
          <DialogTitle>Portfolio API reference</DialogTitle>
          <DialogDescription>
            Contracts the UI actions map to. Errors PORT_001, PORT_002 and
            AUTH_002 are enforced by the in-memory store just as the API would.
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-6'>
          <Endpoint
            title='Create Portfolio — §6.2.1'
            request={CREATE_REQUEST}
            response={CREATE_RESPONSE}
          />
          <Endpoint
            title='Switch Company Context — §6.2.2'
            request={SWITCH_REQUEST}
            response={SWITCH_RESPONSE}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
