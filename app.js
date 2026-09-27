// app.js — porte d'entrée et choix du public, menu, tête de lecture de la séance,
// bouton REC flottant et envoi du formulaire.
// Si le serveur local ne répond pas (page ouverte en fichier, ou hébergée
// sans serveur), la demande part par le logiciel de mail du visiteur.

const COURRIEL = 'contactheo00@gmail.com';
const LIBELLES = { medico: 'Établissement médico-social', jeunes: 'Espace jeunes / animation', autre: 'Autre demande' };
const racine = document.documentElement;
const reduit = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- Choix du public ---------- */
// Adresses partageables : #medico et #animation ouvrent directement le bon côté.
const ANCRES = { medico: 'medico', 'medico-social': 'medico', animation: 'jeunes', 'espaces-jeunes': 'jeunes' };

function choisirPublic(pub, options = {}) {
  // Depuis le site déjà ouvert : fondu enchaîné natif si le navigateur le permet.
  const surPlace = racine.classList.contains('porte-fermee') && options.defiler === false;
  if (surPlace && document.startViewTransition && !reduit) {
    document.startViewTransition(() => appliquerPublic(pub, options));
  } else {
    appliquerPublic(pub, options);
  }
}

function appliquerPublic(pub, { defiler = true } = {}) {
  if (pub === 'medico' || pub === 'jeunes') {
    racine.dataset.public = pub;
    const radio = document.querySelector(`input[name="profil"][value="${pub}"]`);
    if (radio && !document.querySelector('input[name="profil"]:checked')) radio.checked = true;
  } else {
    delete racine.dataset.public;
  }
  document.querySelectorAll('.bascule button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.choix === pub)));
  adapterTextes(pub);
  if (!reduit) requestAnimationFrame(avancerTetes);
  fermerPorte();
  if (defiler) window.scrollTo({ top: 0, behavior: 'instant' });
}

const TEXTES = {
  medico: { titre: 'Ateliers Musiques Urbaines · Médico-social & protection de l’enfance — Théo Von Euw', fonction: 'Éducatrice, chef de service…', public: 'Âge, handicap ou accompagnement, nombre…', periode: 'Une année scolaire, un trimestre…' },
  jeunes: { titre: 'Ateliers Musiques Urbaines · Animation & Espaces jeunes — Théo Von Euw', fonction: 'Animateur, coordinatrice jeunesse…', public: 'Âge des jeunes, taille du groupe…', periode: 'Vacances de février, un week-end…' },
  tout: { titre: 'Théo Von Euw · Ateliers Musiques Urbaines', fonction: 'Éducatrice, animateur…', public: 'Âge, nombre de participants…', periode: 'Vacances de février, à l’année…' },
};
function adapterTextes(pub) {
  const t = TEXTES[pub] || TEXTES.tout;
  document.title = t.titre;
  const f = document.querySelector('#formulaire form');
  if (!f) return;
  f.elements.fonction.placeholder = t.fonction;
  f.elements.public.placeholder = t.public;
  f.elements.periode.placeholder = t.periode;
}

function ouvrirPorte() {
  racine.classList.add('porte-ouverte');
  racine.classList.remove('porte-fermee');
  document.getElementById('accueil').scrollTop = 0;
}
function fermerPorte() {
  racine.classList.remove('porte-ouverte');
  racine.classList.add('porte-fermee');
}

document.querySelectorAll('[data-choix]').forEach((el) => {
  el.addEventListener('click', (e) => {
    const pub = el.dataset.choix;
    if (pub === 'tout') {
      e.preventDefault();
      choisirPublic(null, { defiler: false });
      document.getElementById('parcours').scrollIntoView();
      return;
    }
    e.preventDefault();
    choisirPublic(pub, { defiler: !el.closest('.bascule') });
  });
});
document.querySelectorAll('[data-changer]').forEach((b) => b.addEventListener('click', ouvrirPorte));

// À l'arrivée, on montre toujours la porte d'entrée, sauf pour un lien partagé
// exprès vers un côté (…/#medico ou …/#animation).
const ancre = location.hash.slice(1);
if (ANCRES[ancre]) {
  choisirPublic(ANCRES[ancre], { defiler: false });
} else {
  if (ancre) history.replaceState(null, '', location.pathname);
  ouvrirPorte();
}
addEventListener('hashchange', () => {
  const pub = ANCRES[location.hash.slice(1)];
  if (pub) choisirPublic(pub);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && racine.classList.contains('porte-ouverte')) choisirPublic(null, { defiler: false });
});

