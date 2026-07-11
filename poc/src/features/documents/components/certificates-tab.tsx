import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Medal, Plus, Trash } from 'phosphor-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { type MastersStore } from '../hooks/use-masters'

const certificateFormSchema = z.object({
  certificateName: z.string().min(2, 'Certificate name is required'),
  authorityName: z.string().min(2, 'Authority name is required'),
})

type CertificateFormValues = z.infer<typeof certificateFormSchema>

interface CertificatesTabProps {
  masters: MastersStore
}

/**
 * Kensium Required Certificates master (DOC-26/27): register certificates
 * with their issuing authority; starts with the "No records to display"
 * empty state until the first certificate is configured.
 */
export function CertificatesTab({ masters }: CertificatesTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  const form = useForm<CertificateFormValues>({
    resolver: zodResolver(certificateFormSchema),
    defaultValues: { certificateName: '', authorityName: '' },
  })

  function handleSubmit(values: CertificateFormValues) {
    masters.addCertificate(values)
    form.reset()
    setDialogOpen(false)
  }

  const total = masters.certificates.length

  return (
    <div className='w-full'>
      <div className='mb-3 flex items-center justify-between'>
        <div>
          <h2 className='text-neutral-1600 text-paragraph-md font-medium'>
            Required certificates ({total})
          </h2>
          <p className='text-paragraph-sm text-neutral-1000'>
            Certification requirements tracked for employees, tenant-scoped.
          </p>
        </div>
        <Button
          variant='red'
          onClick={() => {
            form.reset()
            setDialogOpen(true)
          }}
          className='bg-orange-1200 hover:bg-orange-1200 h-7 gap-1! rounded-[6px]! px-1.5!'
        >
          <Plus size={10} weight='bold' />
          Add New Certificate
        </Button>
      </div>

      {total === 0 ? (
        <div className='border-gray-200 flex flex-col items-center gap-2 rounded-[6px] border bg-white px-6 py-12 text-center'>
          <Medal size={32} className='text-neutral-1000' />
          <p className='text-neutral-1600 text-paragraph-md font-medium'>
            No records to display
          </p>
          <p className='text-paragraph-sm text-neutral-1000 max-w-md'>
            Displaying items 0 of 0 — no required certificates have been
            configured yet. Click &#34;Add New Certificate&#34; to begin setup.
          </p>
        </div>
      ) : (
        <div className='rounded-md border bg-white'>
          <Table>
            <TableHeader>
              <TableRow className='bg-gray-50'>
                <TableHead>Certificate name</TableHead>
                <TableHead>Authority name</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {masters.certificates.map((certificate) => (
                <TableRow key={certificate.id}>
                  <TableCell className='text-sm font-medium'>
                    {certificate.certificateName}
                  </TableCell>
                  <TableCell className='text-sm'>
                    {certificate.authorityName}
                  </TableCell>
                  <TableCell className='text-right'>
                    <Button
                      variant='icon2'
                      className='text-neutral-1900 h-7 w-7'
                      aria-label='Delete'
                      onClick={() => masters.deleteCertificate(certificate.id)}
                    >
                      <Trash size={16} weight='bold' />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className='border-gray-200 border-t px-3 py-2'>
            <span className='text-paragraph-sm text-neutral-1000'>
              Displaying items 1 - {total} of {total}
            </span>
          </div>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className='sm:max-w-[420px]'>
          <DialogHeader>
            <DialogTitle>Add new certificate</DialogTitle>
            <DialogDescription>
              Register a required certificate and its issuing authority.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className='space-y-4'
            >
              <FormField
                control={form.control}
                name='certificateName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Certificate name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='e.g. Fire Safety Certification'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='authorityName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Authority name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='e.g. National Safety Council'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type='submit'>Add certificate</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
