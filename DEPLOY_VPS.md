# 🚀 Deploy Automático a VPS con GitHub Actions

Esta guía te explica cómo configurar el deploy automático a tu VPS.

---

## 📋 Requisitos Previos

### En tu VPS:
- ✅ Node.js 20+ instalado
- ✅ PM2 instalado (`npm install -g pm2`)
- ✅ PostgreSQL instalado y configurado
- ✅ SSH habilitado
- ✅ Usuario con permisos para ejecutar comandos

### En tu Local:
- ✅ Acceso SSH a tu VPS
- ✅ Código ya en GitHub

---

## 🔑 PASO 1: Generar Llave SSH (si no tienes)

### En tu computadora local:

```bash
# Generar nueva llave SSH
ssh-keygen -t ed25519 -C "github-actions-deploy"

# Cuando pregunte dónde guardar, presiona Enter (ubicación default)
# Cuando pregunte por passphrase, déjala VACÍA (solo Enter)

# Ver la llave privada (la vas a copiar completa)
cat ~/.ssh/id_ed25519
```

**Copia TODO el contenido** (desde `-----BEGIN OPENSSH PRIVATE KEY-----` hasta `-----END OPENSSH PRIVATE KEY-----`)

### Agregar llave pública al VPS:

```bash
# Ver la llave pública
cat ~/.ssh/id_ed25519.pub

# Copiar el contenido y agregarlo al VPS
ssh tu-usuario@tu-vps-ip

# Dentro del VPS:
mkdir -p ~/.ssh
nano ~/.ssh/authorized_keys
# Pegar la llave pública en una nueva línea
# Ctrl+X, Y, Enter para guardar

# Dar permisos correctos
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
exit
```

### Probar la conexión:

```bash
ssh -i ~/.ssh/id_ed25519 tu-usuario@tu-vps-ip
# Si entra sin pedir contraseña, ¡funciona!
exit
```

---

## 🔐 PASO 2: Configurar GitHub Secrets

1. **Ve a tu repositorio en GitHub:**
   ```
   https://github.com/zeta-dev-web/admin-territorios
   ```

2. **Ve a Settings → Secrets and variables → Actions**

3. **Click en "New repository secret"**

4. **Agrega los siguientes secrets:**

### Secrets Requeridos:

| Secret Name | Descripción | Ejemplo |
|-------------|-------------|---------|
| `VPS_HOST` | IP o dominio de tu VPS | `192.168.1.100` o `midominio.com` |
| `VPS_USER` | Usuario SSH del VPS | `root` o `ubuntu` |
| `VPS_PORT` | Puerto SSH (default 22) | `22` |
| `VPS_SSH_KEY` | Llave privada SSH completa | Todo el contenido de `~/.ssh/id_ed25519` |
| `VPS_APP_PATH` | Ruta donde está la app en el VPS | `/var/www/territorios-app` |
| `DATABASE_URL` | URL de PostgreSQL | `postgresql://user:pass@localhost:5432/territorios_db?schema=public` |
| `NEXTAUTH_URL` | URL pública de tu app | `https://territorios.tudominio.com` |

### Cómo agregar cada secret:

1. Click "New repository secret"
2. Name: `VPS_HOST`
3. Secret: Tu IP o dominio
4. Click "Add secret"
5. Repetir para cada uno

---

## 🖥️ PASO 3: Preparar tu VPS

### Conectarte al VPS:

```bash
ssh tu-usuario@tu-vps-ip
```

### Instalar dependencias necesarias:

```bash
# Actualizar el sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 20 (si no está)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verificar versión
node -v  # Debe ser v20.x

# Instalar PM2 (gestor de procesos)
sudo npm install -g pm2

# Instalar PostgreSQL (si no está)
sudo apt install postgresql postgresql-contrib -y

# Iniciar PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

### Crear directorio para la aplicación:

```bash
# Crear directorio (usa el mismo que pusiste en VPS_APP_PATH)
sudo mkdir -p /var/www/territorios-app

# Dar permisos a tu usuario
sudo chown -R $USER:$USER /var/www/territorios-app

# Entrar al directorio
cd /var/www/territorios-app
```

### Configurar PostgreSQL:

```bash
# Cambiar a usuario postgres
sudo -u postgres psql

# Dentro de psql, ejecutar:
CREATE DATABASE territorios_db;
CREATE USER territorios_user WITH PASSWORD 'tu_contraseña_segura';
GRANT ALL PRIVILEGES ON DATABASE territorios_db TO territorios_user;
\q

