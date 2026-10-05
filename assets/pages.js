/* Affichage propre à chaque page (choisi par <body data-page="…">). Aucun script dans les pages HTML
   (la politique de sécurité CSP n'autorise que les fichiers du site). */
const ICONES_RUB = {
  lecons: '<path d="M4 5c3-1 5-1 8 1 3-2 5-2 8-1v14c-3-1-5-1-8 1-3-2-5-2-8-1z"/><path d="M12 6v14"/>',
  panneaux: '<path d="M12 3 2.5 20h19z"/><path d="M12 10v4M12 17h.01"/>',
  amendes: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>',
  erreurs: '<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>',
  permis: '<rect x="3" y="6" width="18" height="13" rx="2"/><circle cx="8.5" cy="12" r="2"/><path d="M13 11h5M13 14h3"/>'
};
const ico = n => `<svg viewBox="0 0 24 24">${ICONES_RUB[n]}</svg>`;
const racineP = () => document.documentElement.dataset.racine || "";

/* ---------------- accueil ---------------- */
function pageAccueil() {
  afficherThemes("themes", "");
  afficherHistorique("historique");
  document.getElementById("total-q").textContent = T(QUESTIONS.length + " questions", iso(String(QUESTIONS.length)) + " سؤالًا");
  const nbErr = questionsRatees().length;
  document.getElementById("rubriques").innerHTML = [
    ["lecons/", "lecons", T("Leçons", "الدروس"), T("10 cours courts avec schémas", "10 دروس قصيرة مع رسوم")],
    ["panneaux/", "panneaux", T("Panneaux", "العلامات"), T(`${PANNEAUX_NB} panneaux expliqués`, `${iso(String(PANNEAUX_NB))} علامة مشروحة`)],
    ["amendes/", "amendes", T("Amendes et points", "الخطايا والنقاط"), T("Barème 2025 et délits", "سلّم 2025 والجنح")],
    ["entrainement/?erreurs=1", "erreurs", T("Mes erreurs", "أخطائي"), nbErr ? T(`${nbErr} question(s) à revoir`, `${iso(String(nbErr))} سؤال للمراجعة`) : T("Rien à revoir pour l'instant", "لا شيء للمراجعة الآن")],
    ["permis/", "permis", T("Passer le permis", "اجتياز الرخصة"), T("Dossier, épreuves, âge", "الملف، الاختبارات، السن")]
  ].map(([h, i, t, s]) => `<a class="rubrique" href="${h}"><span class="ic">${ico(i)}</span><span><b>${t}</b><small>${s}</small></span></a>`).join("");
  const cr = document.getElementById("credit-hero");
  if (cr) cr.innerHTML = htmlCreditSeul("accueil-route");
}
// Crédit seul (pour les photos de fond : bandeau)
function htmlCreditSeul(id) {
  const p = PHOTOS[id];
  return `${T("Photo", "صورة")} : <bdi>${esc(p.auteur)}</bdi>, <a href="${p.licence_url || p.source}" rel="noopener license" target="_blank"><bdi dir="ltr">${esc(p.licence)}</bdi></a>, <a href="${p.source}" rel="noopener" target="_blank">Wikimedia Commons</a>`;
}
const PANNEAUX_NB = typeof PANNEAUX !== "undefined" ? PANNEAUX.length : 31;

/* ---------------- à propos ---------------- */
function pageAPropos() {
  document.getElementById("chiffres").innerHTML =
    `<tr><td>${T("Questions publiées", "الأسئلة المنشورة")}</td><td>${nb(QUESTIONS.length)}</td></tr>
     <tr><td>${T("En attente de vérification (non publiées)", "في انتظار التثبت (غير منشورة)")}</td><td>${nb(QUESTIONS_INFO.exclues.length)}</td></tr>
     <tr><td>${T("Thèmes et leçons", "المحاور والدروس")}</td><td>${nb(Object.keys(THEMES).length)}</td></tr>
     <tr><td>${T("Texte officiel vérifié le", "تم التثبت من النص الرسمي في")}</td><td id="verifie-le">${nb(REGLES_SITE.verifie_le)}</td></tr>`;
  document.getElementById("credits-photos").innerHTML = Object.entries(PHOTOS).map(([id, p]) =>
    `<li data-photo="${id}"><b><bdi>${esc(bi(p, "alt"))}</bdi></b> — ${htmlCreditSeul(id)}${p.modifications ? ` <span class="doux">(${T(p.modifications, "صورة معدّلة: تصغير وضغط")})</span>` : ""}</li>`).join("");
}

