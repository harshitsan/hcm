import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, ArrowRight } from 'lucide-react'
import { cn } from '@/utils/helpers'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/common/password-input'
import { useLoginHandler } from '../hooks/use-login-handler'

const formSchema = z.object({
  email: z.email({
    error: (iss) => (iss.input === '' ? 'Please enter your email' : undefined),
  }),
  password: z
    .string()
    .min(1, 'Please enter your password')
    .min(7, 'Password must be at least 7 characters long'),
  rememberMe: z.boolean(),
})

interface UserAuthFormProps extends React.HTMLAttributes<HTMLFormElement> {
  redirectTo?: string
}

export function UserAuthForm({
  className,
  redirectTo,
  ...props
}: UserAuthFormProps) {
  const { login, isLoading } = useLoginHandler({ redirectTo })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  })

  function onSubmit(data: z.infer<typeof formSchema>) {
    login({
      username: data.email,
      password: data.password,
      rememberMe: data.rememberMe,
    })
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-3', className)}
        {...props}
      >
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='text-neutral-1800 text-sm font-normal'>
                Email Address
              </FormLabel>
              <FormControl>
                <Input placeholder='' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem>
              <FormLabel className='text-neutral-1800 text-sm font-normal'>
                Password
              </FormLabel>
              <FormControl>
                <PasswordInput placeholder='' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className='mt-2 mb-4 flex items-center justify-between'>
          <FormField
            control={form.control}
            name='rememberMe'
            render={({ field }) => (
              <FormItem className='flex flex-row items-center space-y-0'>
                <FormControl>
                  <Checkbox
                    variant='blue'
                    checked={field.value}
                    onCheckedChange={(checked) => {
                      // Ensure boolean value is passed
                      field.onChange(!!checked)
                    }}
                  />
                </FormControl>
                <FormLabel className='text-neutral-1800 cursor-pointer text-sm font-normal'>
                  Remember me
                </FormLabel>
              </FormItem>
            )}
          />
        </div>

        <Button
          type='button'
          className='!text-md mt-2 !h-[42px] !bg-[#1a237e] font-semibold !text-white hover:!bg-[#151b60] active:!bg-[#0d1245] disabled:!bg-gray-300 disabled:!text-gray-500 disabled:!shadow-none'
          disabled={isLoading}
          onClick={() =>
            login({
              username: form.getValues('email'),
              password: form.getValues('password'),
              rememberMe: form.getValues('rememberMe'),
            })
          }
        >
          Continue
          {isLoading ? <Loader2 className='animate-spin' /> : <ArrowRight />}
        </Button>
      </form>
    </Form>
  )
}
