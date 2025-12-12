import { render } from '@react-email/render'
import { Resend } from 'resend'
import type { ReactElement } from 'react'
import { env } from '@/lib/env.server'

export async function sendEmail({
  subject,
  template,
  to,
}: {
  subject: string
  template: ReactElement
  to: string
}) {
  const resend = new Resend(env.RESEND_API_KEY)

  try {
    console.log('Attempting to send email to:', to)
    console.log('Subject:', subject)

    const html = await render(template)

    const { data, error } = await resend.emails.send({
      from: 'delivered@resend.dev', // TODO: Configure in env
      html,
      subject,
      to,
    })

    if (error) {
      console.error('Resend API error:', error)
      throw new Error(`Failed to send email: ${error.message}`)
    }

    console.log('Email sent successfully:', data)
    return data
  } catch (error) {
    console.error('Email sending error:', error)
    throw error
  }
}
