import React, { useState, useEffect, useRef } from 'react';
import SuggestionInput from '../SuggestionInput';
import { commonTerms } from '../SuggestionDatalist';
import './SelectableInput.css';

/**
 * Componente SelectableInput - Dropdown searchable reutilizable
 * 
 * Props:
 *   label (string): Etiqueta del input
 *   options (array): [{label, value}, ...]
 *   value (string|number): Valor seleccionado
 *   onChange (fn): Callback cuando cambia
 *   placeholder (string): Texto cuando no hay selección
 *   icon (string): Emoji o símbolo
 *   isClientSearch (bool): Si es busca de clientes, incluye cédula
 *   multiSelect (bool): Soporte futuro para selección múltiple
 */
export default function SelectableInput({
  label,
  options = [],
  value,
  onChange,
  placeholder = 'Selecciona una opción...',
  icon = '🔍',
  isClientSearch = false,
  multiSelect = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtrar opciones según búsqueda
  const filtered = options.filter(opt => {
    const searchText = isClientSearch
      ? `${opt.label} ${opt.cedula || ''}`.toLowerCase()
      : opt.label.toLowerCase();
    return searchText.includes(search.toLowerCase());
  });

  const selectedOpt = options.find(o => String(o.value) === String(value));

  return (
    <fieldset className="input-group selectable-input-wrapper" ref={wrapperRef}>
      {label && <legend className="selectable-input-label">{label}</legend>}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`selectable-input-trigger ${isOpen ? 'open' : ''}`}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="selectable-input-icon">{icon}</span>
        <div className={`selectable-input-text ${selectedOpt ? 'selected' : 'placeholder'}`}>
          {selectedOpt
            ? isClientSearch
              ? `${selectedOpt.label} ${selectedOpt.cedula || ''}`
              : selectedOpt.label
            : placeholder}
        </div>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth="3"
          className={`selectable-input-arrow ${isOpen ? 'open' : ''}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {isOpen && (
        <div className="selectable-input-dropdown animate-scale-in" role="listbox">
          <div className="selectable-input-search-container">
            <div className="selectable-input-search-wrapper">
              <SuggestionInput
                autoFocus
                placeholder="Escribe para buscar..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="selectable-input-search-input"
                spellCheck={true}
                lang="es"
                suggestions={[...new Set([...options.map(o => o.label), ...commonTerms])]}
              />
              <svg
                className="selectable-input-search-icon"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
          </div>

          <ul className="selectable-input-options" role="list">
            {filtered.length > 0 ? (
              filtered.map(opt => (
                <li key={opt.value} role="listitem">
                  <button
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`selectable-input-option ${String(value) === String(opt.value) ? 'selected' : ''}`}
                    role="option"
                    aria-selected={String(value) === String(opt.value)}
                  >
                    <span className="selectable-input-option-label">
                      {isClientSearch
                        ? `${opt.label} ${opt.cedula ? `(${opt.cedula})` : ''}`
                        : opt.label}
                    </span>
                    {String(value) === String(opt.value) && (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </button>
                </li>
              ))
            ) : (
              <div className="selectable-input-no-results" role="status" aria-live="polite">
                <span>🔍</span>
                No se encontraron resultados para "{search}"
              </div>
            )}
          </ul>
        </div>
      )}
    </fieldset>
  );
}
