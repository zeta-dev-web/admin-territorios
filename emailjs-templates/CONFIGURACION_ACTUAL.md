# ✅ Configuración Actual de EmailJS

## 🔑 Credenciales (ya configuradas en .env)

- **Public Key:** `OaI9W0nXNybF2Z6Q2`
- **Secret Key:** `5ujkmXsPU-IisURIO-Ayp`
- **Service ID:** `service_2624xui`

## 📧 Templates Configurados

### 1. Template de Bienvenida
- **Template ID:** `template_62rfnbp`
- **Subject:** Territorios App — Tus credenciales de acceso
- **Variables usadas:**
  - `{{to_name}}` - Nombre del usuario
  - `{{to_email}}` - Email del usuario
  - `{{password}}` - Contraseña temporal
  - `{{app_url}}` - URL de la aplicación

### 2. Template de Cambio de Contraseña
- **Template ID:** `template_hwz8ubg`
- **Subject:** Territorios App — Contraseña actualizada
- **Variables usadas:**
  - `{{to_name}}` - Nombre del usuario
  - `{{app_url}}` - URL de la aplicación
- **Email de soporte:** territorios-app@outlook.com

## 🎨 Diseño de los Templates

Ambos templates usan:
- Fondo oscuro (#0A0F1C)
- Gradiente rojo (#dc2626 a #ef4444)
- Diseño responsive con media queries
- Sombras y bordes sutiles

## 🚀 Cómo Probar

1. Asegúrate de que el servidor esté reiniciado:
   ```bash
   npm run dev
   ```

2. Ve a: http://localhost:3000/admin/users

3. Crea un nuevo usuario y verifica que llegue el email

## 🔍 Verificar Envíos

En la consola del servidor verás:
- ✅ Email de bienvenida enviado: [detalles]
- ❌ Error al enviar email de bienvenida: [error]

También puedes ver el historial en el dashboard de EmailJS:
https://dashboard.emailjs.com/admin

## 📝 Notas

- Plan gratuito: 100 emails/mes
- Los emails se envían de forma asíncrona (fire & forget)
- Si el envío falla, la creación del usuario no se bloquea
- Los errores se loguean en la consola del servidor
