import React, { useState } from 'react';
import ThemeToggle from '../../components/ThemeToggle';

const LAST_UPDATED = '22 de abril de 2026';

const sections = [
  {
    id: 'suscripcion',
    label: 'Suscripción y Pagos',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
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
          <span style={{ color: 'var(--text-4)', fontSize: '0.85rem', fontWeight: 600 }}>Condiciones de Servicio</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <ThemeToggle style={{ position: 'relative' }} />
          <a href="/terminos" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}>
            ← Términos y Privacidad
          </a>
        </div>
      </div>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', padding: '4rem 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 99, padding: '0.4rem 1rem', fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.9)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '1.5rem' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
            Actualizado el {LAST_UPDATED}
          </div>
          <h1 style={{ margin: '0 0 1rem', fontSize: '2.4rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.15 }}>
            Condiciones de Servicio
          </h1>
          <p style={{ margin: 0, fontSize: '1.05rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.7 }}>
            Conoce las condiciones bajo las cuales ofrecemos nuestra plataforma de agendamiento para negocios de salud y bienestar.
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
                  background: activeSection === s.id ? 'rgba(5,150,105,0.08)' : 'transparent',
                  color: activeSection === s.id ? '#059669' : 'var(--text-3)',
                  transition: 'all 0.15s',
                  marginBottom: '0.25rem',
                }}>
                <span style={{ color: activeSection === s.id ? '#059669' : 'var(--text-4)' }}>{s.icon}</span>
                {s.label}
              </button>
            ))}
          </div>
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(5,150,105,0.06)', borderRadius: 14, border: '1px solid rgba(5,150,105,0.15)' }}>
            <p style={{ margin: '0 0 0.5rem', fontSize: '0.8rem', fontWeight: 700, color: '#059669' }}>¿Necesitas ayuda?</p>
            <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-4)', lineHeight: 1.6 }}>
              novagendamiento@gmail.com
            </p>
          </div>
        </div>

        {/* Main content */}
        <div className="animate-fade-in" style={{ flex: 1, minWidth: 0 }} key={activeSection}>
          <div className="card" style={{ padding: '2.5rem', borderRadius: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(5,150,105,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', flexShrink: 0 }}>
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

          {/* Related links */}
          <div style={{ marginTop: '1.5rem', padding: '1.25rem 1.75rem', background: 'var(--surface)', borderRadius: 16, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-4)" strokeWidth="2.2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <div>
              <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-2)' }}>También te puede interesar</p>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-4)' }}>
                Lee nuestros <a href="/terminos" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Términos y Condiciones</a> y <a href="/terminos#privacidad" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Política de Privacidad</a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '1.5rem 2rem', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-4)' }}>
          © {new Date().getFullYear()} NovaAgendas · <a href="/terminos" style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>Términos y Privacidad</a>
        </p>
      </div>
    </div>
  );
}
