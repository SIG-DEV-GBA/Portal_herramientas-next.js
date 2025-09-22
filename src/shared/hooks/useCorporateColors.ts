import { useState, useEffect } from 'react';
import { useCurrentUser } from './useCurrentUser';

export interface CorporateColors {
  primary: string;
  secondary: string;
  accent: string;
}

const COLOR_SCHEMES = {
  'fundacionpadrinosdelavejez.es': {
    primary: '#A10D59',
    secondary: '#FFFFFF', 
    accent: '#A10D59'
  },
  'solidaridadintergeneracional.es': {
    primary: '#EE881E',
    secondary: '#FFFFFF',
    accent: '#EE881E'
  },
  // Fallback por defecto
  default: {
    primary: '#D17C22',
    secondary: '#FFFFFF',
    accent: '#8E8D29'
  }
};

function getDomainFromStorage(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('portal_user_domain');
}

function getColorsForDomain(domain: string | null): CorporateColors {
  if (!domain) {
    return {
      primary: '#6B7280', // gris neutro
      secondary: '#FFFFFF',
      accent: '#6B7280'
    };
  }
  return COLOR_SCHEMES[domain as keyof typeof COLOR_SCHEMES] || COLOR_SCHEMES.default;
}

export function useCorporateColors(): CorporateColors {
  const { user, loading } = useCurrentUser();
  const [isClient, setIsClient] = useState(false);
  
  // Inicializar con colores por defecto para evitar hydration mismatch
  const [colors, setColors] = useState<CorporateColors>(() => {
    // Durante SSR, usar siempre colores por defecto
    return {
      primary: '#6B7280', // gris neutro
      secondary: '#FFFFFF',
      accent: '#6B7280'
    };
  });

  // Detectar cuando estamos en el cliente
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Solo ejecutar en el cliente después de hidratación
    if (!isClient || loading) return;

    let domain: string | null = null;
    
    if (user?.email) {
      domain = user.email.split('@')[1];
      // Guardar dominio en localStorage para próximas cargas
      localStorage.setItem('portal_user_domain', domain);
    } else {
      // Intentar recuperar dominio del localStorage
      domain = getDomainFromStorage();
      if (!domain) {
        localStorage.removeItem('portal_user_domain');
      }
    }

    const newColors = getColorsForDomain(domain);
    
    // Solo actualizar si los colores han cambiado
    if (newColors.primary !== colors.primary) {
      setColors(newColors);
    }
  }, [user, loading, isClient, colors.primary]);

  return colors;
}

// Hook para obtener clases CSS dinámicas
export function useCorporateColorClasses() {
  const colors = useCorporateColors();
  
  return {
    // Colores principales
    primaryBg: `bg-[${colors.primary}]`,
    primaryText: `text-[${colors.primary}]`,
    primaryBorder: `border-[${colors.primary}]`,
    
    // Colores secundarios
    secondaryBg: `bg-[${colors.secondary}]`,
    secondaryText: `text-[${colors.secondary}]`,
    
    // Colores de acento
    accentBg: `bg-[${colors.accent}]`,
    accentText: `text-[${colors.accent}]`,
    
    // Colores raw para uso en estilos inline
    colors
  };
}