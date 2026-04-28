import React, { useState, useEffect, useRef } from 'react';
import './SuggestionInput.css';

/**
 * Custom Suggestion Input
 * A premium, themed autocomplete component that replaces the native datalist.
 */
export default function SuggestionInput({ 
  value, 
  onChange, 
  suggestions = [], 
  placeholder = '', 
  className = '', 
  style = {},
  required = false,
  spellCheck = true,
  lang = 'es',
  id = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [filtered, setFiltered] = useState([]);
  const [cursor, setCursor] = useState(-1);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (value && isOpen) {
      const match = suggestions.filter(s => 
        s.toLowerCase().includes(value.toLowerCase()) && 
        s.toLowerCase() !== value.toLowerCase()
      );
      setFiltered(match.slice(0, 8)); // Limit to 8 suggestions
    } else if (isOpen && !value) {
      setFiltered(suggestions.slice(0, 5)); // Show some default suggestions if empty
    } else {
      setFiltered([]);
    }
  }, [value, suggestions, isOpen]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor(c => (c < filtered.length - 1 ? c + 1 : c));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor(c => (c > 0 ? c - 1 : 0));
    } else if (e.key === "Enter" && cursor !== -1) {
      e.preventDefault();
      selectSuggestion(filtered[cursor]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const selectSuggestion = (s) => {
    onChange({ target: { value: s } });
    setIsOpen(false);
    setCursor(-1);
  };

  return (
    <div className="suggestion-wrapper" ref={wrapperRef}>
      <input
        id={id}
        ref={inputRef}
        type="text"
        autoComplete="off"
        className={`input-field ${className}`}
        style={style}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={() => setIsOpen(true)}
        onMouseDown={() => setIsOpen(true)}
        onKeyDown={handleKeyDown}
        required={required}
        spellCheck={spellCheck}
        lang={lang}
      />

      {isOpen && filtered.length > 0 && (
        <ul className="suggestion-dropdown">
          {filtered.map((s, i) => (
            <li 
              key={i} 
              className={`suggestion-item ${cursor === i ? 'active' : ''}`}
              onClick={() => selectSuggestion(s)}
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
