import { useState, useEffect, useRef } from 'react';
import { Icon } from './ui';

// ============================================================
// Channels (marquee) + Pricing + FAQ
// ============================================================

const CHANNELS = [
  { icon: 'message-circle', label: 'WhatsApp', tint: 'var(--emerald-soft)', color: 'var(--emerald)' },
  { icon: 'phone', label: 'Llamada telefónica', tint: 'var(--blue-soft)', color: 'var(--blue-600)' },
  { icon: 'camera', label: 'Instagram', tint: 'var(--violet-soft)', color: 'var(--violet)' },
  { icon: 'users', label: 'Cliente presencial', tint: 'var(--amber-soft)', color: 'var(--amber)' },
  { icon: 'mail', label: 'Correo y mensajes', tint: 'var(--blue-soft)', color: 'var(--blue-600)' },
  { icon: 'share-2', label: 'Redes sociales', tint: 'var(--slate-soft)', color: 'var(--slate-600)' },
];

export function Channels() {
  const loop = [...CHANNELS, ...CHANNELS];
  return (
    <section className="section" style={{ paddingTop: 0 }}>
      <div className="lp-wrap">
        <div className="section-head">
          <span className="eyebrow reveal"><span className="eyebrow-dot" />Un solo lugar</span>
          <h2 className="reveal reveal-d1">Recibe citas por donde te escriban</h2>
          <p className="reveal reveal-d2">Tus clientes te contactan por mil canales. Tú las registras una vez y Novagendas las organiza en una agenda en tiempo real.</p>
        </div>
      </div>
      <div className="marquee reveal reveal-d2">
        <div className="marquee-track">
          {loop.map((c, i) => (
            <span className="mq-chip" key={i}>
              <span className="mq-ico" style={{ background: c.tint, color: c.color }}>
                <Icon name={c.icon} size={19} color={c.color} />
              </span>
              {c.label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// Pricing
// ============================================================
const PLANS = [
  {
    name: 'Inicial', mensual: 39000, anual: 32000,
    desc: 'Para empezar a ordenar tu agenda sin complicaciones.',
    feats: [
      ['Agenda en tiempo real', true],
      ['Hasta 2 especialistas', true],
      ['Registro de citas ilimitado', true],
      ['Gestión de pacientes', true],
      ['Registro de pagos', false],
      ['Estadísticas e inventario', false],
    ],
  },
  {
    name: 'Profesional', mensual: 89000, anual: 74000, popular: true,
    desc: 'Para negocios en crecimiento que quieren control total.',
    feats: [
      ['Todo lo de Inicial', true],
      ['Hasta 8 especialistas', true],
      ['Registro de pagos y cierre diario', true],
      ['Estadísticas internas', true],
      ['Días bloqueados e inasistencias', true],
      ['Inventario avanzado', false],
    ],
  },
  {
    name: 'Negocio', mensual: 159000, anual: 132000,
    desc: 'Control total para operaciones grandes y multi-equipo.',
    feats: [
      ['Todo lo de Profesional', true],
      ['Especialistas ilimitados', true],
      ['Inventario y servicios', true],
      ['Estadísticas avanzadas', true],
      ['Gestión de usuarios y roles', true],
      ['Soporte prioritario', true],
    ],
  },
];

function fmtCOP(n) { return n.toLocaleString('es-CO'); }

export function Pricing({ onLaunchDemo }) {
  const [anual, setAnual] = useState(true);
  return (
    <section className="section section-surface" id="precios">
      <div className="lp-wrap">
        <div className="section-head">
          <span className="eyebrow reveal"><span className="eyebrow-dot" />Planes</span>
          <h2 className="reveal reveal-d1">Un plan para cada etapa de tu negocio</h2>
          <p className="reveal reveal-d2">Sin permanencia ni riesgo técnico. Empieza hoy y cambia de plan cuando crezcas.</p>
          <div className="bill-toggle reveal reveal-d2" role="group" aria-label="Facturación">
            <button className={'bill-opt' + (!anual ? ' on' : '')} onClick={() => setAnual(false)} aria-pressed={!anual}>Mensual</button>
            <button className={'bill-opt' + (anual ? ' on' : '')} onClick={() => setAnual(true)} aria-pressed={anual}>
              Anual<span className="bill-save"><Icon name="sparkles" size={13} />−17%</span>
            </button>
          </div>
        </div>
        <div className="price-grid">
          {PLANS.map((p, i) => (
            <article className={'price-card reveal reveal-d' + (i + 1) + (p.popular ? ' popular' : '')} key={p.name}>
              {p.popular && <span className="pc-badge">Más popular</span>}
              <div className="pc-name">{p.name}</div>
              <div className="pc-price">
                <span className="cur">$</span>
                <span className="amt" key={anual ? 'a' : 'm'}>{fmtCOP(anual ? p.anual : p.mensual)}</span>
                <span className="per">/mes</span>
              </div>
              <div className="pc-note">{anual ? 'Facturado anualmente' : 'Facturado mes a mes'}</div>
              <p className="pc-desc">{p.desc}</p>
              <div className="pc-list">
                {p.feats.map(([t, on]) => (
                  <div className={'pc-li' + (on ? '' : ' off')} key={t}>
                    <span className="ck"><Icon name={on ? 'check' : 'minus'} size={13} /></span>{t}
                  </div>
                ))}
              </div>
              <a className={'btn btn-lg ' + (p.popular ? 'btn-primary' : 'btn-outline')} href="#" onClick={(e) => { e.preventDefault(); onLaunchDemo && onLaunchDemo(); }} style={{ width: '100%' }}>
                Agenda Demo
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// FAQ
// ============================================================
const FAQS = [
  ['¿Mis clientes agendan ellos mismos?',
   'No. Novagendas is una plataforma interna: tú y tu equipo registran las citas que llegan por WhatsApp, llamada, redes o de forma presencial. Así mantienes el control total de tu agenda, sin reservas sorpresa.'],
  ['¿Funciona si tengo varios especialistas?',
   'Sí. Asignas cada cita al especialista disponible y el sistema bloquea su horario automáticamente para que nunca haya un choque de turnos o una doble reserva.'],
  ['¿Necesito conocimientos técnicos para usarlo?',
   'Para nada. La curva de aprendizaje es mínima: configuras tus servicios, especialistas y horarios en minutos y empiezas a registrar citas el mismo día. Sin riesgo técnico.'],
  ['¿Puedo ver cuánto factura mi negocio?',
   'Sí. El registro de pagos calcula tu cierre diario de forma automática y guarda el histórico de ingresos, para que tus números siempre estén claros y a la mano.'],
  ['¿En qué dispositivos funciona?',
   'En cualquier navegador web: computador, tablet o celular. Tu agenda se mantiene sincronizada en tiempo real para todo el equipo, estés donde estés.'],
  ['¿Mi información está segura?',
   'Tu información operativa está centralizada y protegida. Solo el administrador y el personal autorizado pueden acceder y modificar la agenda.'],
];

export function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section className="section" id="faq">
      <div className="lp-wrap">
        <div className="section-head">
          <span className="eyebrow reveal"><span className="eyebrow-dot" />Dudas frecuentes</span>
          <h2 className="reveal reveal-d1">Todo lo que necesitas saber</h2>
          <p className="reveal reveal-d2">Y si te queda alguna duda, escríbenos — respondemos rápido.</p>
        </div>
        <div className="faq-list">
          {FAQS.map(([q, a], i) => (
            <FaqItem key={q} q={q} a={a} open={open === i} onToggle={() => setOpen(open === i ? -1 : i)} reveal={'reveal reveal-d' + Math.min(i + 1, 4)} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function FaqItem({ q, a, open, onToggle, reveal }) {
  const ref = useRef(null);
  const [h, setH] = useState(0);
  useEffect(() => { if (ref.current) setH(ref.current.scrollHeight); }, [a]);
  return (
    <div className={'faq-item ' + reveal + (open ? ' open' : '')}>
      <button className="faq-q" onClick={onToggle} aria-expanded={open}>
        {q}<span className="qi"><Icon name="plus" size={20} /></span>
      </button>
      <div className="faq-a" style={{ maxHeight: open ? h : 0 }}>
        <div className="faq-a-inner" ref={ref}>{a}</div>
      </div>
    </div>
  );
}
