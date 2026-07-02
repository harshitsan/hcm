import { useEffect } from 'react'
import { z } from 'zod'
import { useFormContext } from 'react-hook-form'
import { useDebounce } from '@/hooks/use-debounce'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDealerByEmail } from '@/features/auth/hooks/query/use-auth'

interface DealershipSelectProps {
  isLoading?: boolean
}

export function DealershipSelect({ isLoading }: DealershipSelectProps) {
  const form = useFormContext<{
    email: string
    dealership: string
  }>()

  const emailValue = form.watch('email')
  const debouncedEmail = useDebounce(emailValue, 500)

  // Validate email format
  const isValidEmail =
    debouncedEmail &&
    debouncedEmail.includes('@') &&
    (() => {
      try {
        z.string().email().parse(debouncedEmail)
        return true
      } catch {
        return false
      }
    })()

  const {
    data: dealerData,
    isLoading: isLoadingDealers,
    isNotFound,
  } = useDealerByEmail({
    email: debouncedEmail,
    enabled: !!isValidEmail,
  })

  // Normalize dealers to always be an array
  const dealers = (() => {
    if (!dealerData?.dealers) return []

    // Handle both array and single object cases
    if (Array.isArray(dealerData.dealers)) {
      return dealerData.dealers.map((dealer) => ({
        id: dealer.id,
        name: dealer.name,
      }))
    } else {
      // Single dealer object
      return [{ id: dealerData.dealers.id, name: dealerData.dealers.name }]
    }
  })()

  // Update dealership field when dealer data changes
  useEffect(() => {
    if (dealers.length === 1) {
      // Auto-select if only one dealer
      form.setValue('dealership', dealers[0].id)
    } else if (dealers.length === 0) {
      // Clear selection if no dealer found
      form.setValue('dealership', '')
    }
  }, [dealers, form])

  const hasNoDealer = isNotFound || dealerData === null || dealers.length === 0

  return (
    <FormField
      control={form.control}
      name='dealership'
      render={({ field }) => (
        <FormItem>
          <FormLabel className='text-neutral-1800 text-sm font-normal'>
            Select Dealership
          </FormLabel>
          <Select
            onValueChange={field.onChange}
            value={field.value}
            disabled={isLoading || isLoadingDealers || dealers.length === 0}
          >
            <FormControl>
              <SelectTrigger className='hover:!bg-neutral-2400 aria-invalid:!border-red-1400 aria-invalid:!ring-destructive/20 aria-invalid:!bg-red-1300 active:!border-blue-1400 !h-9 w-full min-w-0 !bg-transparent !px-3 !py-2 text-base !shadow-xs hover:!shadow-xs focus-visible:!shadow-[0px_0px_0px_2px_#1F5ADB] focus-visible:!ring-[1px] active:!shadow-xs md:text-sm'>
                <SelectValue
                  placeholder={
                    isLoadingDealers
                      ? 'Loading dealers...'
                      : hasNoDealer && debouncedEmail
                        ? `No dealer IDs found for email: ${debouncedEmail}`
                        : dealers.length === 0
                          ? 'Enter email to load dealers'
                          : 'Select Dealership'
                  }
                />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {hasNoDealer && debouncedEmail ? (
                <SelectItem value='no-dealer' disabled>
                  No dealer IDs found for email: {debouncedEmail}
                </SelectItem>
              ) : dealers.length === 0 && !isLoadingDealers ? (
                <SelectItem value='no-dealers' disabled>
                  Enter a valid email to load dealers
                </SelectItem>
              ) : (
                dealers.map((dealer) => (
                  <SelectItem key={dealer.id} value={dealer.id}>
                    {dealer.name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
