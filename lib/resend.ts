import emailjs from '@emailjs/nodejs'

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

  // Verificar que las variables de entorno estén configuradas
  const publicKey = process.env.EMAILJS_PUBLIC_KEY
  const privateKey = process.env.EMAILJS_PRIVATE_KEY
  const serviceId = process.env.EMAILJS_SERVICE_ID
  const templateId = process.env.EMAILJS_TEMPLATE_WELCOME

  if (!publicKey || !privateKey || !serviceId || !templateId) {
    console.error('Faltan configuraciones de EmailJS en .env')
    return { 
      success: false, 
      error: 'Configuración de EmailJS incompleta. Verifica las variables de entorno.' 
    }
  }

  try {
    const response = await emailjs.send(
      serviceId,
      templateId,
      {
        to_email: to, // Destinatario
        to_name: name,
        password: password, // Variable del template
        app_url: appUrl,
        login_url: `${appUrl}/login`,
      },
      {
        publicKey,
        privateKey,
      }
    )

    console.log('✅ Email de bienvenida enviado:', response)
    return { success: true, data: response }
  } catch (error) {
    console.error('❌ Error al enviar email de bienvenida:', error)
    return { success: false, error }
  }
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

  // Verificar que las variables de entorno estén configuradas
  const publicKey = process.env.EMAILJS_PUBLIC_KEY
  const privateKey = process.env.EMAILJS_PRIVATE_KEY
  const serviceId = process.env.EMAILJS_SERVICE_ID
  const templateId = process.env.EMAILJS_TEMPLATE_PASSWORD_CHANGED

  if (!publicKey || !privateKey || !serviceId || !templateId) {
    console.error('Faltan configuraciones de EmailJS en .env')
    return { 
      success: false, 
      error: 'Configuración de EmailJS incompleta. Verifica las variables de entorno.' 
    }
  }

  try {
    const response = await emailjs.send(
      serviceId,
      templateId,
      {
        to_email: to,
        to_name: name,
        app_url: appUrl,
        login_url: `${appUrl}/login`,
      },
      {
        publicKey,
        privateKey,
      }
    )

    console.log('✅ Email de cambio de contraseña enviado:', response)
    return { success: true, data: response }
  } catch (error) {
    console.error('❌ Error al enviar email de cambio de contraseña:', error)
    return { success: false, error }
  }
}
