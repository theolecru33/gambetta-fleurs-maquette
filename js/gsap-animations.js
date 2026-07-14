/* ==========================================================================
   Gambetta fleurs — animations GSAP
   Sobres, au service du contenu. Respect de prefers-reduced-motion.
   ========================================================================== */

gsap.registerPlugin(ScrollTrigger);

var motionOK = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* La grille produits est re-rendue à chaque filtre : main.js appelle gfAnimerGrille() */
var grilleDejaVue = false;

window.gfAnimerGrille = function () {
  if (!motionOK) return;
  var cartes = document.querySelectorAll('#grille-produits .carte-produit');
  if (!cartes.length) return;

  // purge les anciens triggers de la grille avant d'en recréer
  ScrollTrigger.getAll().forEach(function (t) {
    if (t.vars && t.vars.id === 'grille') t.kill();
  });

  if (!grilleDejaVue) {
    grilleDejaVue = true;
    gsap.from(cartes, {
      y: 26,
      opacity: 0,
      duration: 0.65,
      stagger: 0.08,
      ease: 'power2.out',
      scrollTrigger: {
        id: 'grille',
        trigger: '#grille-produits',
        start: 'top 82%'
      }
    });
  } else {
    gsap.from(cartes, {
      y: 18,
      opacity: 0,
      duration: 0.45,
      stagger: 0.05,
      ease: 'power2.out'
    });
  }
};

function initAnimations() {

  /* --- Entrée du hero --- */
  var tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
  tl.from('.hero-kicker', { y: 20, opacity: 0, duration: 0.6 })
    .from('.hero-texte h1', { y: 28, opacity: 0, duration: 0.8 }, '-=0.35')
    .from('.hero-sous', { y: 24, opacity: 0, duration: 0.7 }, '-=0.5')
    .from('.hero-cta', { y: 20, opacity: 0, duration: 0.6 }, '-=0.45')
    .from('.hero-avis', { opacity: 0, duration: 0.6 }, '-=0.3')
    .from('.hero-visuel > img', { scale: 1.07, opacity: 0, duration: 1.1, ease: 'power3.out' }, 0.15)
    .from('.hero-carte', { y: 24, opacity: 0, duration: 0.7, ease: 'back.out(1.4)' }, '-=0.5');

  /* --- Parallax très léger sur l'image du hero --- */
  gsap.to('.hero-visuel > img', {
    y: 45,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true
    }
  });

  /* --- Bandeau réassurance --- */
  gsap.from('.reassurance-item', {
    y: 22,
    opacity: 0,
    duration: 0.55,
    stagger: 0.09,
    ease: 'power2.out',
    scrollTrigger: { trigger: '.reassurance', start: 'top 88%' }
  });

  /* --- Têtes de section --- */
  document.querySelectorAll('.section-tete').forEach(function (el) {
    gsap.from(el.children, {
      y: 24,
      opacity: 0,
      duration: 0.7,
      stagger: 0.1,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 85%' }
    });
  });

  /* --- Abonnement --- */
  gsap.from('.abonnement-visuel', {
    y: 34,
    opacity: 0,
    duration: 0.8,
    ease: 'power2.out',
    scrollTrigger: { trigger: '.abonnement-inner', start: 'top 78%' }
  });
  gsap.from('.abonnement-texte > *', {
    y: 24,
    opacity: 0,
    duration: 0.6,
    stagger: 0.08,
    ease: 'power2.out',
    scrollTrigger: { trigger: '.abonnement-inner', start: 'top 78%' }
  });

  /* --- Sur mesure --- */
  document.querySelectorAll('.surmesure-item').forEach(function (item) {
    gsap.from(item, {
      y: 26,
      opacity: 0,
      duration: 0.65,
      ease: 'power2.out',
      scrollTrigger: { trigger: item, start: 'top 86%' }
    });
  });

  /* --- Atelier : les deux images se dévoilent en décalé --- */
  gsap.from('.atelier-img-1', {
    y: 36,
    opacity: 0,
    duration: 0.85,
    ease: 'power2.out',
    scrollTrigger: { trigger: '.atelier-visuels', start: 'top 80%' }
  });
  gsap.from('.atelier-img-2', {
    y: 46,
    opacity: 0,
    duration: 0.85,
    delay: 0.18,
    ease: 'power2.out',
    scrollTrigger: { trigger: '.atelier-visuels', start: 'top 80%' }
  });
  gsap.from('.atelier-texte > *', {
    y: 22,
    opacity: 0,
    duration: 0.6,
    stagger: 0.08,
    ease: 'power2.out',
    scrollTrigger: { trigger: '.atelier-texte', start: 'top 80%' }
  });

  /* --- Avis --- */
  gsap.from('.avis-carte', {
    y: 26,
    opacity: 0,
    duration: 0.6,
    stagger: 0.1,
    ease: 'power2.out',
    scrollTrigger: { trigger: '.avis-grille', start: 'top 84%' }
  });

  /* --- Infos pratiques --- */
  gsap.from('.infos-venir > *', {
    y: 22,
    opacity: 0,
    duration: 0.6,
    stagger: 0.07,
    ease: 'power2.out',
    scrollTrigger: { trigger: '.infos-inner', start: 'top 80%' }
  });
  gsap.from('.infos-livraison > *', {
    y: 22,
    opacity: 0,
    duration: 0.6,
    stagger: 0.07,
    ease: 'power2.out',
    scrollTrigger: { trigger: '.infos-inner', start: 'top 80%' }
  });
}

if (motionOK) {
  initAnimations();
}

/* Recaler les déclencheurs une fois les images chargées */
window.addEventListener('load', function () { ScrollTrigger.refresh(); });
