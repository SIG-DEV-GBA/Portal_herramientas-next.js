# Portal de Aplicaciones - Estructura

Cada **aplicación** del portal es completamente independiente y sigue esta estructura estándar:

```
src/app/apps/[nombre-aplicacion]/
├── api/                    # APIs específicas de la app
│   ├── route.ts           # API principal (GET, POST, etc.)
│   ├── [id]/
│   │   └── route.ts       # API para operaciones específicas por ID
│   └── stats/             # APIs de estadísticas (si aplica)
├── components/            # Componentes específicos de la app
│   ├── charts/           # Gráficas y visualizaciones
│   ├── forms/            # Formularios
│   ├── stats/            # Componentes de estadísticas
│   └── ui/               # Componentes UI específicos
├── lib/                   # Lógica de negocio y utilidades
│   ├── api.ts            # Funciones para comunicación con APIs
│   ├── types.ts          # Tipos TypeScript específicos
│   └── utils.ts          # Funciones utilitarias
├── pages/                 # Componentes de página (client components)
│   └── [NombreApp]Client.tsx
├── hooks/                 # Hooks personalizados (opcional)
├── types/                 # Tipos adicionales (opcional)
├── dashboard/             # Página principal de la app
│   └── page.tsx
└── [otras-rutas]/         # Otras páginas de la app
    └── page.tsx
```

## APIs Directas (Sin Proxy)

Las APIs de cada aplicación se ubican directamente en:

```
src/app/api/apps/[nombre-app]/[endpoint]/route.ts
```

URLs finales:
- `/api/apps/gestor-fichas/fichas` → GET/POST fichas
- `/api/apps/gestor-fichas/fichas/[id]` → GET/PUT/DELETE ficha específica
- `/api/apps/gestor-fichas/stats/[endpoint]` → Estadísticas específicas

## Para añadir nueva aplicación:

1. **Copiar estructura base**: `cp -r src/app/apps/gestor-fichas src/app/apps/nueva-app`
2. **Copiar estructura API**: `cp -r src/app/api/apps/gestor-fichas src/app/api/apps/nueva-app`
3. **Actualizar imports**: Cambiar `@/app/apps/gestor-fichas` por `@/app/apps/nueva-app`
4. **Actualizar URLs**: Cambiar `/api/apps/gestor-fichas/` por `/api/apps/nueva-app/`
5. **Añadir al grid**: Actualizar `src/app/dashboard/page.tsx`

## Rutas del Portal:

- **Portal Principal**: `/dashboard` - Lista de aplicaciones
- **Aplicación**: `/apps/[nombre]/dashboard` - Dashboard específico
- **APIs**: `/api/apps/[nombre]/[endpoint]` - APIs directas por app

## Añadir App al Portal

Añadir la app al grid en `src/app/dashboard/page.tsx`:

```typescript
{
  key: "nombre-app",
  title: "Título de la App",
  description: "Descripción de la funcionalidad",
  href: "/apps/nombre-app/dashboard",
  icon: <IconoLucide size={20} />,
  tags: ["Categoría"],
},
```

## Aplicaciones Actuales:

- **gestor-fichas**: Gestión completa de fichas con dashboard, estadísticas y CRUD

## Beneficios:

✅ **Mantenimiento fácil** - Cada app independiente
✅ **Escalabilidad** - Copiar estructura = nueva app  
✅ **Organización clara** - Todo junto por aplicación
✅ **APIs organizadas** - Cada app tiene sus APIs en `/api/apps/[nombre]/`