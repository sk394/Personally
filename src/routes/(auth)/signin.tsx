import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import z from 'zod'
import { toast } from 'sonner'
import { FieldGroup } from '@/components/ui/field'
import { authClient } from '@/lib/auth/auth-client'
import { useAppForm } from '@/hooks/personally.form'

export const Route = createFileRoute('/(auth)/signin')({
  component: SigninPage,
  ssr: true,
})

const signInSchema = z.object({
  email: z.email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

function SigninPage() {
  const navigate = useNavigate()
  const form = useAppForm({
    defaultValues: {
      email: '',
      password: '',
    },
    validators: {
      onChange: signInSchema,
    },
    onSubmit: async ({ value }) => {
      console.log('Form submitted with value:', value)
      try {
        await authClient.signIn.email({
          email: value.email,
          password: value.password,
          fetchOptions: {
            onError: (ctx) => {
              toast.error(ctx.error.message)
            },
            onSuccess: async () => {
              toast.success('Signed in successfully!')
              navigate({ to: '/dashboard' })
            },
          },
        })
      } catch (error) {
        toast.error('An error occurred during sign in')
      }
    },
  })

  return (
    <div className="flex h-screen items-center justify-center bg-neutral-100 px-4 py-16 dark:bg-neutral-900">
      <div className="shadow-input mx-auto w-full max-w-md rounded-none bg-white p-4 md:rounded-2xl md:p-8 dark:bg-black">
        <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
          Sign in to Personally
        </h2>
        <form
          id="signin-form"
          className="my-8"
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            form.handleSubmit()
          }}
        >
          <FieldGroup className="mb-2">
            <form.AppField name="email">
              {(field) => (
                <field.EmailField
                  label="Email"
                  placeholder="Enter your email"
                />
              )}
            </form.AppField>

            <form.AppField name="password">
              {(field) => (
                <field.PasswordField
                  label="Password"
                  placeholder="Enter your password"
                />
              )}
            </form.AppField>
          </FieldGroup>
          <div className="flex justify-start mt-4">
            <form.AppForm>
              <form.SubmitButton label="Submit" />
            </form.AppForm>
          </div>
        </form>

        <div className="text-center text-sm">
          Don't have an account?{' '}
          <Link to="/signup" className="underline underline-offset-4">
            Create account
          </Link>
        </div>
      </div>
    </div>
  )
}

