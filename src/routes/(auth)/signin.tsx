import { Link, createFileRoute, redirect, useNavigate  } from '@tanstack/react-router'
import z from 'zod'
import { toast } from 'sonner'
import { getRequest } from '@tanstack/react-start/server'
import { FieldGroup } from '@/components/ui/field'
import { cn } from '@/lib/utils'
import { authClient } from '@/lib/auth/auth-client'
import { useAppForm } from '@/hooks/personally.form'

export const Route = createFileRoute('/(auth)/signin')({
  component: SigninPage,
  ssr: true,
  beforeLoad: async () => {
    'use server'
    const request = getRequest()
    const { getSessionUser } = await import('@/lib/utils.server')
    const user = getSessionUser(request)
    if (user) {
      throw redirect({ to: '/dashboard' })
    }
  },
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
          <div className="flex justify-start mt-2">
            <form.AppForm>
              <form.SubmitButton label="Submit" />
            </form.AppForm>
          </div>

          {/* <form.Subscribe
                        selector={(state) => [state.canSubmit, state.isSubmitting]}
                        children={([canSubmit, isSubmitting]) => (
                            <ButtonGroup>
                                <Button type="submit" form="signin-form" className="group/btn relative block h-10 w-full rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset]" disabled={!canSubmit}>
                                    {isSubmitting ? <Spinner /> : 'Sign in'}
                                </Button>
                            </ButtonGroup>
                        )}
                    /> */}
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

export const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) => {
  return (
    <div className={cn('flex w-full flex-col space-y-2', className)}>
      {children}
    </div>
  )
}
