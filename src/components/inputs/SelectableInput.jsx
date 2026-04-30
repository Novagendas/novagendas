import React, { useState, useEffect, useRef } from 'react';
import './SelectableInput.css';

export default function SelectableInput({
  label,
  options = [],
  value,
  onChange,
  placeholder = 'Selecciona una opción...',
  icon = '🔍',
  isClientSearch = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const filtered = options.filter(opt => {
    const searchText = isClientSearch
      ? `${opt.label} ${opt.cedula || ''}`.toLowerCase()
      : opt.label.toLowerCase();
    return searchText.includes(search.toLowerCase());
  });

  const selectedOpt = options.find(o => String(o.value) === String(value));

  const handleOpen = () => {
    setIsOpen(true);
    setSearch('');
  };

  const handleSelect = (optValue) => {
    onChange(optValue);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <fieldset className="input-group selectable-input-wrapper" ref={wrapperRef}>
      {label && <legend className="selectable-input-label">{label}</legend>}

      {isOpen ? (
        <div className="selectable-input-trigger open">
          <span className="selectable-input-icon">{icon}</span>
          <input
            ref={inputRef}
            type="text"
            className="selectable-input-search-inline"
            placeholder="Escribe para buscar..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            strokeWidth="3"
            className="selectable-input-arrow open"
            onClick={() => { setIsOpen(false); setSearch(''); }}
            style={{ cursor: 'pointer', flexShrink: 0 }}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleOpen}
          className="selectable-input-trigger"
          aria-expanded={false}
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
            className="selectable-input-arrow"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      )}

      {isOpen && (
        <ul className="selectable-input-options animate-scale-in" role="listbox">
          {filtered.length > 0 ? (
            filtered.map(opt => (
              <li key={opt.value} role="listitem">
                <button
                  type="button"
                  onClick={() => handleSelect(opt.value)}
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
      )}
    </fieldset>
  );
}