/* ---------- En-tête : plus présent dès qu'on a défilé ---------- */
const entete = document.querySelector('.entete');
let entetePrevu = false;
addEventListener('scroll', () => {
  if (entetePrevu) return;
  entetePrevu = true;
  requestAnimationFrame(() => { entete.classList.toggle('defile', scrollY > 12); entetePrevu = false; });
}, { passive: true });

/* ---------- Menu mobile ---------- */
const boutonMenu = document.querySelector('.menu-mobile');
const nav = document.getElementById('nav');
boutonMenu.addEventListener('click', () => {
  const ouvert = nav.classList.toggle('ouverte');
  boutonMenu.setAttribute('aria-expanded', String(ouvert));
});
function fermerMenu() {
  nav.classList.remove('ouverte');
  boutonMenu.setAttribute('aria-expanded', 'false');
}
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('ouverte')) { fermerMenu(); boutonMenu.focus(); } });
document.addEventListener('click', (e) => { if (nav.classList.contains('ouverte') && !e.target.closest('.capsule')) fermerMenu(); });
nav.addEventListener('click', (e) => {
  if (e.target.closest('a')) {
    nav.classList.remove('ouverte');
    boutonMenu.setAttribute('aria-expanded', 'false');
  }
});

/* ---------- Section active dans la navigation ---------- */
const liensNav = [...nav.querySelectorAll('a[href^="#"]:not(.bouton)')];
const sections = liensNav.map((a) => document.querySelector(a.getAttribute('href'))).filter(Boolean);
const observateurNav = new IntersectionObserver((entrees) => {
  entrees.forEach((en) => {
    if (en.isIntersecting) liensNav.forEach((a) => a.classList.toggle('actif', a.getAttribute('href') === `#${en.target.id}`));
  });
}, { rootMargin: '-45% 0px -50% 0px' });
sections.forEach((s) => observateurNav.observe(s));

