# 📋 Sistema de Gestión de Fichas

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-15.5.0-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)
![React](https://img.shields.io/badge/React-19.1.0-61DAFB)
![Prisma](https://img.shields.io/badge/Prisma-6.14.0-2D3748)
![License](https://img.shields.io/badge/License-Proprietary-red)

**Plataforma corporativa para la gestión integral de fichas de ayudas y subvenciones**

[🚀 Guía de Despliegue](./DEPLOYMENT.md) • [📖 Documentación](#documentación) • [🔧 Desarrollo](#desarrollo)

</div>

---

## 🎯 Descripción del Proyecto

El **Sistema de Gestión de Fichas** es una aplicación web empresarial diseñada para centralizar y optimizar la gestión de fichas informativas sobre ayudas, subvenciones y trámites gubernamentales. La plataforma proporciona herramientas avanzadas de análisis, filtrado y exportación para facilitar la toma de decisiones y mejorar la eficiencia operativa.

### ✨ Características Principales

- **🔍 Sistema de Filtros Avanzados**: Búsqueda y filtrado multidimensional por ámbito, fecha, complejidad, trabajadores y más
- **📊 Dashboard Analítico**: Visualizaciones interactivas con gráficos dinámicos y estadísticas en tiempo real
- **📋 Gestión de Datos**: CRUD completo para fichas, portales, temáticas y trabajadores
- **📄 Exportación Flexible**: Generación de PDFs personalizables y exportación a Excel
- **🔐 Sistema de Autenticación**: Control de acceso seguro con gestión de permisos
- **📱 Interfaz Responsiva**: Diseño moderno optimizado para desktop y móvil
- **⚡ Rendimiento Optimizado**: Paginación inteligente y carga bajo demanda

---

## 🏗️ Arquitectura y Tecnologías

### Stack Tecnológico

| Categoría | Tecnología | Versión | Propósito |
|-----------|------------|---------|-----------|
| **Frontend** | Next.js | 15.5.0 | Framework React con SSR/SSG |
| **Backend** | Next.js API Routes | 15.5.0 | API RESTful integrada |
| **Base de Datos** | MySQL + Prisma ORM | 6.14.0 | Gestión de datos relacional |
| **Lenguaje** | TypeScript | 5.x | Tipado estático y desarrollo seguro |
| **UI/Styling** | Tailwind CSS | 4.1.12 | Framework CSS utility-first |
| **Gráficos** | Recharts | 3.1.2 | Visualizaciones de datos |
| **Exportación** | Puppeteer + ExcelJS | - | Generación de PDFs y Excel |
| **Iconografía** | Lucide React | 0.541.0 | Iconos modernos y consistentes |

### Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Next.js)                     │
├─────────────────────────────────────────────────────────────┤
│  📱 UI Components    📊 Charts    🔍 Filters    📋 Forms   │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                  API LAYER (Next.js API)                   │
├─────────────────────────────────────────────────────────────┤
│  🔐 Auth Routes    📊 Stats API    📄 Export API   🔧 CRUD │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                 DATABASE LAYER (Prisma ORM)                │
├─────────────────────────────────────────────────────────────┤
│      🗄️ MySQL Database with Optimized Schema              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Inicio Rápido

### Prerrequisitos

- **Node.js** ≥ 18.17.0
- **MySQL** ≥ 8.0
- **npm** o **yarn** o **pnpm**

### Instalación

```bash
# 1. Clonar el repositorio
git clone <repository-url>
cd portal

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus configuraciones

# 4. Configurar base de datos
npm run db:push
npm run db:generate

# 5. Iniciar servidor de desarrollo
npm run dev
```

### Variables de Entorno Requeridas

```env
# Base de datos
DATABASE_URL="mysql://usuario:password@localhost:3306/portal_fichas"

# Autenticación
NEXTAUTH_SECRET="tu-clave-secreta-muy-segura"
NEXTAUTH_URL="http://localhost:3000"

# Configuración de aplicación
NODE_ENV="development"
```

---

## 🛠️ Desarrollo

### Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Servidor de desarrollo con Turbopack
npm run dev:fast         # Desarrollo con debugging habilitado

# Construcción y Producción
npm run build            # Build de producción optimizado
npm run start            # Servidor de producción
npm run start:prod       # Servidor en puerto 3000

# Calidad de Código
npm run lint             # Ejecutar ESLint
npm run lint:fix         # Corregir errores de ESLint automáticamente
npm run type-check       # Verificación de tipos TypeScript

# Base de Datos
npm run db:generate      # Generar cliente Prisma
npm run db:push          # Aplicar cambios de esquema
npm run db:studio        # Interfaz visual de Prisma

# Utilidades
npm run clean            # Limpiar archivos de build
```

### Estructura del Proyecto

```
src/
├── app/                          # App Router de Next.js
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Autenticación
│   │   ├── apps/gestor-fichas/   # APIs específicas del gestor
│   │   └── lookups/              # APIs de consulta
│   ├── apps/gestor-fichas/       # Páginas del gestor
│   ├── admin/                    # Panel de administración
│   └── dashboard/                # Dashboard principal
├── components/                   # Componentes reutilizables
│   ├── layout/                   # Componentes de layout
│   ├── management/               # Gestión de entidades
│   └── ui/                       # Componentes de UI base
├── lib/                          # Utilidades y configuraciones
│   ├── auth/                     # Lógica de autenticación
│   ├── database/                 # Configuración de BD
│   └── utils/                    # Funciones utilitarias
├── shared/                       # Recursos compartidos
│   ├── components/               # Componentes compartidos
│   └── hooks/                    # Hooks personalizados
└── apps/gestor-fichas/           # Módulo específico del gestor
    ├── components/               # Componentes del módulo
    ├── lib/                      # Lógica de negocio
    └── pages/                    # Páginas del módulo
```

### Flujo de Desarrollo

1. **Feature Branch**: Crear rama desde `main`
2. **Desarrollo**: Implementar funcionalidad con tests
3. **Quality Check**: Ejecutar linting y type-checking
4. **Build Test**: Verificar que el build sea exitoso
5. **Pull Request**: Revisión de código antes de merge

---

## 📊 Funcionalidades del Sistema

### 🔍 Gestión de Fichas

- **CRUD Completo**: Crear, leer, actualizar y eliminar fichas
- **Filtros Avanzados**: Por ámbito territorial, fechas, complejidad, trabajadores
- **Búsqueda Inteligente**: Texto libre en múltiples campos
- **Paginación Optimizada**: Cursor-based pagination para mejor rendimiento
- **Ordenación Dinámica**: Por cualquier columna con persistencia en URL

### 📈 Dashboard Analítico

- **Gráficos Interactivos**: Evolución temporal, distribuciones, comparativas
- **Métricas en Tiempo Real**: Contadores dinámicos y estadísticas actualizadas
- **Filtros Sincronizados**: Aplicación de filtros en todas las visualizaciones
- **Exportación Visual**: Capturas de gráficos para reportes

### 📄 Sistema de Exportación

- **PDFs Personalizables**: Configuración de contenido y formato
- **Excel Avanzado**: Multiple hojas con formato profesional
- **Vista Previa**: Visualización antes de generar archivos
- **Generación Asíncrona**: Procesamiento en background para archivos grandes

### 👥 Gestión de Usuarios

- **Control de Acceso**: Sistema de permisos granular
- **Gestión de Trabajadores**: CRUD de usuarios del sistema
- **Audit Trail**: Registro de acciones para trazabilidad

---

## 🚀 Despliegue en Producción

### Guía Rápida

```bash
# 1. Build de producción
npm run build

# 2. Verificar build
npm run start

# 3. Configurar entorno de producción
cp .env.production.example .env.production
# Editar variables de producción

# 4. Desplegar (ver DEPLOYMENT.md para detalles)
```

### Configuraciones de Producción

- **Headers de Seguridad**: X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- **Compresión**: Gzip habilitado automáticamente
- **Optimizaciones**: Tree-shaking, code splitting, image optimization
- **Monitoring**: Logs estructurados y métricas de rendimiento

Para instrucciones detalladas de despliegue, consulta [DEPLOYMENT.md](./DEPLOYMENT.md).

---

## 🔧 Configuración Avanzada

### Personalización de Tema

```typescript
// src/lib/theme/colors.ts
export const corporateColors = {
  primary: '#A10D59',    // Color principal
  secondary: '#FFFFFF',  // Color secundario
  accent: '#A10D59'      // Color de acento
};
```

### Configuración de Base de Datos

```sql
-- Configuración recomendada para producción
SET GLOBAL innodb_buffer_pool_size = 2G;
SET GLOBAL max_connections = 200;
SET GLOBAL query_cache_size = 128M;
```

### Variables de Entorno Avanzadas

```env
# Límites de aplicación
MAX_FILE_SIZE=10485760          # 10MB para uploads
PDF_TIMEOUT=30000               # 30s timeout para PDFs
LOG_LEVEL=info                  # Nivel de logging

# Configuraciones de seguridad
ALLOWED_ORIGINS=https://tu-dominio.com
RATE_LIMIT_REQUESTS=100         # Requests por minuto
```

---

## 📖 Documentación

### API Reference

La API está documentada usando OpenAPI 3.0. Endpoints principales:

- `GET /api/apps/gestor-fichas/fichas` - Listar fichas con filtros
- `POST /api/apps/gestor-fichas/fichas` - Crear nueva ficha
- `GET /api/apps/gestor-fichas/stats/*` - Endpoints de estadísticas
- `POST /api/apps/gestor-fichas/generate-pdf-v2` - Generar PDF

### Guías Técnicas

- [🚀 Guía de Despliegue](./DEPLOYMENT.md)
- [🏗️ Arquitectura del Sistema](./ARCHITECTURE.md)
- [🔧 Configuración Avanzada](./docs/configuration.md)
- [📊 Análisis de Rendimiento](./docs/performance.md)

---

## 🤝 Contribución

### Estándares de Código

- **TypeScript First**: Tipado estricto en todo el código
- **ESLint + Prettier**: Configuración estándar para consistencia
- **Conventional Commits**: Formato estándar para mensajes de commit
- **Component-Driven**: Desarrollo basado en componentes reutilizables

### Workflow de Contribución

1. Fork del repositorio
2. Crear feature branch (`feature/nueva-funcionalidad`)
3. Desarrollar con tests correspondientes
4. Commit con mensajes descriptivos
5. Push y crear Pull Request
6. Code review y merge

---

## 📞 Soporte y Mantenimiento

### Contacto Técnico

- **Issues**: Reportar problemas en el repositorio
- **Documentación**: Consultar guías técnicas en `/docs`
- **Logs**: Revisar logs de aplicación para troubleshooting

### Mantenimiento Recomendado

- **Backups Diarios**: Base de datos y archivos críticos
- **Monitoreo**: CPU, memoria, espacio en disco
- **Actualizaciones**: Dependencias de seguridad mensualmente
- **Logs Rotation**: Configurar rotación automática

---

## 📄 Licencia

Este proyecto es software propietario desarrollado para uso interno de la organización. Todos los derechos reservados.

---

<div align="center">

**🏢 Portal Corporativo v2.0**

*Desarrollado con ❤️ usando Next.js y TypeScript*

[⬆️ Volver al inicio](#-sistema-de-gestión-de-fichas)

</div>