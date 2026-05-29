import React from 'react';
import ThemeToggle from '../../components/ThemeToggle';
import './Legal.css';

const LAST_UPDATED = '28 de mayo de 2026';

const steps = [
  {
    number: '1',
    title: 'Envía una solicitud por correo electrónico',
    body: 'Escríbenos a novagendamiento@gmail.com con el asunto "Solicitud de eliminación de datos". Incluye el correo electrónico asociado a tu cuenta y una descripción breve de los datos que deseas eliminar.',
  },
  {
    number: '2',
    title: 'Verificamos tu identidad',
    body: 'En un plazo máximo de 5 días hábiles, nuestro equipo verificará tu identidad para proteger la seguridad de la solicitud. Podemos solicitarte información adicional si fuera necesario.',
  },
  {
    number: '3',
    title: 'Eliminamos tus datos',
    body: 'Una vez verificada la solicitud, procederemos a eliminar permanentemente tu información personal de nuestros sistemas en un plazo máximo de 30 días. Recibirás un correo de confirmación cuando el proceso haya concluido.',
  },
];

const dataTypes = [
  { label: 'Nombre y apellido', icon: '👤' },
  { label: 'Correo electrónico', icon: '✉️' },
  { label: 'Número de teléfono', icon: '📞' },
  { label: 'Historial de citas agendadas', icon: '📅' },
  { label: 'Datos de inicio de sesión con Facebook', icon: '🔑' },
  { label: 'Registros de actividad en la plataforma', icon: '📋' },
];

export default function DataDeletionPage() {
  return (
    <div className="legal-page">
      <header className="legal-header">
        <div className="legal-logo-box">
          <a href="/" className="legal-logo-link">
            <div className="legal-logo-img-wrapper">
              <img src="/logoclaro.jpeg" alt="Novagendas Logo" />
            </div>
            <span className="legal-logo-text">Novagendas</span>
          </a>
          <span className="legal-breadcrumb-sep">/</span>
          <span className="legal-breadcrumb-current">Eliminación de Datos</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <ThemeToggle />
          <a href="/terminos" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 800, textDecoration: 'none', letterSpacing: '0.02em' }}>
            Política de Privacidad →
          </a>
        </div>
      </header>

      <section className="legal-hero legal-hero--blue">
        <div className="legal-hero-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6" /><path d="M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
          Actualizado el {LAST_UPDATED}
        </div>
        <h1>Eliminación de Datos Personales</h1>
        <p>
          En Novagendas respetamos tu derecho a controlar tus datos personales. Aquí encontrarás cómo solicitar la eliminación completa de tu información de nuestra plataforma.
        </p>
      </section>

      <main className="legal-container">
        <aside className="legal-sidebar">
          <div className="card legal-nav-card">
            <div className="legal-nav-btn legal-nav-btn--active" style={{ cursor: 'default' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6" /><path d="M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
              Eliminación de Datos
            </div>
          </div>

          <div className="legal-sidebar-contact">
            <p>¿Necesitas ayuda?</p>
            <p>Contáctanos directamente:</p>
            <p>novagendamiento@gmail.com</p>
          </div>
        </aside>

        <article className="animate-fade-in">
          <div className="card legal-content-card">
            <div className="legal-section-header">
              <div className="legal-section-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  <path d="M10 11v6" /><path d="M14 11v6" />
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
              </div>
              <div className="legal-section-info">
                <h2>Instrucciones para Eliminar tus Datos</h2>
                <p>Novagendas · Derecho al Olvido — Ley 1581 de 2012</p>
              </div>
            </div>

            <div className="legal-body">
              <div className="legal-body-section">
                <h3>¿Qué datos puedes eliminar?</h3>
                <p>Tienes derecho a solicitar la eliminación de cualquier dato personal que hayamos recopilado, incluyendo:</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '1rem 0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {dataTypes.map((item, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0.75rem', background: 'var(--bg-secondary, #f8f9fa)', borderRadius: '8px', fontSize: '0.92rem' }}>
                      <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                      {item.label}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="legal-divider" />

              <div className="legal-body-section">
                <h3>Cómo solicitar la eliminación</h3>
                <p>Sigue estos pasos para iniciar el proceso:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                  {steps.map((step) => (
                    <div key={step.number} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                      <div style={{
                        minWidth: '2rem', height: '2rem', borderRadius: '50%',
                        background: 'var(--primary, #6366f1)', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontWeight: 800, fontSize: '0.9rem', flexShrink: 0
                      }}>
                        {step.number}
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, marginBottom: '0.25rem' }}>{step.title}</p>
                        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.92rem', lineHeight: 1.6 }}>{step.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="legal-divider" />

              <div className="legal-body-section">
                <h3>Inicio de sesión con Facebook</h3>
                <p>
                  Si usaste Facebook para iniciar sesión en Novagendas, también puedes revocar el acceso directamente desde tu cuenta de Facebook siguiendo estos pasos:
                </p>
                <ol style={{ paddingLeft: '1.25rem', lineHeight: 2, fontSize: '0.92rem', color: 'var(--text-secondary)' }}>
                  <li>Ve a <strong>Configuración y privacidad</strong> en tu cuenta de Facebook.</li>
                  <li>Selecciona <strong>Configuración → Aplicaciones y sitios web</strong>.</li>
                  <li>Busca <strong>Novagendas</strong> en la lista y haz clic en <strong>Eliminar</strong>.</li>
                  <li>Adicionalmente, envíanos un correo a novagendamiento@gmail.com para eliminar los datos almacenados en nuestra plataforma.</li>
                </ol>
              </div>

              <div className="legal-divider" />

              <div className="legal-body-section">
                <h3>Tiempo de respuesta y retención legal</h3>
                <p>
                  Procesamos las solicitudes de eliminación en un plazo máximo de <strong>30 días calendario</strong>. Algunos datos pueden retenerse por un período adicional si existe una obligación legal o regulatoria que lo exija (por ejemplo, registros contables o historial clínico conforme a la normativa colombiana de salud).
                </p>
                <p style={{ marginTop: '0.75rem' }}>
                  Una vez completada la eliminación, los datos no podrán recuperarse. Si en el futuro deseas usar nuevamente nuestra plataforma, deberás registrarte de nuevo.
                </p>
              </div>
            </div>
          </div>

          <div className="legal-related-card">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <div className="legal-related-info">
              <p>También podría interesarte</p>
              <p>
                Lee nuestra <a href="/terminos" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 700 }}>Política de Privacidad</a> para conocer todos los detalles sobre cómo tratamos tus datos personales.
              </p>
            </div>
          </div>
        </article>
      </main>

      <footer className="legal-footer">
        <p>© {new Date().getFullYear()} Novagendas Colombia · Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