/* ---------- Apparition au défilement ---------- */
const apparitions = new IntersectionObserver((entrees) => {
  entrees.forEach((en) => {
    if (en.isIntersecting) {
      en.target.classList.add('visible');
      apparitions.unobserve(en.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.apparait').forEach((el) => apparitions.observe(el));

/* ---------- Tête de lecture des pistes (séance et stage) ---------- */
const sessions = [...document.querySelectorAll('.session')];
function avancerTetes() {
  const h = innerHeight;
  sessions.forEach((session) => {
    const r = session.getBoundingClientRect();
    if (!r.height) return; // version masquée pour ce public
    // 0 quand la piste entre par le bas, 1 quand elle atteint le haut de l'écran
    const pos = Math.min(1, Math.max(0, (h - r.top) / (h + r.height * 0.4)));
    session.querySelector('.tete-lecture')?.style.setProperty('--pos', pos.toFixed(4));
  });
}
if (reduit) sessions.forEach((s) => s.querySelector('.tete-lecture')?.style.setProperty('--pos', '0.5'));
else {
  let attente = false;
  addEventListener('scroll', () => {
    if (attente) return;
    attente = true;
    requestAnimationFrame(() => { avancerTetes(); attente = false; });
  }, { passive: true });
}

/* ---------- Bouton REC flottant : caché quand le contact est à l'écran ---------- */
const boutonRec = document.querySelector('.bouton-rec');
new IntersectionObserver(([en]) => boutonRec.classList.toggle('cache', en.isIntersecting), { threshold: 0.15 })
  .observe(document.getElementById('contact'));

/* ---------- Divers ---------- */
document.querySelectorAll('[data-profil]').forEach((lien) => {
  lien.addEventListener('click', () => {
    const radio = document.querySelector(`input[name="profil"][value="${lien.dataset.profil}"]`);
    if (radio) radio.checked = true;
  });
});

document.querySelector('[data-imprimer]').addEventListener('click', () => {
  document.querySelectorAll('.faq details').forEach((d) => (d.open = true));
  window.print();
});

/* ---------- Formulaire ---------- */
const form = document.querySelector('#formulaire form');
const erreur = form.querySelector('.message-erreur');
const confirmation = document.querySelector('#formulaire .confirmation');
const lienMail = confirmation.querySelector('[data-mailto]');

function lireFormulaire() {
  const donnees = Object.fromEntries(new FormData(form));
  for (const k in donnees) donnees[k] = String(donnees[k]).trim();
  return donnees;
}

function construireMailto(d) {
  const objet = `Demande d’atelier${d.structure ? ` — ${d.structure}` : ''}`;
  const details = [
    d.profil && `Profil : ${LIBELLES[d.profil] || d.profil}`,
    `Nom : ${d.nom}${d.fonction ? `, ${d.fonction}` : ''}`,
    d.structure && `Structure : ${d.structure}`,
    d.ville && `Ville : ${d.ville}`,
    d.public && `Public : ${d.public}`,
    d.periode && `Période : ${d.periode}`,
    d.telephone && `Téléphone : ${d.telephone}`,
    d.email && `Courriel : ${d.email}`,
  ].filter(Boolean);
  const corps = [d.message, '', '—', ...details].join('\n');
  return `mailto:${COURRIEL}?subject=${encodeURIComponent(objet)}&body=${encodeURIComponent(corps)}`;
}

function verifier(d) {
  if (!d.nom) return ['nom', 'Merci d’indiquer votre nom.'];
  if (!d.email && !d.telephone) return ['email', 'Laissez-moi un courriel ou un numéro pour vous répondre.'];
  if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) return ['email', 'L’adresse courriel semble incomplète.'];
  if (!d.message) return ['message', 'Quelques mots sur votre projet, et c’est parti.'];
  return null;
}

function afficherErreur(texte, champ) {
  erreur.textContent = texte;
  erreur.hidden = false;
  form.querySelectorAll('[aria-invalid]').forEach((el) => el.removeAttribute('aria-invalid'));
  const el = champ && form.elements[champ];
  if (el) {
    el.setAttribute('aria-invalid', 'true');
    el.setAttribute('aria-describedby', 'erreur-formulaire');
    el.focus();
  }
}
erreur.id = 'erreur-formulaire';
form.addEventListener('input', (e) => {
  if (e.target.getAttribute('aria-invalid')) { e.target.removeAttribute('aria-invalid'); erreur.hidden = true; }
});

// Envoi vers le script Google (mail à Théo, repris ensuite par Ma Compta).
// Le script répond depuis un autre domaine : en mode « no-cors », la requête part
// bien mais sa réponse reste illisible. On se fie donc à la vérification faite
// avant l'envoi, que le script refait de son côté.
async function envoyerAGoogle(d) {
  const url = (window.SITE_CONFIG || {}).formulaire;
  if (!url) return false;
  try {
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(d),
    });
    return true;
  } catch {
    return false;   // pas de connexion
  }
}

// Copie sur le serveur local (page /demandes), quand le site tourne sur le Mac.
async function enregistrerLocalement(d) {
  try {
    const rep = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(d),
    });
    if (rep.status === 404 || rep.status === 405) return null;   // site hébergé sans serveur
    const r = await rep.json().catch(() => ({}));
    return rep.ok ? { ok: true } : { erreur: r.erreur };
  } catch {
    return null;
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  erreur.hidden = true;
  const d = lireFormulaire();
  const probleme = verifier(d);
  if (probleme) return afficherErreur(probleme[1], probleme[0]);

  const bouton = form.querySelector('button[type="submit"]');
  const libelle = bouton.firstChild.textContent;
  bouton.disabled = true;
  bouton.setAttribute('aria-busy', 'true');
  bouton.firstChild.textContent = 'Envoi… ';
  const mailto = construireMailto(d);

  try {
    const [parGoogle, local] = await Promise.all([envoyerAGoogle(d), enregistrerLocalement(d)]);
    if (!parGoogle && local && local.erreur) {
      return afficherErreur(local.erreur || 'L’envoi n’a pas abouti. Réessayez ou écrivez-moi directement.');
    }
    if (parGoogle || (local && local.ok)) {
      lienMail.href = mailto;
      form.hidden = true;
      confirmation.hidden = false;
      confirmation.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      // Ni script Google ni serveur pour recevoir la demande : on passe par le mail.
      window.location.href = mailto;
    }
  } finally {
    bouton.disabled = false;
    bouton.removeAttribute('aria-busy');
    bouton.firstChild.textContent = libelle;
  }
});

confirmation.querySelector('[data-nouvelle]').addEventListener('click', () => {
  form.reset();
  confirmation.hidden = true;
  form.hidden = false;
});
