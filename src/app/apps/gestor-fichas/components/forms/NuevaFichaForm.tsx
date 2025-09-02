"use client";

import { useState, useRef, useEffect } from "react";
import { Upload, FileText, X, RotateCcw, Save, AlertCircle, CheckCircle, Eye } from "lucide-react";

interface NuevaFichaFormData {
  // Auto-rellenables
  nombre_ficha: string;
  frase_publicitaria: string;
  vencimiento: string;
  tramite_tipo: "online" | "presencial" | "directo" | "";

  // Manuales obligatorios
  id_ficha_subida: string;
  ambito_nivel: "UE" | "ESTADO" | "CCAA" | "PROVINCIA" | "";

  // Manuales opcionales
  fecha_subida_web: string;
  fecha_redaccion: string;
  ambito_ccaa_id: string;
  ambito_provincia_id: string;
  ambito_municipal: string;
  trabajador_id: string;
  trabajador_subida_id: string;
  complejidad: "baja" | "media" | "alta" | "";
  tematicas: string[];
  portales: string[];
  texto_divulgacion: string;
  destaque_principal: string;
  destaque_secundario: string;
}

interface AutoFilledData {
  nombre_ficha?: string;
  frase_publicitaria?: string;
  vencimiento?: string;
  tramite_tipo?: "online" | "presencial" | "directo";
  ambito_nivel?: "UE" | "ESTADO" | "CCAA" | "PROVINCIA";
  fecha_redaccion?: string;
}

interface NuevaFichaFormProps {
  onSubmit: (data: NuevaFichaFormData) => Promise<void>;
  isLoading?: boolean;
}

