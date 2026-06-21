import { Resend } from 'resend'

let _resend: Resend | null = null

function getResend(): Resend {
  if (!_resend) {
    _resend = new Resend(process.env.RESEND_API_KEY || '')
  }
  return _resend
}

const FROM_EMAIL = 'onboarding@resend.dev'

/**
 * Envía un email con las credenciales de acceso a un nuevo usuario.
 */
export async function sendWelcomeEmail(params: {
  to: string
  name: string
  email: string
  password: string
  appUrl: string
}) {
  const { to, name, email, password, appUrl } = params

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f5f5f5; padding: 20px;">
          <tr>
            <td align="center">
              <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
                <tr>
                  <td style="background: linear-gradient(135deg, #4f46e5, #6366f1); padding: 32px; text-align: center;">
                    <h1 style="color: #ffffff; font-size: 22px; margin: 0;">Territorios App</h1>
                    <p style="color: #c7d2fe; font-size: 14px; margin: 8px 0 0;">Tus credenciales de acceso</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 32px;">
                    <p style="font-size: 16px; color: #374151; margin: 0 0 16px;">Hola <strong>${name}</strong>,</p>
                    <p style="font-size: 14px; color: #6b7280; margin: 0 0 24px;">Estas son tus credenciales de acceso al sistema de Territorios:</p>

                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                      <tr>
                        <td style="padding: 6px 0;">
                          <span style="font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px;">Usuario</span>
                          <p style="font-size: 15px; color: #111827; font-weight: 600; margin: 2px 0 0; font-family: monospace;">${email}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0;">
                          <span style="font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px;">Contraseña</span>
                          <p style="font-size: 15px; color: #111827; font-weight: 600; margin: 2px 0 0; font-family: monospace;">${password}</p>
                        </td>
                      </tr>
                    </table>

                    <a href="${appUrl}" style="display: inline-block; background: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">Ir al sistema</a>

                    <p style="font-size: 13px; color: #9ca3af; margin: 24px 0 0; border-top: 1px solid #e5e7eb; padding-top: 16px;">
                      Por seguridad, no compartas esta contraseña con nadie.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `

  const { data, error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Territorios App — tus credenciales de acceso`,
    html,
  })

  if (error) {
    console.error('Error al enviar email:', error)
    return { success: false, error }
  }

  return { success: true, data }
}

/**
 * Envía un email notificando que la contraseña fue cambiada.
 * No incluye la nueva contraseña — solo avisa del cambio.
 */
export async function sendPasswordChangedEmail(params: {
  to: string
  name: string
  appUrl: string
}) {
  const { to, name, appUrl } = params

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f5f5f5; padding: 20px;">
          <tr>
            <td align="center">
              <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
                <tr>
                  <td style="background: linear-gradient(135deg, #4f46e5, #6366f1); padding: 32px; text-align: center;">
                    <h1 style="color: #ffffff; font-size: 22px; margin: 0;">Territorios App</h1>
                    <p style="color: #c7d2fe; font-size: 14px; margin: 8px 0 0;">Contraseña actualizada</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 32px;">
                    <p style="font-size: 16px; color: #374151; margin: 0 0 16px;">Hola <strong>${name}</strong>,</p>
                    <p style="font-size: 14px; color: #6b7280; margin: 0 0 24px;">Tu contraseña de acceso al sistema de Territorios fue cambiada correctamente.</p>

                    <a href="${appUrl}" style="display: inline-block; background: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">Ir al sistema</a>

                    <p style="font-size: 13px; color: #9ca3af; margin: 24px 0 0; border-top: 1px solid #e5e7eb; padding-top: 16px;">
                      Si no realizaste este cambio, contactá con el administrador del sistema.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `

  const { data, error } = await getResend().emails.send({
    from: FROM_EMAIL,
    to,
    subject: `Territorios App — contraseña actualizada`,
    html,
  })

  if (error) {
    console.error('Error al enviar email de cambio de clave:', error)
    return { success: false, error }
  }

  return { success: true, data }
}