# Probar conexión
psql -U territorios_user -d territorios_db -h localhost
# Debería conectarse sin errores
\q
```

### Crear archivo .env en el VPS:

```bash
cd /var/www/territorios-app
nano .env
```

Pegar:
```env
DATABASE_URL="postgresql://territorios_user:tu_contraseña@localhost:5432/territorios_db?schema=public"
NEXTAUTH_URL="https://territorios.tudominio.com"
NODE_ENV="production"
```

Guardar: `Ctrl+X`, `Y`, `Enter`

---

## 🔥 PASO 4: Configurar Nginx (Servidor Web)

### Instalar Nginx:

```bash
sudo apt install nginx -y
```

### Crear configuración:

```bash
sudo nano /etc/nginx/sites-available/territorios-app
```

Pegar:
```nginx
server {
    listen 80;
    server_name territorios.tudominio.com;  # Cambiar por tu dominio

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Guardar: `Ctrl+X`, `Y`, `Enter`

### Activar configuración:

```bash
# Crear symlink
sudo ln -s /etc/nginx/sites-available/territorios-app /etc/nginx/sites-enabled/

# Verificar configuración
sudo nginx -t

# Recargar Nginx
sudo systemctl reload nginx
```

### Configurar Firewall:

```bash
# Permitir HTTP y HTTPS
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw enable
```

---

## 🔒 PASO 5: Configurar SSL (HTTPS) - Opcional pero Recomendado

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtener certificado SSL
sudo certbot --nginx -d territorios.tudominio.com

# Seguir las instrucciones
# Elegir opción 2: Redirect HTTP to HTTPS

# Renovación automática (ya está configurada)
sudo certbot renew --dry-run
```

---

## ✅ PASO 6: Hacer el Primer Deploy Manual

```bash
# En el VPS, dentro de /var/www/territorios-app
cd /var/www/territorios-app

# Clonar el repositorio (solo la primera vez)
git clone https://github.com/zeta-dev-web/admin-territorios.git .

# O si ya está clonado, hacer pull
git pull origin main

# Instalar dependencias
npm install

# Generar Prisma Client
npx prisma generate

# Ejecutar migraciones
npx prisma migrate deploy

# Build de Next.js
npm run build

# Iniciar con PM2
pm2 start npm --name "territorios-app" -- start

# Guardar configuración de PM2
pm2 save

# Configurar PM2 para iniciar en boot
pm2 startup
# Copiar y ejecutar el comando que te muestra
```

### Verificar que funciona:

```bash
# Ver logs
pm2 logs territorios-app

# Ver estado
pm2 status

# Probar en navegador
curl http://localhost:3000
```

Si ves HTML, ¡funciona!

Ahora prueba desde tu navegador: `http://tu-vps-ip` o `https://territorios.tudominio.com`

---

## 🚀 PASO 7: Probar el Deploy Automático

### Hacer un cambio pequeño:

```bash
# En tu local
cd "c:\Users\Leo\Documents\PROYECTO TERRITORIOS\territorios-app"

# Hacer un cambio (ej: editar README)
echo "# Test deploy" >> README.md

# Commit y push
git add .
git commit -m "test: probar deploy automático"
git push origin main
```

### Verificar en GitHub:

1. Ve a: `https://github.com/zeta-dev-web/admin-territorios/actions`
2. Deberías ver un workflow ejecutándose
3. Click en él para ver el progreso en tiempo real
4. Si todo está bien, se marcará con ✅ verde

### Verificar en el VPS:

```bash
# Ver logs de PM2
pm2 logs territorios-app --lines 50

# Debería mostrar que se reinició
```

---

## 🐛 Troubleshooting

### Error: "Permission denied (publickey)"

```bash
# Verifica que la llave esté en GitHub Secrets
# Verifica que la llave pública esté en el VPS:
cat ~/.ssh/authorized_keys
```

### Error: "PM2 not found"

```bash
# Instalar PM2 globalmente
sudo npm install -g pm2
```

### Error: "Port 3000 already in use"

```bash
# Ver qué proceso usa el puerto
sudo lsof -i :3000

# Matar el proceso
pm2 delete territorios-app
pm2 start npm --name "territorios-app" -- start
```

### Error: "Cannot connect to database"

```bash
# Verificar que PostgreSQL esté corriendo
sudo systemctl status postgresql

# Verificar conexión
psql -U territorios_user -d territorios_db -h localhost

# Verificar .env
cat /var/www/territorios-app/.env
```

### Deploy falla en GitHub Actions

```bash
# Ver logs detallados en:
# GitHub → Actions → Click en el workflow fallido → Ver error específico

# Verificar secrets en GitHub:
# Settings → Secrets and variables → Actions
```

---

## 📊 Comandos Útiles en el VPS

```bash
# Ver estado de la app
pm2 status

# Ver logs en tiempo real
pm2 logs territorios-app

# Reiniciar la app
pm2 restart territorios-app

# Detener la app
pm2 stop territorios-app

# Ver logs de Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Verificar espacio en disco
df -h

# Ver uso de memoria
free -h
```

---

## ✅ Checklist Final

- [ ] Llave SSH generada y agregada al VPS
- [ ] Todos los secrets configurados en GitHub
- [ ] VPS tiene Node.js 20+ instalado
- [ ] PostgreSQL configurado y corriendo
- [ ] PM2 instalado
- [ ] Nginx configurado
- [ ] SSL configurado (opcional)
- [ ] Primer deploy manual exitoso
- [ ] App accesible desde el navegador
- [ ] Deploy automático probado y funcionando

---

## 🎉 ¡Listo!

Ahora cada vez que hagas `git push origin main`, tu aplicación se deployará automáticamente al VPS.

**Flujo completo:**
1. Haces cambios en local
2. `git push origin main`
3. GitHub Actions se ejecuta automáticamente
4. Sube archivos al VPS por SSH
5. Ejecuta comandos (install, build, migrate)
6. Reinicia la app con PM2
7. ¡Tu app está actualizada!

---

¿Problemas? Revisa los logs:
- GitHub: `Actions` tab
- VPS: `pm2 logs territorios-app`