/* ---------------- leçons ---------------- */
function pageLecons() {
  const t = +new URLSearchParams(location.search).get("theme");
  const zone = document.getElementById("lecon"), titre = document.getElementById("titre-page");
  const L = LECONS.find(l => l.theme === t);
  if (!L) {
    titre.textContent = T("Les leçons du code de la route", "دروس قانون الطرقات");
    zone.innerHTML = `${htmlPhoto("lecons-route", "large")}
      <div class="liste-lecons">${LECONS.map(l => `<a class="lecon-carte" href="?theme=${l.theme}" data-theme="${l.theme}">
        <img src="${racineP()}${PHOTOS[l.photo].fichier}" alt="" width="120" height="80" loading="lazy">
        <span><span class="num">${T("Leçon", "الدرس")} ${nb(l.theme)}</span><b>${nomTheme(l.theme)}</b>
        <small>${bi(l, "intro").slice(0, 90)}…</small></span></a>`).join("")}</div>`;
    return;
  }
  titre.textContent = `${T("Leçon", "الدرس")} ${nb(L.theme)} · ${nomTheme(L.theme)}`;
  const prec = L.theme > 1 ? L.theme - 1 : null, suiv = L.theme < 10 ? L.theme + 1 : null;
  zone.innerHTML = `<article class="carte protege lecon" data-theme="${L.theme}">
      ${htmlPhoto(L.photo, "large")}
      <p class="intro-lecon">${bi(L, "intro")}</p>
      ${L.blocs.map(b => `<section class="bloc"><h2>${bi(b, "t")}</h2><p>${bi(b, "")}</p></section>`).join("")}
      <img class="schema" src="${racineP()}assets/illustrations/${L.schema}" width="320" height="200" alt="${T("Schéma de la leçon", "رسم توضيحي للدرس")}">
      <div class="retenir"><h2>${T("À retenir", "للتذكّر")}</h2><ul>${L.retenir.map(r => `<li>${bi(r)}</li>`).join("")}</ul></div>
      <p class="source"><b>${T("Source :", "المصدر:")}</b> <bdi dir="ltr">${esc(L.sources)}</bdi></p>
      ${htmlSignaler("LECON-" + L.theme, nomThemeFr(L.theme))}
    </article>
    <div class="actions"><a class="btn large orange" id="vers-entrainement" href="../entrainement/?theme=${L.theme}">${T("S'entraîner sur ce thème", "تدرّب على هذا المحور")} ${ICONES.fleche}</a></div>
    <div class="actions">${prec ? `<a class="btn second" href="?theme=${prec}">‹ ${T("Leçon précédente", "الدرس السابق")}</a>` : ""}
      <a class="btn second" href="./">${T("Toutes les leçons", "كل الدروس")}</a>
      ${suiv ? `<a class="btn second" href="?theme=${suiv}">${T("Leçon suivante", "الدرس التالي")} ›</a>` : ""}</div>`;
}
function nomThemeFr(n) { return THEMES[n].fr; }

/* ---------------- panneaux ---------------- */
function pagePanneaux() {
  document.getElementById("photo-panneaux").innerHTML = htmlPhoto("lecon-1", "large");
  document.getElementById("familles").innerHTML = Object.entries(PANNEAUX_FAMILLES).map(([f, F]) => `
    <section class="carte protege famille" id="famille-${f}">
      <h2>${bi(F)}</h2>
      <p class="doux">${bi(F, "regle")} <span class="source">(<bdi dir="ltr">${esc(F.art)}</bdi>)</span></p>
      <div class="grille-panneaux">${PANNEAUX.filter(p => p.famille === f).map(p => `
        <div class="panneau" data-id="${p.id}">
          <img class="panneau-img" src="${racineP()}assets/panneaux/${p.id}.svg" width="96" height="96" alt="${esc(bi(p))}" loading="lazy">
          <b>${bi(p)}</b><span>${bi(p, "sens")}</span>
          <small class="source"><bdi dir="ltr">${esc(p.source)}</bdi></small>
        </div>`).join("")}</div>
    </section>`).join("");
}

/* ---------------- amendes ---------------- */
function pageAmendes() {
  const A = AMENDES;
  document.getElementById("photo-amendes").innerHTML = htmlPhoto("lecon-10", "large");
  document.getElementById("bareme").innerHTML = A.bareme_2025.categories.map(c =>
    `<div class="cat-amende"><span>${T("Catégorie", "الصنف")} ${nb(c.cat)}</span> <b>${nb(c.montant)} ${T("DT", "د")}</b></div>`).join("");
  document.getElementById("bareme-source").textContent = A.bareme_2025.source;
  document.getElementById("note-verif").textContent = bi(A.verification, "note");
  document.getElementById("table-contraventions").innerHTML =
    `<thead><tr><th>${T("Infraction", "المخالفة")}</th><th>${T("Ancienne catégorie (sur 5)", "الصنف القديم (من 5)")}</th></tr></thead><tbody>` +
    A.contraventions.map(c => `<tr data-n="${c.n}"><td>${bi(c)}<small class="source"><bdi dir="ltr">${esc(c.ref)} ; ${T("décret 2010-262", "الأمر 2010-262")}, n° ${esc(c.n)}</bdi></small></td>
      <td><span class="cat-old c${c.cat2010}">${nb(c.cat2010)}</span></td></tr>`).join("") + `</tbody>`;
  document.getElementById("table-delits").innerHTML =
    `<thead><tr><th>${T("Délit", "الجنحة")}</th><th>${T("Peine prévue", "العقوبة")}</th></tr></thead><tbody>` +
    A.delits.map(d => `<tr><td>${bi(d)}<small class="source"><bdi dir="ltr">${esc(d.ref)}</bdi></small></td><td>${bi(d, "peine")}</td></tr>`).join("") + `</tbody>`;
}

