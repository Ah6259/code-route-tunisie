/* Langue (français / arabe), en-tête (menu + bouton doré « Pass Examen », voir pass.js) et pied de page communs, bandeau de relecture, liens hors ligne,
   crédits des photos, boutons « Signaler une erreur », petites fonctions partagées. */
// Date, année et mode relecture : viennent UNIQUEMENT de assets/regles.js (REGLES_SITE), chargé avant ce fichier.
const MAJ = REGLES_SITE.verifie_le, ANNEE = REGLES_SITE.annee, RELECTURE = REGLES_SITE.relecture === true;

// Menu commun (en-tête) : une seule liste pour toutes les pages (le test vérifie que chaque lien mène à une page existante)
const MENU_SITE = [
  ["lecons/", "Leçons", "الدروس"],
  ["panneaux/", "Panneaux", "العلامات"],
  ["entrainement/", "Entraînement", "التدريب"],
  ["examen/", "Examen", "الامتحان"],
  ["https://ah6259.github.io/auto-ecoles-tunisie/", "Auto-écoles", "مدارس السياقة", "assets/illustrations/rub-auto-ecole.svg"],  // notre annuaire (demande d'Ahmed)
  ["amendes/", "Amendes", "الخطايا"],
  ["a-propos/", "À propos", "من نحن"]
];

