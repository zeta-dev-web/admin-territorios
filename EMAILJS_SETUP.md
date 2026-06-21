# Configuración de EmailJS

## 1. Crear cuenta en EmailJS

1. Ve a https://www.emailjs.com/
2. Crea una cuenta gratuita (100 emails/mes)
3. Verifica tu email

## 2. Configurar un servicio de email

1. En el dashboard, ve a **Email Services**
2. Click en **Add New Service**
3. Selecciona tu proveedor (Gmail, Outlook, etc.)
4. Configura las credenciales según tu proveedor
5. Guarda el **Service ID** (ej: `service_abc123`)

## 3. Obtener las API Keys

1. Ve a **Account** > **General**
2. En la sección **API Keys** encontrarás:
   - **Public Key** (ej: `abcdefghijklmno`)
   - **Private Key** (click en "Create Private Key" si no tienes)

## 4. Crear Templates

### Template 1: Email de Bienvenida

1. Ve a **Email Templates** > **Create New Template**
2. Nombre: `welcome_email` o similar
3. Subject: `Territorios App — tus credenciales de acceso`
4. Configura las siguientes variables en el template:

**Variables disponibles:**
- `{{to_name}}` - Nombre del usuario
- `{{user_email}}` - Email del usuario (login)
- `{{user_password}}` - Contraseña temporal
- `{{app_url}}` - URL de la aplicación
- `{{login_url}}` - URL directa al login

**HTML del template:**

```html
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
                <p style="font-size: 16px; color: #374151; margin: 0 0 16px;">Hola <strong>{{to_name}}</strong>,</p>
                <p style="font-size: 14px; color: #6b7280; margin: 0 0 24px;">Estas son tus credenciales de acceso al sistema de Territorios:</p>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f9fafb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                  <tr>
                    <td style="padding: 6px 0;">
                      <span style="font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px;">Usuario</span>
                      <p style="font-size: 15px; color: #111827; font-weight: 600; margin: 2px 0 0; font-family: monospace;">{{user_email}}</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0;">
                      <span style="font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px;">Contraseña</span>
                      <p style="font-size: 15px; color: #111827; font-weight: 600; margin: 2px 0 0; font-family: monospace;">{{user_password}}</p>
                    </td>
                  </tr>
                </table>

                <a href="{{login_url}}" style="display: inline-block; background: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">Ir al sistema</a>

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
```

5. Guarda el template y copia el **Template ID** (ej: `template_xyz789`)

### Template 2: Cambio de Contraseña

1. Crea otro template nuevo
2. Nombre: `password_changed` o similar
3. Subject: `Territorios App — contraseña actualizada`

**Variables disponibles:**
- `{{to_name}}` - Nombre del usuario
- `{{app_url}}` - URL de la aplicación
- `{{login_url}}` - URL directa al login

**HTML del template:**

```html
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
                <p style="font-size: 16px; color: #374151; margin: 0 0 16px;">Hola <strong>{{to_name}}</strong>,</p>
                <p style="font-size: 14px; color: #6b7280; margin: 0 0 24px;">Tu contraseña de acceso al sistema de Territorios fue cambiada correctamente.</p>

                <a href="{{login_url}}" style="display: inline-block; background: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">Ir al sistema</a>

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
```

5. Guarda el template y copia el **Template ID**

## 5. Configurar el archivo .env

Abre tu archivo `.env` y completa estos valores:

```env
# EmailJS Configuration
EMAILJS_PUBLIC_KEY="tu_public_key_aqui"
EMAILJS_PRIVATE_KEY="tu_private_key_aqui"
EMAILJS_SERVICE_ID="tu_service_id_aqui"
EMAILJS_TEMPLATE_WELCOME="template_welcome_id"
EMAILJS_TEMPLATE_PASSWORD_CHANGED="template_password_changed_id"
```

## 6. Verificar la configuración

Para verificar que todo funciona:

1. Reinicia tu servidor de desarrollo
2. Crea un nuevo usuario desde el panel de admin
3. Verifica que el email llegue correctamente

## Troubleshooting

### No llegan los emails

1. Verifica que el Service ID esté bien configurado
2. Revisa que las credenciales del servicio de email sean correctas
3. Verifica que no estés superando el límite gratuito (100 emails/mes)
4. Revisa la consola del servidor para ver errores

### Variables no se reemplazan

1. Asegúrate de que los nombres de las variables en el template coincidan exactamente
2. Verifica que estés usando la sintaxis `{{variable}}` en EmailJS
3. Los nombres de variables deben coincidir con los que se envían desde el código

## Límites del plan gratuito

- 100 emails por mes
- 1 usuario
- Ilimitados templates
- Soporte por email

Si necesitas más, considera actualizar a un plan pago: https://www.emailjs.com/pricing
