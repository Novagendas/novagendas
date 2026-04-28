import React, { useState } from 'react';
import ThemeToggle from '../../components/ThemeToggle';
import './Legal.css';

const LAST_UPDATED = '22 de abril de 2026';

const sections = [
  {
    id: 'suscripcion',
    label: 'Suscripción y Pagos',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
      </svg>
    ),
    content: [
      {
        title: '1. Planes de Servicio',
        body: 'NovaAgendas ofrece diferentes planes de suscripción adaptados a las necesidades de cada negocio. Cada plan incluye:\n\n• Acceso completo a la plataforma de agendamiento\n• Número de usuarios según el plan seleccionado\n• Soporte técnico por los canales definidos en el plan\n• Actualizaciones automáticas de la plataforma\n• Almacenamiento en la nube para datos e historial',
      },
      {
        title: '2. Facturación y Cobros',
        body: 'Los cobros se realizan de manera mensual o anual según el plan elegido, en pesos colombianos (COP). La facturación se genera automáticamente al inicio de cada período.\n\nEl negocio es responsable de mantener actualizado un método de pago válido. El incumplimiento de pago puede resultar en la suspensión temporal del servicio.',
      },
      {
        title: '3. Período de Prueba',
        body: 'Los nuevos negocios pueden acceder a un período de prueba gratuito de 14 días con acceso completo a todas las funcionalidades. No se requiere tarjeta de crédito durante este período.\n\nAl finalizar la prueba, el negocio debe seleccionar un plan para continuar usando la plataforma.',
      },
      {
        title: '4. Cancelación y Reembolsos',
        body: 'Puede cancelar su suscripción en cualquier momento desde el portal de administración. La cancelación tendrá efecto al final del período de facturación en curso.\n\nNo ofrecemos reembolsos prorrateados por períodos parciales. Los datos del negocio se conservan por 30 días después de la cancelación para facilitar la reactivación.',
      },
      {
        title: '5. Cambios de Plan',
        body: 'Los cambios de plan (actualización o reducción) se aplican al inicio del siguiente período de facturación. Las actualizaciones de plan pueden aplicarse inmediatamente con ajuste proporcional al costo.',
      },
    ],
  },
  {
    id: 'uso',
    label: 'Condiciones de Uso',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    ),
    content: [
      {
        title: '1. Responsabilidades del Negocio',
        body: 'El negocio registrado en NovaAgendas es responsable de:\n\n• Garantizar que el uso de la plataforma cumpla con la legislación colombiana vigente\n• Obtener los consentimientos necesarios de sus pacientes/clientes para el tratamiento de datos\n• Capacitar a sus usuarios en el uso apropiado de la plataforma\n• Mantener actualizados los datos de los pacientes conforme a la normativa de salud\n• Notificar a NovaAgendas de cualquier incidente de seguridad',
      },
      {
        title: '2. Gestión de Datos Clínicos',
        body: 'Para negocios del sector salud, la gestión del historial clínico debe realizarse en cumplimiento de:\n\n• Resolución 1995 de 1999 del Ministerio de Salud (Historias Clínicas)\n• Ley 1581 de 2012 (Protección de Datos Personales)\n• Ley 23 de 1981 (Ética Médica)\n\nNovaAgendas provee las herramientas tecnológicas; el cumplimiento normativo es responsabilidad del negocio.',
      },
      {
        title: '3. Nivel de Servicio (SLA)',
        body: 'NovaAgendas se compromete a mantener:\n\n• Disponibilidad de la plataforma: 99.5% mensual (excluye mantenimientos programados)\n• Tiempo de respuesta de soporte: máximo 24 horas hábiles\n• Mantenimientos programados: comunicados con 48 horas de anticipación\n• Respaldo de datos: cada 24 horas\n\nEn caso de incumplimiento del SLA, el negocio podrá solicitar créditos según la política vigente.',
      },
      {
        title: '4. Integraciones de Terceros',
        body: 'NovaAgendas integra servicios de terceros (Google Calendar, Supabase) para brindar funcionalidades adicionales. El uso de estas integraciones está sujeto a los términos de servicio de cada proveedor.\n\nNovaAgendas no se hace responsable por interrupciones o cambios en los servicios de terceros.',
      },
      {
        title: '5. Actualizaciones del Servicio',
        body: 'NovaAgendas puede actualizar, modificar o descontinuar funcionalidades de la plataforma en cualquier momento. Las actualizaciones significativas serán comunicadas con al menos 7 días de anticipación a través del correo registrado.',
      },
    ],
  },
  {
    id: 'soporte',
    label: 'Soporte y Garantías',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    ),
    content: [
      {
        title: '1. Canales de Soporte',
        body: 'NovaAgendas ofrece soporte técnico a través de:\n\n• Correo electrónico: novagendamiento@gmail.com\n• Documentación en línea (próximamente)\n• Soporte vía chat (plan premium)\n\nEl soporte está disponible en días hábiles de lunes a viernes, de 8:00 a.m. a 6:00 p.m. (hora Colombia).',
      },
      {
        title: '2. Alcance del Soporte',
        body: 'El soporte incluye:\n\n• Resolución de problemas técnicos de la plataforma\n• Orientación sobre el uso de funcionalidades\n• Configuración inicial del negocio\n• Capacitación básica para administradores\n\nNo incluye desarrollo de funcionalidades personalizadas ni soporte para hardware del cliente.',
      },
      {
        title: '3. Garantía de Satisfacción',
        body: 'Si en los primeros 30 días de suscripción paga la plataforma no cumple con las funcionalidades descritas, puede solicitar la cancelación sin costo adicional.\n\nEsta garantía no aplica al período de prueba gratuito.',
      },
      {
        title: '4. Exclusiones de Garantía',
        body: 'NovaAgendas no garantiza:\n\n• Que la plataforma sea libre de errores en todo momento\n• Que los resultados obtenidos sean exactos o confiables para toma de decisiones médicas\n• Compatibilidad con todos los navegadores y dispositivos (soportamos las últimas 2 versiones de Chrome, Firefox, Safari y Edge)\n\nLa plataforma se provee "tal como está" en lo que respecta a las limitaciones técnicas inherentes a cualquier software.',
      },
    ],
  },
];