/* ---------------- permis (démarches) ---------------- */
function pagePermis() {
  document.getElementById("credit-cles").innerHTML = htmlCreditSeul("cles");
}

/* ---------------- relecture (moniteur) ---------------- */
const CLE_RELECTURE = "crt-relecture-v1";
function lireRelecture() { try { return JSON.parse(localStorage.getItem(CLE_RELECTURE) || "{}") || {}; } catch (e) { return {}; } }
function ecrireRelecture(r) { try { localStorage.setItem(CLE_RELECTURE, JSON.stringify(r)); } catch (e) {} }
function pageRelecture() {
  const r = lireRelecture();
  const ligne = (id, contenu) => `<div class="relu ${r[id] ? r[id].etat : ""}" data-id="${id}">${contenu}
      <div class="choix-relu"><button type="button" class="btn-ok" data-etat="ok">✓ OK</button>
      <button type="button" class="btn-ko" data-etat="corriger">✗ ${T("À corriger", "للتصحيح")}</button></div>
      <textarea placeholder="${T("Correction proposée (facultatif)", "التصحيح المقترح (اختياري)")}" rows="2">${esc((r[id] && r[id].note) || "")}</textarea></div>`;
  const q = QUESTIONS;
  document.getElementById("relecture").innerHTML =
    Object.keys(THEMES).map(t => `<section class="carte protege"><h2>${T("Thème", "المحور")} ${nb(t)} · ${nomTheme(t)}</h2>
      ${(() => { const L = LECONS.find(l => l.theme === +t); return ligne("LECON-" + t, `<p class="num">${T("Leçon", "الدرس")}</p><p>${bi(L, "intro")}</p>${L.blocs.map(b => `<p><b>${bi(b, "t")}</b> — ${bi(b, "")}</p>`).join("")}<p class="source">${esc(L.sources)}</p>`); })()}
      ${q.filter(x => x.theme === +t).map(x => ligne(x.id, `<p class="num">${x.id}</p><p class="question">${esc(txt(x, "question"))}</p>
        <ul class="liste">${x.choix.map((c, i) => `<li class="${x.bonnes.includes(i) ? "bonne-relu" : ""}">${x.bonnes.includes(i) ? "✓ " : ""}${esc(txt(c))}</li>`).join("")}</ul>
        <p class="doux">${esc(txt(x, "explication"))}</p><p class="source">${esc(x.source)}</p>`)).join("")}
    </section>`).join("");
  const zone = document.getElementById("relecture");
  zone.querySelectorAll(".relu").forEach(d => {
    const id = d.dataset.id;
    d.querySelectorAll("button").forEach(b => b.onclick = () => {
      const s = lireRelecture(); s[id] = Object.assign(s[id] || {}, { etat: b.dataset.etat }); ecrireRelecture(s);
      d.classList.remove("ok", "corriger"); d.classList.add(b.dataset.etat); bilan();
    });
    d.querySelector("textarea").onchange = ev => { const s = lireRelecture(); s[id] = Object.assign(s[id] || { etat: "corriger" }, { note: ev.target.value }); ecrireRelecture(s); bilan(); };
  });
  bilan();
}
function bilan() {
  const r = lireRelecture(), ids = Object.keys(r);
  const ok = ids.filter(i => r[i].etat === "ok").length, ko = ids.filter(i => r[i].etat === "corriger");
  const total = QUESTIONS.length + LECONS.length;
  document.getElementById("bilan").innerHTML = `<b>${nb(ok)}</b> OK · <b>${nb(ko.length)}</b> ${T("à corriger", "للتصحيح")} · ${nb(total - ok - ko.length)} ${T("non vus", "لم تُراجع")}`;
  const texte = `[Relecture code de la route] Bilan : ${ok} OK, ${ko.length} à corriger, ${total - ok - ko.length} non vus.\n` +
    ko.map(i => `- ${i}${r[i].note ? " : " + r[i].note : ""}`).join("\n");
  document.getElementById("envoyer-bilan").href = lienWhatsApp(texte, location.href.split("?")[0]);
}

/* ---------------- aiguillage ---------------- */
let entrainementLance = false;
document.addEventListener("langue", () => {
  const p = document.body.dataset.page;
  if (p === "accueil") pageAccueil();
  else if (p === "a-propos") pageAPropos();
  else if (p === "lecons") pageLecons();
  else if (p === "panneaux") pagePanneaux();
  else if (p === "amendes") pageAmendes();
  else if (p === "permis") pagePermis();
  else if (p === "relecture") pageRelecture();
  else if (p === "examen") rendreExamen();
  else if (p === "entrainement") { if (entrainementLance) rendreEntrainement(); else { entrainementLance = true; lancerEntrainement(); } }
});
