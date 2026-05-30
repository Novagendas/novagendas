import React from 'react';
import { Icon } from './ui';

// ============================================================
// Product showcase (alternating sections)
// ============================================================

export function Showcase() {
  return (
    <section className="section section-surface" id="producto">
      <div className="lp-wrap">
        <div className="section-head">
          <span className="eyebrow reveal"><span className="eyebrow-dot" />El producto por dentro</span>
          <h2 className="reveal reveal-d1">Una vista para todo el equipo</h2>
          <p className="reveal reveal-d2">Diseñado para que el administrador y el personal autorizado trabajen sobre la misma información, siempre actualizada.</p>
        </div>

        {/* 1 — Agenda */}
        <div className="showcase" style={{ marginTop: 64 }}>
          <div className="sc-text">
            <span className="eyebrow reveal"><span className="eyebrow-dot" />Agenda de Citas</span>
            <h3 className="reveal reveal-d1">Toda la semana, sin huecos ni choques</h3>
            <p className="reveal reveal-d2">
              Registra citas por servicio, asigna al especialista disponible y deja que el sistema bloquee
              los espacios ocupados. La agenda de equipo se ve en tiempo real, así nadie pisa el turno de nadie.
            </p>
            <div className="sc-list">
              <div className="sc-li reveal reveal-d2"><span className="ck"><Icon name="check" size={15} /></span>
                <span><b>Bloqueo automático de horarios</b><span>Los espacios ocupados se cierran solos — adiós a la doble reserva.</span></span></div>
              <div className="sc-li reveal reveal-d3"><span className="ck ck-blue"><Icon name="check" size={15} /></span>
                <span><b>Filtro por especialista</b><span>Mira la jornada completa o el día de una sola persona.</span></span></div>
              <div className="sc-li reveal reveal-d4"><span className="ck ck-violet"><Icon name="check" size={15} /></span>
                <span><b>Vista día, semana y mes</b><span>Cambia de enfoque con un clic, sin perder el contexto.</span></span></div>
            </div>
          </div>
          <div className="sc-visual reveal reveal-d2">
            <AgendaPanel />
          </div>
        </div>

        {/* 2 — Pagos (flipped) */}
        <div className="showcase flip">
          <div className="sc-text">
            <span className="eyebrow reveal"><span className="eyebrow-dot" />Registro de Pagos</span>
            <h3 className="reveal reveal-d1">El cierre diario, claro y sin hojas de cálculo</h3>
            <p className="reveal reveal-d2">
              Cada servicio cobrado queda registrado con su especialista y estado. Consulta los ingresos
              del día y el histórico cuando quieras — tus números siempre cuadran.
            </p>
            <div className="sc-list">
              <div className="sc-li reveal reveal-d2"><span className="ck"><Icon name="check" size={15} /></span>
                <span><b>Cierre diario al instante</b><span>El total del día se calcula solo a medida que registras.</span></span></div>
              <div className="sc-li reveal reveal-d3"><span className="ck ck-blue"><Icon name="check" size={15} /></span>
                <span><b>Estados de pago</b><span>Confirmado, pendiente o por cobrar — todo identificado.</span></span></div>
              <div className="sc-li reveal reveal-d4"><span className="ck ck-violet"><Icon name="check" size={15} /></span>
                <span><b>Historial centralizado</b><span>Consulta cualquier movimiento sin salir de la plataforma.</span></span></div>
            </div>
          </div>
          <div className="sc-visual reveal reveal-d2">
            <PaymentsPanel />
          </div>
        </div>
      </div>
    </section>
  );
}