(function () {
  const html = document.documentElement;
  const racine = html.dataset.racine || "";
  let langue = "fr";
  try { langue = localStorage.getItem("langue") || ((navigator.language || "").startsWith("ar") ? "ar" : "fr"); } catch (e) {}
  const demande = new URLSearchParams(location.search).get("lang");
  if (demande === "ar" || demande === "fr") langue = demande;

  window.T = (fr, ar) => html.lang === "ar" ? ar : fr;

  function rubriqueActuelle() {
    const m = location.pathname.match(/\/(lecons|panneaux|entrainement|examen|amendes|a-propos|permis|relecture)\/(index\.html)?$/);
    return m ? m[1] + "/" : "";
  }

  function cadre() {
    const e = document.getElementById("entete");
    const actuelle = rubriqueActuelle();
    if (e) e.innerHTML = `
      ${RELECTURE ? `<div class="bandeau-relecture" id="bandeau-relecture"><div class="wrap">
        <b>${T("Version de relecture", "نسخة للمراجعة")}</b> — ${T("en cours de vérification par un moniteur d'auto-école. Merci de signaler toute erreur.", "قيد التثبت من قبل مدرّب سياقة. شكرًا على الإعلام بأي خطأ.")}
        <a href="${racine}relecture/">${T("Tout relire", "مراجعة الكل")} ›</a></div></div>` : ""}
      <div class="wrap haut-entete">
        <a class="logo" href="${racine || "./"}">
          <img class="logo-mark" src="${racine}assets/logo.svg" alt="" width="34" height="34">
          <span class="logo-nom">${T("Code de la route Tunisie", "قانون الطرقات تونس")}
            <small>${T("Révision gratuite du permis", "مراجعة مجانية لرخصة السياقة")}</small></span>
        </a>
        <div class="entete-boutons">
          ${/\/pass\//.test(location.pathname) || (typeof accesExamen === "function" && accesExamen() !== "gratuit") ? `<a class="entete-pass${typeof passActif === "function" && passActif() ? " actif" : ""}" href="${racine}pass/"><span class="long">${T("Pass Examen", "باقة الامتحان")}</span><span class="court">${T("Pass", "الباقة")}</span></a>` : ""}
          <button class="partager" type="button" aria-label="${T("Partager cette page", "شارك هذه الصفحة")}" title="${T("Partager", "شارك")}"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg></button>
          <button class="langue" type="button">${T("العربية", "Français")}</button>
        </div>
      </div>
      <nav class="menu" aria-label="${T("Menu", "القائمة")}"><div class="wrap">${MENU_SITE.map(([h, fr, ar, ico]) => /^https:/.test(h)
        ? `<a class="menu-annuaire" href="${h}" data-lien="annuaire-auto-ecoles">${ico ? `<img src="${racine}${ico}" alt="" width="20" height="20">` : ""}${T(fr, ar)}</a>`
        : `<a href="${racine}${h}"${h === actuelle ? ' aria-current="page"' : ""}>${T(fr, ar)}</a>`).join("")}</div></nav>`;
    const p = document.getElementById("pied");
    if (p) p.innerHTML = `
      <div class="wrap">
        <div class="pied-logo"><img src="${racine}assets/logo.svg" alt="" width="24" height="24"> ${T("Code de la route Tunisie", "قانون الطرقات تونس")}</div>
        <nav>
          <a href="${racine}lecons/">${T("Leçons", "الدروس")}</a>
          <a href="${racine}panneaux/">${T("Panneaux", "العلامات")}</a>
          <a href="${racine}entrainement/">${T("Entraînement par thème", "تدريب حسب المحور")}</a>
          <a href="${racine}entrainement/?erreurs=1">${T("Mes erreurs", "أخطائي")}</a>
          <a href="${racine}examen/">${T("Examen blanc", "امتحان تجريبي")}</a>
          <a href="${racine}amendes/">${T("Amendes et sanctions", "الخطايا والعقوبات")}</a>
          <a href="${racine}permis/">${T("Passer le permis", "اجتياز رخصة السياقة")}</a>
          <a href="${racine}a-propos/">${T("À propos et sources", "من نحن والمصادر")}</a>
          <a href="${racine}pass/">${T("Pass Examen", "باقة الامتحان")}</a>
          <a href="${racine}#avis">${T("Votre avis", "رأيك")}</a>
        </nav>
        <p>${T(`Sources : Code de la route (loi n° 99-71 du 26 juillet 1999) et ses décrets d'application, recueil officiel de l'IORT (édition 2012) publié sur transport.tn ; loi de finances 2025 (JORT n° 149). Texte vérifié le ${MAJ}.`,
               `المصادر: مجلة الطرقات (القانون عدد ${iso("99-71")} المؤرخ في 26 جويلية 1999) ونصوصها التطبيقية، المجموعة الرسمية للمطبعة الرسمية (طبعة 2012) المنشورة على ${iso("transport.tn")}؛ قانون المالية لسنة 2025 (الرائد الرسمي عدد 149). تم التثبت من النص في ${iso(MAJ)}.`)}</p>
        <p>${T("Photos : Wikimedia Commons, auteurs et licences indiqués sous chaque photo et dans « À propos ». Dessins et schémas : faits par nous.",
               "الصور: ويكيميديا كومنز، مع ذكر المؤلف والرخصة تحت كل صورة وفي صفحة «من نحن». الرسوم: من إنجازنا.")}</p>
        <p>${T("Site non officiel, sans lien avec l'ATTT ni avec le ministère du Transport. Les noms, marques et logos cités appartiennent à leurs propriétaires. Votre progression reste dans votre téléphone.",
               "موقع غير رسمي، لا علاقة له بالوكالة الفنية للنقل البري ولا بوزارة النقل. الأسماء والعلامات المذكورة ملك لأصحابها. تقدّمك يبقى في هاتفك.")}</p>
        <p>© ${ANNEE} Code de la route Tunisie — ${T("tous droits réservés. Reproduction des leçons, questions et dessins interdite.", "جميع الحقوق محفوظة. يُمنع نسخ الدروس والأسئلة والرسوم.")}</p>
      </div>`;
    document.querySelectorAll(".langue").forEach(b =>
      b.addEventListener("click", () => appliquer(html.lang === "ar" ? "fr" : "ar")));
    // bouton Partager (demande d'Ahmed) : menu de partage du téléphone, sinon WhatsApp avec le lien de la page
    document.querySelectorAll(".partager").forEach(b => b.addEventListener("click", async () => {
      const url = location.href.split("#")[0].replace(/[?&]lang=(fr|ar)/, ""), titre = document.title.split(" | ")[0];
      try { if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: "partage" + location.pathname.replace("/code-route-tunisie/", "/"), title: "Partage", event: true }); } catch (e) {}
      return window.partagerLien();
    }));
    document.querySelectorAll("[data-maj]").forEach(x => x.textContent = MAJ);
    document.querySelectorAll("[data-annee]").forEach(x => x.textContent = ANNEE);
  }

  function appliquer(l) {
    html.lang = l; html.dir = l === "ar" ? "rtl" : "ltr";
    try { localStorage.setItem("langue", l); } catch (e) {}
    cadre();
    document.dispatchEvent(new Event("langue"));
    liensHorsLigne(document);
  }
  document.addEventListener("DOMContentLoaded", () => {
    appliquer(langue);
    // Pages ouvertes depuis le PC (file://) : les liens changent au fil des écrans -> on les corrige à chaque changement
    if (location.protocol === "file:" && window.MutationObserver)
      new MutationObserver(() => liensHorsLigne(document)).observe(document.body, { childList: true, subtree: true });
  });
})();

