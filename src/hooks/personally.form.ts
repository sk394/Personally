import { createFormHook } from '@tanstack/react-form'
import { fieldContext, formContext } from './personally.form-context'
import {
  CheckboxField,
  ChoiceCardField,
  DateField,
  EmailField,
  NumberField,
  PasswordField,
  TextArea as PersonallyTextArea,
  TextField as PersonallyTextField,
  RadioGroupField,
  SelectField,
  SliderField,
  SubmitButton,
  SwitchField,
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
