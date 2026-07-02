import { useState } from 'react'
import { Image as ImageIcon } from 'phosphor-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import type { OrganizationStore } from '../../hooks/use-organization'
import type { StepNavProps } from '../organization-tab'

interface BrandingStepProps extends StepNavProps {
  org: OrganizationStore
}

interface LogoSpec {
  key: 'loginLogo' | 'homeLogo'
  label: string
  width: number
  height: number
  usage: string
}

const LOGO_SPECS: LogoSpec[] = [
  {
    key: 'loginLogo',
    label: 'Login Logo',
    width: 220,
    height: 40,
    usage: 'Shown on the sign-in page',
  },
  {
    key: 'homeLogo',
    label: 'Home Logo',
    width: 151,
    height: 47,
    usage: 'Shown in the application header',
  },
]

/** Organization branding logo uploads with dimension checks (LOC-23). */
export function BrandingStep({ org, onNext, onBack }: BrandingStepProps) {
  const [loginLogo, setLoginLogo] = useState<string | null>(org.branding.loginLogo)
  const [homeLogo, setHomeLogo] = useState<string | null>(org.branding.homeLogo)

  const values = { loginLogo, homeLogo }
  const setters = { loginLogo: setLoginLogo, homeLogo: setHomeLogo }

  const handleFile = (spec: LogoSpec, file: File | undefined) => {
    if (!file) return
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      if (img.width !== spec.width || img.height !== spec.height) {
        toast.warning(
          `${spec.label}: expected ${spec.width}x${spec.height}px, got ${img.width}x${img.height}px. Resize for best results.`
        )
      }
      URL.revokeObjectURL(url)
    }
    img.src = url
    setters[spec.key](file.name)
  }

  const handleSave = () => {
    org.saveBranding({ loginLogo, homeLogo })
    onNext()
  }

  return (
    <Card className='gap-2 border-none bg-white py-3'>
      <CardHeader className='px-4'>
        <CardTitle className='text-paragraph-md text-neutral-1600 font-medium'>
          Branding logos
        </CardTitle>
      </CardHeader>
      <CardContent className='px-4'>
        <div className='max-w-2xl space-y-4'>
          {LOGO_SPECS.map((spec) => (
            <div key={spec.key} className='rounded-[6px] border border-gray-200 p-3'>
              <div className='mb-2 flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <ImageIcon size={16} weight='bold' className='text-neutral-1000' />
                  <span className='text-neutral-1600 text-sm font-medium'>
                    {spec.label} ({spec.width}x{spec.height})
                  </span>
                </div>
                {values[spec.key] ? (
                  <Badge variant='badge_active'>Uploaded</Badge>
                ) : (
                  <Badge variant='pending'>Not uploaded</Badge>
                )}
              </div>
              <p className='text-paragraph-sm text-neutral-1000 mb-2'>{spec.usage}</p>
              <Input
                type='file'
                accept='image/*'
                onChange={(e) => handleFile(spec, e.target.files?.[0])}
              />
              {values[spec.key] && (
                <p className='text-paragraph-sm text-neutral-1000 mt-1'>
                  Current file: {values[spec.key]}
                </p>
              )}
            </div>
          ))}

          <div className='flex justify-end gap-3 pt-2'>
            <Button type='button' variant='outline' onClick={onBack}>
              Back
            </Button>
            <Button type='button' onClick={handleSave}>
              Save &amp; Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
