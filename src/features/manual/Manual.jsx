import { useState, useEffect } from 'react';
import './Manual.css';
import { MANUAL_SECTIONS, filterSectionsByRole, searchSections } from './manualContent';

export default function Manual({ user }) {
  const [activeId, setActiveId] = useState(null);
  const [search, setSearch] = useState('');

  const visible = filterSectionsByRole(MANUAL_SECTIONS, user.role);
  const filtered = searchSections(visible, search);

  useEffect(() => {
    if (!activeId && filtered.length > 0) setActiveId(filtered[0].id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const activeSection = filtered.find(s => s.id === activeId) ?? filtered[0] ?? null;

  return (
    <div className="manual-container">
      <div className="manual-header">
        <h1 className="manual-title">Manual de Usuario</h1>
        <div className="manual-search-wrapper">
          <span className="manual-search-icon">🔍</span>
          <input
            type="text"
            className="manual-search"
            placeholder="Buscar en el manual..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setActiveId(null);
            }}
          />
          {search && (
            <button className="manual-search-clear" onClick={() => setSearch('')}>✕</button>
          )}
        </div>
      </div>

      <div className="manual-body">
        <nav className="manual-sidebar">
          {filtered.length === 0 ? (
            <p className="manual-no-results">Sin resultados para «{search}»</p>
          ) : (
            <ul className="manual-nav-list">
              {filtered.map(section => (
                <li key={section.id}>
                  <button
                    className={`manual-nav-btn${activeSection?.id === section.id ? ' active' : ''}`}
                    onClick={() => setActiveId(section.id)}
                  >
                    <span className="manual-nav-icon">{section.icon}</span>
                    {section.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </nav>

        <main className="manual-content">
          {activeSection && (
            <>
              <h2 className="manual-section-title">
                {activeSection.icon} {activeSection.label}
              </h2>
              <div className="manual-section-divider" />
              <div className="manual-section-body">
                {activeSection.content}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
