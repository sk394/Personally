import { createFormHook } from '@tanstack/react-form'
import { fieldContext, formContext } from './personally.form-context'
import {
  EmailField,
  SelectField,
  SwitchField,
  SliderField,
  CheckboxField,
  RadioGroupField,
  SubmitButton,
  TextField as PersonallyTextField,
  TextArea as PersonallyTextArea,
  ChoiceCardField,
  NumberField,
  PasswordField,
  DateField,
} from '@/components/personally.FormComponents'

export const { useAppForm, withForm } = createFormHook({
  fieldComponents: {
    PersonallyTextField,
    SelectField,
    PersonallyTextArea,
    EmailField,
    PasswordField,
    SwitchField,
    SliderField,
    CheckboxField,
    RadioGroupField,
    ChoiceCardField,
    NumberField,
    DateField,
  },
  formComponents: {
    SubmitButton,
  },
  fieldContext,
  formContext,
})
