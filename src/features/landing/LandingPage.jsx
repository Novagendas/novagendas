import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import './LandingPage.css';

// Registrar ScrollTrigger de GSAP
gsap.registerPlugin(ScrollTrigger);

// --- ICONOS SVG INLINE PREMIUM (CON DIMENSIONES PRECISAS DE DISEÑO) ---
const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v2h-5zm0 3h5v2h-5z" /></svg>
);

const SyncIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm-6 8c0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3c-3.31 0-6-2.69-6-6z" /></svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
);

const ArrowRightIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" /></svg>
);

const LotusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 2c1.1 0 2 .9 2 2s-.9 2-2 2-2-.9-2-2 .9-2 2-2zm0 18c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 9.74C4.46 10.97 4 12.43 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8c0-1.57-.46-3.03-1.24-4.26l-1.46 1.46c.45.83.7 1.79.7 2.8 0 3.31-2.69 6-6 6zm4-6c0 2.21-1.79 4-4 4s-4-1.79-4-4c0-.68.17-1.31.47-1.87l1.46 1.46C9.64 12.83 9.5 13.4 9.5 14c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5c0-.6-.14-1.17-.37-1.67l1.46-1.46c.3.56.47 1.19.47 1.87z" /></svg>
);

const BriefcaseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M20 6h-4V4c0-1.11-.89-2-2-2h-4c-1.11 0-2 .89-2 2v2H4c-1.11 0-1.99.89-1.99 2L2 19c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V8c0-1.11-.89-2-2-2zm-6 0h-4V4h4v2z" /></svg>
);

const ScissorsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M6 2c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.03-.81L10 9.22v5.56l-1.97 2.03c-.53-.5-1.24-.81-2.03-.81-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3c0-.79-.31-1.5-.81-2.03L10 14.78v-1.56l4-4.11 4.11 4.11c-.5.53-.81 1.24-.81 2.03 0 1.66 1.34 3 3 3s3-1.34 3-3-1.34-3-3-3c-.79 0-1.5.31-2.03.81L14 13.22V7.66l1.97-2.03c.53.5 1.24.81 2.03.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .79.31 1.5.81 2.03L14 9.22V7.66L10 3.56l-1.97 2.03c.5-.53.81-1.24.81-2.03 0-1.66-1.34-3-3-3zm0 4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm12 12c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z" /></svg>
);

const BrainIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 19.4c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l1.9-1.9C9.13 19.55 10.51 20 12 20c4.97 0 9-4.03 9-9s-4.03-9-9-9zm0 15c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" /></svg>
);

const DumbbellIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M20.57 14.86L22 13.43c.78-.78.78-2.05 0-2.83l-1.43-1.43c-.78-.78-2.05-.78-2.83 0l-1.43 1.43-3.57-3.57 1.43-1.43c.78-.78.78-2.05 0-2.83L12.74 1.3c-.78-.78-2.05-.78-2.83 0L8.48 2.73c-.78.78-.78 2.05 0 2.83l1.43 1.43-3.57 3.57-1.43-1.43c-.78-.78-2.05-.78-2.83 0L.65 10.57c-.78.78-.78 2.05 0 2.83l1.43 1.43c.78.78 2.05.78 2.83 0l1.43-1.43 3.57 3.57-1.43 1.43c-.78.78-.78 2.05 0 2.83l1.43 1.43c.78.78 2.05.78 2.83 0l1.43-1.43 3.57-3.57 1.43 1.43c.78.78 2.05.78 2.83 0l1.43-1.43z" /></svg>
);

const PawIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M12 14c-1.66 0-3 1.34-3 3 0 2 2 3.5 3 4 1-.5 3-2 3-4 0-1.66-1.34-3-3-3zm-4.5-2c-.83 0-1.5-.67-1.5-1.5S6.67 9 7.5 9s1.5.67 1.5 1.5S8.33 12 7.5 12zm9 0c-.83 0-1.5-.67-1.5-1.5S15.67 9 16.5 9s1.5.67 1.5 1.5S17.33 12 16.5 12zm-9.3-5.2c-.55 0-1-.45-1-1 0-.8.7-1.5 1.5-1.5.55 0 1 .45 1 1 0 .8-.7 1.5-1.5 1.5zm7.6 0c-.8 0-1.5-.7-1.5-1.5 0-.55.45-1 1-1 .8 0 1.5.7 1.5 1.5 0 .55-.45 1-1 1z" /></svg>
);

const DragIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 12c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" /></svg>
);

const MedicalIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-2 10h-4v4h-2v-4H7v-2h4V7h2v4h4v2z" /></svg>
);

const CardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" /></svg>
);

const BoxIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" /></svg>
);

const ReportIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14H7v-7h3v7zm4 0h-3V7h3v10zm4 0h-3v-4h3v4z" /></svg>
);

const ShareIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" /></svg>
);

export default function LandingPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [loadedCount, setLoadedCount] = useState(0);
  const [hideHint, setHideHint] = useState(false);
  const [threadIndex, setThreadIndex] = useState(0); // 0-3 hilo activo

  // Selector de paleta de diseño dinámico (para cumplir con "haz varias opciones de colores, que prime un azul")
  const [selectedPalette, setSelectedPalette] = useState(() => {
    return localStorage.getItem('novagendas_palette') || 'classic';
  });
  const [isThemeOpen, setIsThemeOpen] = useState(false);

  const canvasRef = useRef(null);
  const heroRef = useRef(null);
  const sectorsRef = useRef(null);
  const featuresRef = useRef(null);

  const TOTAL_FRAMES = 160;
  const imagesRef = useRef([]);
  const currentFrameRef = useRef(0);
  const currentScaleRef = useRef(1);

  // Función para rellenar ceros a la izquierda (ej. 1 -> 001)
  const padZero = (num) => String(num).padStart(3, '0');

  // Modificar dinámicamente los estilos de #root para habilitar el scroll de ventana
  useEffect(() => {
    const rootElement = document.getElementById('root');
    if (!rootElement) return;

    const originalHeight = rootElement.style.height;
    const originalMinHeight = rootElement.style.minHeight;
    const originalDisplay = rootElement.style.display;

    rootElement.style.setProperty('height', 'auto', 'important');
    rootElement.style.setProperty('min-height', '100vh', 'important');
    rootElement.style.setProperty('display', 'block', 'important');

    return () => {
      if (originalHeight) rootElement.style.height = originalHeight;
      else rootElement.style.removeProperty('height');

      if (originalMinHeight) rootElement.style.minHeight = originalMinHeight;
      else rootElement.style.removeProperty('min-height');

      if (originalDisplay) rootElement.style.display = originalDisplay;
      else rootElement.style.removeProperty('display');
    };
  }, []);

  // Pre-cargar todas las imágenes (formato PNG de alta calidad)
  useEffect(() => {
    let active = true;
    let count = 0;
    const loadedImages = [];

    const handleImageLoad = () => {
      if (!active) return;
      count++;
      setLoadedCount(count);
      if (count === TOTAL_FRAMES) {
        setIsLoading(false);
      }
    };

    const handleImageError = (e) => {
      console.warn(`Error cargando imagen: ${e.target.src}`);
      handleImageLoad(); // Continuamos de todos modos
    };

    for (let i = 1; i <= TOTAL_FRAMES; i++) {
      const img = new Image();
      img.src = `/animacion novegandas/ezgif-frame-${padZero(i)}.png`;
      img.onload = handleImageLoad;
      img.onerror = handleImageError;
      loadedImages.push(img);
    }

    imagesRef.current = loadedImages;

    return () => {
      active = false;
    };
  }, []);

  // Función de dibujo optimizada con cálculo de aspecto (cover) y zoom
  const drawFrame = (frameIndex, scale = 1) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Habilitar suavizado de imágenes de alta calidad para máxima nitidez
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // eslint-disable-next-line security/detect-object-injection
    const img = imagesRef.current[frameIndex];
    if (!img || !img.complete) return;

    // Guardar valores actuales para redibujar en resize
    currentFrameRef.current = frameIndex;
    currentScaleRef.current = scale;

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Limpiar canvas con el color de fondo dinámico de la paleta
    const computedStyle = window.getComputedStyle(document.body);
    const bgColor = computedStyle.getPropertyValue('--bg').trim() || '#f8fafc';
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Dimensiones de la imagen
    const imgWidth = img.naturalWidth || img.width;
    const imgHeight = img.naturalHeight || img.height;

    const imageRatio = imgWidth / imgHeight;
    const canvasRatio = canvasWidth / canvasHeight;

    let drawWidth, drawHeight, drawX, drawY;

    // Lógica object-fit: cover
    if (canvasRatio > imageRatio) {
      drawWidth = canvasWidth;
      drawHeight = canvasWidth / imageRatio;
      drawX = 0;
      drawY = (canvasHeight - drawHeight) / 2;
    } else {
      drawWidth = canvasHeight * imageRatio;
      drawHeight = canvasHeight;
      drawX = (canvasWidth - drawWidth) / 2;
      drawY = 0;
    }

    // Dibujar con el efecto sutil de escala (zoom) desde el centro
    ctx.save();
    ctx.translate(canvasWidth / 2, canvasHeight / 2);
    ctx.scale(scale, scale);
    ctx.translate(-canvasWidth / 2, -canvasHeight / 2);
    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
    ctx.restore();
  };

  // Manejar el redimensionamiento del Canvas de forma nítida (Retina/High-DPI)
  useEffect(() => {
    if (isLoading) return;

    const handleResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Super-sampling: forzar dpr mínimo de 2 para lograr nitidez y detalle extremo
      const dpr = Math.max(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;

      // Redibujar el frame actual tras redimensionar
      drawFrame(currentFrameRef.current, currentScaleRef.current);
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Disparo inicial para dimensionar correctamente

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isLoading]);

  // Configurar las animaciones con GSAP, ScrollTrigger y Lenis
  useEffect(() => {
    if (isLoading) return;

    const heroEl = heroRef.current;
    const sectorsEl = sectorsRef.current;
    const featuresEl = featuresRef.current;

    // Asegurar que el canvas muestra el frame 0 inicialmente
    drawFrame(0, 1);

    // ─── ESTADOS INICIALES ──────────────────────────────────────────────
    gsap.set(heroEl, { opacity: 0, y: 0, autoAlpha: 0 });
    gsap.set('.landing-canvas-wrapper', { opacity: 0 });
    gsap.set(sectorsEl, { opacity: 0, y: 30, autoAlpha: 0 });
    gsap.set(featuresEl, { opacity: 0, y: 30, autoAlpha: 0 });

    // Hijos del Hero (para animación de entrada)
    gsap.set(heroEl.querySelectorAll('.title-line-inner'), { y: '105%' });
    gsap.set(heroEl.querySelectorAll('.hero-tag'), { opacity: 0, y: 20 });
    gsap.set(heroEl.querySelector('.hero-subtitle'), { opacity: 0, y: 20 });
    gsap.set(heroEl.querySelectorAll('.hero-actions a'), { opacity: 0, y: 18 });
    gsap.set(heroEl.querySelectorAll('.premium-card'), { opacity: 0, y: 24, scale: 0.97 });

    // Hijos de Sectores (scrub-driven)
    gsap.set(sectorsEl.querySelectorAll('.title-line-inner'), { y: '105%' });
    gsap.set(sectorsEl.querySelector('.section-subtitle'), { opacity: 0, y: 22 });
    gsap.set(sectorsEl.querySelectorAll('.sector-card'), { opacity: 0, y: 44, scale: 0.97 });

    // Hijos de Features (scrub-driven)
    gsap.set(featuresEl.querySelectorAll('.title-line-inner'), { y: '105%' });
    gsap.set(featuresEl.querySelector('.section-subtitle'), { opacity: 0, y: 22 });
    gsap.set(featuresEl.querySelectorAll('.feature-card'), { opacity: 0, y: 44, scale: 0.97 });

    // ─── ANIMACIÓN DE ENTRADA DEL HERO (one-shot, sin scrub) ────────────
    const heroEntry = gsap.timeline({ delay: 0.5 });
    heroEntry
      .to('.landing-canvas-wrapper', {
        opacity: 1, duration: 1.5, ease: 'power2.out'
      })
      .to(heroEl, {
        opacity: 1, autoAlpha: 1, duration: 1.2, ease: 'power2.out'
      }, '-=1.2')
      .to(heroEl.querySelectorAll('.hero-tag'), {
        opacity: 1, y: 0, duration: 0.65, stagger: 0.14, ease: 'power3.out'
      }, '-=0.8')
      .to(heroEl.querySelectorAll('.title-line-inner'), {
        y: '0%', duration: 1.05, stagger: 0.14, ease: 'power4.out'
      }, '-=0.35')
      .to(heroEl.querySelector('.hero-subtitle'), {
        opacity: 1, y: 0, duration: 0.85, ease: 'power3.out'
      }, '-=0.5')
      .to(heroEl.querySelectorAll('.hero-actions a'), {
        opacity: 1, y: 0, duration: 0.65, stagger: 0.1, ease: 'power3.out'
      }, '-=0.5')
      .to(heroEl.querySelectorAll('.premium-card'), {
        opacity: 1, y: 0, scale: 1, duration: 0.75, stagger: 0.14, ease: 'power3.out',
        clearProps: 'transform'
      }, '-=0.45');

    // ─── LENIS (smooth scroll) ────────────────────────────────────────────
    const lenis = new Lenis({
      duration: 1.8,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.85,
      touchMultiplier: 1.5,
    });

    lenis.on('scroll', ScrollTrigger.update);

    const tickerCallback = (time) => { lenis.raf(time * 1000); };
    gsap.ticker.add(tickerCallback);
    gsap.ticker.lagSmoothing(0);

    // ─── TIMELINE SCRUB PRINCIPAL ─────────────────────────────────────────
    // Total duración virtual: ~35 unidades — más lenta y cinemática
    const animObj = { frame: 0, scale: 1.0 };

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: '.landing-scroll-spacer',
        start: 'top top',
        end: 'bottom bottom',
        scrub: 2.2,
        // Snap suave a los puntos de hold real del timeline (duración total 35u)
        // Hero hold: 0-2/35=0.057 | Sectores hold: 10/35=0.286 | Features hold: 22/35=0.629 | Fin: 1.0
        snap: {
          snapTo: (value, self) => {
            const snapPoints = [0.0, 0.286, 0.629, 1.0];
            const p = self.progress;
            // Zona de intención: sólo snappear si estamos dentro de ±4% del punto
            const nearest = snapPoints.reduce((a, b) => Math.abs(b - p) < Math.abs(a - p) ? b : a);
            if (Math.abs(nearest - p) < 0.04) return nearest;
            return p; // fuera de zona → seguir scroll libre
          },
          duration: { min: 0.6, max: 1.2 },
          delay: 0.08,
          ease: 'power2.inOut'
        },
        onUpdate: (self) => {
          if (self.progress > 0.015) setHideHint(true);
          else setHideHint(false);

          // Actualizar hilo activo según progreso
          const p = self.progress;
          if (p < 0.143) setThreadIndex(0);       // Hero (0 → 2/35)
          else if (p < 0.457) setThreadIndex(1);  // Sectores (2/35 → 16/35)
          else if (p < 0.771) setThreadIndex(2);  // Features (16/35 → 27/35)
          else setThreadIndex(3);                  // Final
        }
      }
    });

    // A. Hold Inicial: frame 0 → Hero visible
    tl.to(animObj, {
      frame: 0, scale: 1.0, duration: 2.0, ease: 'none',
      onUpdate: () => drawFrame(0, animObj.scale)
    });

    // ── TRANSICIÓN 1: HERO → SECTORES ──────────────────────────────
    tl.addLabel('sectors-transition');

    // B1. Avance de frames 0 → 61
    tl.to(animObj, {
      frame: 61, scale: 1.018, duration: 8.0, ease: 'power1.inOut',
      onUpdate: () => drawFrame(Math.round(animObj.frame), animObj.scale)
    }, 'sectors-transition');

    // B2. Hero desaparece
    tl.to(heroEl, {
      opacity: 0, y: -38, autoAlpha: 0, duration: 3.5, ease: 'power2.inOut'
    }, 'sectors-transition');

    // B3. Sección Sectores aparece
    tl.to(sectorsEl, {
      opacity: 1, y: 0, autoAlpha: 1, duration: 4.5, ease: 'power2.out'
    }, 'sectors-transition+=2.5');

    // B4. Título: reveal línea por línea
    tl.to(sectorsEl.querySelectorAll('.title-line-inner'), {
      y: '0%', duration: 2.5, stagger: 0.25, ease: 'power4.out'
    }, 'sectors-transition+=4.0');

    // B5. Subtítulo
    tl.to(sectorsEl.querySelector('.section-subtitle'), {
      opacity: 1, y: 0, duration: 2.0, ease: 'power3.out'
    }, 'sectors-transition+=5.2');

    // B6. Cards en cascada
    tl.to(sectorsEl.querySelectorAll('.sector-card'), {
      opacity: 1, y: 0, scale: 1, duration: 1.4, stagger: 0.18, ease: 'power3.out'
    }, 'sectors-transition+=5.8');

    // C. Hold Sectores: mantener frame 61
    tl.addLabel('sectors-hold', 'sectors-transition+=8.0');
    tl.to(animObj, {
      frame: 61, scale: 1.022, duration: 4.0, ease: 'none',
      onUpdate: () => drawFrame(61, animObj.scale)
    }, 'sectors-hold');

    // ── TRANSICIÓN 2: SECTORES → FEATURES ─────────────────────────
    tl.addLabel('features-transition', 'sectors-hold+=4.0');

    // D1. Avance de frames 61 → 130
    tl.to(animObj, {
      frame: 130, scale: 1.038, duration: 8.0, ease: 'power1.inOut',
      onUpdate: () => drawFrame(Math.round(animObj.frame), animObj.scale)
    }, 'features-transition');

    // D2. Sectores desaparece
    tl.to(sectorsEl, {
      opacity: 0, y: -38, autoAlpha: 0, duration: 3.5, ease: 'power2.inOut'
    }, 'features-transition');

    // D3. Features aparece
    tl.to(featuresEl, {
      opacity: 1, y: 0, autoAlpha: 1, duration: 4.5, ease: 'power2.out'
    }, 'features-transition+=2.5');

    // D4. Título: reveal línea por línea
    tl.to(featuresEl.querySelectorAll('.title-line-inner'), {
      y: '0%', duration: 2.5, stagger: 0.25, ease: 'power4.out'
    }, 'features-transition+=4.0');

    // D5. Subtítulo
    tl.to(featuresEl.querySelector('.section-subtitle'), {
      opacity: 1, y: 0, duration: 2.0, ease: 'power3.out'
    }, 'features-transition+=5.2');

    // D6. Feature cards en cascada
    tl.to(featuresEl.querySelectorAll('.feature-card'), {
      opacity: 1, y: 0, scale: 1, duration: 1.4, stagger: 0.18, ease: 'power3.out'
    }, 'features-transition+=5.8');

    // E. Hold Features: mantener frame 130
    tl.addLabel('features-hold', 'features-transition+=8.0');
    tl.to(animObj, {
      frame: 130, scale: 1.042, duration: 4.0, ease: 'none',
      onUpdate: () => drawFrame(130, animObj.scale)
    }, 'features-hold');

    // ── TRANSICIÓN 3: FEATURES → FIN ───────────────────────────────
    tl.addLabel('end-transition', 'features-hold+=4.0');

    // F1. Avance de frames 130 → 159
    tl.to(animObj, {
      frame: 159, scale: 1.055, duration: 7.0, ease: 'power1.inOut',
      onUpdate: () => drawFrame(Math.round(animObj.frame), animObj.scale)
    }, 'end-transition');

    // F2. Features desaparece
    tl.to(featuresEl, {
      opacity: 0, y: -38, autoAlpha: 0, duration: 3.5, ease: 'power2.inOut'
    }, 'end-transition');

    // G. Hold Final: frame 159
    tl.to(animObj, {
      frame: 159, scale: 1.055, duration: 2.0, ease: 'none',
      onUpdate: () => drawFrame(159, animObj.scale)
    });

    // Limpieza al desmontar
    return () => {
      heroEntry.kill();
      lenis.destroy();
      gsap.ticker.remove(tickerCallback);
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, [isLoading]);

  // Porcentaje de progreso de carga
  const progressPercent = Math.round((loadedCount / TOTAL_FRAMES) * 100);

  return (
    <div className={`landing-page-root palette-${selectedPalette}`}>
      {/* Pantalla de Carga Clara Premium */}
      <div className={`landing-loader-overlay ${!isLoading ? 'fade-out' : ''}`}>
        <div className="landing-loader-content">
          <div className="landing-loader-logo-row">
            <div className="landing-loader-dot" />
            <h1 className="landing-loader-brand">Nova<span>gendas</span></h1>
          </div>
          <p className="landing-loader-tagline">
            Preparando tu plataforma<em>...</em>
          </p>
          <div className="landing-loader-progress-wrapper">
            <div className="landing-loader-bar-outer">
              <div
                className="landing-loader-bar-inner"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="landing-loader-percentage">{progressPercent}%</span>
          </div>
        </div>
      </div>

      {/* Experiencia Cinemática */}
      <>
          {/* Header Fijo Premium */}
          <header className="landing-header">
            <a href="/" className="landing-header-brand">
              Nova<span>gendas</span>
            </a>
            <nav className="landing-header-menu">
              <a href="#funciones" className="landing-header-link">Funciones</a>
              <a href="#como-funciona" className="landing-header-link">Cómo funciona</a>
              <a href="#sectores" className="landing-header-link">Sectores</a>
            </nav>
            <a href="#probar" className="landing-header-cta">
              Probar gratis
            </a>
          </header>

          {/* Contenedor del Canvas Sticky */}
          <div className="landing-canvas-wrapper">
            <canvas ref={canvasRef} id="scroll-canvas" />
          </div>

          {/* Viñeta sutil por encima del canvas */}
          <div className="landing-vignette" />

          {/* --- CAPAS DE CONTENIDO (OVERLAYS FIJOS) --- */}

          {/* 1. HITOS: HERO SECTION */}
          <section ref={heroRef} className="landing-section active">
            <div className="hero-content">
              <div className="hero-left">
                <div className="hero-tags">
                  <div className="hero-tag">
                    <UserIcon />
                    Software de agendamiento multi-usuario
                  </div>
                  <div className="hero-tag">
                    <SyncIcon />
                    Google Calendar Sync
                  </div>
                </div>
                <h1 className="hero-title">
                  <span className="title-line"><span className="title-line-inner">Agenda tu negocio.</span></span>
                  <span className="title-line"><span className="title-line-inner"><span className="caos">Sin caos.</span> <span className="papel">Sin papel.</span></span></span>
                </h1>
                <p className="hero-subtitle">
                  La plataforma integral para gestionar citas, clientes y operaciones en tiempo real.
                  Sincronización total, control absoluto.
                </p>
                <div className="hero-actions">
                  <a href="#probar" className="btn-green">
                    Probar gratis <ArrowRightIcon />
                  </a>
                  <a href="#funcionalidades" className="btn-outline-grey">
                    Ver funcionalidades
                  </a>
                </div>
              </div>

              <div className="hero-right">
                <div className="card-stat-row">
                  <div className="premium-card">
                    <div className="card-stat-title">
                      <CalendarIcon /> Citas hoy
                    </div>
                    <div className="card-stat-val">24</div>
                  </div>
                  <div className="premium-card">
                    <div className="card-stat-title">
                      💸 Ingresos
                    </div>
                    <div className="card-stat-val gold">$4.2M</div>
                  </div>
                </div>

                <div className="premium-card citas-list-card">
                  <div className="citas-card-header">
                    <span>Próximas Citas</span>
                    <CalendarIcon />
                  </div>
                  <div className="citas-list">
                    <div className="cita-item">
                      <div className="cita-left">
                        <span className="cita-name">Consulta General</span>
                        <span className="cita-time">09:00 AM - Maria Lopez</span>
                      </div>
                      <span className="badge-status confirmada">Confirmada</span>
                    </div>
                    <div className="cita-item">
                      <div className="cita-left">
                        <span className="cita-name">Limpieza Facial</span>
                        <span className="cita-time">10:30 AM - Carlos R.</span>
                      </div>
                      <span className="badge-status pendiente">Pendiente</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* 2. HITOS: SECTORES */}
          <section ref={sectorsRef} className="landing-section">
            <div className="section-center-content">
              <h2 className="section-title">
                <span className="title-line"><span className="title-line-inner">Diseñado para sectores que no se detienen</span></span>
              </h2>
              <p className="section-subtitle">Adaptable a las <span className="highlight">necesidades específicas</span> de tu <span className="gold">industria</span>.</p>

              <div className="sectores-grid">
                <div className="sector-card featured">
                  <div className="sector-icon-wrapper">
                    <LotusIcon />
                  </div>
                  <h3 className="sector-name">Clínicos y Spas</h3>
                  <p className="sector-desc">Gestión de cubículos, especialistas y aparatología.</p>
                </div>

                <div className="sector-card">
                  <div className="sector-icon-wrapper">
                    <BriefcaseIcon />
                  </div>
                  <h3 className="sector-name">Consultorios</h3>
                </div>

                <div className="sector-card">
                  <div className="sector-icon-wrapper">
                    <ScissorsIcon />
                  </div>
                  <h3 className="sector-name">Barberías</h3>
                </div>

                <div className="sector-card">
                  <div className="sector-icon-wrapper">
                    <BrainIcon />
                  </div>
                  <h3 className="sector-name">Psicólogos</h3>
                </div>

                <div className="sector-card">
                  <div className="sector-icon-wrapper">
                    <DumbbellIcon />
                  </div>
                  <h3 className="sector-name">Centros Deportivos</h3>
                </div>

                <div className="sector-card">
                  <div className="sector-icon-wrapper">
                    <PawIcon />
                  </div>
                  <h3 className="sector-name">Veterinarios</h3>
                </div>
              </div>
            </div>
          </section>

          {/* 3. HITOS: CARACTERÍSTICAS (CONTROL TOTAL) */}
          <section ref={featuresRef} className="landing-section">
            <div className="section-center-content">
              <h2 className="section-title">
                <span className="title-line"><span className="title-line-inner">Control total en un solo lugar</span></span>
              </h2>
              <p className="section-subtitle">Herramientas <span className="highlight">poderosas</span> diseñadas para potenciar tu <span className="gold">productividad</span>.</p>

              <div className="features-grid">
                <div className="feature-card">
                  <div className="feature-icon-box">
                    <SyncIcon />
                  </div>
                  <h3 className="feature-title">Google Calendar</h3>
                  <p className="feature-desc">Sincronización bidireccional automática.</p>
                </div>

                <div className="feature-card">
                  <div className="feature-icon-box green-bg">
                    <DragIcon />
                  </div>
                  <h3 className="feature-title">Agenda Drag & Drop</h3>
                  <p className="feature-desc">Organiza tu día con un solo movimiento.</p>
                </div>

                <div className="feature-card">
                  <div className="feature-icon-box">
                    <MedicalIcon />
                  </div>
                  <h3 className="feature-title">Historial Clínico</h3>
                  <p className="feature-desc">Gestión completa de clientes y evolución.</p>
                </div>

                <div className="feature-card">
                  <div className="feature-icon-box green-bg">
                    <CardIcon />
                  </div>
                  <h3 className="feature-title">Control de Pagos</h3>
                  <p className="feature-desc">Múltiples métodos y registro en COP.</p>
                </div>

                <div className="feature-card">
                  <div className="feature-icon-box">
                    <BoxIcon />
                  </div>
                  <h3 className="feature-title">Inventario</h3>
                  <p className="feature-desc">Control de insumos y productos.</p>
                </div>

                <div className="feature-card">
                  <div className="feature-icon-box green-bg">
                    <ReportIcon />
                  </div>
                  <h3 className="feature-title">Reportes</h3>
                  <p className="feature-desc">Estadísticas clave para crecer.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Indicador de Scroll Minimalista */}
          <div className={`landing-scroll-hint ${hideHint ? 'hidden' : ''}`}>
            <span className="landing-scroll-text">Desliza para explorar</span>
            <div className="landing-scroll-line-outer">
              <div className="landing-scroll-line-inner" />
            </div>
          </div>

          {/* Indicador de Progreso por Hilo (4 puntos) */}
          <div className={`thread-progress-indicator ${hideHint ? 'visible' : ''}`} aria-label="Progreso de sección">
            {['Inicio', 'Sectores', 'Funciones', 'Detalle'].map((label, i) => (
              <div
                key={i}
                className={`thread-dot ${i === threadIndex ? 'active' : ''} ${i < threadIndex ? 'done' : ''}`}
                title={label}
              />
            ))}
          </div>

          {/* Espaciador de Scroll Físico */}
          <div className="landing-scroll-spacer" />

          {/* --- 4. SECCIÓN FINAL EN FLUJO (SCROLL NATURAL) --- */}
          <div className="landing-footer-flow">
            {/* Detalles & Mockup */}
            <section className="features-detail-section">
              <div className="lotus-bg">
                <LotusIcon />
              </div>
              <div className="detail-content">
                <div className="detail-left">
                  <h2 className="detail-title">No es solo software.<br />Es tu socio operativo.</h2>
                  <div className="detail-list">
                    <div className="detail-item">
                      <div className="detail-item-num">1</div>
                      <div className="detail-item-text">
                        <span className="detail-item-title">Acceso multi-dispositivo</span>
                        <span className="detail-item-desc">Gestiona desde tu PC, tablet o celular sin instalar nada.</span>
                      </div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-item-num">2</div>
                      <div className="detail-item-text">
                        <span className="detail-item-title">Subdominio propio</span>
                        <span className="detail-item-desc">ej: tunegocio.novagendas.com. Presencia profesional.</span>
                      </div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-item-num">3</div>
                      <div className="detail-item-text">
                        <span className="detail-item-title">Días festivos configurables</span>
                        <span className="detail-item-desc">Bloquea fechas automáticamente según tu calendario local.</span>
                      </div>
                    </div>
                    <div className="detail-item">
                      <div className="detail-item-num">4</div>
                      <div className="detail-item-text">
                        <span className="detail-item-title">Auditoría de cambios</span>
                        <span className="detail-item-desc">Registro detallado de quién agendó, movió o canceló una cita.</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="detail-right">
                  <div className="browser-mockup">
                    <div className="browser-header">
                      <div className="browser-dots">
                        <div className="browser-dot" />
                        <div className="browser-dot" />
                        <div className="browser-dot" />
                      </div>
                      <div className="browser-address">
                        🔒 tunegocio.novagendas.com
                      </div>
                    </div>
                    <div className="browser-dashboard">
                      <div className="browser-sidebar">
                        <div className="browser-side-item active" />
                        <div className="browser-side-item" />
                        <div className="browser-side-item" />
                        <div className="browser-side-item" />
                      </div>
                      <div className="browser-main">
                        <div className="browser-nav" />
                        <div className="browser-grid">
                          <div className="browser-left-pane">
                            <div className="browser-skeleton-line short" />
                            <div className="browser-skeleton-line medium" />
                            <div className="browser-skeleton-block" />
                          </div>
                          <div className="browser-right-pane">
                            <div className="browser-skeleton-line" />
                            <div className="browser-skeleton-block" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Banner de Cierre (CTA) */}
            <section className="landing-cta-banner">
              <h2 className="cta-banner-title">¿Listo para eliminar el caos?</h2>
              <p className="cta-banner-desc">Únete a los negocios que ya optimizan su tiempo con Novagendas.</p>
              <div className="cta-banner-actions">
                <a href="#demo" className="btn-white">Solicitar demo</a>
                <a href="https://wa.me/573026060889" className="btn-outline-white" target="_blank" rel="noopener noreferrer">
                  WhatsApp
                </a>
              </div>
            </section>

            {/* Footer Detallado */}
            <footer className="landing-footer">
              <div className="footer-top">
                <div className="footer-column">
                  <div className="footer-brand">Nova<span>gendas</span></div>
                  <p className="footer-brand-text">
                    La solución definitiva en agendamiento y gestión para centros estéticos, spas y consultorios.
                  </p>
                </div>
                <div className="footer-column">
                  <span className="footer-col-title">Contacto</span>
                  <div className="footer-contact-item">
                    📱 <a href="tel:+573026060889">WhatsApp: +57 302 606 0889</a>
                  </div>
                  <div className="footer-contact-item">
                    ✉️ <a href="mailto:notificaciog@novagendas.com">notificaciog@novagendas.com</a>
                  </div>
                </div>
                <div className="footer-column">
                  <span className="footer-col-title">Legal</span>
                  <a href="/terminos" className="footer-link">Términos y Condiciones</a>
                  <a href="/condiciones" className="footer-link">Privacidad</a>
                </div>
                <div className="footer-column">
                  <span className="footer-col-title">Social</span>
                  <button className="footer-share-btn" aria-label="Compartir Novagendas">
                    <ShareIcon />
                  </button>
                </div>
              </div>
              <div className="footer-bottom">
                <span>© {new Date().getFullYear()} Novagendas. Todos los derechos reservados.</span>
                <span>Bogotá, Colombia</span>
              </div>
            </footer>

            {/* Selector de Paleta Interactivo Flotante (Wow Factor) */}
            <div className={`landing-theme-selector ${isThemeOpen ? 'open' : ''}`}>
              <button
                className="landing-theme-trigger"
                onClick={() => setIsThemeOpen(!isThemeOpen)}
                title="Personalizar Paleta de Colores"
                aria-label="Personalizar Paleta de Colores"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M12 3a9 9 0 0 0-9 9 9 9 0 0 0 9 9 1.5 1.5 0 0 0 1.5-1.5c0-.39-.15-.74-.39-1.01a.39.39 0 0 1-.1-.24c0-.22.18-.4.4-.4h1.6c3.3 0 6-2.7 6-6 0-4.96-4.04-9-9-9zm-5.5 9a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3-3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm4.5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm3 3a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
                </svg>
              </button>

              {isThemeOpen && (
                <div className="landing-theme-panel">
                  <span className="theme-panel-title">Estilo de Marca</span>
                  <span className="theme-panel-subtitle">Predominancia de Azul</span>
                  <div className="theme-options">
                    <button
                      className={`theme-option-btn ${selectedPalette === 'classic' ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedPalette('classic');
                        localStorage.setItem('novagendas_palette', 'classic');
                      }}
                    >
                      <span className="option-color-preview" style={{ background: 'linear-gradient(135deg, #3b82f6 50%, #8b5cf6 50%)' }} />
                      <span className="option-label">Azul Premium</span>
                    </button>
                    <button
                      className={`theme-option-btn ${selectedPalette === 'sapphire' ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedPalette('sapphire');
                        localStorage.setItem('novagendas_palette', 'sapphire');
                      }}
                    >
                      <span className="option-color-preview" style={{ background: 'linear-gradient(135deg, #0f52ba 50%, #06b6d4 50%)' }} />
                      <span className="option-label">Zafiro Eléctrico</span>
                    </button>
                    <button
                      className={`theme-option-btn ${selectedPalette === 'indigo' ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedPalette('indigo');
                        localStorage.setItem('novagendas_palette', 'indigo');
                      }}
                    >
                      <span className="option-color-preview" style={{ background: 'linear-gradient(135deg, #4f46e5 50%, #ec4899 50%)' }} />
                      <span className="option-label">Índigo Real</span>
                    </button>
                    <button
                      className={`theme-option-btn ${selectedPalette === 'ocean' ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedPalette('ocean');
                        localStorage.setItem('novagendas_palette', 'ocean');
                      }}
                    >
                      <span className="option-color-preview" style={{ background: 'linear-gradient(135deg, #0284c7 50%, #10b981 50%)' }} />
                      <span className="option-label">Océano Fresco</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
    </div>
  );
}
