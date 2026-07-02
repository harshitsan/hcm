import { useSearch } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AuthLayout } from './auth-layout'
import { UserAuthForm } from './user-auth-form'

export function SignIn() {
  const { redirect } = useSearch({ from: '/(auth)/sign-in' })

  return (
    <AuthLayout>
      <Card className='border-grey-1500 gap-4 rounded-lg border-2'>
        <CardHeader>
          <CardTitle>
            <h2 className='text-dark-400 text-h2 leading-8 font-semibold'>
              Login
            </h2>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <UserAuthForm redirectTo={redirect} />
        </CardContent>
      </Card>
    </AuthLayout>
  )
}
