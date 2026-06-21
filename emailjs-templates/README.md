# Templates de EmailJS

Esta carpeta contiene los templates HTML que debes copiar en EmailJS.

## 📄 Archivos

### `template-welcome.html`
Template para el email de bienvenida con credenciales de acceso.

**Variables que usa:**
- `{{to_name}}` - Nombre del usuario
- `{{user_email}}` - Email/usuario para login
- `{{user_password}}` - Contraseña temporal
- `{{login_url}}` - URL al login de la app

**Cómo usarlo:**
1. Copia todo el contenido de este archivo
2. En EmailJS: Dashboard > Email Templates > Create New Template
3. Pega el HTML en la sección "Content"
4. Subject: `Territorios App — tus credenciales de acceso`
5. Guarda y copia el Template ID

### `template-password-changed.html`
Template para notificar cambio de contraseña.

**Variables que usa:**
- `{{to_name}}` - Nombre del usuario
- `{{login_url}}` - URL al login de la app

**Cómo usarlo:**
1. Copia todo el contenido de este archivo
2. En EmailJS: Dashboard > Email Templates > Create New Template
3. Pega el HTML en la sección "Content"
4. Subject: `Territorios App — contraseña actualizada`
5. Guarda y copia el Template ID

## 🎨 Personalización

Puedes modificar estos templates para:
- Cambiar colores (busca los códigos hexadecimales como `#4f46e5`)
- Modificar textos
- Agregar tu logo
- Cambiar el diseño

## ⚠️ Importante

- No modifiques los nombres de las variables `{{variable}}`
- Si cambias el nombre de una variable en el template, también debes cambiarla en `lib/resend.ts`
- Los estilos deben ser inline para máxima compatibilidad con clientes de email

## 📧 Vista previa

Para probar cómo se ven los templates:
1. Abre los archivos `.html` en tu navegador
2. Los valores `{{variable}}` aparecerán tal cual
3. En el email real, se reemplazan por los valores reales