/* Ouverture du site depuis le PC (file://) : « dossier/ » n'ouvre pas index.html -> on l'ajoute.
   « entrainement/?erreurs=1 » devient « entrainement/index.html?erreurs=1 ». En ligne (https), rien ne change. */
function lienFichier(href) {
  if (!href || /^(https?:|mailto:|tel:|#|data:|javascript:)/i.test(href)) return href;
  return href.replace(/^((?:[^?#]*\/)?)(\?[^#]*)?(#.*)?$/, (m, chemin, q, h) =>
    (chemin === "" ? "index.html" : chemin + "index.html") + (q || "") + (h || ""));
}
function liensHorsLigne(racineDom) {
  if (location.protocol !== "file:") return;
  racineDom.querySelectorAll("a[href]").forEach(a => {
    const h = a.getAttribute("href"), n = lienFichier(h);
    if (n !== h && !/index\.html/.test(h)) a.setAttribute("href", n);
  });
}

/* Isolation des nombres et des mots latins dans un texte arabe (U+2066 … U+2069) */
function iso(t) { return "⁦" + t + "⁩"; }
function isoAr(t) {
  return String(t).replace(/[A-Za-z0-9][A-Za-z0-9.,:/%°'’ -]*[A-Za-z0-9%]|[A-Za-z0-9]/g, m => iso(m));
}
/* Nombre dans la langue de la page (isolé en arabe) */
function nb(n) { return document.documentElement.lang === "ar" ? iso(String(n)) : String(n); }
/* Échappe le texte avant de le mettre dans du HTML */
function esc(t) {
  return String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
/* Texte d'une question dans la langue de la page */
function txt(obj, champ) {
  const ar = document.documentElement.lang === "ar";
  if (!champ) return ar ? isoAr(obj.ar) : obj.fr;          // un choix {fr, ar}
  return ar ? isoAr(obj[champ + "_ar"]) : obj[champ + "_fr"];
}
/* Texte bilingue d'un objet {fr, ar} ou de deux champs x_fr / x_ar */
function bi(o, champ) {
  const ar = document.documentElement.lang === "ar";
  if (!champ) return ar ? isoAr(o.ar) : o.fr;
  return ar ? isoAr(o[champ + "_ar"]) : o[champ + "_fr"];
}

/* Progression gardée dans le navigateur (jamais envoyée) — tout dans try/catch */
const CLE = "crt-progression-v1";
function lireProgression() {
  try {
    const p = JSON.parse(localStorage.getItem(CLE) || "{}");
    return { q: p.q || {}, examens: Array.isArray(p.examens) ? p.examens : [] };
  } catch (e) { return { q: {}, examens: [] }; }
}
function ecrireProgression(p) {
  try { localStorage.setItem(CLE, JSON.stringify(p)); } catch (e) {}
}

function lienWhatsApp(texte, url) {
  return "https://wa.me/?text=" + encodeURIComponent(texte + " " + (url || location.href.split("?")[0]));
}
const ICONE_WHATSAPP = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.4 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.6-4-4.7-4.2-.1-.2-1.1-1.5-1.1-2.9s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.3 0 .5l-.4.6-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.1.1.6-.1 1.2z"/></svg>';

/* Petit lien discret « Signaler une erreur » -> WhatsApp prérempli (identifiant + texte + réponse proposée) */
function htmlSignaler(id, texte, reponse) {
  const msg = `[Relecture code de la route] ${id}\n${texte}${reponse ? "\nRéponse du site : " + reponse : ""}\nErreur constatée : `;
  return `<a class="signaler" target="_blank" rel="noopener" data-signaler="${esc(id)}" href="${lienWhatsApp(msg, location.href.split("#")[0])}">${ICONE_WHATSAPP}${T("Signaler une erreur", "الإعلام بخطأ")}</a>`;
}

/* Photo réelle avec son crédit (auteur, licence, lien vers la source) — obligatoire pour chaque photo */
function htmlPhoto(id, classe) {
  const p = (typeof PHOTOS !== "undefined") && PHOTOS[id];
  if (!p) return "";
  const racine = document.documentElement.dataset.racine || "";
  return `<figure class="photo ${classe || ""}" data-photo="${id}">
    <img src="${racine}${p.fichier}" width="${p.largeur}" height="${p.hauteur}" alt="${esc(bi(p, "alt"))}" loading="lazy" decoding="async">
    <figcaption class="credit">${T("Photo", "صورة")} : <bdi>${esc(p.auteur)}</bdi>, <a href="${p.licence_url || p.source}" rel="noopener license" target="_blank"><bdi dir="ltr">${esc(p.licence)}</bdi></a>, <a href="${p.source}" rel="noopener" target="_blank">Wikimedia Commons</a>${p.lieu ? " — " + esc(p.lieu) : ""}</figcaption>
  </figure>`;
}

/* Installation sur le téléphone : service worker PRUDENT (sw.js : réseau d'abord pour les pages et les données).
   Seulement en https (jamais en file: pendant les tests locaux). */
if ("serviceWorker" in navigator && location.protocol === "https:") {
  window.addEventListener("load", () => {
    try { navigator.serviceWorker.register("/code-route-tunisie/sw.js", { scope: "/code-route-tunisie/" }).catch(() => {}); } catch (e) { /* rien : le site marche sans */ }
  });
}

/* >>> vidéo de présentation : page video/ partagée par le bouton « Partager » (outil vidéos d'Ahmed) */
window.VIDEO_SITE = {"base": "/code-route-tunisie/", "defaut": "fr", "nom": {"fr": "Code de la route Tunisie", "ar": "قانون الطرقات تونس"}};
/* Bouton « Partager » (demande d'Ahmed, octobre 2026) : partage un LIEN vers la page vidéo du site (qui montre la vidéo
   de présentation, avec un gros bouton « Ouvrir le site ») + l'adresse du site dans le texte. WhatsApp et Facebook
   affichent l'aperçu de la page vidéo (grande image, vidéo lisible sur Facebook). Menu de partage du téléphone, sinon WhatsApp.
   Espace professionnels des annuaires : page « video-pro/ ». Réglages : window.VIDEO_SITE (juste au-dessus). */
(function () {
  var S = window.VIDEO_SITE, ORIGINE = "https://ah6259.github.io";
  function langue() { return document.documentElement.lang || S.defaut; }
  function M(o) { return o[langue()] || o[S.defaut] || o.fr; }
  // page vidéo à partager (et page du site correspondante) selon la page où l'on est
  window.pageVideo = function () {
    var chemin = location.pathname, pro = false;
    for (var i = 0; i < (S.pro || []).length; i++) if (chemin.indexOf(S.base + S.pro[i]) === 0) pro = true;
    var l = langue(), q = l !== S.defaut ? "?lang=" + l : "";
    return { page: ORIGINE + S.base + (pro ? "video-pro/" : "video/") + q, site: ORIGINE + S.base + (pro ? S.site_pro : "") + q + (pro ? (S.ancre_pro || "") : ""),
             titre: M(pro ? S.titre_pro : S.nom) };
  };
  window.partagerLien = function (titre, site) {
    var v = window.pageVideo(), t = titre || v.titre;
    if (site) v.site = site;
    var texte = t + "\n" + M({ fr: "Le site : ", ar: "الموقع: ", en: "The website: " }) + v.site + "\n" + M({ fr: "Regardez la vidéo :", ar: "شاهد الفيديو:", en: "Watch the video:" });
    function whatsapp() { window.open("https://wa.me/?text=" + encodeURIComponent(texte + " " + v.page), "_blank", "noopener"); return "whatsapp"; }
    if (navigator.share) {
      return navigator.share({ title: t, text: texte, url: v.page }).then(function () { return "lien"; }, function (e) {
        return e && e.name === "AbortError" ? "annule" : whatsapp();
      });
    }
    return Promise.resolve(whatsapp());
  };
  // page vidéo : textes dans la langue de la page (data-vfr / data-var / data-ven), vidéo de la langue (data-src-fr…)
  function traduire() {
    var l = langue();
    var el = document.querySelectorAll("[data-vfr]");
    for (var i = 0; i < el.length; i++) { var t = el[i].getAttribute("data-v" + l) || el[i].getAttribute("data-v" + S.defaut); if (t && el[i].textContent !== t) el[i].textContent = t; }
    var v = document.querySelector(".video-lecteur");
    if (v) {
      var s = v.getAttribute("data-src-" + l) || v.getAttribute("data-src-defaut") || v.getAttribute("src");
      if (!v.getAttribute("data-src-defaut")) v.setAttribute("data-src-defaut", v.getAttribute("src"));
      if (v.getAttribute("src") !== s) v.setAttribute("src", s);
      if (!v.getAttribute("data-poster-defaut")) v.setAttribute("data-poster-defaut", v.getAttribute("poster"));
      var po = v.getAttribute("data-poster-" + l) || v.getAttribute("data-poster-defaut");
      if (v.getAttribute("poster") !== po) v.setAttribute("poster", po);
    }
    // lien discret « Vidéo de présentation » en bas de l'accueil et de À propos -> la page vidéo
    var p = location.pathname.replace(/index\.html$/, "");
    if (p === S.base || p === S.base + "a-propos/") {
      var b = document.getElementById("lien-video");
      if (!b) {
        b = document.createElement("p"); b.id = "lien-video"; b.className = "lien-video"; b.appendChild(document.createElement("a"));
        var m = document.querySelector("main"); if (m) m.insertAdjacentElement("afterend", b); else document.body.appendChild(b);
      }
      b.firstChild.href = S.base + "video/" + (l !== S.defaut ? "?lang=" + l : "");
      b.firstChild.textContent = M({ fr: "Vidéo de présentation", ar: "الفيديو التقديمي", en: "Presentation video" });
    }
  }
  document.addEventListener("click", function (e) {
    var b = e.target && e.target.closest && e.target.closest("[data-partager-video]");
    if (!b) return;
    e.preventDefault();
    try { if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: "partage" + location.pathname.replace(S.base, "/"), title: "Partage", event: true }); } catch (x) {}
    window.partagerLien();
  });
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(traduire, 0); }); else setTimeout(traduire, 0);
  document.addEventListener("langue", function () { setTimeout(traduire, 0); });
  try { new MutationObserver(function () { setTimeout(traduire, 0); }).observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] }); } catch (x) {}
})();
/* <<< vidéo de présentation */
