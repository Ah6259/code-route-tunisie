/* Affichage propre à chaque page (choisi par <body data-page="…">). Aucun script dans les pages HTML
   (la politique de sécurité CSP n'autorise que les fichiers du site). */
const racineP = () => document.documentElement.dataset.racine || "";

/* ---------------- accueil ---------------- */
function pageAccueil() {
  afficherThemes("themes", "");
  afficherHistorique("historique");
  document.getElementById("total-q").textContent = T(QUESTIONS.length + " questions", iso(String(QUESTIONS.length)) + " سؤالًا");
  const nbErr = questionsRatees().length;
  document.getElementById("rubriques").innerHTML = [
    ["entrainement/", "entrainement", T("Entraînement", "التدريب"), T("Questions par thème, correction immédiate", "أسئلة حسب المحور مع تصحيح فوري")],
    ["lecons/", "lecons", T("Leçons", "الدروس"), T("10 cours courts avec schémas", "10 دروس قصيرة مع رسوم")],
    ["panneaux/", "panneaux", T("Panneaux", "العلامات"), T(`${PANNEAUX_NB} panneaux expliqués`, `${iso(String(PANNEAUX_NB))} علامة مشروحة`)],
    ["amendes/", "amendes", T("Amendes et sanctions", "الخطايا والعقوبات"), T("Barème 2025 et délits", "سلّم 2025 والجنح")],
    ["entrainement/?erreurs=1", "erreurs", T("Mes erreurs", "أخطائي") + (passActif() ? "" : ` <span class="mini-pass">${T("Pass", "الباقة")}</span>`), nbErr ? T(`${nbErr} question(s) à revoir`, `${iso(String(nbErr))} سؤال للمراجعة`) : T("Rien à revoir pour l'instant", "لا شيء للمراجعة الآن")],
    ["permis/", "permis", T("Passer le permis", "اجتياز الرخصة"), T("Dossier, épreuves, âge", "الملف، الاختبارات، السن")],
    ["https://ah6259.github.io/auto-ecoles-tunisie/", "auto-ecole", T("Trouver une auto-école", "ابحث عن مدرسة سياقة"), T("Près de chez vous, par gouvernorat (annuaire gratuit)", "قريبة منك، حسب الولاية (دليل مجاني)")]
  ].map(([h, i, t, s]) => `<a class="rubrique" href="${h}"><span class="ic ill"><img src="${racineP()}assets/illustrations/rub-${i}.svg" alt="" width="46" height="46"></span><span><b>${t}</b><small>${s}</small></span></a>`).join("");
  const cr = document.getElementById("credit-hero");
  if (cr) cr.innerHTML = htmlCreditSeul("accueil-route");
  // gros bouton doré « Pass Examen » (en haut de l'accueil)
  const cta = document.getElementById("cta-pass-zone");
  if (cta) cta.innerHTML = passActif()
    ? `<a class="btn-pass-grand actif" id="cta-pass" href="examen/"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg><span>${T("Pass Examen actif", "باقة الامتحان مفعّلة")}<small>${T(`Examens blancs illimités jusqu'au ${dateLisible(finPass())} inclus`, `امتحانات تجريبية بلا حدود إلى غاية ${iso(dateLisible(finPass()))}`)}</small></span></a>`
    : htmlBoutonPass("cta-pass", "Pass Examen : examens blancs illimités", "باقة الامتحان: امتحانات تجريبية بلا حدود");
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

/* ---------------- Pass Examen (page pass/) ---------------- */
function pagePass() {
  const etat = document.getElementById("pass-etat");
  if (!etat) return;
  etat.hidden = !passActif();
  etat.innerHTML = passActif() ? `<b>✓ ${T(`Votre Pass Examen est actif sur ce téléphone jusqu'au ${dateLisible(finPass())} inclus.`, `باقة الامتحان مفعّلة على هذا الهاتف إلى غاية ${iso(dateLisible(finPass()))}.`)}</b>
    <div class="actions"><a class="btn" href="../examen/">${T("Passer un examen blanc", "اجتياز امتحان تجريبي")}</a><a class="btn second" href="../examen/#stats">${T("Mes statistiques", "إحصائياتي")}</a></div>` : "";
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
  const crp = document.getElementById("credit-hero");   // crédit de la photo du bandeau (pages autres que l'accueil)
  if (crp && crp.dataset.photo && typeof PHOTOS !== "undefined") crp.innerHTML = htmlCreditSeul(crp.dataset.photo);
  if (p === "accueil") pageAccueil();
  else if (p === "a-propos") pageAPropos();
  else if (p === "lecons") pageLecons();
  else if (p === "panneaux") pagePanneaux();
  else if (p === "amendes") pageAmendes();
  else if (p === "permis") pagePermis();
  else if (p === "relecture") pageRelecture();
  else if (p === "examen") rendreExamen();
  else if (p === "pass") pagePass();
  else if (p === "entrainement") { if (entrainementLance) rendreEntrainement(); else { entrainementLance = true; lancerEntrainement(); } }
});

// Pass Examen activé, prolongé ou arrêté (pass.js) : on met à jour ce qui en dépend, sans jamais couper un examen en cours
document.addEventListener("pass", () => {
  const p = document.body.dataset.page;
  if (p === "accueil") pageAccueil();
  else if (p === "pass") pagePass();
  else if (p === "examen" && examen.etape === "intro") rendreExamen();
  else if (p === "entrainement" && /erreurs/.test(String(entrainement.theme))) lancerEntrainement();
});
