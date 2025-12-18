import { useStore } from '@tanstack/react-form'
import {
  CalendarIcon,
  ChevronDown,
  Loader2,
  LockIcon,
  MailIcon,
  X,
} from 'lucide-react'
import { format } from 'date-fns'
import { Outlet } from '@tanstack/react-router'
import { RadioGroup, RadioGroupItem } from './ui/radio-group'
import { Button } from '@/components/ui/button'
import { ButtonGroup } from '@/components/ui/button-group'
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSet,
  FieldTitle,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group'
import {
  useFieldContext,
  useFormContext,
} from '@/hooks/personally.form-context'
import { Textarea } from '@/components/ui/textarea'
import * as ShadcnSelect from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Switch as ShadcnSwitch } from '@/components/ui/switch'
import { Slider as ShadcnSlider } from '@/components/ui/slider'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'

export function SubmitButton({
  label,
  className,
}: {
  label: string
  className?: string
}) {
  const form = useFormContext()
  return (
    <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
      {([canSubmit, isSubmitting]) => (
        <ButtonGroup>
          <Button
            type="submit"
            className={className}
            disabled={isSubmitting || !canSubmit}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {label + `ing...`}
              </>
            ) : (
              label
            )}
          </Button>
        </ButtonGroup>
      )}
    </form.Subscribe>
  )
}

function ErrorMessages({
  errors,
}: {
  errors: Array<string | { message: string }>
}) {
  return (
    <>
      {errors.map((error) => (
        <div
          key={typeof error === 'string' ? error : error.message}
          className="text-red-500 mt-1 font-bold"
        >
          {typeof error === 'string' ? error : error.message}
        </div>
      ))}
    </>
  )
}

export function TextField({
  label,
  placeholder,
  required,
  className,
  placeholderIcon,
  ...props
}: {
  label?: string
  placeholder?: string
  required?: boolean
  className?: string
  placeholderIcon?: React.ReactNode
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const field = useFieldContext<string>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <Field>
      {label && (
        <FieldLabel
          htmlFor={label}
          className="text-base font-semibold flex items-center gap-2"
        >
          {label} {required && <span className="text-destructive">*</span>}
        </FieldLabel>
      )}
      <InputGroup>
        <InputGroupInput
          {...props}
          value={field.state.value}
          placeholder={placeholder}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          autoComplete="off"
          autoFocus
          className={className}
        />
        {placeholderIcon && (
          <InputGroupAddon>{placeholderIcon}</InputGroupAddon>
        )}
      </InputGroup>
      {field.state.meta.isTouched && <FieldError errors={errors} />}
    </Field>
  )
}

export function NumberField({
  label,
  placeholder,
  required,
  children,
}: {
  label?: string
  placeholder?: string
  required?: boolean
  children?: React.ReactNode
}) {
  const field = useFieldContext<number>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <Field>
      {label && (
        <FieldLabel
          htmlFor={label}
          className="text-base font-semibold flex items-center gap-2"
        >
          {label} {required && <span className="text-destructive">*</span>}
        </FieldLabel>
      )}
      <InputGroup>
        <InputGroupInput
          value={field.state.value}
          type="number"
          placeholder={placeholder}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(Number(e.target.value))}
          autoComplete="off"
          autoFocus
          className="text-base h-10"
        />
        {children}
      </InputGroup>
      {field.state.meta.isTouched && <FieldError errors={errors} />}
    </Field>
  )
}

export function EmailField({
  label,
  placeholder,
  className,
  ...props
}: {
  label?: string
  placeholder?: string
  className?: string
} & React.ComponentProps<'input'>) {
  const field = useFieldContext<string>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <Field>
      {label && (
        <FieldLabel
          htmlFor={label}
          className="text-base font-semibold flex items-center gap-2"
        >
          {label}
        </FieldLabel>
      )}
      <InputGroup>
        <InputGroupInput
          {...props}
          value={field.state.value}
          placeholder={placeholder}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          type="email"
          className={className}
        />
        <InputGroupAddon>
          <MailIcon />
        </InputGroupAddon>
      </InputGroup>
      {field.state.meta.isTouched && <FieldError errors={errors} />}
    </Field>
  )
}

