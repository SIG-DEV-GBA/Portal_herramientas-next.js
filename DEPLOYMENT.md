# 🚀 Guía de Despliegue - Sistema de Gestión de Fichas

Esta guía contiene las instrucciones para desplegar el Sistema de Gestión de Fichas en un entorno de producción.

## 📋 Requisitos Previos

### Sistema
- **Node.js**: v18.17.0 o superior
- **MySQL/MariaDB**: v8.0 o superior
- **Memoria RAM**: Mínimo 2GB, recomendado 4GB
- **Espacio en disco**: Mínimo 5GB para aplicación y datos

### Dependencias
- **PM2** (recomendado para gestión de procesos)
- **Nginx** (recomendado como proxy reverso)

## 🔧 Preparación del Entorno

### 1. Configuración de Base de Datos

```sql
-- Crear base de datos
CREATE DATABASE portal_fichas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Crear usuario de aplicación
CREATE USER 'portal_user'@'localhost' IDENTIFIED BY 'password_seguro_aqui';
GRANT ALL PRIVILEGES ON portal_fichas.* TO 'portal_user'@'localhost';
FLUSH PRIVILEGES;
```

### 2. Variables de Entorno

```bash
# Copiar template de configuración
cp .env.production.example .env.production

# Editar configuraciones (reemplazar valores de ejemplo)
nano .env.production
```

**Variables críticas a configurar:**
- `DATABASE_URL`: Conexión a base de datos de producción
- `NEXTAUTH_SECRET`: Clave secreta única (generar nueva)
- `NEXTAUTH_URL`: URL completa de tu aplicación
- `NODE_ENV`: "production"

### 3. Instalación de Dependencias

```bash
# Instalar dependencias de producción
npm ci --only=production

# Generar cliente de Prisma
npm run db:generate

# Aplicar migraciones de base de datos
npm run db:push
```

## 🏗️ Proceso de Construcción

### 1. Build de Aplicación

```bash
# Construir aplicación para producción
npm run build

# Verificar que no hay errores de tipos
npm run type-check
```

### 2. Verificación de Build

```bash
# Probar aplicación localmente
npm run start

# Verificar en http://localhost:3000
```

## 🌐 Configuración del Servidor Web

### Nginx (Recomendado)

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name tu-dominio.com;

    # Redireccionar a HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name tu-dominio.com;

    # Configuración SSL
    ssl_certificate /path/to/your/cert.pem;
    ssl_certificate_key /path/to/your/private.key;

    # Configuraciones de seguridad SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    # Headers de seguridad
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # Configuración de proxy
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Optimizaciones para archivos estáticos
    location /_next/static/ {
        proxy_pass http://localhost:3000;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Limits y timeouts
    client_max_body_size 10M;
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;
}
```

## 🔄 Gestión de Procesos con PM2

### 1. Instalación de PM2

```bash
npm install -g pm2
```

### 2. Configuración de PM2

Crear archivo `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'portal-fichas',
    script: 'npm',
    args: 'start',
    cwd: '/path/to/your/app',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

### 3. Comandos de PM2

```bash
# Iniciar aplicación
pm2 start ecosystem.config.js

# Ver estado
pm2 status

# Ver logs
pm2 logs portal-fichas

# Reiniciar
pm2 restart portal-fichas

# Configurar inicio automático
pm2 startup
pm2 save
```

## 📊 Monitoreo y Logs

### 1. Configuración de Logs

```bash
# Crear directorio de logs
mkdir logs

# Configurar rotación de logs (con logrotate)
sudo nano /etc/logrotate.d/portal-fichas
```

### 2. Métricas Importantes

- **Memoria**: Monitorear uso de RAM
- **CPU**: Vigilar picos de procesamiento
- **Disco**: Espacio disponible y I/O
- **Red**: Latencia y throughput
- **Base de datos**: Conexiones y queries lentas

## 🔒 Seguridad

### 1. Checklist de Seguridad

- [ ] HTTPS configurado correctamente
- [ ] Headers de seguridad implementados
- [ ] Rate limiting configurado
- [ ] Firewall configurado (puertos 80, 443, 22)
- [ ] Acceso SSH restringido
- [ ] Base de datos no expuesta públicamente
- [ ] Variables de entorno seguras
- [ ] Backups automáticos configurados

### 2. Backups

```bash
# Script de backup de base de datos
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u portal_user -p portal_fichas > backup_$DATE.sql
gzip backup_$DATE.sql

# Programar en cron para ejecución diaria
0 2 * * * /path/to/backup/script.sh
```

## 🚨 Troubleshooting

### Problemas Comunes

1. **Error de conexión a BD**
   - Verificar variables de entorno
   - Comprobar conectividad de red
   - Validar credenciales

2. **High memory usage**
   - Revisar configuración de PM2
   - Optimizar queries de BD
   - Implementar cache si es necesario

3. **Slow response times**
   - Verificar logs de aplicación
   - Monitorear queries de BD
   - Revisar configuración de Nginx

### Comandos Útiles

```bash
# Ver logs de aplicación
pm2 logs portal-fichas --lines 100

# Monitorear recursos
pm2 monit

# Ver conexiones de BD
mysql> SHOW PROCESSLIST;

# Verificar estado de Nginx
sudo systemctl status nginx
```

## 📞 Soporte

Para soporte técnico o consultas sobre el despliegue:

1. Revisar logs de aplicación y servidor
2. Consultar documentación técnica en `/docs`
3. Verificar configuraciones siguiendo esta guía

---

**Importante**: Realiza pruebas completas en un entorno de staging antes de desplegar en producción.