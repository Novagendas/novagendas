import { useState, useEffect, useCallback } from 'react';
import './TourOverlay.css';
import ALL_STEPS from './tourSteps';

const TOOLTIP_WIDTH = 400;
const TOOLTIP_HEIGHT = 220;
const PADDING = 18;

export default function TourOverlay({ onComplete, onSkip, userRole, hasBotEnabled }) {
  const steps = ALL_STEPS.filter(s => {
    if (s.adminOnly && userRole !== 'admin') return false;
    if (s.requiresBot && !hasBotEnabled) return false;
    return true;
  });

  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);

  const currentStep = steps[step];

  const readRect = useCallback(() => {
    if (!currentStep?.target) { setTargetRect(null); return; }
    const el = document.querySelector(`[data-tour="${currentStep.target}"]`);
    if (el) setTargetRect(el.getBoundingClientRect());
    else setTargetRect(null);
  }, [currentStep]);

  useEffect(() => {
    if (!currentStep?.target) { setTargetRect(null); return; }

    setTargetRect(null);

    const el = document.querySelector(`[data-tour="${currentStep.target}"]`);
    if (!el) return;

    const nav = document.querySelector('.sidebar-nav');
    if (nav && nav.contains(el)) {
      const navRect = nav.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      const elRelativeTop = elRect.top - navRect.top + nav.scrollTop;
      nav.scrollTo({ top: elRelativeTop - nav.clientHeight / 2 + elRect.height / 2, behavior: 'smooth' });
    }

    const timer = setTimeout(readRect, 350);
    return () => clearTimeout(timer);
  }, [currentStep?.target, readRect]);

  useEffect(() => {
    window.addEventListener('resize', readRect);
    return () => window.removeEventListener('resize', readRect);
  }, [readRect]);

  const goNext = () => {
    if (step < steps.length - 1) setStep(s => s + 1);
    else onComplete();
  };

  const goPrev = () => setStep(s => Math.max(0, s - 1));

  const getTooltipStyle = () => {
    if (!targetRect || currentStep.position === 'center') {
      return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
    }

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let top = targetRect.top + targetRect.height / 2 - TOOLTIP_HEIGHT / 2;
    let left = targetRect.right + PADDING;

    if (left + TOOLTIP_WIDTH > vw - 16) left = targetRect.left - TOOLTIP_WIDTH - PADDING;
    if (top < 80) top = 80;
    if (top + TOOLTIP_HEIGHT > vh - 20) top = vh - TOOLTIP_HEIGHT - 20;

    return { top, left, maxWidth: TOOLTIP_WIDTH };
  };

  const getArrowClass = () => {
    if (!targetRect || currentStep.position === 'center') return '';
    const vw = window.innerWidth;
    const wouldOverflowRight = targetRect.right + PADDING + TOOLTIP_WIDTH > vw - 16;
    return wouldOverflowRight ? 'arrow-right' : 'arrow-left';
  };

  if (!currentStep) return null;

  // Mientras esperamos el rect de un paso con target, solo mostramos el dim
  const isTransitioning = Boolean(currentStep.target && !targetRect);

  return (
    <div className="tour-root">
      {targetRect ? (
        <div
          className="tour-spotlight"
          style={{
            top: targetRect.top - 5,
            left: targetRect.left - 5,
            width: targetRect.width + 10,
            height: targetRect.height + 10,
          }}
        />
      ) : (
        <div className="tour-dim" />
      )}

      {!isTransitioning && <div className={`tour-card ${getArrowClass()}`} style={getTooltipStyle()}>
        <div className="tour-card-header">
          <div className="tour-badge">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            Paso {step + 1} de {steps.length}
          </div>
          <div className="tour-header-actions">
            <button className="tour-skip-btn" onClick={onSkip} title="Omitir tour por ahora">
              Omitir
            </button>
            <button className="tour-complete-btn" onClick={onComplete} title="Marcar como completado y no volver a mostrar">
              Marcar completado
            </button>
          </div>
        </div>

        <h3 className="tour-title">{currentStep.title}</h3>
        <p className="tour-desc">{currentStep.description}</p>

        <div className="tour-card-footer">
          <div className="tour-dots">
            {steps.map((_, i) => (
              <div key={i} className={`tour-dot${i === step ? ' active' : ''}`} />
            ))}
          </div>
          <div className="tour-nav-btns">
            {step > 0 && (
              <button className="tour-btn-prev" onClick={goPrev}>Anterior</button>
            )}
            <button className="tour-btn-next" onClick={goNext}>
              {step === steps.length - 1 ? '¡Comenzar!' : 'Siguiente'}
            </button>
          </div>
        </div>
      </div>}
    </div>
  );
}