export function PasswordField({
  label,
  placeholder,
  className,
  ...props
}: {
  label?: string
  placeholder?: string
  className?: string
} & React.ComponentProps<'input'>) {
  const field = useFieldContext<string>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <Field>
      {label && (
        <FieldLabel
          htmlFor={label}
          className="text-base font-semibold flex items-center gap-2"
        >
          {label}
        </FieldLabel>
      )}
      <InputGroup>
        <InputGroupInput
          {...props}
          value={field.state.value}
          placeholder={placeholder}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          type="password"
          autoComplete="off"
          className={className}
        />
        <InputGroupAddon>
          <LockIcon />
        </InputGroupAddon>
      </InputGroup>
      {field.state.meta.isTouched && <FieldError errors={errors} />}
    </Field>
  )
}

export function DateField({
  label,
  placeholder,
  className,
}: {
  label?: string
  placeholder?: string
  className?: string
}) {
  const field = useFieldContext<Date | undefined>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <Field>
      {label && (
        <FieldLabel
          htmlFor={label}
          className="text-base font-semibold flex items-center gap-2"
        >
          {label}
        </FieldLabel>
      )}
      <Popover>
        <PopoverTrigger asChild>
          <div className="relative">
            <Button
              type="button"
              variant="outline"
              className={`w-full justify-start text-left font-normal ${className}`}
            >
              <CalendarIcon />
              {field.state.value ? (
                format(new Date(field.state.value), 'PPP')
              ) : (
                <span>{placeholder}</span>
              )}
            </Button>
            {field.state.value && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="absolute top-1/2 -end-0 -translate-y-1/2"
                onClick={(e) => {
                  e.preventDefault()
                  field.handleChange(undefined)
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="center" side="bottom">
          <Calendar
            mode="single"
            selected={
              field.state.value ? new Date(field.state.value) : undefined
            }
            onSelect={(date) => field.handleChange(date ?? undefined)}
            autoFocus
          />
        </PopoverContent>
      </Popover>
      {field.state.meta.isTouched && <FieldError errors={errors} />}
    </Field>
  )
}

export function TextArea({
  label,
  placeholder,
  rows = 3,
  fieldDescription,
}: {
  label?: string
  placeholder?: string
  rows?: number
  fieldDescription?: string
}) {
  const field = useFieldContext<string>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <Field>
      {/* <div className="flex items-center gap-2 mb-2">
        <ChevronDown className="size-4 text-indigo-500" />*/}
      {label && (
        <FieldLabel
          htmlFor={label}
          className="text-base font-semibold flex items-center gap-2"
        >
          {label}
        </FieldLabel>
      )}
      {/* </div>*/}
      <Textarea
        id={label}
        value={field.state.value}
        placeholder={placeholder}
        onBlur={field.handleBlur}
        rows={rows}
        onChange={(e) => field.handleChange(e.target.value)}
        className="resize-none text-base"
      />
      <FieldDescription>{fieldDescription}</FieldDescription>
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </Field>
  )
}

export function SelectField({
  label,
  values,
  placeholder,
}: {
  label: string
  values: Array<{ label: string; value: string }>
  placeholder?: string
}) {
  const field = useFieldContext<string>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <Field>
      <FieldLabel
        htmlFor={label}
        className="text-base font-semibold flex items-center gap-2"
      >
        {label}
      </FieldLabel>
      <ShadcnSelect.Select
        name={field.name}
        value={field.state.value}
        onValueChange={(value) => field.handleChange(value)}
      >
        <ShadcnSelect.SelectTrigger className="w-full">
          <ShadcnSelect.SelectValue placeholder={placeholder} />
        </ShadcnSelect.SelectTrigger>
        <ShadcnSelect.SelectContent>
          <ShadcnSelect.SelectGroup>
            {values.map((value) => (
              <ShadcnSelect.SelectItem key={value.value} value={value.value}>
                {value.label}
              </ShadcnSelect.SelectItem>
            ))}
          </ShadcnSelect.SelectGroup>
        </ShadcnSelect.SelectContent>
      </ShadcnSelect.Select>
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </Field>
  )
}

export function SwitchField({
  label,
  description,
}: {
  label: string
  description?: string
}) {
  const field = useFieldContext<boolean>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <Field>
      <div className="flex items-center justify-between space-x-2">
        <div className="flex-1">
          <FieldLabel
            htmlFor={label}
            className="text-base font-semibold flex items-center gap-2"
          >
            {label}
          </FieldLabel>
          {description && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              {description}
            </p>
          )}
        </div>
        <ShadcnSwitch
          id={label}
          checked={field.state.value}
          onCheckedChange={(checked) => field.handleChange(checked)}
        />
      </div>
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </Field>
  )
}

