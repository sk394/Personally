// routes/(auth)/verify-email.tsx
import { useForm } from '@tanstack/react-form'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import z from 'zod'
import { toast } from 'sonner'
import { useState } from 'react'
import { authClient } from '@/lib/auth/auth-client'
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { ButtonGroup } from '@/components/ui/button-group'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

export const Route = createFileRoute('/(auth)/verify-email')({
  component: VerifyEmailPage,
  validateSearch: z.object({
    email: z.string().email(),
  }),
})

const verifySchema = z.object({
  code: z.string().min(6, 'Verification code must be 6 digits'),
})

function VerifyEmailPage() {
  const navigate = useNavigate()
  const { email } = Route.useSearch()
  const [isResending, setIsResending] = useState(false)

  const form = useForm({
    defaultValues: {
      code: '',
    },
    validators: {
      onChange: verifySchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await authClient.emailOtp.verifyEmail({
          email: email,
          otp: value.code,
          fetchOptions: {
            onError: (ctx) => {
              toast.error(ctx.error.message)
            },
            onSuccess: async () => {
              toast.success('Email verified successfully!')
              navigate({ to: '/' })
            },
          },
        })
      } catch (error) {
        toast.error('Failed to verify email')
      }
    },
  })

  const handleResend = async () => {
    setIsResending(true)
    try {
      await authClient.emailOtp.sendVerificationOtp({
        email: email,
        type: 'email-verification',
        fetchOptions: {
          onSuccess: () => {
            toast.success('Verification code resent!')
          },
          onError: (ctx) => {
            toast.error(ctx.error.message)
          },
        },
      })
    } catch (error) {
      toast.error('Failed to resend code')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Verify your email</h2>
        <p className="text-sm text-muted-foreground mt-2">
          We've sent a verification code to <strong>{email}</strong>
        </p>
      </div>

      <form
        id="verify-form"
        onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }}
      >
        <FieldGroup>
          <form.Field
            name="code"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>
                    Verification Code
                  </FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="Enter 6-digit code"
                    autoComplete="off"
                    maxLength={6}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          />
        </FieldGroup>

        <form.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
          children={([canSubmit, isSubmitting]) => (
            <ButtonGroup>
              <Button
                type="submit"
                form="verify-form"
                className="w-full"
                disabled={!canSubmit}
              >
                {isSubmitting ? <Spinner /> : 'Verify Email'}
              </Button>
            </ButtonGroup>
          )}
        />
      </form>

      <div className="text-center text-sm">
        Didn't receive the code?{' '}
        <button
          type="button"
          onClick={handleResend}
          disabled={isResending}
          className="underline underline-offset-4 disabled:opacity-50"
        >
          {isResending ? 'Resending...' : 'Resend'}
        </button>
      </div>
    </div>
  )
}