export default function NuevaFichaForm({ onSubmit, isLoading }: NuevaFichaFormProps) {
  const [formData, setFormData] = useState<NuevaFichaFormData>({
    // Auto-rellenables
    nombre_ficha: "",
    frase_publicitaria: "",
    vencimiento: "",
    tramite_tipo: "",
    // Manuales
    id_ficha_subida: "",
    ambito_nivel: "",
    fecha_subida_web: "",
    fecha_redaccion: "",
    ambito_ccaa_id: "",
    ambito_provincia_id: "",
    ambito_municipal: "",
    trabajador_id: "",
    trabajador_subida_id: "",
    complejidad: "",
    tematicas: [],
    portales: [],
    texto_divulgacion: "",
    destaque_principal: "",
    destaque_secundario: "",
  });

  const [autoFilledData, setAutoFilledData] = useState<AutoFilledData>({});
  const [isDragActive, setIsDragActive] = useState(false);
  const [processingFile, setProcessingFile] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lookups
  const [trabajadores, setTrabajadores] = useState<{id: number; nombre: string}[]>([]);
  const [ccaa, setCcaa] = useState<{id: number; nombre: string}[]>([]);
  const [provincias, setProvincias] = useState<{id: number; nombre: string}[]>([]);
  const [tematicasOptions, setTematicasOptions] = useState<{id: number; nombre: string}[]>([]);
  const [portalesOptions, setPortalesOptions] = useState<{id: number; nombre: string}[]>([]);

  // Cargar datos de lookups
  useEffect(() => {
    Promise.all([
      fetch("/api/lookups/trabajadores").then(r => r.json()),
      fetch("/api/lookups/ccaa").then(r => r.json()),
      fetch("/api/lookups/provincias").then(r => r.json()),
      fetch("/api/lookups/tematicas").then(r => r.json()),
      fetch("/api/lookups/portales").then(r => r.json())
    ])
    .then(([trabajadoresData, ccaaData, provinciasData, tematicasData, portalesData]) => {
      setTrabajadores(trabajadoresData || []);
      setCcaa(ccaaData || []);
      setProvincias(provinciasData || []);
      setTematicasOptions(tematicasData || []);
      setPortalesOptions(portalesData || []);
    })
    .catch(() => {
      setTrabajadores([]);
      setCcaa([]);
      setProvincias([]);
      setTematicasOptions([]);
      setPortalesOptions([]);
    });
  }, []);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.docx')) {
      setError("Por favor, sube un archivo DOCX válido");
      return;
    }

    setProcessingFile(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/apps/gestor-fichas/process-docx', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error procesando el archivo');
      }

      const extractedData = await response.json();
      
      // Guardar datos auto-rellenados
      setAutoFilledData(extractedData);
      
      // Actualizar formulario con datos extraídos
      setFormData(prev => ({
        ...prev,
        ...extractedData,
      }));

    } catch (error) {
      console.error('Error processing file:', error);
      setError("Error procesando el archivo DOCX");
    } finally {
      setProcessingFile(false);
    }
  };

  const resetAutoField = (field: keyof AutoFilledData) => {
    if (autoFilledData[field] !== undefined) {
      setFormData(prev => ({
        ...prev,
        [field]: autoFilledData[field] || "",
      }));
    }
  };

  const handleInputChange = (field: keyof NuevaFichaFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación básica
    if (!formData.nombre_ficha.trim()) {
      setError("El nombre de la ficha es obligatorio");
      return;
    }
    
    if (!formData.id_ficha_subida.trim()) {
      setError("El ID de ficha subida es obligatorio");
      return;
    }
    
    if (!formData.ambito_nivel) {
      setError("El ámbito territorial es obligatorio");
      return;
    }

    try {
      await onSubmit(formData);
      setError("");
    } catch (error: any) {
      setError(error.message || "Error al crear la ficha");
    }
  };

  const isAutoFilled = (field: keyof AutoFilledData) => {
    return autoFilledData[field] !== undefined;
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Nueva Ficha</h2>

        {/* Drag & Drop Area */}
        <div
          className={[
            "border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200",
            isDragActive 
              ? "border-blue-500 bg-blue-50" 
              : "border-gray-300 hover:border-gray-400"
          ].join(' ')}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx"
            onChange={handleFileInput}
            className="hidden"
          />
          
          {processingFile ? (
            <div className="space-y-2">
              <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-sm text-gray-600">Procesando archivo DOCX...</p>
            </div>
          ) : (
            <div className="space-y-6">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Arrastra un archivo DOCX aquí
                </p>
                <p className="text-sm text-gray-500">
                  o{" "}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    selecciona un archivo
                  </button>
                </p>
              </div>
              <p className="text-xs text-gray-400">
                Se auto-completarán: nombre, frase publicitaria, vencimiento, tipo de trámite, ámbito territorial y fecha de redacción
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-8">
          {/* Información Principal */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 space-y-6 border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Información Principal</h3>
            </div>

            {/* Nombre de la ficha */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Nombre de la ayuda
                {isAutoFilled('nombre_ficha') && (
                  <span className="ml-2 text-xs text-green-600 inline-flex items-center gap-1 font-medium">
                    <CheckCircle size={12} /> Auto-completado
                  </span>
                )}
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={formData.nombre_ficha}
                  onChange={(e) => handleInputChange('nombre_ficha', e.target.value)}
                  className={[
                    "flex-1 px-4 py-3 border rounded-xl text-sm font-medium shadow-sm transition-all duration-200",
                    isAutoFilled('nombre_ficha')
                      ? "border-green-400 bg-gradient-to-r from-green-50 to-emerald-50 text-green-900"
                      : "border-gray-300 bg-white hover:border-gray-400",
                    "focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:shadow-md"
                  ].join(' ')}
                  placeholder="Introduce el nombre completo de la ayuda..."
                  required
                />
                {isAutoFilled('nombre_ficha') && (
                  <button
                    type="button"
                    onClick={() => resetAutoField('nombre_ficha')}
                    className="px-4 py-3 text-xs text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                    title="Resetear al valor auto-detectado"
                  >
                    <RotateCcw size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* ID Ficha */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                ID de Ficha
              </label>
              <input
                type="text"
                value={formData.id_ficha_subida}
                onChange={(e) => handleInputChange('id_ficha_subida', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-medium bg-white shadow-sm
                         focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:shadow-md
                         hover:border-gray-400 transition-all duration-200"
                placeholder="ID único identificador de la ficha..."
                required
              />
            </div>

            {/* Texto para divulgación */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Texto para divulgación
                {isAutoFilled('frase_publicitaria') && (
                  <span className="ml-2 text-xs text-green-600 inline-flex items-center gap-1 font-medium">
                    <CheckCircle size={12} /> Auto-completado
                  </span>
                )}
              </label>
              <div className="flex gap-3">
                <textarea
                  value={formData.frase_publicitaria}
                  onChange={(e) => handleInputChange('frase_publicitaria', e.target.value)}
                  rows={3}
                  className={[
                    "flex-1 px-4 py-3 border rounded-xl text-sm font-medium shadow-sm transition-all duration-200 resize-none",
                    isAutoFilled('frase_publicitaria')
                      ? "border-green-400 bg-gradient-to-r from-green-50 to-emerald-50 text-green-900"
                      : "border-gray-300 bg-white hover:border-gray-400",
                    "focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:shadow-md"
                  ].join(' ')}
                  placeholder="Descripción completa y atractiva para la divulgación de la ayuda..."
                  required
                />
                {isAutoFilled('frase_publicitaria') && (
                  <button
                    type="button"
                    onClick={() => resetAutoField('frase_publicitaria')}
                    className="px-4 py-3 text-xs text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors self-start"
                    title="Resetear al valor auto-detectado"
                  >
                    <RotateCcw size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Configuración Territorial y Administrativa */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 space-y-6 border border-purple-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 6a3 3 0 013-3h10a1 1 0 01.8 1.6L14.25 8l2.55 3.4A1 1 0 0116 13H6a1 1 0 00-1 1v3a1 1 0 11-2 0V6z" clipRule="evenodd"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Configuración Territorial</h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Ámbito territorial */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Ámbito Territorial
                  {isAutoFilled('ambito_nivel') && (
                    <span className="ml-2 text-xs text-amber-600 inline-flex items-center gap-1 font-medium">
                      <Eye size={12} /> Autodetectado
                    </span>
                  )}
                </label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <select
                      value={formData.ambito_nivel}
                      onChange={(e) => handleInputChange('ambito_nivel', e.target.value)}
                      className={[
                        "w-full px-4 py-3 pr-10 border rounded-xl text-sm font-medium appearance-none cursor-pointer",
                        "shadow-sm transition-all duration-200",
                        isAutoFilled('ambito_nivel')
                          ? "border-amber-400 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-900"
                          : "border-gray-300 bg-white hover:border-gray-400",
                        "focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:shadow-md"
                      ].join(' ')}
                      required
                    >
                      <option value="" className="text-gray-500">✨ Seleccionar ámbito territorial...</option>
                      <option value="UE" className="text-blue-700 font-medium">🇪🇺 Unión Europea</option>
                      <option value="ESTADO" className="text-red-700 font-medium">🏛️ Estado Español</option>
                      <option value="CCAA" className="text-green-700 font-medium">🌐 Comunidad Autónoma</option>
                      <option value="PROVINCIA" className="text-purple-700 font-medium">📍 Provincial/Local</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {isAutoFilled('ambito_nivel') && (
                    <button
                      type="button"
                      onClick={() => resetAutoField('ambito_nivel')}
                      className="px-4 py-3 text-xs text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                      title="Resetear al valor auto-detectado"
                    >
                      <RotateCcw size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Tipo de trámite */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Modalidad de Trámite
                  {isAutoFilled('tramite_tipo') && (
                    <span className="ml-2 text-xs text-green-600 inline-flex items-center gap-1 font-medium">
                      <CheckCircle size={12} /> Auto-detectado
                    </span>
                  )}
                </label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <select
                      value={formData.tramite_tipo}
                      onChange={(e) => handleInputChange('tramite_tipo', e.target.value)}
                      className={[
                        "w-full px-4 py-3 pr-10 border rounded-xl text-sm font-medium appearance-none cursor-pointer",
                        "shadow-sm transition-all duration-200",
                        isAutoFilled('tramite_tipo')
                          ? "border-green-400 bg-gradient-to-r from-green-50 to-emerald-50 text-green-900"
                          : "border-gray-300 bg-white hover:border-gray-400",
                        "focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:shadow-md"
                      ].join(' ')}
                      required
                    >
                      <option value="" className="text-gray-500">⚡ Seleccionar modalidad...</option>
                      <option value="online" className="text-blue-700 font-medium">🌐 Online (Digital)</option>
                      <option value="presencial" className="text-orange-700 font-medium">🏢 Presencial</option>
                      <option value="directo" className="text-green-700 font-medium">⚡ Mixto (Ambas)</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {isAutoFilled('tramite_tipo') && (
                    <button
                      type="button"
                      onClick={() => resetAutoField('tramite_tipo')}
                      className="px-4 py-3 text-xs text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                      title="Resetear al valor auto-detectado"
                    >
                      <RotateCcw size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Trabajador Responsable */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Trabajador Responsable
                </label>
                <div className="relative">
                  <select
                    value={formData.trabajador_id}
                    onChange={(e) => handleInputChange('trabajador_id', e.target.value)}
                    className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-xl text-sm font-medium
                             bg-white shadow-sm transition-all duration-200 appearance-none cursor-pointer
                             focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:shadow-md
                             hover:border-gray-400"
                    required
                  >
                    <option value="" className="text-gray-500">👤 Seleccionar trabajador...</option>
                    {trabajadores.map((t) => (
                      <option key={t.id} value={t.id} className="font-medium">{t.nombre}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Complejidad */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Nivel de Complejidad
                </label>
                <div className="relative">
                  <select
                    value={formData.complejidad}
                    onChange={(e) => handleInputChange('complejidad', e.target.value)}
                    className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-xl text-sm font-medium
                             bg-white shadow-sm transition-all duration-200 appearance-none cursor-pointer
                             focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:shadow-md
                             hover:border-gray-400"
                    required
                  >
                    <option value="" className="text-gray-500">📊 Seleccionar complejidad...</option>
                    <option value="baja" className="text-green-700 font-medium">🟢 Baja - Trámite sencillo</option>
                    <option value="media" className="text-yellow-700 font-medium">🟡 Media - Complejidad moderada</option>
                    <option value="alta" className="text-red-700 font-medium">🔴 Alta - Trámite complejo</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Fechas y Plazos */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 space-y-6 border border-green-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"/>
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Fechas y Plazos</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Fecha de redacción */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Fecha de Redacción
                  {isAutoFilled('fecha_redaccion') && (
                    <span className="ml-2 text-xs text-green-600 inline-flex items-center gap-1 font-medium">
                      <CheckCircle size={12} /> Auto-detectado
                    </span>
                  )}
                </label>
                <div className="flex gap-3">
                  <input
                    type="date"
                    value={formData.fecha_redaccion}
                    onChange={(e) => handleInputChange('fecha_redaccion', e.target.value)}
                    className={[
                      "flex-1 px-4 py-3 border rounded-xl text-sm font-medium shadow-sm transition-all duration-200",
                      isAutoFilled('fecha_redaccion')
                        ? "border-green-400 bg-gradient-to-r from-green-50 to-emerald-50 text-green-900"
                        : "border-gray-300 bg-white hover:border-gray-400",
                      "focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:shadow-md"
                    ].join(' ')}
                    required
                  />
                  {isAutoFilled('fecha_redaccion') && (
                    <button
                      type="button"
                      onClick={() => resetAutoField('fecha_redaccion')}
                      className="px-4 py-3 text-xs text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                      title="Resetear al valor auto-detectado"
                    >
                      <RotateCcw size={14} />
                    </button>
                  )}
                </div>
              </div>

              {/* Fecha subida web */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Fecha Subida Web
                </label>
                <input
                  type="date"
                  value={formData.fecha_subida_web}
                  onChange={(e) => handleInputChange('fecha_subida_web', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-medium bg-white shadow-sm
                           focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:shadow-md
                           hover:border-gray-400 transition-all duration-200"
                  required
                />
              </div>

              {/* Fecha vencimiento */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Fecha de Vencimiento
                  {isAutoFilled('vencimiento') && (
                    <span className="ml-2 text-xs text-green-600 inline-flex items-center gap-1 font-medium">
                      <CheckCircle size={12} /> Auto-completado
                    </span>
                  )}
                </label>
                <div className="flex gap-3">
                  <input
                    type="date"
                    value={formData.vencimiento}
                    onChange={(e) => handleInputChange('vencimiento', e.target.value)}
                    className={[
                      "flex-1 px-4 py-3 border rounded-xl text-sm font-medium shadow-sm transition-all duration-200",
                      isAutoFilled('vencimiento')
                        ? "border-green-400 bg-gradient-to-r from-green-50 to-emerald-50 text-green-900"
                        : "border-gray-300 bg-white hover:border-gray-400",
                      "focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 focus:shadow-md"
                    ].join(' ')}
                    required
                  />
                  {isAutoFilled('vencimiento') && (
                    <button
                      type="button"
                      onClick={() => resetAutoField('vencimiento')}
                      className="px-4 py-3 text-xs text-gray-600 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                      title="Resetear al valor auto-detectado"
                    >
                      <RotateCcw size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg
                       hover:bg-gray-50 focus:ring-2 focus:ring-blue-500/20"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white 
                       bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500/20
                       disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Crear Ficha
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}