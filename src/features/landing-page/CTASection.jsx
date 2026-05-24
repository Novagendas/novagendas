import { ArrowRight } from './icons';
import './CTASection.css';

export default function CTASection() {
  return (
    <section id="contacto" className="lp-cta-section">
      <div className="lp-container lp-cta-inner">
        <div className="lp-section-tag lp-reveal">Novagendas</div>
        <h2 className="lp-cta-h2 lp-reveal lp-stagger-1">
          ¿Listo para modernizar<br />
          <span className="lp-gradient-text">tu gestión?</span>
        </h2>
        <p className="lp-cta-sub lp-reveal lp-stagger-2">
          Únete a negocios que ya optimizan su tiempo con Novagendas.
          Agenda, clientes, pagos e inventario — todo en un solo lugar.
        </p>
        <div className="lp-reveal lp-stagger-3">
          <a href="mailto:sanabria3210@gmail.com" className="lp-btn-primary lp-cta-btn">
            Contactar ventas <ArrowRight />
          </a>
        </div>
      </div>
    </section>
  );
}
