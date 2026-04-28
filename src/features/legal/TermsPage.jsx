import React, { useState } from 'react';
import ThemeToggle from '../../components/ThemeToggle';
import './Legal.css';

const LAST_UPDATED = '22 de abril de 2026';

const sections = [
  {
    id: 'terminos',
    label: 'Términos y Condiciones',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
      </svg>
    ),
    content: [
      {
        title: '1. Aceptación de los Términos',
        body: 'Al acceder y utilizar la plataforma NovaAgendas, usted acepta quedar vinculado por estos Términos y Condiciones. Si no está de acuerdo con alguna parte de estos términos, no debe utilizar nuestros servicios.\n\nEstos términos aplican a todos los usuarios de la plataforma, incluyendo administradores de negocios, profesionales de la salud y recepcionistas.',
      },
      {
        title: '2. Descripción del Servicio',
        body: 'NovaAgendas es una plataforma SaaS (Software como Servicio) de agendamiento diseñada para clínicas estéticas, centros médicos y negocios de salud y bienestar en Colombia. La plataforma permite:\n\n• Gestión de citas y agenda\n• Administración de clientes y pacientes\n• Control de servicios e inventario\n• Procesamiento de pagos\n• Integración con Google Calendar\n• Generación de reportes y auditoría',
      },
      {
        title: '3. Registro y Cuentas',
        body: 'Para acceder a NovaAgendas, los negocios deben registrarse a través de nuestro portal de administración. Usted es responsable de:\n\n• Mantener la confidencialidad de sus credenciales de acceso\n• Todas las actividades que ocurran bajo su cuenta\n• Notificar inmediatamente cualquier uso no autorizado\n• Garantizar que la información proporcionada sea veraz y actualizada\n\nNos reservamos el derecho de suspender o cancelar cuentas que violen estos términos.',
      },
      {
        title: '4. Uso Aceptable',
        body: 'El usuario se compromete a utilizar la plataforma únicamente para fines legales y legítimos. Está expresamente prohibido:\n\n• Intentar acceder a datos de otros negocios o usuarios sin autorización\n• Usar la plataforma para actividades fraudulentas o ilegales\n• Interferir con la infraestructura técnica de NovaAgendas\n• Recopilar información de otros usuarios sin su consentimiento\n• Distribuir malware o código malicioso a través de la plataforma',
      },
      {
        title: '5. Propiedad Intelectual',
        body: 'Todos los derechos de propiedad intelectual sobre la plataforma NovaAgendas, incluyendo pero no limitado a software, diseño, logotipos y documentación, son propiedad exclusiva de NovaAgendas.\n\nSe otorga una licencia limitada, no exclusiva e intransferible para usar la plataforma de acuerdo con estos términos. Esta licencia no autoriza la sublicencia, venta, reventa o explotación comercial de la plataforma.',
      },
      {
        title: '6. Limitación de Responsabilidad',
        body: 'NovaAgendas no será responsable por daños indirectos, incidentales o consecuentes derivados del uso o imposibilidad de uso de la plataforma. En ningún caso nuestra responsabilidad total superará el monto pagado por el usuario en los últimos tres (3) meses.\n\nNo garantizamos la disponibilidad ininterrumpida del servicio, aunque nos esforzamos por mantener una disponibilidad del 99.5% mensual.',
      },
      {
        title: '7. Modificaciones',
        body: 'NovaAgendas se reserva el derecho de modificar estos Términos en cualquier momento. Los cambios entrarán en vigencia 30 días después de su publicación. El uso continuado de la plataforma después de dicho período constituye la aceptación de los nuevos términos.',
      },
      {
        title: '8. Ley Aplicable',
        body: 'Estos términos se rigen por las leyes de la República de Colombia. Cualquier disputa será resuelta ante los tribunales competentes de la ciudad de Bogotá D.C., Colombia.',
      },
    ],
  },
  {
    id: 'privacidad',
    label: 'Política de Privacidad',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
    content: [
      {
        title: '1. Responsable del Tratamiento',
        body: 'NovaAgendas actúa como responsable del tratamiento de los datos personales recopilados a través de la plataforma, en cumplimiento de la Ley 1581 de 2012 (Ley de Protección de Datos Personales de Colombia) y sus decretos reglamentarios.',
      },
      {
        title: '2. Datos que Recopilamos',
        body: 'Recopilamos la siguiente información:\n\n• Datos de identificación: nombre, cédula, correo electrónico, teléfono\n• Datos de acceso: credenciales de usuario (contraseñas almacenadas de forma segura)\n• Datos de uso: registros de actividad, citas agendadas, historial de servicios\n• Datos clínicos: notas e historial médico de pacientes (solo para negocios del sector salud)\n• Datos técnicos: dirección IP, tipo de navegador, datos de sesión',
      },
      {
        title: '3. Finalidad del Tratamiento',
        body: 'Los datos personales son tratados para:\n\n• Prestar y mejorar los servicios de la plataforma\n• Gestionar la relación contractual con los negocios registrados\n• Enviar notificaciones relacionadas con el uso del servicio\n• Integrar con servicios de terceros autorizados (Google Calendar)\n• Cumplir obligaciones legales y regulatorias\n• Prevenir el fraude y garantizar la seguridad de la plataforma',
      },
      {
        title: '4. Compartición de Datos',
        body: 'No vendemos ni arrendamos sus datos personales a terceros. Podemos compartir información con:\n\n• Proveedores de servicios tecnológicos (Supabase para base de datos, Google para Calendar)\n• Autoridades competentes cuando sea requerido por ley\n• Socios comerciales únicamente con su consentimiento explícito\n\nTodos los terceros están sujetos a acuerdos de confidencialidad y tratamiento de datos.',
      },
      {
        title: '5. Seguridad de los Datos',
        body: 'Implementamos medidas técnicas y organizativas apropiadas para proteger sus datos:\n\n• Cifrado SSL/TLS en todas las comunicaciones\n• Almacenamiento seguro con Supabase (proveedor certificado SOC 2 Type II)\n• Control de acceso basado en roles (RBAC)\n• Registros de auditoría de todas las operaciones\n• Revisiones periódicas de seguridad',
      },
      {
        title: '6. Derechos del Titular',
        body: 'Como titular de datos personales, usted tiene derecho a:\n\n• Conocer, actualizar y rectificar sus datos\n• Solicitar la eliminación de sus datos (derecho al olvido)\n• Oponerse al tratamiento de sus datos\n• Acceder gratuitamente a sus datos personales\n• Presentar quejas ante la Superintendencia de Industria y Comercio (SIC)\n\nPara ejercer estos derechos, contáctenos a través de los canales indicados al final de este documento.',
      },
      {
        title: '7. Retención de Datos',
        body: 'Los datos se conservan durante el tiempo que sea necesario para cumplir con las finalidades descritas o según lo exija la ley colombiana. Los datos clínicos de pacientes se conservan mínimo 5 años de acuerdo con la normativa de salud vigente.',
      },
      {
        title: '8. Cookies y Tecnologías Similares',
        body: 'Utilizamos localStorage del navegador para mantener sesiones de usuario y preferencias de la plataforma. No utilizamos cookies de seguimiento de terceros para publicidad.',
      },
    ],
  },
];

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState('terminos');
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
          <span className="legal-breadcrumb-current">Términos y Privacidad</span>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <ThemeToggle />
          <a href="/condiciones" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 800, textDecoration: 'none', letterSpacing: '0.02em' }}>
            Condiciones de Servicio →
          </a>
        </div>
      </header>

      {/* Hero Section */}
      <section className="legal-hero legal-hero--blue">
        <div className="legal-hero-badge">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          Actualizado el {LAST_UPDATED}
        </div>
        <h1>Transparencia y Confianza</h1>
        <p>
          En NovaAgendas nos comprometemos con la protección de tus datos y el uso transparente de nuestra plataforma SaaS para salud y bienestar.
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
            <p>¿Tienes dudas?</p>
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
                <p>NovaAgendas Legal Compliance</p>
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
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            <div className="legal-related-info">
              <p>También podría interesarte</p>
              <p>Consulta nuestras <a href="/condiciones" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 700 }}>Condiciones de Servicio</a> para conocer más detalles sobre el uso comercial.</p>
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

