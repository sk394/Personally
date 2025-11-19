import { authClient } from '@/lib/auth/auth-client';
import { useForm } from '@tanstack/react-form';
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import z from 'zod';
import { toast } from 'sonner'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';
import { LockIcon, MailIcon } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { ButtonGroup } from '@/components/ui/button-group';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn, getSessionUser } from '@/lib/utils';
import { getRequest } from '@tanstack/react-start/server';

export const Route = createFileRoute('/(auth)/signup')({
  component: SignupPage,
  // if already signed in, redirect to dashboard
  beforeLoad: async () => {
    'use server';
    const request = getRequest();
    const user = getSessionUser(request);
    if (user) {
      throw redirect({ to: '/dashboard' });
    }
  }
})

const signUpSchema = z
  .object({
    firstName: z.string().min(2, "First name must be at least 2 characters"),
    lastName: z.string().min(2, "Last name must be at least 2 characters"),
    email: z.string().email("Please enter a valid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    passwordConfirmation: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "Passwords do not match.",
    path: ["passwordConfirmation"],
  });

function SignupPage() {
  const navigate = useNavigate();
  const form = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      passwordConfirmation: ""
    },
    validators: {
      onChange: signUpSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        // First create the user account
        await authClient.signUp.email({
          email: value.email,
          password: value.password,
          name: `${value.firstName} ${value.lastName}`,
          fetchOptions: {
            onError: (ctx) => {
              toast.error(ctx.error.message);
            },
            onSuccess: async () => {
              toast.success("Account created successfully!");
              navigate({ to: "/dashboard" });
              // Then send the OTP for verification
              // try {
              //   await authClient.emailOtp.sendVerificationOtp({
              //     email: value.email,
              //     type: "email-verification",
              //     fetchOptions: {
              //       onSuccess: () => {
              //         toast.success("Account created! Please check your email for verification code.");
              //         navigate({ to: "/verify-email", search: { email: value.email } });
              //       },
              //       onError: (ctx) => {
              //         toast.error("Account created but failed to send verification code: " + ctx.error.message);
              //         navigate({ to: "/verify-email", search: { email: value.email } });
              //       },
              //     },
              //   });
              // } catch (error) {
              //   toast.error("Account created but failed to send verification code");
              //   navigate({ to: "/verify-email", search: { email: value.email } });
              // }
            },
          },
        });
      } catch (error) {
        toast.error("An error occurred during sign up");
      }
    },
  });

  return (
    <div className="flex h-screen items-center justify-center bg-neutral-100 px-4 py-16 dark:bg-neutral-900">
      <div className="shadow-input mx-auto w-full max-w-md rounded-none bg-white p-4 md:rounded-2xl md:p-8 dark:bg-black">
        <h2 className="text-xl font-bold text-neutral-800 dark:text-neutral-200">
          Welcome to Personally
        </h2>
        <form id="signup-form" className="my-8" onSubmit={(e) => {
          e.preventDefault()
          form.handleSubmit()
        }} >
          <FieldGroup>
            <div className="mb-2 flex flex-col space-y-1 md:flex-row md:space-y-0 md:space-x-2">
              <LabelInputContainer>
                <form.Field
                  name="firstName"
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>First Name</FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          placeholder="John"
                          autoComplete="off"
                        />
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    )
                  }}
                />
              </LabelInputContainer>
              <LabelInputContainer>
                <form.Field
                  name="lastName"
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>Last Name</FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          placeholder="Doe"
                          autoComplete="off"
                        />
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    )
                  }}
                />
              </LabelInputContainer>
            </div>
            <LabelInputContainer>
              <form.Field
                name="email"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                      <InputGroup>
                        <InputGroupInput
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          autoComplete="off"
                          type="email"
                          placeholder="Enter your email"
                        />
                        <InputGroupAddon>
                          <MailIcon />
                        </InputGroupAddon>
                      </InputGroup>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              />
            </LabelInputContainer>
            <LabelInputContainer>
              <form.Field
                name="password"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                      <InputGroup>
                        <InputGroupInput
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          type="password"
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          autoComplete="off"
                          placeholder="Enter your password"
                        />
                        <InputGroupAddon>
                          <LockIcon />
                        </InputGroupAddon>
                      </InputGroup>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              />
            </LabelInputContainer>
            <LabelInputContainer className="mb-8">
              <form.Field
                name="passwordConfirmation"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Confirm Password</FieldLabel>
                      <InputGroup>
                        <InputGroupInput
                          id={field.name}
                          name={field.name}
                          type="password"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          autoComplete="off"
                          placeholder="Retype your password"
                        />
                        <InputGroupAddon>
                          <LockIcon />
                        </InputGroupAddon>
                      </InputGroup>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  )
                }}
              />
            </LabelInputContainer>
          </FieldGroup>
          <form.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, isSubmitting]) => (
              <ButtonGroup>
                <Button type="submit" form="signup-form" className="group/btn relative block h-10 w-full rounded-md bg-gradient-to-br from-black to-neutral-600 font-medium text-white shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:bg-zinc-800 dark:from-zinc-900 dark:to-zinc-900 dark:shadow-[0px_1px_0px_0px_#27272a_inset,0px_-1px_0px_0px_#27272a_inset]" disabled={!canSubmit}>
                  {isSubmitting ? <Spinner /> : 'Submit'}
                </Button>
              </ButtonGroup>
            )}
          />
        </form>

        <div className="text-center text-sm">
          Already have an account?{" "}
          <Link to="/signin" className="underline underline-offset-4">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex w-full flex-col space-y-2", className)}>
      {children}
    </div>
  );
};