// --- Weekly agenda visual ---
export function AgendaPanel() {
  const days = ['LUN', 'MAR', 'MIÉ', 'JUE', 'VIE'];
  const nums = ['1', '2', '3', '4', '5'];
  const times = ['9 AM', '10 AM', '11 AM', '12 PM'];
  // events: {col(0-4), row(0-3), span, title, time, grad}
  const events = [
    { col: 0, row: 0, span: 1, t: 'María V.', e: 'Facial', g: 'var(--event-grad-blue)' },
    { col: 1, row: 1, span: 1, t: 'Juliana C.', e: 'Manicure', g: 'linear-gradient(135deg,#8b5cf6,#5c94f7)' },
    { col: 2, row: 0, span: 2, t: 'Andrés R.', e: 'Masaje', g: 'linear-gradient(135deg,#10b981,#38bdf8)' },
    { col: 3, row: 2, span: 1, t: 'Sofía M.', e: 'Cejas', g: 'var(--event-grad)' },
    { col: 4, row: 1, span: 2, t: 'Carlos D.', e: 'Corte', g: 'linear-gradient(135deg,#5c94f7,#3b82f6)' },
    { col: 1, row: 3, span: 1, t: 'Laura P.', e: 'Pestañas', g: 'linear-gradient(135deg,#f59e0b,#5c94f7)' },
  ];
  return (
    <div className="panel float product-light" style={{ animationDuration: '7.5s' }}>
      <div className="cal">
        <div className="cal-h">
          <span className="mo">1 De Jun — 7 De Jun</span>
          <span className="cal-nav">
            <span><Icon name="chevron-left" size={16} /></span>
            <span style={{ background: 'var(--blue-50)', borderColor: 'var(--blue-200)', color: 'var(--blue-600)', fontSize: 11, fontWeight: 700, width: 'auto', padding: '0 10px' }}>Hoy</span>
            <span><Icon name="chevron-right" size={16} /></span>
          </span>
        </div>
        <div className="cal-grid">
          <div />
          {days.map((d, i) => (
            <div key={d} style={{ textAlign: 'center', paddingBottom: 8, borderBottom: '1px solid var(--grid-line)' }}>
              <div className="cal-col-h" style={{ border: 0, padding: 0 }}>{d}</div>
              <div className="cal-col-h daynum" style={{ border: 0, padding: 0, fontSize: 13, marginTop: 2 }}>{nums[i]}</div>
            </div>
          ))}
          {times.map((tm, r) => (
            <React.Fragment key={tm}>
              <div className="cal-time" style={{ paddingTop: 6 }}>{tm}</div>
              {days.map((d, c) => {
                const ev = events.find((e) => e.col === c && e.row === r);
                return (
                  <div className="cal-cell" key={d + r}>
                    {ev && (
                      <div className="cal-evt" style={{ background: ev.g, top: 4, height: ev.span * 56 - 8 }}>
                        {ev.t}<div className="et">{ev.e}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Payments visual ---
export function PaymentsPanel() {
  const rows = [
    { in: 'MV', nm: 'María Vargas', meta: 'Limpieza facial · Daniela', amt: '180.000', g: 'var(--event-grad-blue)', badge: 'success', bl: 'Pagado' },
    { in: 'JC', nm: 'Juliana Cárdenas', meta: 'Manicure semiperm. · Paola', amt: '95.000', g: 'linear-gradient(135deg,#8b5cf6,#5c94f7)', badge: 'success', bl: 'Pagado' },
    { in: 'AR', nm: 'Andrés Ruiz', meta: 'Masaje 60min · Ricardo', amt: '140.000', g: 'linear-gradient(135deg,#10b981,#38bdf8)', badge: 'warning', bl: 'Pendiente' },
    { in: 'SM', nm: 'Sofía Mejía', meta: 'Diseño de cejas · Daniela', amt: '70.000', g: 'var(--event-grad)', badge: 'success', bl: 'Pagado' },
  ];
  return (
    <div className="panel float product-light" style={{ animationDuration: '8s', animationDelay: '.4s' }}>
      <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border-1)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-.02em', color: 'var(--slate-900)' }}>Registro de Pagos</div>
          <div className="t-overline" style={{ marginTop: 3 }}>Cierre Diario</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.03em', color: 'var(--emerald)', lineHeight: 1 }}>4.500.000</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--slate-400)', marginTop: 3 }}>Ingresos de hoy</div>
        </div>
      </div>
      <div className="list-panel">
        {rows.map((r) => (
          <div className="list-row" key={r.nm}>
            <span className="av" style={{ background: r.g }}>{r.in}</span>
            <span>
              <span className="nm" style={{ display: 'block' }}>{r.nm}</span>
              <span className="meta">{r.meta}</span>
            </span>
            <span style={{ marginLeft: 'auto', textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
              <span className="amt" style={{ marginLeft: 0 }}>{r.amt}</span>
              <span className={'badge ' + r.badge}><span className="bd" />{r.bl}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
