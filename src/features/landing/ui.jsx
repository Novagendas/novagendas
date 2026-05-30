import { useRef, useEffect, useState } from 'react';
import logoNovagendas from './assets/logo-novagendas.png';

// ============================================================
// Novagendas Landing — shared primitives
// ============================================================

// Lucide icon — injects raw HTML so React doesn't fight the swap.
export function Icon({ name, size = 18, color, style = {}, strokeWidth = 1.9 }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !window.lucide) return;
    el.innerHTML = `<i data-lucide="${name}"></i>`;
    window.lucide.createIcons({ attrs: { 'stroke-width': strokeWidth } });
    const svg = el.querySelector('svg');
    if (svg) { svg.setAttribute('width', size); svg.setAttribute('height', size); }
  }, [name, size, strokeWidth]);
  return <span ref={ref} style={{ display: 'inline-flex', alignItems: 'center', color, ...style }} />;
}

// Scroll reveal — adds .in when element enters viewport.
// Robust to React re-renders: once revealed, an element is tagged with
// data-revealed; a MutationObserver re-applies .in if React's className
// reconciliation strips it (e.g. when an accordion/price card re-renders).
export function useReveal() {
  useEffect(() => {
    const markIn = (el) => { 
      el.classList.add('in'); 
      el.classList.add('reveal-visible'); 
      el.setAttribute('data-revealed', '1'); 
    };
    const els = document.querySelectorAll('.reveal:not(.in)');
    if (!('IntersectionObserver' in window)) {
      els.forEach(markIn);
      return;
    }
    // Reveal above-the-fold content on the first frame so the hero never sits blank.
    requestAnimationFrame(() => {
      const vh = window.innerHeight || 800;
      document.querySelectorAll('.reveal:not(.in)').forEach((e) => {
        if (e.getBoundingClientRect().top < vh * 0.9) markIn(e);
      });
    });
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { markIn(en.target); io.unobserve(en.target); }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -8% 0px' });
    els.forEach((e) => io.observe(e));
    // Failsafe: if the observer never fires, force everything visible.
    const failsafe = setTimeout(() => {
      document.querySelectorAll('.reveal:not(.in)').forEach(markIn);
    }, 1400);
    // Guard: restore .in if a re-render drops it from a revealed node.
    const mo = new MutationObserver((muts) => {
      muts.forEach((m) => {
        const el = m.target;
        if (el.nodeType === 1 && el.getAttribute('data-revealed') === '1' && !el.classList.contains('in')) {
          el.classList.add('in');
          el.classList.add('reveal-visible');
        }
      });
    });
    mo.observe(document.body, { subtree: true, attributes: true, attributeFilter: ['class'] });
    return () => { io.disconnect(); mo.disconnect(); clearTimeout(failsafe); };
  });
}

// Count-up number on first view.
export function CountUp({ to, duration = 1500, format = (n) => n, className, style }) {
  const ref = useRef(null);
  const [val, setVal] = useState(0);
  const done = useRef(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting && !done.current) {
          done.current = true;
          const start = performance.now();
          const tick = (now) => {
            const p = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - p, 3);
            setVal(Math.round(to * eased));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      });
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, [to, duration]);
  return <span ref={ref} className={className} style={style}>{format(val)}</span>;
}

// Brand logo lockup
export function Logo({ sub = 'Agenda Inteligente' }) {
  return (
    <a href="#top" className="logo-lockup" aria-label="Novagendas — inicio">
      <span className="logo-mark"><img src={logoNovagendas} alt="Novagendas" /></span>
      <span>
        <span className="logo-name" style={{ display: 'block' }}>Novagendas</span>
        <span className="logo-sub">{sub}</span>
      </span>
    </a>
  );
}

// Theme toggle — light (default) / dark, persisted in localStorage.
export function ThemeToggle() {
  const [dark, setDark] = useState(
    () => document.documentElement.getAttribute('data-theme') === 'dark'
  );
  const toggle = () => {
    setDark((d) => {
      const next = !d;
      if (next) document.documentElement.setAttribute('data-theme', 'dark');
      else document.documentElement.removeAttribute('data-theme');
      try { localStorage.setItem('nv-theme', next ? 'dark' : 'light'); } catch (e) {}
      return next;
    });
  };
  return (
    <button className="theme-toggle" onClick={toggle} role="switch" aria-checked={dark}
      aria-label={dark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'} title="Cambiar tema">
      <span className="tt-thumb"><Icon name={dark ? 'moon' : 'sun'} size={14} /></span>
    </button>
  );
}

// Thin scroll-progress bar pinned to the top of the viewport.
export function ScrollProgress() {
  const [w, setW] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      setW(max > 0 ? (h.scrollTop / max) * 100 : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
  }, []);
  return <div className="scroll-progress" style={{ width: w + '%' }} />;
}

// Floating "back to top" button — mirrors the product help FAB.
export function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 640);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <button className={'fab' + (show ? ' show' : '')} aria-label="Volver arriba"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
      <Icon name="arrow-up" size={22} />
    </button>
  );
}
