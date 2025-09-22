"use client";

import { useCorporateColors, CorporateColors } from "@/shared/hooks/useCorporateColors";

interface CorporateFooterProps {
  colors?: CorporateColors;
}

export default function CorporateFooter({ colors: overrideColors }: CorporateFooterProps) {
  const dynamicColors = useCorporateColors();
  const colors = overrideColors || dynamicColors;

  return (
    <footer className="mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div 
          className="rounded-2xl p-8"
          style={{
            background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primary}dd 100%)`
          }}
        >
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white mb-3">
              Portal de herramientas corporativas
            </h3>
            <p className="text-white/90 mb-6 max-w-2xl mx-auto">
              Acceso seguro a las aplicaciones y herramientas de trabajo. 
              Todas las sesiones están protegidas.
            </p>
            
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/80">
              <div className="flex items-center gap-2">
                <div 
                  className="w-2 h-2 rounded-full animate-pulse"
                  style={{ backgroundColor: colors.secondary }}
                ></div>
                <span>Sistema operativo</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-white/40"></div>
                <span>Versión {new Date().getFullYear()}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-4 bg-white/40"></div>
                <span>Uso interno</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}