export function SliderField({
  label,
  min = 0,
  max = 100,
  step = 1,
}: {
  label: string
  min?: number
  max?: number
  step?: number
}) {
  const field = useFieldContext<number>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <Field>
      <div className="space-y-2">
        <div className="flex justify-between">
          <FieldLabel
            htmlFor={label}
            className="text-base font-semibold flex items-center gap-2"
          >
            {label}
          </FieldLabel>
          <span className="text-sm text-zinc-600 dark:text-zinc-400">
            {field.state.value}
          </span>
        </div>
        <ShadcnSlider
          id={label}
          min={min}
          max={max}
          step={step}
          value={[field.state.value]}
          onValueChange={(value) => field.handleChange(value[0])}
        />
      </div>
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </Field>
  )
}

export function CheckboxField({
  label,
  description,
}: {
  label: string
  description?: string
}) {
  const field = useFieldContext<boolean>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <Field>
      <div className="flex items-start space-x-2">
        <Checkbox
          id={label}
          checked={field.state.value}
          onCheckedChange={(checked) => field.handleChange(checked as boolean)}
        />
        <div className="flex-1">
          <Label
            htmlFor={label}
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            {label}
          </Label>
          {description && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              {description}
            </p>
          )}
        </div>
      </div>
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </Field>
  )
}

export function RadioGroupField({
  label,
  options,
}: {
  label: string
  options: Array<{ label: string; value: string; description?: string }>
}) {
  const field = useFieldContext<string>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <Field>
      <FieldLabel className="text-base font-semibold flex items-center gap-2">
        {label}
      </FieldLabel>
      <div className="space-y-2">
        {options.map((option) => (
          <div
            key={option.value}
            className="flex items-start space-x-3 cursor-pointer"
            onClick={() => field.handleChange(option.value)}
          >
            <div className="flex items-center h-5">
              <input
                type="radio"
                id={`${label}-${option.value}`}
                name={field.name}
                value={option.value}
                checked={field.state.value === option.value}
                onChange={(e) => field.handleChange(e.target.value)}
                className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
              />
            </div>
            <div className="flex-1">
              <Label
                htmlFor={`${label}-${option.value}`}
                className="text-sm font-medium cursor-pointer"
              >
                {option.label}
              </Label>
              {option.description && (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  {option.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
    </Field>
  )
}

export function ChoiceCardField({
  label,
  fieldDescription,
  alignment = 'vertical',
  options,
}: {
  label?: string
  fieldDescription?: string
  alignment?: 'horizontal' | 'vertical'
  options: Array<{
    label: string
    value: string
    description?: string
    icon?: React.ReactNode
    backgroundColor?: string
  }>
}) {
  const field = useFieldContext<string>()
  const errors = useStore(field.store, (state) => state.meta.errors)

  return (
    <div className="w-full">
      <FieldGroup>
        <FieldSet>
          {label && (
            <FieldLabel
              htmlFor={label}
              className="text-base font-semibold flex items-center gap-2"
            >
              {label}
            </FieldLabel>
          )}
          {fieldDescription && (
            <FieldDescription>{fieldDescription}</FieldDescription>
          )}
          <RadioGroup
            value={field.state.value}
            onValueChange={(value) => field.handleChange(value)}
            className={cn(
              alignment === 'horizontal'
                ? 'grid grid-cols-1 sm:grid-cols-2 gap-4'
                : 'flex flex-col gap-2',
            )}
          >
            {options.map((option) => {
              const isSelected = field.state.value === option.value
              return (
                <FieldLabel
                  key={option.value}
                  htmlFor={`${label}-${option.value}`}
                  className={
                    isSelected ? option.backgroundColor : 'hover:bg-indigo-50'
                  }
                >
                  <Field
                    orientation="horizontal"
                    className={cn(
                      'rounded-lg transition-all cursor-pointer border',
                      isSelected
                        ? option?.backgroundColor || 'bg-indigo-50 shadow-sm'
                        : ' dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700',
                    )}
                  >
                    <FieldContent>
                      <div className="flex items-center gap-2">
                        {option.icon}
                        <FieldTitle>{option.label}</FieldTitle>
                      </div>
                      {option.description && (
                        <FieldDescription>
                          {option.description}
                        </FieldDescription>
                      )}
                    </FieldContent>
                    <RadioGroupItem
                      value={option.value}
                      id={`${label}-${option.value}`}
                    />
                  </Field>
                </FieldLabel>
              )
            })}
          </RadioGroup>
          {field.state.meta.isTouched && <ErrorMessages errors={errors} />}
        </FieldSet>
      </FieldGroup>
    </div>
  )
}
