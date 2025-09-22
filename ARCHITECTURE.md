# Arquitectura del Portal de Herramientas

## 📁 Estructura del Proyecto

### Organización Principal

```
src/
├── shared/                    # Recursos compartidos entre aplicaciones
│   ├── components/           # Componentes reutilizables
│   │   ├── ui/              # Componentes de interfaz básicos
│   │   ├── charts/          # Componentes de gráficos
│   │   └── data-management/ # Gestores de datos (CRUD)
│   ├── hooks/               # Hooks personalizados globales
│   ├── utils/               # Utilidades compartidas
│   └── config/              # Configuraciones y constantes
├── apps/                     # Aplicaciones específicas
│   └── gestor-fichas/       # Aplicación de gestión de fichas
│       ├── components/      # Componentes específicos de la app
│       ├── hooks/           # Hooks específicos de la app
│       └── lib/             # Lógica de negocio específica
├── components/              # Componentes de layout principal
│   └── layout/             # Headers, footers del portal
├── lib/                     # Librerías y utilidades del sistema
└── app/                     # Rutas y páginas de Next.js
    ├── api/                # Endpoints de API
    ├── apps/               # Páginas de aplicaciones
    └── (auth)/             # Páginas de autenticación
```

## 🎯 Principios de Diseño

### 1. Separación de Responsabilidades
- **`shared/`**: Código reutilizable entre múltiples aplicaciones
- **`apps/`**: Lógica específica de cada aplicación
- **`components/layout/`**: Layout global del portal
- **`lib/`**: Utilidades del sistema

### 2. Escalabilidad
- Cada nueva herramienta va en `apps/nueva-herramienta/`
- Componentes compartidos se reutilizan desde `shared/`
- APIs organizadas por aplicación en `app/api/apps/`

### 3. Mantenibilidad
- Imports centralizados desde rutas base (`@/shared`, `@/apps`)
- Configuraciones en archivos dedicados
- Separación clara entre UI y lógica de negocio

## 🔧 Convenciones

### Estructura de una Nueva Aplicación

```
apps/nueva-herramienta/
├── components/          # Componentes específicos
│   ├── layout/         # Layout de la aplicación
│   ├── forms/          # Formularios
│   ├── tables/         # Tablas y listas
│   └── modals/         # Modales y diálogos
├── hooks/              # Hooks específicos
├── lib/                # Tipos, utils y lógica
│   ├── types.ts        # Tipos TypeScript
│   ├── utils.ts        # Utilidades
│   └── api.ts          # Clientes de API
└── pages/              # Páginas principales (si es complejo)
```

### Imports Recomendados

```typescript
// Shared (primera prioridad)
import { useCurrentUser } from '@/shared/hooks/useCurrentUser';
import { ChartCard } from '@/shared/components/charts/ChartCard';

// App específica
import { FichaForm } from '@/apps/gestor-fichas/components/forms/FichaForm';
import type { Filters } from '@/apps/gestor-fichas/lib/types';

// Layout global
import { CorporateFooter } from '@/components/layout/CorporateFooter';
```

## 🚀 Añadir una Nueva Herramienta

### 1. Crear Estructura Base
```bash
mkdir -p src/apps/nueva-herramienta/{components,hooks,lib}
mkdir -p src/app/apps/nueva-herramienta
mkdir -p src/app/api/apps/nueva-herramienta
```

### 2. Configurar Rutas
- Añadir rutas en `shared/config/paths.ts`
- Crear páginas en `app/apps/nueva-herramienta/`
- Implementar APIs en `app/api/apps/nueva-herramienta/`

### 3. Reutilizar Componentes
- Layout: Usar `AppHeader` o crear uno específico
- Footer: `CorporateFooter` (ya implementado)
- UI: Componentes de `shared/components/ui/`
- Gestión: Managers de `shared/components/data-management/`

### 4. Añadir al Dashboard
```typescript
// En dashboard/page.tsx
const tools: ToolItem[] = [
  // ... herramientas existentes
  {
    key: "nueva-herramienta",
    title: "Nueva Herramienta",
    description: "Descripción de la funcionalidad",
    href: "/apps/nueva-herramienta",
    icon: <IconoCorrespondiente size={20} />,
    tags: ["Categoría"],
  },
];
```

## 🎨 Temas y Colores

### Sistema de Colores Dinámicos
- **Fundación Padrinos**: Rosa (#A10D59) + Blanco (#FFFFFF)
- **Solidaridad Intergeneracional**: Naranja (#EE881E) + Blanco (#FFFFFF)
- **Por defecto**: Naranja (#D17C22) + Verde (#8E8D29)

### Uso de Colores
```typescript
import { useCorporateColors } from '@/shared/hooks/useCorporateColors';

function MiComponente() {
  const colors = useCorporateColors();
  
  return (
    <div style={{ backgroundColor: colors.primary }}>
      Contenido con color corporativo
    </div>
  );
}
```

## 📊 Patrones Comunes

### Gestión de Estado
- Formularios: `useState` + validación local
- Datos de API: `useApiData` hook compartido
- Estado global: Context API cuando sea necesario

### Manejo de Errores
- UI: `useNotification` hook para mostrar mensajes
- API: Manejo centralizado en hooks de datos
- Fallbacks: Componentes de error y loading

### Performance
- Lazy loading para aplicaciones grandes
- Memoización en componentes pesados
- Optimización de imports con tree-shaking

## 🔐 Autenticación y Permisos

### Flujo de Autenticación
1. Login → Middleware verifica dominio
2. Token almacenado en cookies httpOnly
3. `useCurrentUser` proporciona datos del usuario
4. Colores corporativos basados en email domain

### Control de Acceso
- Middleware protege rutas privadas
- Hooks de permisos por recurso
- Componentes condicionales según rol