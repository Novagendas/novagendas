import React, { useState } from 'react';
import ThemeToggle from '../../components/ThemeToggle';

const LAST_UPDATED = '22 de abril de 2026';

const sections = [
  {
    id: 'terminos',
    label: 'Términos y Condiciones',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-main)' }}>

      {/* Header */}
      <div style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)', padding: '0.85rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10, backdropFilter: 'blur(10px)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, overflow: 'hidden' }}>
              <img src="/logoclaro.jpeg" alt="NovaAgendas" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text)' }}>NovaAgendas</span>
          </a>
          <span style={{ color: 'var(--border)', fontSize: '1.2rem' }}>/</span>
          <span style={{ color: 'var(--text-4)', fontSize: '0.85rem', fontWeight: 600 }}>Términos y Privacidad</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <ThemeToggle style={{ position: 'relative' }} />
          <a href="/condiciones" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
            Condiciones de Servicio →
          </a>
        </div>
      </div>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, var(--primary) 0%, #1e40af 100%)', padding: '4rem 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 99, padding: '0.4rem 1rem', fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Actualizado el {LAST_UPDATED}
          </div>
          <h1 style={{ margin: '0 0 1rem', fontSize: '2.4rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.15 }}>
            Transparencia y Confianza
          </h1>
          <p style={{ margin: 0, fontSize: '1.05rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.7 }}>
            En NovaAgendas nos comprometemos con la protección de tus datos y el uso transparente de nuestra plataforma.
          </p>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '3rem 2rem', display: 'flex', gap: '2.5rem', alignItems: 'flex-start' }}>

        {/* Sidebar nav */}
        <div style={{ width: 240, flexShrink: 0, position: 'sticky', top: '5rem' }}>
          <div className="card" style={{ padding: '0.5rem', borderRadius: 16 }}>
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', textAlign: 'left',
                  padding: '0.75rem 1rem', borderRadius: 12, border: 'none', cursor: 'pointer',
                  fontFamily: 'var(--font-main)', fontSize: '0.87rem', fontWeight: 700,
                  background: activeSection === s.id ? 'var(--primary-light)' : 'transparent',
                  color: activeSection === s.id ? 'var(--primary)' : 'var(--text-3)',
                  transition: 'all 0.15s',
                  marginBottom: '0.25rem',
                }}>
                <span style={{ color: activeSection === s.id ? 'var(--primary)' : 'var(--text-4)' }}>{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>
          <p style={{ margin: '1.5rem 0 0', fontSize: '0.78rem', color: 'var(--text-4)', lineHeight: 1.6, padding: '0 0.5rem' }}>
            ¿Preguntas sobre estos términos?<br />
            Contáctanos en <span style={{ color: 'var(--primary)', fontWeight: 600 }}>novagendamiento@gmail.com</span>
          </p>
        </div>

        {/* Main content */}
        <div className="animate-fade-in" style={{ flex: 1, minWidth: 0 }} key={activeSection}>
          <div className="card" style={{ padding: '2.5rem', borderRadius: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', flexShrink: 0 }}>
                {current?.icon}
              </div>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'var(--text)' }}>{current?.label}</h2>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-4)', fontWeight: 500 }}>Última actualización: {LAST_UPDATED}</p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {current?.content.map((section, i) => (
                <div key={i}>
                  <h3 style={{ margin: '0 0 0.75rem', fontSize: '1rem', fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.01em' }}>
                    {section.title}
                  </h3>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-3)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                    {section.body}
                  </div>
                  {i < current.content.length - 1 && (
                    <div style={{ marginTop: '2rem', height: 1, background: 'var(--border)' }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '1.5rem 2rem', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-4)' }}>
          © {new Date().getFullYear()} NovaAgendas · <a href="/condiciones" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Condiciones de Servicio</a>
        </p>
      </div>
    </div>
  );
}
