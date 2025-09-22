/**
 * Configuración centralizada de rutas del proyecto
 * Facilita el mantenimiento y escalabilidad
 */

// Rutas base de aplicaciones
export const APP_ROUTES = {
  DASHBOARD: '/dashboard',
  LOGIN: '/login',
  GESTOR_FICHAS: '/apps/gestor-fichas',
} as const;

// Rutas de API
export const API_ROUTES = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
  },
  GESTOR_FICHAS: {
    FICHAS: '/api/apps/gestor-fichas/fichas',
    STATS: '/api/apps/gestor-fichas/stats',
    GENERATE_PDF: '/api/apps/gestor-fichas/generate-pdf-v2',
    GENERATE_EXCEL: '/api/apps/gestor-fichas/generate-excel',
  },
  LOOKUPS: {
    CCAA: '/api/lookups/ccaa',
    PROVINCIAS: '/api/lookups/provincias',
    PORTALES: '/api/lookups/portales',
    TEMATICAS: '/api/lookups/tematicas',
    TRABAJADORES: '/api/lookups/trabajadores',
    REDACTORES: '/api/lookups/redactores',
  }
} as const;

// Títulos de páginas
export const PAGE_TITLES = {
  DASHBOARD: 'Portal de Herramientas',
  LOGIN: 'Acceso al Portal',
  GESTOR_FICHAS: 'Gestor de Fichas',
  NUEVA_FICHA: 'Nueva Ficha',
} as const;