export default function ConditionsPage() {
  const [activeSection, setActiveSection] = useState('suscripcion');
  const current = sections.find(s => s.id === activeSection);

  return (
    <div className="legal-page">
      {/* Header */}
      <header className="legal-header">
        <div className="legal-logo-box">
          <a href="/" className="legal-logo-link">
            <div className="legal-logo-img-wrapper">
              <img src="/logoclaro.jpeg" alt="NovaAgendas Logo" />
            </div>
            <span className="legal-logo-text">NovaAgendas</span>
          </a>
          <span className="legal-breadcrumb-sep">/</span>
          <span className="legal-breadcrumb-current">Condiciones de Servicio</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <ThemeToggle />
          <a href="/terminos" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 800, textDecoration: 'none', letterSpacing: '0.02em' }}>
            ← Términos y Privacidad
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="legal-hero legal-hero--green">
        <div className="legal-hero-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
          </svg>
          Actualizado el {LAST_UPDATED}
        </div>
        <h1>Condiciones de Servicio</h1>
        <p>
          Conoce las condiciones bajo las cuales ofrecemos nuestra plataforma de agendamiento para negocios de salud y bienestar en Colombia.
        </p>
      </section>

      {/* Main Content */}
      <main className="legal-container">
        {/* Navigation Sidebar */}
        <aside className="legal-sidebar">
          <div className="card legal-nav-card">
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`legal-nav-btn ${activeSection === s.id ? 'legal-nav-btn--active' : ''}`}
              >
                {s.icon}
                {s.label}
              </button>
            ))}
          </div>

          <div className="legal-sidebar-contact">
            <p>¿Necesitas ayuda?</p>
            <p>Escríbenos a:</p>
            <p>novagendamiento@gmail.com</p>
          </div>
        </aside>

        {/* Content Area */}
        <article className="animate-fade-in" key={activeSection}>
          <div className="card legal-content-card">
            <div className="legal-section-header">
              <div className="legal-section-icon">
                {current?.icon}
              </div>
              <div className="legal-section-info">
                <h2>{current?.label}</h2>
                <p>NovaAgendas Service Policy</p>
              </div>
            </div>

            <div className="legal-body">
              {current?.content.map((section, i) => (
                <div key={i} className="legal-body-section">
                  <h3>{section.title}</h3>
                  <p>{section.body}</p>
                  {i < current.content.length - 1 && <div className="legal-divider" />}
                </div>
              ))}
            </div>
          </div>

          {/* Related Info Card */}
          <div className="legal-related-card">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            <div className="legal-related-info">
              <p>También podría interesarte</p>
              <p>Lee nuestros <a href="/terminos" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 700 }}>Términos y Condiciones</a> y <a href="/terminos#privacidad" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 700 }}>Política de Privacidad</a>.</p>
            </div>
          </div>
        </article>
      </main>

      {/* Footer */}
      <footer className="legal-footer">
        <p>© {new Date().getFullYear()} NovaAgendas Colombia · Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}

