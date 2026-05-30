import { useState, useEffect } from 'react';
import { Icon, Logo, ThemeToggle } from './ui';
import logoNovagendas from './assets/logo-novagendas.png';

// ============================================================
// Nav + Hero
// ============================================================

export function Nav({ onLaunchDemo }) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <header className={'nav' + (scrolled ? ' scrolled' : '')}>
      <div className="lp-wrap-wide nav-inner">
        <Logo />
        <nav className="nav-links">
          <a className="nav-link" href="#funciones">Funciones</a>
          <a className="nav-link" href="#producto">Producto</a>
          <a className="nav-link" href="#como-funciona">Cómo funciona</a>
          <a className="nav-link" href="#valores">Por qué Novagendas</a>
        </nav>
        <div className="nav-cta">
          <ThemeToggle />
          <a className="btn btn-outline" href="#" style={{ padding: '10px 18px', fontSize: 14 }}>Iniciar Sesión</a>
          <a className="btn btn-dark" href="#" onClick={(e) => { e.preventDefault(); onLaunchDemo && onLaunchDemo(); }} style={{ padding: '10px 18px', fontSize: 14 }}>
            Agenda Demo<Icon name="arrow-right" size={16} />
          </a>
        </div>
      </div>
    </header>
  );
}

export function Hero({ onLaunchDemo }) {
  return (
    <section className="hero" id="top">
      <div className="hero-bg">
        <span className="hero-blob b1" />
        <span className="hero-blob b2" />
        <span className="hero-grid-fade" />
      </div>
      <div className="lp-wrap-wide hero-inner">
        {/* copy */}
        <div className="hero-copy">
          <span className="eyebrow reveal">
            <span className="eyebrow-dot" />Plataforma de agendamiento inteligente
          </span>
          <h1 className="reveal reveal-d1">
            Tu negocio, organizado.<br /><span className="grad">Tú, en control.</span>
          </h1>
          <p className="hero-sub reveal reveal-d2">
            Novagendas centraliza tus citas, especialistas y pagos en una sola agenda en tiempo real.
            Sin dobles reservas, sin caos — el control operativo de tu negocio de estética en un solo lugar.
          </p>
          <div className="hero-actions reveal reveal-d3">
            <a className="btn btn-primary btn-lg" href="#" onClick={(e) => { e.preventDefault(); onLaunchDemo && onLaunchDemo(); }}>
              Agenda Demo<Icon name="arrow-right" size={18} />
            </a>
            <a className="btn btn-outline btn-lg" href="#producto">
              <Icon name="play-circle" size={18} />Ver el producto
            </a>
          </div>
          <div className="hero-trust reveal reveal-d4">
            <span className="trust-item"><Icon name="check-circle" size={17} />Sin doble reserva</span>
            <span className="trust-item"><Icon name="check-circle" size={17} />Agenda en tiempo real</span>
            <span className="trust-item"><Icon name="check-circle" size={17} />Curva de aprendizaje mínima</span>
          </div>
        </div>

        {/* mockup */}
        <div className="hero-mock-col reveal reveal-d2">
          <HeroMock />
        </div>
      </div>
    </section>
  );
}

export function HeroMock() {
  return (
    <div className="mock-stage product-light">
      <div className="mock-window float">
        {/* titlebar */}
        <div className="mock-titlebar">
          <span className="tl-dot" style={{ background: '#ff5f57' }} />
          <span className="tl-dot" style={{ background: '#febc2e' }} />
          <span className="tl-dot" style={{ background: '#28c840' }} />
          <span className="mock-url"><Icon name="lock" size={11} />app.novagendas.com/vista-general</span>
        </div>
        <div className="mock-body">
          {/* sidebar */}
          <div className="mock-side">
            <span className="mock-side-logo"><img src={logoNovagendas} alt="" /></span>
            <span className="mock-nav-ico on"><Icon name="home" size={18} /></span>
            <span className="mock-nav-ico"><Icon name="calendar" size={18} /></span>
            <span className="mock-nav-ico"><Icon name="users" size={18} /></span>
            <span className="mock-nav-ico"><Icon name="credit-card" size={18} /></span>
            <span className="mock-nav-ico"><Icon name="box" size={18} /></span>
            <span className="mock-nav-ico"><Icon name="bar-chart-3" size={18} /></span>
          </div>
          {/* main */}
          <div className="mock-main">
            <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-.02em', color: 'var(--slate-900)' }}>Bienvenido Daniel</div>
            <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--slate-400)', marginTop: 2, marginBottom: 14 }}>Hoy tienes 20 citas programadas.</div>
            <div className="mock-kpis">
              <div className="mock-kpi">
                <span className="chip" style={{ background: 'var(--emerald-soft)', color: 'var(--emerald)' }}><Icon name="dollar-sign" size={16} /></span>
                <div className="num">4.500.000</div>
                <div className="lbl">Ingresos Hoy</div>
              </div>
              <div className="mock-kpi">
                <span className="chip" style={{ background: 'var(--blue-soft)', color: 'var(--blue-600)' }}><Icon name="calendar" size={16} /></span>
                <div className="num">20</div>
                <div className="lbl">Citas Hoy</div>
              </div>
              <div className="mock-kpi">
                <span className="chip" style={{ background: 'var(--violet-soft)', color: 'var(--violet)' }}><Icon name="user" size={16} /></span>
                <div className="num">200</div>
                <div className="lbl">Pacientes</div>
              </div>
            </div>
            <div className="mock-card">
              <div className="mock-card-h">
                <span className="ttl">Próximas Citas</span>
                <span className="badge info"><span className="bd" />Hoy</span>
              </div>
              <div className="mock-appt">
                <span className="av" style={{ background: 'var(--event-grad-blue)' }}>MV</span>
                <span><span className="nm" style={{ display: 'block' }}>María Vargas</span><span className="sv">Limpieza facial profunda</span></span>
                <span className="tm">9:00 AM</span>
              </div>
              <div className="mock-appt">
                <span className="av" style={{ background: 'linear-gradient(135deg,#8b5cf6,#5c94f7)' }}>JC</span>
                <span><span className="nm" style={{ display: 'block' }}>Juliana Cárdenas</span><span className="sv">Manicure semipermanente</span></span>
                <span className="tm">10:30 AM</span>
              </div>
              <div className="mock-appt">
                <span className="av" style={{ background: 'linear-gradient(135deg,#10b981,#38bdf8)' }}>AR</span>
                <span><span className="nm" style={{ display: 'block' }}>Andrés Ruiz</span><span className="sv">Masaje descontracturante</span></span>
                <span className="tm">12:00 PM</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* floating chips */}
      <div className="float-chip fc-tl float-sm" style={{ animationDelay: '.8s' }}>
        <span className="fc-ico" style={{ background: 'var(--emerald-soft)', color: 'var(--emerald)', animation: 'pulse-ring 2.6s infinite' }}>
          <Icon name="check" size={20} />
        </span>
        <span>
          <span className="fc-num" style={{ display: 'block' }}>Sincronizado</span>
          <span className="fc-lbl">Agenda en tiempo real</span>
        </span>
      </div>
      <div className="float-chip fc-br float-sm" style={{ animationDelay: '.3s' }}>
        <span className="fc-ico" style={{ background: 'var(--blue-soft)', color: 'var(--blue-600)' }}>
          <Icon name="calendar-check" size={20} />
        </span>
        <span>
          <span className="fc-num" style={{ display: 'block' }}>0 inasistencias</span>
          <span className="fc-lbl">Control del día</span>
        </span>
      </div>
    </div>
  );
}
