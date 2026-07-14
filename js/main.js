/* ==========================================================================
   Gambetta fleurs — moteur de la boutique (maquette de démonstration)
   Panier en localStorage, modales maison (jamais de confirm() natif),
   tunnel de commande factice en 3 étapes.
   ========================================================================== */

(function () {
  'use strict';

  /* ---------- Données ---------- */

  // Clé PUBLIQUE de TEST Stripe (faite pour être exposée côté client ; aucun paiement réel
  // possible avec une clé pk_test_). À remplacer par la clé de Flora à la mise en ligne.
  // Un encaissement réel nécessitera EN PLUS un petit backend créant le PaymentIntent
  // (clé secrète, jamais côté navigateur) + l'authentification forte 3-D Secure.
  var STRIPE_PK = 'pk_test_TYooMQauvdEDq54NiTphI7jx';

  var LIVRAISON_OFFERTE = 60;
  var HEURE_LIMITE = 14; // commandé avant 14h = livré le jour même (mar-sam)

  var LIVRAISON_PRIX = 15; // tarif unique partout en France ; offerte dès LIVRAISON_OFFERTE

  var PRODUITS = [
    {
      id: 'flora', nom: 'Le bouquet de Flora', vedette: true,
      compo: 'les plus belles fleurs du jour',
      desc: 'Notre signature. Chaque matin, Flora compose avec les arrivages du marché : vous choisissez la taille, elle choisit les fleurs. Jamais deux fois le même, toujours de saison.',
      img: 'img/b-kraft-signature.jpg', badge: 'La signature',
      occasions: ['anniversaire', 'amour', 'merci'],
      tailles: [
        { code: 'S', label: 'Douceur', detail: 'une douzaine de tiges', prix: 25 },
        { code: 'M', label: 'Généreux', detail: 'une vingtaine de tiges', prix: 35 },
        { code: 'L', label: 'Opulent', detail: 'trente tiges et plus', prix: 49 }
      ]
    },
    {
      id: 'jetee-thiers', nom: 'Jetée Thiers',
      compo: 'tulipes de saison, papier kraft',
      desc: 'Des tulipes fraîches simplement nouées dans leur papier kraft, comme un matin de marché face à la jetée.',
      img: 'img/b-tulipes-roses.jpg',
      occasions: ['anniversaire', 'merci'],
      tailles: [
        { code: 'M', label: 'Le bouquet', detail: 'quinze tulipes', prix: 28 },
        { code: 'L', label: 'Le grand', detail: 'vingt-cinq tulipes', prix: 42 }
      ]
    },
    {
      id: 'ville-hiver', nom: "Ville d'Hiver",
      compo: 'roses crème, eucalyptus',
      desc: "Roses couleur crème et feuillage argenté. Une pièce élégante et apaisante, pensée pour accompagner les moments de recueillement comme les grandes occasions.",
      img: 'img/b-roses-blanches.jpg',
      occasions: ['deuil', 'amour'],
      tailles: [
        { code: 'M', label: 'Le bouquet', detail: 'roses et eucalyptus', prix: 44 },
        { code: 'L', label: 'Le grand', detail: 'format cérémonie', prix: 62 }
      ]
    },
    {
      id: 'pereire', nom: 'Pereire',
      compo: 'pivoines en pleine saison',
      desc: "La star du début d'été : des pivoines qui s'ouvrent en quelques jours et embaument toute la pièce. Quand il y en a, il faut en profiter.",
      img: 'img/b-pivoines.jpg', badge: 'De saison',
      occasions: ['amour', 'anniversaire'],
      tailles: [
        { code: 'M', label: 'Le bouquet', detail: 'sept pivoines, feuillage', prix: 39 },
        { code: 'L', label: 'Le grand', detail: 'douze pivoines', prix: 55 }
      ]
    },
    {
      id: 'abatilles', nom: 'Abatilles',
      compo: 'tulipes blanches',
      desc: "La simplicité lumineuse d'une brassée de tulipes blanches. Aussi juste pour dire merci que pour accompagner une pensée.",
      img: 'img/b-tulipes-blanches.jpg',
      occasions: ['deuil', 'merci'],
      tailles: [{ code: 'M', label: 'Le bouquet', detail: 'quinze tulipes', prix: 26 }]
    },
    {
      id: 'petit-bouquet', nom: "Le p'tit bouquet",
      compo: 'le petit format du jour',
      desc: "Le petit plaisir de la semaine : un format tout doux composé avec les fleurs du moment. Parfait pour s'offrir des fleurs sans raison.",
      img: 'img/b-boutique-chaise.jpg', badge: 'Petit prix',
      occasions: ['poursoi', 'merci'],
      tailles: [{ code: 'S', label: "Le p'tit", detail: 'huit tiges de saison', prix: 16 }]
    },
    {
      id: 'banc-arguin', nom: "Banc d'Arguin",
      compo: "fleurs séchées, tons d'été indien",
      desc: "Un bouquet sec aux couleurs chaudes, qui ne demande ni eau ni entretien et reste beau des mois durant.",
      img: 'img/b-sechees-kraft.jpg',
      occasions: ['sechees', 'poursoi'],
      tailles: [{ code: 'M', label: 'Le bouquet', detail: 'séché, longue durée', prix: 34 }]
    },
    {
      id: 'dune', nom: 'Dune',
      compo: 'composition séchée, vase compris',
      desc: 'Une composition de fleurs séchées installée dans son vase, prête à poser. Le cadeau déco qui dure.',
      img: 'img/b-sechees-vase.jpg', badge: 'Vase compris',
      occasions: ['sechees'],
      tailles: [{ code: 'M', label: 'La composition', detail: 'vase en céramique compris', prix: 46 }]
    },
    {
      id: 'moulleau', nom: 'Moulleau',
      compo: 'roses et fleurs des champs',
      desc: "L'esprit bord de mer : des roses pastel mêlées de fleurs champêtres, léger et lumineux comme une fin de journée au Moulleau.",
      img: 'img/b-champetre-pastel.jpg',
      occasions: ['anniversaire', 'amour'],
      tailles: [
        { code: 'M', label: 'Le bouquet', detail: 'roses et champêtres', prix: 32 },
        { code: 'L', label: 'Le grand', detail: 'le format généreux', prix: 46 }
      ]
    },
    {
      id: 'aiguillon', nom: "L'Aiguillon",
      compo: 'camomilles, chrysanthèmes',
      desc: 'Un bouquet des prés, frais et spontané, qui sent bon la campagne. Le merci parfait.',
      img: 'img/b-camomille.jpg',
      occasions: ['merci', 'poursoi'],
      tailles: [{ code: 'M', label: 'Le bouquet', detail: 'champêtre du moment', prix: 29 }]
    },
    {
      id: 'parc-mauresque', nom: 'Parc Mauresque',
      compo: 'roses poudrées, fleurs fines',
      desc: 'Des roses aux teintes poudrées et des fleurs toutes fines. Romantique sans en faire trop, comme une promenade au parc.',
      img: 'img/b-roses-pastel.jpg',
      occasions: ['amour'],
      tailles: [
        { code: 'M', label: 'Le bouquet', detail: 'roses et fleurs fines', prix: 36 },
        { code: 'L', label: 'Le grand', detail: 'le format généreux', prix: 52 }
      ]
    },
    {
      id: 'presquile', nom: "Presqu'île",
      compo: 'fleurs et graminées du moment',
      desc: "Le bouquet brut de l'atelier : fleurs de saison et graminées, noué serré dans son papier. Un peu sauvage, très nature.",
      img: 'img/b-rustique.jpg',
      occasions: ['merci', 'anniversaire'],
      tailles: [{ code: 'M', label: 'Le bouquet', detail: 'nature et graminées', prix: 31 }]
    }
  ];

  var ABONNEMENT = {
    id: 'abonnement', nom: "L'abonnement floral", abonnement: true,
    compo: 'des fleurs fraîches, livrées chez vous',
    desc: "Flora compose un bouquet du moment et vous le livre au rythme choisi. Sans engagement : vous suspendez ou arrêtez quand vous voulez, la livraison est offerte.",
    img: 'img/b-boutique-chaise.jpg', badge: 'Livraison offerte',
    occasions: [],
    tailles: [
      { code: 'S', label: 'Le bouquet', detail: 'une douzaine de tiges', prix: 25 },
      { code: 'M', label: 'Le généreux', detail: 'une vingtaine de tiges', prix: 35 },
      { code: 'L', label: "L'opulent", detail: 'le grand format', prix: 49 }
    ]
  };

  var AVIS = [
    {
      auteur: 'Sellier L.', quand: 'octobre 2025',
      texte: "Je suis de Toulouse et j'ai eu raison de leur faire confiance pour faire livrer de magnifiques bouquets à mes grands-parents sur Arcachon. Merci encore !"
    },
    {
      auteur: 'Marie M.', quand: 'février 2025',
      texte: 'Ravissant bouquet, composé avec beaucoup de goût. Un grand merci, la surprise fut parfaite.'
    },
    {
      auteur: 'Sabrina H.', quand: 'janvier 2025',
      texte: 'Le bouquet était magnifique ! Je recommande à 100 %. Très bonne communication, ma fille était ravie.'
    },
    {
      auteur: 'Marmotte H.', quand: 'décembre 2024',
      texte: "Les fleurs que je souhaitais n'étaient pas disponibles alors la fleuriste m'a appelée et je lui ai laissé le choix sur un bouquet de saison. Il est superbe, merci beaucoup !"
    }
  ];

  var SUGGESTIONS_MESSAGE = [
    'Joyeux anniversaire !',
    'Merci pour tout.',
    'Avec tout mon amour.',
    'Félicitations à vous deux.',
    'Toutes mes condoléances.',
    'Prompt rétablissement.'
  ];

  /* ---------- Petites aides ---------- */

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $$(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function euros(n) {
    var texte = (Math.round(n * 100) / 100).toFixed(2).replace('.', ',');
    return texte.replace(',00', '') + ' €';
  }

  function eurosPanier(n) {
    return (Math.round(n * 100) / 100).toFixed(2).replace('.', ',') + ' €';
  }

  function produitParId(id) {
    if (id === 'abonnement') return ABONNEMENT;
    for (var i = 0; i < PRODUITS.length; i++) if (PRODUITS[i].id === id) return PRODUITS[i];
    return null;
  }

  function tailleDe(produit, code) {
    for (var i = 0; i < produit.tailles.length; i++) if (produit.tailles[i].code === code) return produit.tailles[i];
    return produit.tailles[0];
  }

  function echap(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  var JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  var MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

  /* ---------- Messages de délai (avant 14h = jour même) ---------- */

  function livraisonAujourdhuiPossible(d) {
    var jour = d.getDay(); // livraison du mardi (2) au samedi (6)
    return jour >= 2 && jour <= 6 && d.getHours() < HEURE_LIMITE;
  }

  function messageDelai() {
    var now = new Date();
    if (livraisonAujourdhuiPossible(now)) {
      var restant = HEURE_LIMITE - now.getHours() - (now.getMinutes() > 0 ? 1 : 0);
      var minutes = now.getMinutes() > 0 ? 60 - now.getMinutes() : 0;
      var restantTexte = restant > 0 ? restant + 'h' + (minutes ? String(minutes).padStart(2, '0') : '') : minutes + ' min';
      return 'Commandé dans les ' + restantTexte + ', votre bouquet est livré aujourd’hui.';
    }
    var prochain = new Date(now);
    prochain.setDate(prochain.getDate() + 1);
    while (prochain.getDay() < 2) prochain.setDate(prochain.getDate() + 1); // saute dim et lun
    var demain = new Date(now);
    demain.setDate(demain.getDate() + 1);
    var quand = (prochain.getDate() === demain.getDate() && prochain.getMonth() === demain.getMonth())
      ? 'demain' : JOURS[prochain.getDay()];
    return 'Commandé maintenant, votre bouquet est livré ' + quand + ' dans la matinée.';
  }

  /* ---------- État du panier ---------- */

  var panier = [];
  try {
    var brut = localStorage.getItem('gf_panier');
    if (brut) panier = JSON.parse(brut) || [];
  } catch (e) { panier = []; }

  function sauver() {
    try { localStorage.setItem('gf_panier', JSON.stringify(panier)); } catch (e) { /* stockage plein ou bloqué */ }
  }

  function totalPanier() {
    var t = 0;
    panier.forEach(function (l) {
      var p = produitParId(l.pid);
      if (p) t += tailleDe(p, l.taille).prix * l.qte;
    });
    return t;
  }

  function nbArticles() {
    var n = 0;
    panier.forEach(function (l) { n += l.qte; });
    return n;
  }

  /* ---------- Références DOM ---------- */

  var grille = $('#grille-produits');
  var drawer = $('#panier');
  var voile = $('#voile');
  var modaleProduit = $('#modale-produit');
  var modaleCommande = $('#modale-commande');
  var modaleConfirm = $('#modale-confirm');
  var toasts = $('#toasts');
  var barreMobile = $('#barre-mobile');

  var focusAvantModale = null;

  /* ---------- Toast ---------- */

  function toast(texte) {
    var el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10.5 8.2 15 16 5.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' + echap(texte);
    toasts.appendChild(el);
    requestAnimationFrame(function () { el.classList.add('visible'); });
    setTimeout(function () {
      el.classList.remove('visible');
      setTimeout(function () { el.remove(); }, 350);
    }, 2600);
  }

  /* ---------- Ouverture / fermeture générique (voile, focus, échap) ---------- */

  function ouvrirVoile() {
    voile.hidden = false;
    void voile.offsetWidth; // force un reflow pour déclencher la transition (fiable même onglet en arrière-plan)
    voile.classList.add('visible');
  }

  function fermerVoile() {
    voile.classList.remove('visible');
    setTimeout(function () { voile.hidden = true; }, 300);
  }

  function focusDans(conteneur) {
    var focusables = $$('button, [href], input, select, textarea, summary', conteneur).filter(function (el) {
      return !el.disabled && el.offsetParent !== null;
    });
    if (focusables.length) focusables[0].focus();
  }

  function pieger(e, conteneur) {
    if (e.key !== 'Tab') return;
    var focusables = $$('button, [href], input, select, textarea, summary', conteneur).filter(function (el) {
      return !el.disabled && el.offsetParent !== null;
    });
    if (!focusables.length) return;
    var premier = focusables[0];
    var dernier = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === premier) { e.preventDefault(); dernier.focus(); }
    else if (!e.shiftKey && document.activeElement === dernier) { e.preventDefault(); premier.focus(); }
  }

  /* ---------- Rendu de la grille produits ---------- */

  var filtreActif = 'tous';

  function carteProduitHTML(p) {
    var depuis = p.tailles.length > 1 ? '<small>à partir de</small> ' : '';
    var prixMini = p.tailles.reduce(function (m, t) { return Math.min(m, t.prix); }, Infinity);
    return '' +
      '<article class="carte-produit' + (p.vedette ? ' vedette' : '') + '" data-pid="' + p.id + '">' +
        '<div class="carte-produit-visuel">' +
          (p.badge ? '<span class="carte-badge">' + echap(p.badge) + '</span>' : '') +
          '<img src="' + p.img + '" alt="' + echap(p.nom + ', ' + p.compo) + '" width="700" height="822" loading="lazy">' +
          '<button type="button" class="carte-ajout" data-ouvrir-produit="' + p.id + '" aria-label="Découvrir ' + echap(p.nom) + '">' +
            '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>' +
          '</button>' +
        '</div>' +
        '<div class="carte-produit-corps">' +
          '<h3 class="carte-produit-nom">' + echap(p.nom) + '</h3>' +
          '<p class="carte-produit-compo">' + echap(p.compo) + '</p>' +
          '<p class="carte-produit-prix">' + depuis + euros(prixMini) + '</p>' +
        '</div>' +
      '</article>';
  }

  function rendreGrille() {
    var liste = PRODUITS.filter(function (p) {
      return filtreActif === 'tous' || p.occasions.indexOf(filtreActif) !== -1;
    });
    grille.innerHTML = liste.map(carteProduitHTML).join('');

    // toute la carte est cliquable (en plus du bouton +)
    $$('.carte-produit', grille).forEach(function (carte) {
      carte.addEventListener('click', function (e) {
        var bouton = e.target.closest('[data-ouvrir-produit]');
        ouvrirProduit(carte.getAttribute('data-pid'), !!bouton);
      });
    });

    if (window.gfAnimerGrille) window.gfAnimerGrille();
  }

  /* ---------- Filtres ---------- */

  $$('#filtres .filtre').forEach(function (btn) {
    btn.addEventListener('click', function () {
      filtreActif = btn.getAttribute('data-filtre');
      $$('#filtres .filtre').forEach(function (b) {
        var actif = b === btn;
        b.classList.toggle('actif', actif);
        b.setAttribute('aria-pressed', actif ? 'true' : 'false');
      });
      rendreGrille();
    });
  });

  /* ---------- Modale produit ---------- */

  var produitOuvert = null;
  var tailleChoisie = null;
  var freqChoisie = 'semaine';
  var qteChoisie = 1;

  function ouvrirProduit(pid, direct) {
    var p = produitParId(pid);
    if (!p) return;
    produitOuvert = p;
    tailleChoisie = p.tailles.length > 1 ? p.tailles[1].code : p.tailles[0].code;
    if (p.tailles.length === 2) tailleChoisie = p.tailles[0].code;
    qteChoisie = 1;
    freqChoisie = 'semaine';

    $('#mp-img').src = p.img;
    $('#mp-img').alt = p.nom + ', ' + p.compo;
    $('#mp-nom').textContent = p.nom;
    $('#mp-compo').textContent = p.compo;
    $('#mp-desc').textContent = p.desc;

    var badge = $('#mp-badge');
    badge.hidden = !p.badge;
    if (p.badge) badge.textContent = p.badge;

    var zone = $('#mp-tailles');
    var html = '<legend>' + (p.abonnement ? 'Choisissez la formule' : 'Choisissez la taille') + '</legend><div class="mp-tailles-liste">';
    p.tailles.forEach(function (t) {
      html += '' +
        '<div class="mp-taille">' +
          '<input type="radio" name="mp-taille" id="mpt-' + t.code + '" value="' + t.code + '"' + (t.code === tailleChoisie ? ' checked' : '') + '>' +
          '<label for="mpt-' + t.code + '"><strong>' + echap(t.label) + ' · ' + euros(t.prix) + '</strong><span>' + echap(t.detail) + '</span></label>' +
        '</div>';
    });
    html += '</div>';

    if (p.abonnement) {
      html += '<legend style="margin-top:18px">À quel rythme ?</legend><div class="mp-tailles-liste">' +
        '<div class="mp-taille"><input type="radio" name="mp-freq" id="mpf-semaine" value="semaine" checked><label for="mpf-semaine"><strong>Chaque semaine</strong><span>le rendez-vous du vendredi</span></label></div>' +
        '<div class="mp-taille"><input type="radio" name="mp-freq" id="mpf-quinzaine" value="quinzaine"><label for="mpf-quinzaine"><strong>Tous les quinze jours</strong><span>une semaine sur deux</span></label></div>' +
      '</div>';
    }
    zone.innerHTML = html;

    $$('input[name="mp-taille"]', zone).forEach(function (r) {
      r.addEventListener('change', function () { tailleChoisie = r.value; majPrixModale(); });
    });
    $$('input[name="mp-freq"]', zone).forEach(function (r) {
      r.addEventListener('change', function () { freqChoisie = r.value; });
    });

    $('#mp-qte').textContent = '1';
    var blocQte = $('.mp-quantite');
    blocQte.style.display = p.abonnement ? 'none' : '';

    $('#mp-livraison').textContent = p.abonnement
      ? 'Livraison offerte, sans engagement.'
      : messageDelai() + ' Partout en France en 24 à 48h. Retrait boutique gratuit.';

    majPrixModale();
    ouvrirModale(modaleProduit);
  }

  function majPrixModale() {
    if (!produitOuvert) return;
    var prix = tailleDe(produitOuvert, tailleChoisie).prix * qteChoisie;
    $('#mp-prix').textContent = euros(prix) + (produitOuvert.abonnement ? ' / bouquet' : '');
    $('#mp-ajouter').firstChild.textContent = (produitOuvert.abonnement ? "M'abonner · " : 'Ajouter au panier · ');
  }

  $('#mp-moins').addEventListener('click', function () {
    if (qteChoisie > 1) { qteChoisie--; $('#mp-qte').textContent = qteChoisie; majPrixModale(); }
  });
  $('#mp-plus').addEventListener('click', function () {
    if (qteChoisie < 9) { qteChoisie++; $('#mp-qte').textContent = qteChoisie; majPrixModale(); }
  });

  $('#mp-ajouter').addEventListener('click', function () {
    if (!produitOuvert) return;
    ajouterAuPanier(produitOuvert.id, tailleChoisie, qteChoisie, produitOuvert.abonnement ? freqChoisie : null);
    fermerModale(modaleProduit);
    ouvrirPanier();
  });

  /* ---------- Modales : ouverture / fermeture ---------- */

  var modaleOuverte = null;

  function ouvrirModale(m) {
    focusAvantModale = document.activeElement;
    modaleOuverte = m;
    m.hidden = false;
    document.body.style.overflow = 'hidden';
    void m.offsetWidth; // force un reflow pour déclencher la transition
    m.classList.add('visible');
    setTimeout(function () { focusDans(m); }, 60);
  }

  function fermerModale(m) {
    if (!m) return;
    m.classList.remove('visible');
    modaleOuverte = null;
    document.body.style.overflow = '';
    setTimeout(function () { m.hidden = true; }, 300);
    if (focusAvantModale && focusAvantModale.focus) focusAvantModale.focus();
  }

  $$('.modale').forEach(function (m) {
    m.addEventListener('click', function (e) {
      if (e.target === m) fermerModale(m);
    });
    m.addEventListener('keydown', function (e) { pieger(e, m); });
  });

  $$('[data-fermer-modale]').forEach(function (b) {
    b.addEventListener('click', function () { fermerModale(b.closest('.modale')); });
  });

  /* ---------- Panier : opérations ---------- */

  function ajouterAuPanier(pid, taille, qte, freq) {
    var existante = null;
    panier.forEach(function (l) {
      if (l.pid === pid && l.taille === taille && l.freq === (freq || null)) existante = l;
    });
    if (existante) existante.qte = Math.min(existante.qte + qte, 9);
    else panier.push({ pid: pid, taille: taille, qte: qte, freq: freq || null });
    sauver();
    majPanier();
    var p = produitParId(pid);
    toast(p.abonnement ? 'Abonnement ajouté au panier' : p.nom + ' ajouté au panier');
  }

  function changerQte(index, delta) {
    var l = panier[index];
    if (!l) return;
    l.qte += delta;
    if (l.qte <= 0) panier.splice(index, 1);
    if (l.qte > 9) l.qte = 9;
    sauver();
    majPanier();
  }

  function retirerLigne(index) {
    panier.splice(index, 1);
    sauver();
    majPanier();
  }

  /* ---------- Panier : rendu ---------- */

  function majPanier() {
    var n = nbArticles();
    var total = totalPanier();

    var compte = $('#panier-compte');
    compte.hidden = n === 0;
    compte.textContent = n;

    // barre mobile
    if (n > 0) {
      barreMobile.hidden = false;
      document.body.classList.add('panier-plein');
      $('#barre-mobile-total').textContent = eurosPanier(total);
    } else {
      barreMobile.hidden = true;
      document.body.classList.remove('panier-plein');
    }

    // jauge livraison offerte
    var jaugeTexte = $('#panier-jauge-texte');
    var jaugeBarre = $('#panier-jauge-barre');
    var pct = Math.min(100, (total / LIVRAISON_OFFERTE) * 100);
    jaugeBarre.style.width = pct + '%';
    if (total >= LIVRAISON_OFFERTE) {
      jaugeTexte.textContent = 'La livraison vous est offerte';
      jaugeTexte.classList.add('atteint');
      jaugeBarre.style.background = 'var(--vert)';
    } else {
      jaugeTexte.textContent = 'Plus que ' + eurosPanier(LIVRAISON_OFFERTE - total) + ' pour la livraison offerte';
      jaugeTexte.classList.remove('atteint');
      jaugeBarre.style.background = '';
    }

    var livraisonInfo = $('#panier-livraison-info');
    if (livraisonInfo) {
      livraisonInfo.textContent = total >= LIVRAISON_OFFERTE ? 'offerte' : '15 €, offerte dès 60 €';
      livraisonInfo.classList.toggle('offerte', total >= LIVRAISON_OFFERTE);
    }

    // lignes
    var corps = $('#panier-corps');
    if (!panier.length) {
      corps.innerHTML = '' +
        '<div class="panier-vide">' +
          '<svg viewBox="0 0 28 28" aria-hidden="true"><path d="M14 24V10M14 10c0-5 3.5-7 7-7 0 5-3 7-7 7Zm0 0c0-5-3.5-7-7-7 0 5 3 7 7 7Zm0 6c0-3.5 2.5-5 5.5-5-.4 3.5-2.2 5-5.5 5Z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>' +
          '<p>Votre panier attend ses premières fleurs.</p>' +
          '<button type="button" class="btn btn-ligne" data-fermer-panier data-va-boutique>Découvrir les bouquets</button>' +
        '</div>';
    } else {
      corps.innerHTML = panier.map(function (l, i) {
        var p = produitParId(l.pid);
        if (!p) return '';
        var t = tailleDe(p, l.taille);
        var sousTitre = t.label + ' · ' + t.detail;
        if (l.freq) sousTitre = t.label + ' · ' + (l.freq === 'semaine' ? 'chaque semaine' : 'tous les quinze jours');
        return '' +
          '<div class="panier-ligne">' +
            '<img src="' + p.img + '" alt="" width="72" height="88">' +
            '<div class="panier-ligne-infos">' +
              '<p class="panier-ligne-nom">' + echap(p.nom) + '</p>' +
              '<p class="panier-ligne-taille">' + echap(sousTitre) + '</p>' +
              '<p class="panier-ligne-prix">' + eurosPanier(t.prix * l.qte) + (l.freq ? ' <small>/ bouquet</small>' : '') + '</p>' +
            '</div>' +
            '<div class="panier-ligne-actions">' +
              '<button type="button" class="ligne-retirer" data-retirer="' + i + '" aria-label="Retirer ' + echap(p.nom) + ' du panier">' +
                '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>' +
              '</button>' +
              '<div class="stepper" role="group" aria-label="Quantité pour ' + echap(p.nom) + '">' +
                '<button type="button" data-moins="' + i + '" aria-label="Réduire la quantité">−</button>' +
                '<span>' + l.qte + '</span>' +
                '<button type="button" data-plus="' + i + '" aria-label="Augmenter la quantité">+</button>' +
              '</div>' +
            '</div>' +
          '</div>';
      }).join('');
    }

    $('#panier-total').textContent = eurosPanier(total);
    $('#panier-pied').style.display = panier.length ? '' : 'none';

    // brancher les actions des lignes
    $$('[data-moins]', corps).forEach(function (b) {
      b.addEventListener('click', function () { changerQte(parseInt(b.getAttribute('data-moins'), 10), -1); });
    });
    $$('[data-plus]', corps).forEach(function (b) {
      b.addEventListener('click', function () { changerQte(parseInt(b.getAttribute('data-plus'), 10), 1); });
    });
    $$('[data-retirer]', corps).forEach(function (b) {
      b.addEventListener('click', function () { retirerLigne(parseInt(b.getAttribute('data-retirer'), 10)); });
    });
    $$('[data-fermer-panier]', corps).forEach(function (b) {
      b.addEventListener('click', function () {
        fermerPanier();
        if (b.hasAttribute('data-va-boutique')) {
          document.getElementById('boutique').scrollIntoView({ behavior: 'smooth' });
        }
      });
    });
  }

  /* ---------- Drawer panier ---------- */

  var panierOuvert = false;

  function ouvrirPanier() {
    panierOuvert = true;
    drawer.hidden = false;
    ouvrirVoile();
    document.body.style.overflow = 'hidden';
    void drawer.offsetWidth; // force un reflow pour déclencher la transition d'ouverture
    drawer.classList.add('ouvert');
    setTimeout(function () { focusDans(drawer); }, 100);
  }

  function fermerPanier() {
    panierOuvert = false;
    drawer.classList.remove('ouvert');
    fermerVoile();
    document.body.style.overflow = '';
    setTimeout(function () { drawer.hidden = true; }, 350);
  }

  $('#btn-panier').addEventListener('click', ouvrirPanier);
  $('#barre-mobile-btn').addEventListener('click', ouvrirPanier);
  $$('.panier-tete [data-fermer-panier]').forEach(function (b) { b.addEventListener('click', fermerPanier); });
  drawer.addEventListener('keydown', function (e) { pieger(e, drawer); });
  voile.addEventListener('click', function () { if (panierOuvert) fermerPanier(); });

  /* ---------- Vider le panier (modale maison) ---------- */

  $('#btn-vider').addEventListener('click', function () { ouvrirModale(modaleConfirm); });
  $('#conf-annuler').addEventListener('click', function () { fermerModale(modaleConfirm); });
  $('#conf-valider').addEventListener('click', function () {
    panier = [];
    sauver();
    majPanier();
    fermerModale(modaleConfirm);
    toast('Panier vidé');
  });

  /* ---------- Tunnel de commande ---------- */

  var commande = {};

  function ouvrirCommande() {
    if (!panier.length) return;
    commande = {
      mode: 'livraison',
      date: null,
      creneau: null,
      moisAffiche: null,
      acheteur: {},
      destinataire: {},
      message: '',
      anonyme: false
    };
    fermerPanier();
    $('#mc-etapes').style.visibility = '';
    setTimeout(function () {
      allerEtape(1);
      ouvrirModale(modaleCommande);
    }, 200);
  }

  $('#btn-commander').addEventListener('click', ouvrirCommande);

  function majEtapes(n) {
    $$('#mc-etapes li').forEach(function (li) {
      var num = parseInt(li.getAttribute('data-etape'), 10);
      li.classList.toggle('active', num === n);
      li.classList.toggle('faite', num < n);
    });
  }

  function fraisLivraison() {
    if (commande.mode === 'retrait') return 0;
    if (totalPanier() >= LIVRAISON_OFFERTE) return 0;
    return LIVRAISON_PRIX;
  }

  /* --- Étape 1 : livraison ou retrait + date + créneau --- */

  function allerEtape(n) {
    majEtapes(n);
    if (n === 1) rendreEtape1();
    if (n === 2) rendreEtape2();
    if (n === 3) rendreEtape3();
    $('#mc-boite').scrollTop = 0;
  }

  function rendreEtape1() {
    var corps = $('#mc-corps');
    var fraisTexte = totalPanier() >= LIVRAISON_OFFERTE ? 'offerte' : euros(LIVRAISON_PRIX);

    corps.innerHTML = '' +
      '<div class="mc-choix-mode" role="radiogroup" aria-label="Livraison ou retrait">' +
        '<div class="mc-mode">' +
          '<input type="radio" name="mc-mode" id="mode-livraison" value="livraison"' + (commande.mode === 'livraison' ? ' checked' : '') + '>' +
          '<label for="mode-livraison"><strong>Livraison · ' + fraisTexte + '</strong><span>partout en France, offerte dès 60 €</span></label>' +
        '</div>' +
        '<div class="mc-mode">' +
          '<input type="radio" name="mc-mode" id="mode-retrait" value="retrait"' + (commande.mode === 'retrait' ? ' checked' : '') + '>' +
          '<label for="mode-retrait"><strong>Retrait boutique</strong><span>gratuit, 7 jours sur 7</span></label>' +
        '</div>' +
      '</div>' +
      '<div class="mc-calendrier">' +
        '<label style="display:block;font-weight:600;font-size:0.92rem;margin-bottom:10px" id="mc-cal-label">Choisissez votre date</label>' +
        '<div id="mc-calendrier-zone"></div>' +
        '<p class="mc-cal-aide" id="mc-cal-aide"></p>' +
      '</div>' +
      '<div class="mc-champ">' +
        '<label id="mc-creneau-label">Sur quel créneau ?</label>' +
        '<div class="mc-creneaux" role="radiogroup" aria-labelledby="mc-creneau-label" id="mc-creneaux"></div>' +
        '<p class="mc-erreur" id="mc-erreur-etape1" style="display:none"></p>' +
      '</div>' +
      '<div class="mc-recap mc-recap-mini" id="mc-total-e1"></div>' +
      '<div class="mc-actions">' +
        '<button type="button" class="btn btn-plein" id="mc-suite-1">Continuer</button>' +
      '</div>';

    $$('input[name="mc-mode"]', corps).forEach(function (r) {
      r.addEventListener('change', function () {
        commande.mode = r.value;
        commande.date = null;
        commande.creneau = null;
        rendreCalendrier();
        rendreCreneaux();
        majTotalEtape1();
      });
    });

    rendreCalendrier();
    rendreCreneaux();
    majTotalEtape1();

    $('#mc-suite-1').addEventListener('click', function () {
      var err = $('#mc-erreur-etape1');
      if (!commande.date) {
        err.textContent = 'Choisissez une date dans le calendrier.';
        err.style.display = 'block';
        return;
      }
      if (!commande.creneau) {
        err.textContent = 'Choisissez un créneau.';
        err.style.display = 'block';
        return;
      }
      allerEtape(2);
    });
  }

  // Total livraison comprise, visible dès l'étape 1 (mis à jour au changement de commune ou de mode)
  function majTotalEtape1() {
    var bloc = $('#mc-total-e1');
    if (!bloc) return;
    var total = totalPanier();
    var frais = fraisLivraison();
    var ligneFrais;
    if (commande.mode === 'retrait') ligneFrais = '<div class="mc-recap-ligne"><span>Retrait boutique</span><span>gratuit</span></div>';
    else ligneFrais = '<div class="mc-recap-ligne"><span>Livraison</span><span>' + (frais === 0 ? 'offerte' : eurosPanier(frais)) + '</span></div>';
    bloc.innerHTML =
      '<div class="mc-recap-ligne"><span>Sous-total</span><span>' + eurosPanier(total) + '</span></div>' +
      ligneFrais +
      '<div class="mc-recap-ligne total"><span>Total</span><span>' + eurosPanier(total + frais) + '</span></div>';
  }

  function jourOuvrable(d) {
    if (commande.mode === 'retrait') return true; // boutique ouverte 7j/7
    var j = d.getDay();
    return j >= 2 && j <= 6; // livraison mar-sam
  }

  function dateSelectionnable(d) {
    var now = new Date();
    var aujourdhui = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var jour = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    if (jour < aujourdhui) return false;
    var horizon = new Date(aujourdhui);
    horizon.setDate(horizon.getDate() + 28);
    if (jour > horizon) return false;
    if (!jourOuvrable(d)) return false;
    if (jour.getTime() === aujourdhui.getTime()) {
      if (commande.mode === 'livraison') return now.getHours() < HEURE_LIMITE;
      // retrait : jusqu'à environ 1h avant la fermeture (13h le dimanche, 19h sinon)
      return now.getHours() < (d.getDay() === 0 ? 12 : 18);
    }
    return true;
  }

  function rendreCalendrier() {
    var zone = $('#mc-calendrier-zone');
    var now = new Date();
    if (!commande.moisAffiche) commande.moisAffiche = new Date(now.getFullYear(), now.getMonth(), 1);
    var m = commande.moisAffiche;

    var premierJour = new Date(m.getFullYear(), m.getMonth(), 1);
    var nbJours = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
    var decalage = (premierJour.getDay() + 6) % 7; // lundi = 0

    var moisCourant = new Date(now.getFullYear(), now.getMonth(), 1);
    var moisMax = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    var precDesactive = m <= moisCourant;
    var suivDesactive = m >= moisMax;

    var html = '' +
      '<div class="mc-cal-tete">' +
        '<button type="button" class="mc-cal-nav" id="mc-cal-prec" aria-label="Mois précédent"' + (precDesactive ? ' disabled' : '') + '>&#8592;</button>' +
        '<strong>' + MOIS[m.getMonth()] + ' ' + m.getFullYear() + '</strong>' +
        '<button type="button" class="mc-cal-nav" id="mc-cal-suiv" aria-label="Mois suivant"' + (suivDesactive ? ' disabled' : '') + '>&#8594;</button>' +
      '</div>' +
      '<div class="mc-cal-grille">';

    ['lu', 'ma', 'me', 'je', 've', 'sa', 'di'].forEach(function (j) {
      html += '<span class="mc-cal-jour-nom" aria-hidden="true">' + j + '</span>';
    });
    for (var v = 0; v < decalage; v++) html += '<span></span>';
    for (var jr = 1; jr <= nbJours; jr++) {
      var d = new Date(m.getFullYear(), m.getMonth(), jr);
      var ok = dateSelectionnable(d);
      var choisi = commande.date && commande.date.getTime() === d.getTime();
      html += '<button type="button" class="mc-cal-jour' + (choisi ? ' choisi' : '') + '" data-jour="' + jr + '"' +
        (ok ? '' : ' disabled') +
        ' aria-label="' + JOURS[d.getDay()] + ' ' + jr + ' ' + MOIS[m.getMonth()] + '"' +
        '>' + jr + '</button>';
    }
    html += '</div>';
    zone.innerHTML = html;

    $('#mc-cal-aide').textContent = commande.mode !== 'livraison'
      ? 'Retrait 7 jours sur 7 aux horaires de la boutique, le dimanche jusqu’à 13h.'
      : 'Livraison du mardi au samedi. ' + messageDelai() + ' Hors du Bassin, comptez 24 à 48h de transport.';

    var prec = $('#mc-cal-prec');
    var suiv = $('#mc-cal-suiv');
    if (prec) prec.addEventListener('click', function () {
      commande.moisAffiche = new Date(m.getFullYear(), m.getMonth() - 1, 1);
      rendreCalendrier();
    });
    if (suiv) suiv.addEventListener('click', function () {
      commande.moisAffiche = new Date(m.getFullYear(), m.getMonth() + 1, 1);
      rendreCalendrier();
    });

    $$('.mc-cal-jour:not(:disabled)', zone).forEach(function (b) {
      b.addEventListener('click', function () {
        commande.date = new Date(m.getFullYear(), m.getMonth(), parseInt(b.getAttribute('data-jour'), 10));
        commande.creneau = null;
        rendreCalendrier();
        rendreCreneaux();
      });
    });
  }

  function rendreCreneaux() {
    var zone = $('#mc-creneaux');
    var creneaux = [
      { id: 'matin', label: 'Matin · 9h30 à 12h30' },
      { id: 'apresmidi', label: 'Après-midi · 14h à 19h' }
    ];
    var dimancheChoisi = commande.date && commande.date.getDay() === 0;
    var lundiChoisi = commande.date && commande.date.getDay() === 1;
    var aujourdHuiChoisi = false;
    if (commande.date) {
      var now = new Date();
      aujourdHuiChoisi = commande.date.getDate() === now.getDate() &&
        commande.date.getMonth() === now.getMonth() &&
        commande.date.getFullYear() === now.getFullYear();
    }

    zone.innerHTML = creneaux.map(function (c) {
      var desactive = false;
      if (c.id === 'apresmidi' && dimancheChoisi) desactive = true; // dimanche : matin seulement
      if (c.id === 'matin' && lundiChoisi) desactive = true; // lundi : ouverture à 14h30
      if (c.id === 'matin' && aujourdHuiChoisi && new Date().getHours() >= 11) desactive = true;
      return '' +
        '<div class="mc-creneau">' +
          '<input type="radio" name="mc-creneau" id="cr-' + c.id + '" value="' + c.id + '"' +
            (commande.creneau === c.id ? ' checked' : '') + (desactive ? ' disabled' : '') + '>' +
          '<label for="cr-' + c.id + '">' + c.label + '</label>' +
        '</div>';
    }).join('');

    $$('input[name="mc-creneau"]', zone).forEach(function (r) {
      r.addEventListener('change', function () { commande.creneau = r.value; });
    });
  }

  /* --- Étape 2 : coordonnées + message --- */

  function champ(id, label, type, valeur, options) {
    options = options || {};
    return '' +
      '<div class="mc-champ" id="bloc-' + id + '">' +
        '<label for="' + id + '">' + label + (options.aide ? ' <small>' + options.aide + '</small>' : '') + '</label>' +
        '<input type="' + (type || 'text') + '" id="' + id + '" value="' + echap(valeur || '') + '"' +
          (options.inputmode ? ' inputmode="' + options.inputmode + '"' : '') +
          (options.autocomplete ? ' autocomplete="' + options.autocomplete + '"' : '') + '>' +
        '<p class="mc-erreur">' + (options.erreur || 'Ce champ est nécessaire.') + '</p>' +
      '</div>';
  }

  function rendreEtape2() {
    var corps = $('#mc-corps');
    var livraison = commande.mode === 'livraison';
    var a = commande.acheteur;
    var d = commande.destinataire;

    var html = '<h3 style="font-size:1.15rem;margin-bottom:16px">Vos coordonnées</h3>' +
      '<div class="mc-2col">' +
        champ('ach-nom', 'Votre nom', 'text', a.nom, { autocomplete: 'name' }) +
        champ('ach-tel', 'Votre téléphone', 'tel', a.tel, { inputmode: 'tel', autocomplete: 'tel', erreur: 'Un téléphone valide est nécessaire.' }) +
      '</div>' +
      champ('ach-email', 'Votre email', 'email', a.email, { aide: 'pour la confirmation de commande', autocomplete: 'email', erreur: 'Un email valide est nécessaire.' });

    if (livraison) {
      html += '<h3 style="font-size:1.15rem;margin:26px 0 16px">Le ou la destinataire</h3>' +
        '<div class="mc-2col">' +
          champ('dest-nom', 'Son nom', 'text', d.nom) +
          champ('dest-tel', 'Son téléphone', 'tel', d.tel, { aide: 'uniquement pour la livraison', inputmode: 'tel', erreur: 'Utile au livreur si la personne est absente.' }) +
        '</div>' +
        champ('dest-adresse', 'Adresse de livraison', 'text', d.adresse, { autocomplete: 'street-address' });
    } else {
      html += '<p style="color:var(--gris);font-size:0.95rem;margin:6px 0 4px">Votre bouquet vous attendra au frais à la boutique, 33 avenue Gambetta à Arcachon.</p>';
    }

    html += '<h3 style="font-size:1.15rem;margin:26px 0 10px">Le petit mot qui accompagne</h3>' +
      '<div class="mc-champ">' +
        '<label for="mc-message">Votre message <small>Flora l’écrit à la main sur une jolie carte, c’est offert</small></label>' +
        '<textarea id="mc-message" maxlength="240" placeholder="Écrivez votre message ici, ou laissez vide pour un bouquet sans carte">' + echap(commande.message) + '</textarea>' +
        '<div class="mc-suggestions" aria-label="Suggestions de messages">' +
          SUGGESTIONS_MESSAGE.map(function (s) {
            return '<button type="button" class="mc-suggestion">' + echap(s) + '</button>';
          }).join('') +
        '</div>' +
      '</div>' +
      '<div class="mc-case">' +
        '<input type="checkbox" id="mc-anonyme"' + (commande.anonyme ? ' checked' : '') + '>' +
        '<label for="mc-anonyme">Je préfère rester anonyme, la carte ne sera pas signée</label>' +
      '</div>' +
      '<div class="mc-actions">' +
        '<button type="button" class="btn btn-ligne" id="mc-retour-2">Retour</button>' +
        '<button type="button" class="btn btn-plein" id="mc-suite-2">Continuer</button>' +
      '</div>';

    corps.innerHTML = html;

    $$('.mc-suggestion', corps).forEach(function (b) {
      b.addEventListener('click', function () {
        $('#mc-message').value = b.textContent;
        $('#mc-message').focus();
      });
    });

    $('#mc-retour-2').addEventListener('click', function () { sauverEtape2(); allerEtape(1); });
    $('#mc-suite-2').addEventListener('click', function () {
      sauverEtape2();
      if (validerEtape2()) allerEtape(3);
    });
  }

  function sauverEtape2() {
    commande.acheteur = {
      nom: ($('#ach-nom') || {}).value || '',
      tel: ($('#ach-tel') || {}).value || '',
      email: ($('#ach-email') || {}).value || ''
    };
    if (commande.mode === 'livraison') {
      commande.destinataire = {
        nom: ($('#dest-nom') || {}).value || '',
        tel: ($('#dest-tel') || {}).value || '',
        adresse: ($('#dest-adresse') || {}).value || ''
      };
    }
    commande.message = ($('#mc-message') || {}).value || '';
    commande.anonyme = !!($('#mc-anonyme') || {}).checked;
  }

  function marquer(id, invalide) {
    var bloc = $('#bloc-' + id);
    if (!bloc) return;
    bloc.classList.toggle('invalide', invalide);
    var input = $('#' + id);
    if (input) input.classList.toggle('erreur', invalide);
  }

  function validerEtape2() {
    var ok = true;
    function verif(id, valeur, test) {
      var mauvais = !test(valeur.trim());
      marquer(id, mauvais);
      if (mauvais) ok = false;
    }
    verif('ach-nom', commande.acheteur.nom, function (v) { return v.length >= 2; });
    verif('ach-tel', commande.acheteur.tel, function (v) { return /^[0-9 +().-]{8,}$/.test(v); });
    verif('ach-email', commande.acheteur.email, function (v) { return /.+@.+\..+/.test(v); });
    if (commande.mode === 'livraison') {
      verif('dest-nom', commande.destinataire.nom, function (v) { return v.length >= 2; });
      verif('dest-tel', commande.destinataire.tel, function (v) { return /^[0-9 +().-]{8,}$/.test(v); });
      verif('dest-adresse', commande.destinataire.adresse, function (v) { return v.length >= 6; });
    }
    return ok;
  }

  /* --- Étape 3 : récapitulatif + paiement factice --- */

  function rendreEtape3() {
    var corps = $('#mc-corps');
    var total = totalPanier();
    var frais = fraisLivraison();

    var dateTexte = '';
    if (commande.date) {
      dateTexte = JOURS[commande.date.getDay()] + ' ' + commande.date.getDate() + ' ' + MOIS[commande.date.getMonth()];
      dateTexte += commande.creneau === 'matin' ? ', le matin' : ', l’après-midi';
    }

    var lignes = panier.map(function (l) {
      var p = produitParId(l.pid);
      var t = tailleDe(p, l.taille);
      return '<div class="mc-recap-ligne"><span>' + l.qte + ' × ' + echap(p.nom) + ' (' + echap(t.label) + ')</span><span>' + eurosPanier(t.prix * l.qte) + '</span></div>';
    }).join('');

    corps.innerHTML = '' +
      '<div class="mc-recap">' +
        lignes +
        '<div class="mc-recap-ligne"><span>' +
          (commande.mode === 'livraison'
            ? 'Livraison à domicile, ' + dateTexte
            : 'Retrait boutique, ' + dateTexte) +
        '</span><span>' + (frais === 0 ? (commande.mode === 'retrait' ? 'gratuit' : 'offerte') : eurosPanier(frais)) + '</span></div>' +
        (commande.message
          ? '<div class="mc-recap-ligne"><span>Carte manuscrite' + (commande.anonyme ? ' (anonyme)' : '') + '</span><span>offerte</span></div>'
          : '') +
        '<div class="mc-recap-ligne total"><span>Total</span><span>' + eurosPanier(total + frais) + '</span></div>' +
      '</div>' +
      '<div class="mc-stripe-tete">' +
        '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 9V6.5a5 5 0 0 1 10 0V9m-11 0h12v8.5H4V9Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>' +
        '<span>Paiement 100&nbsp;% sécurisé, traité par <strong>Stripe</strong></span>' +
      '</div>' +
      '<div class="mc-champ">' +
        '<label for="stripe-card">Carte bancaire</label>' +
        '<div id="stripe-card" class="stripe-card"></div>' +
        '<p id="stripe-erreur" role="alert"></p>' +
      '</div>' +
      '<p class="stripe-test-aide" id="stripe-aide"></p>' +
      '<div class="mc-actions">' +
        '<button type="button" class="btn btn-ligne" id="mc-retour-3">Retour</button>' +
        '<button type="button" class="btn btn-plein" id="mc-payer">Payer ' + eurosPanier(total + frais) + '</button>' +
      '</div>' +
      '<p class="mc-securise">' +
        '<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M5 9V6.5a5 5 0 0 1 10 0V9m-11 0h12v8.5H4V9Z" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>' +
        'Maquette en mode test Stripe : aucun paiement réel, aucune carte débitée.' +
      '</p>';

    $('#mc-retour-3').addEventListener('click', function () { detruireStripe(); allerEtape(2); });
    monterStripe(eurosPanier(total + frais));
  }

  /* --- Paiement Stripe (mode test) --- */

  var stripe = null, stripeElements = null, stripeCard = null;

  function monterStripe(montant) {
    var zone = $('#stripe-card');
    var aide = $('#stripe-aide');
    var erreur = $('#stripe-erreur');
    var btn = $('#mc-payer');

    // Repli si Stripe.js n'a pas pu charger (hors ligne, script bloqué) : la maquette
    // reste démontrable. Sur le site en ligne, le vrai formulaire Stripe s'affiche ici.
    if (!window.Stripe || !STRIPE_PK) {
      zone.classList.add('stripe-indispo');
      zone.textContent = 'Module de paiement Stripe indisponible hors connexion. En ligne, le vrai champ carte Stripe s’affiche ici.';
      aide.textContent = '';
      btn.addEventListener('click', function () {
        btn.disabled = true;
        btn.textContent = 'Simulation…';
        setTimeout(function () { rendreMerci(null); }, 900);
      });
      return;
    }

    if (!stripe) stripe = Stripe(STRIPE_PK);
    stripeElements = stripe.elements();
    stripeCard = stripeElements.create('card', {
      hidePostalCode: true,
      style: {
        base: {
          color: '#2A2820',
          fontFamily: '"General Sans", system-ui, sans-serif',
          fontSize: '16px',
          '::placeholder': { color: '#9A9486' }
        },
        invalid: { color: '#A64E2E', iconColor: '#A64E2E' }
      }
    });
    stripeCard.mount('#stripe-card');
    aide.innerHTML = 'Mode test : saisissez <strong>4242 4242 4242 4242</strong>, une date future et n’importe quel cryptogramme.';

    stripeCard.on('change', function (e) {
      erreur.textContent = e.error ? e.error.message : '';
    });

    btn.addEventListener('click', function () {
      erreur.textContent = '';
      btn.disabled = true;
      btn.textContent = 'Paiement en cours…';
      stripe.createPaymentMethod({ type: 'card', card: stripeCard }).then(function (res) {
        if (res.error) {
          erreur.textContent = res.error.message;
          btn.disabled = false;
          btn.textContent = 'Payer ' + montant;
          return;
        }
        detruireStripe();
        rendreMerci(res.paymentMethod.id);
      });
    });
  }

  function detruireStripe() {
    if (stripeCard) {
      try { stripeCard.destroy(); } catch (e) { /* déjà démonté */ }
      stripeCard = null;
    }
  }

  function rendreMerci(stripeId) {
    var numero = 'GF-' + String(Math.floor(1000 + Math.random() * 9000));
    var corps = $('#mc-corps');
    $('#mc-etapes').style.visibility = 'hidden';
    corps.innerHTML = '' +
      '<div class="mc-merci">' +
        '<svg viewBox="0 0 28 28" aria-hidden="true"><circle cx="14" cy="14" r="12.5" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M8.5 14.5l3.6 3.8L19.5 10" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        '<h3>Merci, vos fleurs sont en route</h3>' +
        '<p>' + (commande.mode === 'livraison'
          ? 'Flora composera votre bouquet le matin même et le livrera comme convenu.'
          : 'Flora composera votre bouquet le matin même, il vous attendra au frais à la boutique.') + '</p>' +
        '<p>Une confirmation vient de partir par email' + (commande.acheteur.email ? ' à ' + echap(commande.acheteur.email) : '') + '.</p>' +
        '<span class="mc-numero">Commande ' + numero + '</span>' +
        (stripeId ? '<p class="mc-stripe-ref">Moyen de paiement Stripe (test) : ' + echap(stripeId) + '</p>' : '') +
        '<button type="button" class="btn btn-plein" id="mc-fini">Revenir à la boutique</button>' +
      '</div>';
    panier = [];
    sauver();
    majPanier();
    $('#mc-fini').addEventListener('click', function () {
      fermerModale(modaleCommande);
      $('#mc-etapes').style.visibility = '';
    });
  }

  /* ---------- Abonnement ---------- */

  $('#btn-abonnement').addEventListener('click', function () { ouvrirProduit('abonnement'); });

  /* ---------- Menu mobile ---------- */

  var burger = $('#burger');
  var menuMobile = $('#menu-mobile');

  burger.addEventListener('click', function () {
    var ouvert = burger.getAttribute('aria-expanded') === 'true';
    burger.setAttribute('aria-expanded', ouvert ? 'false' : 'true');
    burger.setAttribute('aria-label', ouvert ? 'Ouvrir le menu' : 'Fermer le menu');
    menuMobile.hidden = ouvert;
    menuMobile.classList.toggle('ouvert', !ouvert);
  });

  $$('.menu-mobile a').forEach(function (a) {
    a.addEventListener('click', function () {
      burger.setAttribute('aria-expanded', 'false');
      menuMobile.hidden = true;
      menuMobile.classList.remove('ouvert');
    });
  });

  /* ---------- Header : état scrollé + lien actif ---------- */

  var header = $('#header');
  var derniereY = 0;
  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    if ((y > 10) !== (derniereY > 10)) header.classList.toggle('scrolle', y > 10);
    derniereY = y;
  }, { passive: true });

  var sections = ['boutique', 'abonnement', 'surmesure', 'atelier', 'infos'];
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entrees) {
      entrees.forEach(function (en) {
        if (en.isIntersecting) {
          $$('.nav a').forEach(function (a) {
            a.classList.toggle('actif', a.getAttribute('href') === '#' + en.target.id);
          });
        }
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    sections.forEach(function (id) {
      var el = document.getElementById(id);
      if (el) observer.observe(el);
    });
  }

  /* ---------- Échap global ---------- */

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (modaleOuverte) { fermerModale(modaleOuverte); return; }
    if (panierOuvert) { fermerPanier(); return; }
    if (burger.getAttribute('aria-expanded') === 'true') {
      burger.setAttribute('aria-expanded', 'false');
      menuMobile.hidden = true;
      menuMobile.classList.remove('ouvert');
    }
  });

  /* ---------- Avis ---------- */

  function rendreAvis() {
    var zone = $('#avis-grille');
    zone.innerHTML = AVIS.map(function (a) {
      return '' +
        '<figure class="avis-carte">' +
          '<span class="etoiles" aria-hidden="true">★★★★★</span>' +
          '<blockquote>« ' + echap(a.texte) + ' »</blockquote>' +
          '<figcaption><strong>' + echap(a.auteur) + '</strong>Avis Google · ' + echap(a.quand) + '</figcaption>' +
        '</figure>';
    }).join('');
  }

  /* ---------- Bandeau + horaires du jour ---------- */

  function majTopbar() {
    var now = new Date();
    var texte;
    if (livraisonAujourdhuiPossible(now)) {
      texte = 'Commandé avant 14h, livré le jour même sur Arcachon et le Bassin';
    } else {
      var prochain = new Date(now);
      prochain.setDate(prochain.getDate() + 1);
      while (prochain.getDay() < 2) prochain.setDate(prochain.getDate() + 1);
      var quand = JOURS[prochain.getDay()];
      var demain = new Date(now); demain.setDate(demain.getDate() + 1);
      if (prochain.getDate() === demain.getDate() && prochain.getMonth() === demain.getMonth()) quand = 'demain';
      texte = 'Commandé maintenant, livré ' + quand + ' sur Arcachon et le Bassin';
    }
    $('#topbar-cutoff').textContent = texte;

    var ligne = $('.horaires tr[data-jour="' + now.getDay() + '"]');
    if (ligne) ligne.classList.add('aujourdhui');
  }

  /* ---------- Pages légales ---------- */

  var CONTENUS_LEGAUX = {
    mentions: {
      titre: 'Mentions légales',
      html: '' +
        '<h3>Éditeur du site</h3>' +
        '<p><strong>Gambetta fleurs</strong>, SARL au capital de 1 000 €.<br>' +
        '33 avenue Gambetta, 33120 Arcachon.<br>' +
        'Téléphone : 05 56 83 56 79 · gambettafleurscontact@gmail.com</p>' +
        '<ul>' +
          '<li>SIRET : 848 050 464 00017</li>' +
          '<li>TVA intracommunautaire : FR96 848 050 464</li>' +
          '<li>Directrice de la publication : Flora Marti</li>' +
        '</ul>' +
        '<h3>Hébergement</h3>' +
        '<p>Le site est hébergé en France. Les coordonnées complètes de l’hébergeur seront précisées à la mise en ligne du site.</p>' +
        '<h3>Propriété intellectuelle</h3>' +
        '<p>Les textes et les photographies présents sur ce site appartiennent à Gambetta fleurs ou sont utilisés avec l’accord de leurs auteurs. Toute reproduction sans autorisation est interdite.</p>' +
        '<p class="legal-note">Cette page est une maquette de démonstration réalisée par BassinWebFlow. Les informations légales seront vérifiées et complétées avec Flora avant la mise en ligne.</p>'
    },
    confidentialite: {
      titre: 'Politique de confidentialité',
      html: '' +
        '<h3>Vos données, simplement</h3>' +
        '<p>Quand vous passez commande, nous recueillons seulement ce qu’il faut pour préparer et livrer vos fleurs : votre nom, votre téléphone, votre email, et l’adresse de livraison. Rien de plus.</p>' +
        '<h3>À quoi elles servent</h3>' +
        '<ul>' +
          '<li>Préparer et livrer votre commande</li>' +
          '<li>Vous envoyer la confirmation et vous joindre en cas de besoin</li>' +
          '<li>Écrire à la main la carte qui accompagne le bouquet</li>' +
        '</ul>' +
        '<p>Nous ne revendons jamais vos coordonnées et nous ne les transmettons qu’à notre livreur, uniquement pour vous livrer.</p>' +
        '<h3>Vos droits</h3>' +
        '<p>Vous pouvez à tout moment demander à consulter, corriger ou supprimer vos informations en écrivant à <strong>gambettafleurscontact@gmail.com</strong>.</p>' +
        '<p class="legal-note">Maquette de démonstration BassinWebFlow. Le texte définitif sera adapté au fonctionnement réel de la boutique (paiement, cookies de mesure d’audience) avant mise en ligne.</p>'
    },
    cgv: {
      titre: 'Conditions générales de vente',
      html: '' +
        '<h3>Commande et paiement</h3>' +
        '<p>Vos achats sur la boutique en ligne sont réglés par carte bancaire, de façon sécurisée. La commande est confirmée par email dès le paiement validé.</p>' +
        '<h3>Livraison et retrait</h3>' +
        '<p>Nous livrons du mardi au samedi sur Arcachon et le Bassin. Une commande passée avant 14h est livrée le jour même. Le retrait en boutique est gratuit, aux horaires d’ouverture.</p>' +
        '<h3>Fraîcheur et disponibilité</h3>' +
        '<p>Nos bouquets sont composés à la main avec les fleurs du marché. Selon les arrivages, une variété peut être remplacée par une fleur équivalente ou supérieure, en gardant l’esprit et la valeur du bouquet.</p>' +
        '<h3>Droit de rétractation</h3>' +
        '<p>Les fleurs fraîches étant des produits périssables, elles ne sont pas concernées par le délai de rétractation de 14 jours (article L221-28 du Code de la consommation). En cas de souci sur une commande, appelez-nous : nous trouverons toujours une solution.</p>' +
        '<p class="legal-note">Maquette de démonstration BassinWebFlow. Les CGV définitives seront rédigées avec Flora en fonction de ses tarifs et de sa zone de livraison réels.</p>'
    }
  };

  var modaleLegal = $('#modale-legal');

  function ouvrirLegal(type) {
    var contenu = CONTENUS_LEGAUX[type];
    if (!contenu) return;
    $('#legal-titre').textContent = contenu.titre;
    $('#legal-corps').innerHTML = contenu.html;
    modaleLegal.scrollTop = 0;
    ouvrirModale(modaleLegal);
  }

  $$('[data-legal]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      ouvrirLegal(a.getAttribute('data-legal'));
    });
  });

  /* ---------- FAQ en accordéon (un seul ouvert à la fois) ---------- */

  var faqDetails = $$('#faq details');
  faqDetails.forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (d.open) {
        faqDetails.forEach(function (autre) {
          if (autre !== d) autre.open = false;
        });
      }
    });
  });

  /* ---------- Lancement ---------- */

  rendreGrille();
  rendreAvis();
  majPanier();
  majTopbar();

})();
