"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, X, Check } from "lucide-react";

interface MultiSelectProps {
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  maxDisplay?: number;
}

export default function MultiSelect({ 
  options = [], 
  value = [], 
  onChange, 
  placeholder = "Seleccionar...",
  maxDisplay = 3 
}: MultiSelectProps) {
  // Ensure options is always an array
  const safeOptions = Array.isArray(options) ? options : [];
  const safeValue = Array.isArray(value) ? value : [];
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (option: string) => {
    const newValue = safeValue.includes(option)
      ? safeValue.filter(v => v !== option)
      : [...safeValue, option];
    onChange(newValue);
  };

  const handleRemove = (option: string) => {
    onChange(safeValue.filter(v => v !== option));
  };

  const displayText = () => {
    if (safeValue.length === 0) return placeholder;
    if (safeValue.length <= maxDisplay) {
      return safeValue.join(", ");
    }
    return `${safeValue.slice(0, maxDisplay).join(", ")} +${safeValue.length - maxDisplay} más`;
  };

  return (
    <div className="relative" ref={containerRef}>
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm cursor-pointer
                   focus:ring-2 focus:ring-[#D17C22]/20 focus:border-[#D17C22]
                   hover:border-[#8E8D29] transition-all duration-200 flex items-center justify-between"
      >
        <span className={safeValue.length === 0 ? "text-gray-500" : "text-gray-900"}>
          {displayText()}
        </span>
        <ChevronDown 
          className={`ml-2 h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {safeOptions.length === 0 ? (
            <div className="px-3 py-2 text-sm text-gray-500">No hay opciones</div>
          ) : (
            safeOptions.map((option) => (
              <div
                key={option}
                onClick={() => handleToggle(option)}
                className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-50 flex items-center justify-between"
              >
                <span className="text-gray-900">{option}</span>
                {safeValue.includes(option) && (
                  <Check className="h-4 w-4 text-[#D17C22]" />
                )}
              </div>
            ))
          )}
        </div>
      )}

      {/* Tags seleccionados */}
      {safeValue.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {safeValue.map((item) => (
            <span
              key={item}
              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-[#D17C22]/10 text-[#D17C22] border border-[#D17C22]/20"
            >
              {item}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(item);
                }}
                className="ml-1 hover:text-[#8E8D29]"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}