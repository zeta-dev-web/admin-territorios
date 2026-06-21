# ⚡ Quick Start - EmailJS

## ✅ Todo está configurado!

Tu EmailJS ya está completamente configurado y listo para usar:

### 🔑 Credenciales configuradas
- ✅ Public Key: `OaI9W0nXNybF2Z6Q2`
- ✅ Private Key: `5ujkmXsPU-IisURIO-Ayp`
- ✅ Service ID: `service_2624xui`

### 📧 Templates configurados
- ✅ Welcome Email: `template_62rfnbp`
- ✅ Password Reset: `template_hwz8ubg`

### 📝 Variables de entorno
Todas las variables ya están en tu archivo `.env`:
```env
EMAILJS_PUBLIC_KEY="OaI9W0nXNybF2Z6Q2"
EMAILJS_PRIVATE_KEY="5ujkmXsPU-IisURIO-Ayp"
EMAILJS_SERVICE_ID="service_2624xui"
EMAILJS_TEMPLATE_WELCOME="template_62rfnbp"
EMAILJS_TEMPLATE_PASSWORD_CHANGED="template_hwz8ubg"
```

## 🚀 Cómo Usar

### 1. Reiniciar el servidor
Si tienes el servidor corriendo, reinícialo para que cargue las nuevas variables:

```bash
# Detén el servidor (Ctrl+C)
# Vuelve a iniciarlo
npm run dev
```

### 2. Probar el envío de emails

#### Opción A: Desde la aplicación
1. Ve a http://localhost:3000/admin/users
2. Crea un nuevo usuario
3. Verifica que el email llegue con el diseño oscuro personalizado

#### Opción B: Script de prueba
```bash
# Verificar configuración
npx tsx scripts/test-emailjs.ts

# Enviar emails de prueba a tu email
npx tsx scripts/test-emailjs.ts tu-email@ejemplo.com
```

### 3. Verificar en la consola
Cuando se envíe un email, verás en la consola del servidor:
```
✅ Email de bienvenida enviado: { status: 200, text: 'OK' }
```

O si hay error:
```
❌ Error al enviar email de bienvenida: [detalles del error]
```

## 📊 Dashboard de EmailJS

Puedes ver el historial de emails enviados en:
https://dashboard.emailjs.com/admin

## 🎨 Diseño de los Emails

Tus templates usan un diseño oscuro personalizado:
- Fondo: `#0A0F1C` (azul oscuro)
- Gradiente: `#dc2626` a `#ef4444` (rojo)
- Responsive design con media queries
- Email de soporte: territorios-app@outlook.com

## 📝 Cuándo se envían los emails

### Email de Bienvenida (template_62rfnbp)
Se envía automáticamente cuando:
- Un admin crea un nuevo usuario desde `/admin/users`
- Se resetea la contraseña de un usuario

**Variables del template:**
- `{{to_name}}` - Nombre del usuario
- `{{to_email}}` - Email del usuario
- `{{password}}` - Contraseña temporal
- `{{app_url}}` - URL de la app

### Email de Cambio de Contraseña (template_hwz8ubg)
Se envía cuando:
- Un usuario cambia su propia contraseña desde settings

**Variables del template:**
- `{{to_name}}` - Nombre del usuario
- `{{app_url}}` - URL de la app

## ⚠️ Límites

Plan gratuito de EmailJS:
- ✅ 100 emails por mes
- ✅ 1 usuario
- ✅ Templates ilimitados
- ✅ Soporte por email

Si necesitas más, considera el plan pago: https://www.emailjs.com/pricing

## 🔧 Troubleshooting

### No llegan los emails
1. Verifica la consola del servidor para ver errores
2. Revisa el dashboard de EmailJS: https://dashboard.emailjs.com/admin
3. Verifica que no hayas superado el límite de 100 emails/mes
4. Chequea la carpeta de spam

### Error de configuración
```bash
# Verifica que las variables estén cargadas
npx tsx scripts/test-emailjs.ts
```

### Modificar los templates
Si necesitas cambiar los diseños:
1. Ve a https://dashboard.emailjs.com/admin/templates
2. Edita los templates directamente ahí
3. Los cambios se aplican inmediatamente (no necesitas reiniciar el servidor)

## 📚 Archivos de Referencia

- `emailjs-templates/template-welcome.html` - Diseño del email de bienvenida
- `emailjs-templates/template-password-changed.html` - Diseño del cambio de contraseña
- `emailjs-templates/CONFIGURACION_ACTUAL.md` - Documentación completa
- `lib/resend.ts` - Código que envía los emails
