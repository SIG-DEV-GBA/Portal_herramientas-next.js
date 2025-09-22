"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "@/apps/gestor-fichas/components/layout/AppHeader";
import NuevaFichaForm from "@/apps/gestor-fichas/components/forms/NuevaFichaForm";
import { useNotification } from "@/shared/hooks/useNotification";
import { NotificationModal } from "@/shared/components/ui/Modal";
import CorporateFooter from "@/components/layout/CorporateFooter";

export default function NuevaFichaPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { notification, showSuccess, showError, closeNotification } = useNotification();

  const handleSubmit = async (formData: Record<string, any>) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/apps/gestor-fichas/fichas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Campos obligatorios
          nombre_ficha: formData.nombre_ficha,
          id_ficha_subida: formData.id_ficha_subida,
          ambito_nivel: formData.ambito_nivel,
          
          // Campos opcionales con valores válidos
          ambito_ccaa_id: formData.ambito_ccaa_id ? Number(formData.ambito_ccaa_id) : null,
          ambito_provincia_id: formData.ambito_provincia_id ? Number(formData.ambito_provincia_id) : null,
          ambito_municipal: formData.ambito_municipal || null,
          
          trabajador_id: formData.trabajador_id ? Number(formData.trabajador_id) : null,
          trabajador_subida_id: formData.trabajador_subida_id ? Number(formData.trabajador_subida_id) : null,
          redactor_id: formData.redactor_id ? Number(formData.redactor_id) : null,
          
          tramite_tipo: formData.tramite_tipo || null,
          complejidad: formData.complejidad || null,
          
          frase_publicitaria: formData.frase_publicitaria || null,
          texto_divulgacion: formData.texto_divulgacion || null,
          destaque_principal: formData.destaque_principal ? 'nueva' : null,
          destaque_secundario: formData.destaque_secundario ? 'para_publicitar' : null,
          
          // Fechas
          fecha_redaccion: formData.fecha_redaccion || null,
          fecha_subida_web: formData.fecha_subida_web || null,
          vencimiento: formData.vencimiento || null,
          
          // Relaciones (convertir a arrays de números)
          portales: formData.portales?.filter(Boolean).map(Number) || [],
          tematicas: formData.tematicas?.filter(Boolean).map(Number) || [],
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Error al crear la ficha';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (jsonError) {
          // Si no puede parsear JSON, usar mensaje genérico con código de estado
          errorMessage = `Error del servidor (${response.status}): ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const nuevaFicha = await response.json();
      
      showSuccess(
        '¡Ficha creada exitosamente!',
        `La ficha "${nuevaFicha.nombre_ficha}" se ha guardado correctamente. Redirigiendo al dashboard...`
      );

      // Auto-redirección después de 3 segundos con parámetro refresh
      setTimeout(() => {
        router.push('/apps/gestor-fichas/dashboard?refresh=true');
      }, 3000);
      
    } catch (error: unknown) {
      console.error('Error creating ficha:', error);
      const errorMessage = (error instanceof Error ? error.message : 'Error desconocido') || 'No se pudo crear la ficha. Inténtalo de nuevo.';
      
      showError(
        'Error al crear ficha',
        errorMessage
      );
      
      // No re-lanzar el error para evitar duplicate error handling
      // El modal de error ya muestra la información al usuario
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <AppHeader title="Nueva Ficha" showBackButton={true} />
      
      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <nav className="flex items-center space-x-2 text-sm text-gray-500">
            <button 
              onClick={() => router.push('/apps/gestor-fichas/dashboard')}
              className="hover:text-gray-700 transition-colors cursor-pointer"
            >
              Gestor de Fichas
            </button>
            <span>/</span>
            <span className="text-gray-900 font-medium">Nueva Ficha</span>
          </nav>
        </div>

        <NuevaFichaForm 
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>

      {/* Notification Modal */}
      {notification.isOpen && (
        <NotificationModal
          isOpen={notification.isOpen}
          onClose={closeNotification}
          type={notification.type}
          title={notification.title}
          message={notification.message}
          autoClose={notification.type === 'success' ? 3000 : undefined}
        />
      )}
      
      <CorporateFooter />
    </div>
  );
}