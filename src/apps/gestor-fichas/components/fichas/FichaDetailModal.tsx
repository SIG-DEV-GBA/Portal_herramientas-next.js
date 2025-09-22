"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  FileText, 
  Calendar, 
  User, 
  Globe, 
  Building, 
  Tag,
  ExternalLink,
  MapPin,
  Clock,
  Zap,
  Monitor,
  AlertTriangle,
  Copy,
  Check
} from "lucide-react";

import { Ficha } from "@/apps/gestor-fichas/lib/types";
import { fmtDate } from "@/apps/gestor-fichas/lib/utils";

interface Props {
  ficha: Ficha;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (updatedFicha: Ficha) => void;
}

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
  count?: number;
}

export default function FichaDetailModal({ ficha, isOpen, onClose, onUpdate }: Props) {
  const [activeTab, setActiveTab] = useState('general');
  const [copied, setCopied] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedFicha, setEditedFicha] = useState<Ficha>(ficha);

  // Reset edited values when ficha changes
  useEffect(() => {
    setEditedFicha(ficha);
  }, [ficha]);

  const handleFieldChange = (field: keyof Ficha, value: any) => {
    setEditedFicha(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/apps/gestor-fichas/fichas/${ficha.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedFicha),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar los cambios');
      }

      const updatedFicha = await response.json();
      console.log('Ficha actualizada exitosamente:', updatedFicha);
      
      setIsEditMode(false);
      
      // Actualizar los datos del modal
      setEditedFicha(updatedFicha);
      
      // Notificar al componente padre para que actualice la tabla
      if (onUpdate) {
        onUpdate(updatedFicha);
      }
      
    } catch (error) {
      console.error('Error al guardar:', error);
      // Opcional: mostrar mensaje de error
      // toast.error(error.message || 'Error al guardar los cambios');
      alert('Error al guardar los cambios: ' + (error instanceof Error ? error.message : 'Error desconocido'));
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getAmbitoInfo = (nivel: string) => {
    const info = {
      'UE': { label: 'Unión Europea', icon: '🇪🇺', color: 'text-blue-700 bg-blue-50 border-blue-200' },
      'ESTADO': { label: 'Estado Español', icon: '🏛️', color: 'text-[#D17C22] bg-orange-50 border-[#D17C22]/30' },
      'CCAA': { label: 'Comunidad Autónoma', icon: '🌐', color: 'text-[#8E8D29] bg-green-50 border-[#8E8D29]/30' },
      'PROVINCIA': { label: 'Provincial/Local', icon: '📍', color: 'text-amber-700 bg-amber-50 border-amber-200' }
    };
    return info[nivel as keyof typeof info] || { label: nivel, icon: '📋', color: 'text-gray-600 bg-gray-50 border-gray-200' };
  };

  const getTramiteInfo = (tipo: string) => {
    const info = {
      'si': { label: 'Online (Digital)', icon: '🌐', color: 'text-[#8E8D29] bg-[#8E8D29]/10 border-[#8E8D29]/30' },
      'no': { label: 'Presencial', icon: '🏢', color: 'text-[#D17C22] bg-[#D17C22]/10 border-[#D17C22]/30' },
      'directo': { label: 'Mixto (Ambas modalidades)', icon: '⚡', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' }
    };
    return info[tipo as keyof typeof info] || { label: tipo, icon: '❓', color: 'text-gray-600 bg-gray-50 border-gray-200' };
  };

  const getComplejidadInfo = (nivel: string) => {
    const info = {
      'baja': { label: 'Baja - Trámite sencillo', icon: '🟢', color: 'text-[#8E8D29] bg-[#8E8D29]/10 border-[#8E8D29]/30' },
      'media': { label: 'Media - Complejidad moderada', icon: '🟡', color: 'text-amber-700 bg-amber-50 border-amber-200' },
      'alta': { label: 'Alta - Trámite complejo', icon: '🔴', color: 'text-[#D17C22] bg-[#D17C22]/10 border-[#D17C22]/30' }
    };
    return info[nivel as keyof typeof info] || { label: nivel, icon: '⚪', color: 'text-gray-600 bg-gray-50 border-gray-200' };
  };

  const tabs: Tab[] = [
    {
      id: 'general',
      label: 'Información General',
      icon: <FileText className="w-4 h-4" />
    },
    {
      id: 'fechas',
      label: 'Fechas y Plazos',
      icon: <Calendar className="w-4 h-4" />
    },
    {
      id: 'territorial',
      label: 'Ámbito Territorial',
      icon: <MapPin className="w-4 h-4" />
    },
    {
      id: 'gestion',
      label: 'Gestión',
      icon: <User className="w-4 h-4" />
    }
  ];

  const currentFicha = isEditMode ? editedFicha : ficha;
  const ambitoInfo = getAmbitoInfo(currentFicha.ambito_nivel);
  const tramiteInfo = currentFicha.tramite_tipo ? getTramiteInfo(currentFicha.tramite_tipo) : null;
  const complejidadInfo = currentFicha.complejidad ? getComplejidadInfo(currentFicha.complejidad) : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 transition-opacity backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className="relative min-h-full flex items-start justify-center p-4 py-8">
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden my-8">
          {/* Header */}
          <div className="bg-[#D17C22] px-6 py-5">
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      Ficha #{ficha.id_ficha_subida}
                    </h2>
                    <p className="text-white/80 text-sm">
                      Creada {fmtDate(ficha.created_at)}
                    </p>
                  </div>
                </div>
                {isEditMode ? (
                  <input
                    type="text"
                    value={editedFicha.nombre_ficha}
                    onChange={(e) => handleFieldChange('nombre_ficha', e.target.value)}
                    className="text-2xl font-bold text-gray-900 leading-tight bg-white rounded-lg px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
                  />
                ) : (
                  <h1 className="text-2xl font-bold text-white leading-tight">
                    {ficha.nombre_ficha}
                  </h1>
                )}
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`https://solidaridadintergeneracional.es/ayuda/${ficha.id_ficha_subida}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-200"
                  title="Ver en Portal Web"
                >
                  <ExternalLink className="w-4 h-4" />
                  Ver en Web
                </a>
                <button
                  onClick={() => {
                    if (isEditMode) {
                      // Resetear cambios al cancelar
                      setEditedFicha(ficha);
                    }
                    setIsEditMode(!isEditMode);
                  }}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isEditMode 
                      ? 'bg-white text-[#D17C22] hover:bg-gray-100' 
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                  title={isEditMode ? "Cancelar edición" : "Editar ficha"}
                >
                  {isEditMode ? 'Cancelar' : 'Editar'}
                </button>
                <button
                  onClick={() => copyToClipboard(`Ficha #${ficha.id_ficha_subida}: ${ficha.nombre_ficha}`)}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                  title="Copiar información"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 bg-gray-50">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200
                    ${activeTab === tab.id
                      ? 'border-[#D17C22] text-[#D17C22] bg-white/50'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-[#8E8D29]/50'
                    }
                  `}
                >
                  {tab.icon}
                  {tab.label}
                  {tab.count && (
                    <span className="ml-2 bg-gray-200 text-gray-700 py-1 px-2 rounded-full text-xs">
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="overflow-y-auto" style={{ maxHeight: 'calc(95vh - 200px)' }}>
            <div className="p-6">
              {activeTab === 'general' && (
                <div className="space-y-6">
                  {/* Frase publicitaria */}
                  {(ficha.frase_publicitaria || isEditMode) && (
                    <div className="bg-[#8E8D29]/10 border border-[#8E8D29]/30 rounded-xl p-4">
                      <h3 className="text-sm font-semibold text-[#8E8D29] mb-2 flex items-center gap-2">
                        <Zap className="w-4 h-4" />
                        Texto para Divulgación
                      </h3>
                      {isEditMode ? (
                        <textarea
                          value={editedFicha.frase_publicitaria || ''}
                          onChange={(e) => handleFieldChange('frase_publicitaria', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8E8D29] focus:border-transparent text-[#8E8D29]/90 leading-relaxed resize-none"
                          rows={3}
                          placeholder="Ingrese el texto para divulgación..."
                        />
                      ) : (
                        <p className="text-[#8E8D29]/90 leading-relaxed">
                          {ficha.frase_publicitaria}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Estados y características */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Ámbito */}
                    <div className={`p-4 rounded-xl border ${ambitoInfo.color}`}>
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{ambitoInfo.icon}</div>
                        <div className="flex-1">
                          <p className="text-xs font-medium opacity-75">ÁMBITO</p>
                          {isEditMode ? (
                            <select
                              value={editedFicha.ambito_nivel}
                              onChange={(e) => handleFieldChange('ambito_nivel', e.target.value)}
                              className="w-full font-semibold bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                            >
                              <option value="UE">Unión Europea</option>
                              <option value="ESTADO">Estado Español</option>
                              <option value="CCAA">Comunidad Autónoma</option>
                              <option value="PROVINCIA">Provincial/Local</option>
                            </select>
                          ) : (
                            <p className="font-semibold">{ambitoInfo.label}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Trámite */}
                    {(tramiteInfo || isEditMode) && (
                      <div className={`p-4 rounded-xl border ${tramiteInfo?.color || 'text-gray-600 bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{tramiteInfo?.icon || '❓'}</div>
                          <div className="flex-1">
                            <p className="text-xs font-medium opacity-75">MODALIDAD</p>
                            {isEditMode ? (
                              <select
                                value={editedFicha.tramite_tipo || ''}
                                onChange={(e) => handleFieldChange('tramite_tipo', e.target.value)}
                                className="w-full font-semibold bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                              >
                                <option value="">Seleccionar...</option>
                                <option value="si">Online (Digital)</option>
                                <option value="no">Presencial</option>
                                <option value="directo">Mixto (Ambas modalidades)</option>
                              </select>
                            ) : (
                              <p className="font-semibold">{tramiteInfo.label}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Complejidad */}
                    {(complejidadInfo || isEditMode) && (
                      <div className={`p-4 rounded-xl border ${complejidadInfo?.color || 'text-gray-600 bg-gray-50 border-gray-200'}`}>
                        <div className="flex items-center gap-3">
                          <div className="text-2xl">{complejidadInfo?.icon || '⚪'}</div>
                          <div className="flex-1">
                            <p className="text-xs font-medium opacity-75">COMPLEJIDAD</p>
                            {isEditMode ? (
                              <select
                                value={editedFicha.complejidad || ''}
                                onChange={(e) => handleFieldChange('complejidad', e.target.value)}
                                className="w-full font-semibold bg-transparent border-none focus:outline-none focus:ring-0 p-0"
                              >
                                <option value="">Seleccionar...</option>
                                <option value="baja">Baja - Trámite sencillo</option>
                                <option value="media">Media - Complejidad moderada</option>
                                <option value="alta">Alta - Trámite complejo</option>
                              </select>
                            ) : (
                              <p className="font-semibold">{complejidadInfo.label}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>


                  {/* Información adicional */}
                  {(ficha.texto_divulgacion || ficha.destaque_principal || ficha.destaque_secundario || isEditMode) && (
                    <div className="bg-gray-50 rounded-xl p-4">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Tag className="w-4 h-4" />
                        Información Adicional
                      </h3>
                      <div className="space-y-3">
                        {(ficha.texto_divulgacion || isEditMode) && (
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-1">Texto de Divulgación</h4>
                            {isEditMode ? (
                              <textarea
                                value={editedFicha.texto_divulgacion || ''}
                                onChange={(e) => handleFieldChange('texto_divulgacion', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-600 leading-relaxed resize-none"
                                rows={3}
                                placeholder="Ingrese el texto de divulgación..."
                              />
                            ) : (
                              <p className="text-gray-600 leading-relaxed">
                                {ficha.texto_divulgacion}
                              </p>
                            )}
                          </div>
                        )}
                        <div className="space-y-2">
                          {(ficha.destaque_principal || isEditMode) && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-1">Destaque Principal</h4>
                              {isEditMode ? (
                                <select
                                  value={editedFicha.destaque_principal || ''}
                                  onChange={(e) => handleFieldChange('destaque_principal', e.target.value)}
                                  className="w-full px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                >
                                  <option value="">Sin destaque</option>
                                  <option value="nueva">Nueva - Primera vez que se introduce</option>
                                  <option value="para_publicitar">Para Publicitar - Ficha importante</option>
                                </select>
                              ) : ficha.destaque_principal ? (
                                <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                                  {ficha.destaque_principal === 'nueva' ? '🆕 Nueva' : '📢 Para Publicitar'}
                                </span>
                              ) : null}
                            </div>
                          )}
                          {(ficha.destaque_secundario || isEditMode) && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-700 mb-1">Destaque Secundario</h4>
                              {isEditMode ? (
                                <select
                                  value={editedFicha.destaque_secundario || ''}
                                  onChange={(e) => handleFieldChange('destaque_secundario', e.target.value)}
                                  className="w-full px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                >
                                  <option value="">Sin destaque</option>
                                  <option value="nueva">Nueva - Primera vez que se introduce</option>
                                  <option value="para_publicitar">Para Publicitar - Ficha importante</option>
                                </select>
                              ) : ficha.destaque_secundario ? (
                                <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                                  {ficha.destaque_secundario === 'nueva' ? '🆕 Nueva' : '📢 Para Publicitar'}
                                </span>
                              ) : null}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'fechas' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Fecha de Creación
                      </h3>
                      <p className="text-gray-700">
                        {fmtDate(ficha.created_at)}
                      </p>
                    </div>

                    {ficha.fecha_redaccion && (
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Fecha de Redacción
                        </h3>
                        <p className="text-gray-700">
                          {fmtDate(ficha.fecha_redaccion, true)}
                        </p>
                      </div>
                    )}

                    {ficha.fecha_subida_web && (
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                          <Monitor className="w-4 h-4" />
                          Fecha de Subida Web
                        </h3>
                        <p className="text-gray-700">
                          {fmtDate(ficha.fecha_subida_web, true)}
                        </p>
                      </div>
                    )}

                    {ficha.vencimiento && (
                      <div className={`border rounded-xl p-4 ${
                        new Date(ficha.vencimiento) < new Date()
                          ? 'bg-red-50 border-red-200'
                          : new Date(ficha.vencimiento) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                          ? 'bg-amber-50 border-amber-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}>
                        <h3 className={`font-semibold mb-3 flex items-center gap-2 ${
                          new Date(ficha.vencimiento) < new Date()
                            ? 'text-red-800'
                            : new Date(ficha.vencimiento) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                            ? 'text-amber-800'
                            : 'text-gray-800'
                        }`}>
                          {new Date(ficha.vencimiento) < new Date() ? (
                            <AlertTriangle className="w-4 h-4" />
                          ) : (
                            <Clock className="w-4 h-4" />
                          )}
                          Fecha de Vencimiento
                        </h3>
                        <p className={`${
                          new Date(ficha.vencimiento) < new Date()
                            ? 'text-red-700'
                            : new Date(ficha.vencimiento) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                            ? 'text-amber-700'
                            : 'text-gray-700'
                        }`}>
                          {fmtDate(ficha.vencimiento, true)}
                          {new Date(ficha.vencimiento) < new Date() && (
                            <span className="block text-sm mt-1 font-medium">
                              ⚠️ Vencida
                            </span>
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'territorial' && (
                <div className="space-y-6">
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                    <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Globe className="w-5 h-5" />
                      Configuración Territorial
                    </h3>
                    
                    <div className="grid gap-4">
                      <div className={`p-4 rounded-lg border bg-white ${ambitoInfo.color}`}>
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">{ambitoInfo.icon}</div>
                          <div>
                            <p className="text-xs font-medium opacity-75">NIVEL</p>
                            <p className="text-lg font-bold">{ambitoInfo.label}</p>
                          </div>
                        </div>
                      </div>

                      {ficha.ambito_municipal && (
                        <div className="p-4 bg-white border border-gray-200 rounded-lg">
                          <h4 className="font-medium text-gray-700 mb-1 flex items-center gap-2">
                            <Building className="w-4 h-4" />
                            Ámbito Municipal
                          </h4>
                          <p className="text-gray-600">{ficha.ambito_municipal}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'gestion' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Información de Gestión
                      </h3>
                      <div className="space-y-3">
                        {ficha.trabajadores && (
                          <div>
                            <p className="text-sm text-gray-600">Trabajador que Redactó la Ficha</p>
                            <p className="font-medium">{ficha.trabajadores.nombre}</p>
                          </div>
                        )}
                        {ficha.trabajadores_trabajador_subida_idTotrabajadores && (
                          <div>
                            <p className="text-sm text-gray-600">Trabajador que Subió</p>
                            <p className="font-medium">{ficha.trabajadores_trabajador_subida_idTotrabajadores.nombre}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Metadatos
                      </h3>
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-gray-600">ID Interno</p>
                          <p className="font-mono font-medium">{ficha.id}</p>
                        </div>
                        {ficha.nombre_slug && (
                          <div>
                            <p className="text-sm text-gray-600">Slug</p>
                            <p className="font-mono text-sm">{ficha.nombre_slug}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm text-gray-600">Última Actualización</p>
                          <p className="font-medium">{fmtDate(ficha.updated_at)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 border-t border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Ficha #{ficha.id_ficha_subida} • Última actualización: {fmtDate(ficha.updated_at)}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => copyToClipboard(`${window.location.origin}/apps/gestor-fichas/ficha/${ficha.id}`)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Compartir
                </button>
                {isEditMode && (
                  <button
                    onClick={handleSave}
                    className="px-4 py-2 text-sm font-medium text-white bg-[#8E8D29] rounded-lg hover:bg-[#8E8D29]/90 transition-all duration-200"
                  >
                    Guardar Cambios
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#D17C22] rounded-lg hover:bg-[#D17C22]/90 transition-all duration-200"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}