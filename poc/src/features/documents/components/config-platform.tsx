import { useState } from 'react'
import { Database, LockKey, ShieldCheck } from 'phosphor-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ALL_FORMATS, type DocumentFormat } from '../data/documents'
import { COMPANIES } from '../data/org'
import { type DocumentSettingsStore } from '../hooks/use-document-settings'

interface ConfigPlatformProps {
  settings: DocumentSettingsStore
}

/**
 * Platform Admin governance: the file-upload policy (allowed formats + max
 * size) maintained as versioned, effective-dated config that the validation
 * engine reads (DOC-17/21), and the encryption-at-rest / tenant-isolation
 * security posture (DOC-10).
 */
export function ConfigPlatform({ settings }: ConfigPlatformProps) {
  const [draftFormats, setDraftFormats] = useState<DocumentFormat[]>(
    settings.policy.allowedFormats
  )
  const [draftMaxMb, setDraftMaxMb] = useState(
    String(settings.policy.maxSizeMb)
  )

  const toggleFormat = (format: DocumentFormat) =>
    setDraftFormats((prev) =>
      prev.includes(format)
        ? prev.filter((f) => f !== format)
        : [...prev, format]
    )

  const save = () => {
    const maxMb = Number(draftMaxMb)
    if (!Number.isFinite(maxMb) || maxMb <= 0 || draftFormats.length === 0)
      return
    settings.updatePolicy(draftFormats, maxMb)
  }

  return (
    <>
      <Card className='gap-3 border-none bg-white py-4'>
        <CardHeader className='px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            File-upload policy (governed, versioned)
          </CardTitle>
          <p className='text-paragraph-sm text-neutral-1000'>
            The upload validation engine evaluates every file&#39;s actual type
            and size against this config — no hard-coded rules, no redeploy.
            Applies to Company, Employee, and Candidate uploads uniformly.
          </p>
        </CardHeader>
        <CardContent className='space-y-3 px-4'>
          <div>
            <p className='text-neutral-1600 mb-1 text-sm font-medium'>
              Allowed formats
            </p>
            <div className='flex flex-wrap gap-1'>
              {ALL_FORMATS.map((format) => {
                const allowed = draftFormats.includes(format)
                return (
                  <button
                    key={format}
                    type='button'
                    onClick={() => toggleFormat(format)}
                    title={allowed ? 'Allowed — click to block' : 'Blocked — click to allow'}
                  >
                    <Badge variant={allowed ? 'open' : 'pending'}>
                      {format}
                    </Badge>
                  </button>
                )
              })}
            </div>
          </div>
          <div className='flex items-end gap-2'>
            <div>
              <Label htmlFor='max-size' className='text-sm font-medium'>
                Maximum file size (MB)
              </Label>
              <Input
                id='max-size'
                type='number'
                min={1}
                value={draftMaxMb}
                onChange={(e) => setDraftMaxMb(e.target.value)}
                className='mt-1 h-7 w-[120px]'
              />
            </div>
            <Button className='h-7 px-3' onClick={save}>
              Save policy version
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Version</TableHead>
                <TableHead>Effective from</TableHead>
                <TableHead>Changed by</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...settings.policyVersions].reverse().map((version) => (
                <TableRow key={version.version}>
                  <TableCell className='text-sm font-medium'>
                    v{version.version}
                  </TableCell>
                  <TableCell className='text-sm'>
                    {version.effectiveFrom}
                  </TableCell>
                  <TableCell className='text-sm'>{version.changedBy}</TableCell>
                  <TableCell className='text-neutral-1000 text-sm'>
                    {version.note}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className='gap-3 border-none bg-white py-4'>
        <CardHeader className='px-4'>
          <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
            Security posture — encryption &amp; tenant isolation
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3 px-4'>
          <div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
            <div className='border-grey-200 rounded-[6px] border px-3 py-2'>
              <div className='mb-1 flex items-center gap-2'>
                <LockKey size={16} className='text-blue-1400' />
                <p className='text-neutral-1600 text-sm font-medium'>
                  Encryption at rest
                </p>
              </div>
              <p className='text-paragraph-sm text-neutral-1000'>
                Every stored document is AES-256 encrypted with a per-tenant
                key and decrypted only for authorized users of the owning
                tenant.
              </p>
            </div>
            <div className='border-grey-200 rounded-[6px] border px-3 py-2'>
              <div className='mb-1 flex items-center gap-2'>
                <Database size={16} className='text-blue-1400' />
                <p className='text-neutral-1600 text-sm font-medium'>
                  Tenant isolation
                </p>
              </div>
              <p className='text-paragraph-sm text-neutral-1000'>
                Row-level scoping means queries return only the caller&#39;s
                tenant documents across Company, Employee, and Candidate
                entities — no cross-tenant leakage.
              </p>
            </div>
            <div className='border-grey-200 rounded-[6px] border px-3 py-2'>
              <div className='mb-1 flex items-center gap-2'>
                <ShieldCheck size={16} className='text-blue-1400' />
                <p className='text-neutral-1600 text-sm font-medium'>
                  Access controls
                </p>
              </div>
              <p className='text-paragraph-sm text-neutral-1000'>
                The role-based access matrix combines with tenant isolation so
                only permitted roles can view or download each category.
              </p>
            </div>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tenant</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Encryption key</TableHead>
                <TableHead>Isolation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {COMPANIES.map((company, index) => (
                <TableRow key={company.name}>
                  <TableCell className='text-sm font-medium'>
                    {company.name}
                  </TableCell>
                  <TableCell className='text-sm'>{company.group}</TableCell>
                  <TableCell className='text-neutral-1000 text-sm'>
                    kms/doc-key-{2026 + index}a · AES-256
                  </TableCell>
                  <TableCell>
                    <Badge variant='badge_active'>Enforced</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}
