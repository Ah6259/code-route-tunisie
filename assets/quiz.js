/* Code de la route Tunisie — thèmes, entraînement, examen blanc (tout se passe dans le navigateur) */

// Examen blanc : chiffres trouvés dans nos recherches, À CONFIRMER auprès d'une auto-école / de l'ATTT.
const EXAMEN = { nb: 30, parTheme: 3, seuil: 24 };

const THEMES = {
  1: { fr: "Panneaux et signalisation", ar: "العلامات والإشارات", ic: '<path d="M12 3 2.5 20h19z"/><path d="M12 10v4M12 17h.01"/>' },
  2: { fr: "Priorités et intersections", ar: "الأولوية والتقاطعات", ic: '<path d="M9 3v6H3M15 3v6h6M9 21v-6H3M15 21v-6h6"/>' },
  3: { fr: "Croisement et dépassement", ar: "الالتقاء والتجاوز", ic: '<path d="M7 21V9M7 9l-3 3M7 9l3 3"/><path d="M15 21v-4c0-3 3-4 3-8V3M18 3l-3 3M18 3l3 3"/>' },
  4: { fr: "Vitesse et distances", ar: "السرعة والمسافات", ic: '<path d="M4 18a8 8 0 1 1 16 0"/><path d="M12 18l4-6"/>' },
  5: { fr: "Arrêt et stationnement", ar: "التوقف والوقوف", ic: '<rect x="4" y="3" width="16" height="18" rx="3"/><path d="M10 17V7h3a3 3 0 0 1 0 6h-3"/>' },
  6: { fr: "Feux et éclairage", ar: "الأضواء والإنارة", ic: '<path d="M11 5C7 5 4 8 4 12s3 7 7 7z"/><path d="M15 8h6M15 12h6M15 16h6"/>' },
  7: { fr: "Alcool, fatigue, téléphone", ar: "الكحول والتعب والهاتف", ic: '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 17h2M3 3l18 18"/>' },
  8: { fr: "Mécanique et entretien", ar: "الميكانيك والصيانة", ic: '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4z"/>' },
  9: { fr: "Premiers secours et accident", ar: "الإسعافات والحوادث", ic: '<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/>' },
  10: { fr: "Infractions et sanctions", ar: "المخالفات والعقوبات", ic: '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>' }
};
const ICONES = {
  ok: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/></svg>',
  ko: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/></svg>',
  fleche: '<svg class="sens" viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>'
};
const LETTRES = { fr: ["A", "B", "C", "D", "E"], ar: ["أ", "ب", "ج", "د", "هـ"] };

/* ---------- logique pure (testée par tools/test_site.mjs) ---------- */
function melanger(t, rng = Math.random) {
  const a = t.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}
function questionsDuTheme(n) { return QUESTIONS.filter(q => q.theme === +n); }
function estJuste(q, choisis) {
  const s = new Set(choisis);
  return s.size === q.bonnes.length && q.bonnes.every(b => s.has(b));
}
// 30 questions sans doublon : 3 par thème, complété au hasard si un thème en manque
function tirerExamen(rng = Math.random, liste = QUESTIONS) {
  let tirage = [];
  for (const t of Object.keys(THEMES))
    tirage.push(...melanger(liste.filter(q => q.theme === +t), rng).slice(0, EXAMEN.parTheme));
  const reste = melanger(liste.filter(q => !tirage.includes(q)), rng);
  tirage.push(...reste.slice(0, Math.max(0, EXAMEN.nb - tirage.length)));
  return melanger(tirage.slice(0, EXAMEN.nb), rng);
}
function noter(questions, reponses) {
  const parTheme = {}; const erreurs = []; let score = 0;
  questions.forEach((q, i) => {
    const r = reponses[i] || [];
    const pt = parTheme[q.theme] || (parTheme[q.theme] = { bons: 0, total: 0 });
    pt.total++;
    if (estJuste(q, r)) { score++; pt.bons++; } else erreurs.push({ q, choisis: r, rang: i + 1 });
  });
  return { score, total: questions.length, reussi: score >= EXAMEN.seuil, parTheme, erreurs };
}
function nomTheme(n) { return T(THEMES[n].fr, THEMES[n].ar); }
function lettre(i) { return LETTRES[document.documentElement.lang === "ar" ? "ar" : "fr"][i]; }
// « 25 / 30 » : un seul bloc isolé, pour garder l'ordre en arabe
function frac(a, b, sep = " / ") { return nb(a + sep + b); }

/* ---------- morceaux d'affichage communs ---------- */
function htmlChoix(q, choisis, corrige) {
  return `<div class="choix-liste">` + q.choix.map((c, i) => {
    const on = choisis.includes(i), bonne = q.bonnes.includes(i);
    let cl = on ? " on" : "", marque = "";
    if (corrige) {
      cl = bonne ? " bonne" : on ? " fausse" : "";
      if (bonne && !on) marque = `<span class="marque">${T("Bonne réponse", "الإجابة الصحيحة")}</span>`;
      if (bonne && on) marque = `<span class="marque">✓ ${T("Bonne réponse", "الإجابة الصحيحة")}</span>`;
      if (!bonne && on) marque = `<span class="marque">✗ ${T("Votre réponse", "إجابتك")}</span>`;
    }
    return `<button type="button" class="choix-q${cl}" data-i="${i}" role="checkbox" aria-checked="${on}"${corrige ? " disabled" : ""}>
      <span class="lettre">${lettre(i)}</span><span class="txt">${esc(txt(c))}${marque}</span></button>`;
  }).join("") + `</div>`;
}
function htmlExplication(q) {
  const ar = document.documentElement.lang === "ar";
  return `<div class="explication"><p>${esc(txt(q, "explication"))}</p>
    <p class="source"><b>${T("Source :", "المصدر:")}</b> ${ar ? `<bdi dir="ltr">${esc(q.source)}</bdi>` : esc(q.source)}</p></div>`;
}
function htmlProgres(i, total, droite) {
  return `<div class="progres"><span>${T("Question", "السؤال")} ${frac(i + 1, total)}</span><span>${droite || ""}</span></div>
    <div class="barre" aria-hidden="true"><span style="width:${(i / total * 100).toFixed(1)}%"></span></div>`;
}
function htmlSchema(q) {
  if (!q.image) return "";
  const racine = document.documentElement.dataset.racine || "";
  return `<img class="schema" src="${racine}assets/illustrations/${q.image}" width="320" height="200" alt="${T("Schéma de la situation", "رسم توضيحي للوضعية")}">`;
}
function htmlSignalerQ(q) {
  return htmlSignaler(q.id, q.question_fr, q.bonnes.map(b => q.choix[b].fr).join(" + "));
}
const CONSIGNE = () => T("Une ou plusieurs bonnes réponses : cochez tout ce qui est juste.", "إجابة صحيحة واحدة أو أكثر: اختر كل ما هو صحيح.");

/* ---------- grille des thèmes (accueil et page entraînement) ---------- */
function afficherThemes(cible, racine) {
  const el = typeof cible === "string" ? document.getElementById(cible) : cible;
  if (!el) return;
  const prog = lireProgression();
  el.innerHTML = Object.keys(THEMES).map(t => {
    const qs = questionsDuTheme(t);
    const reussies = qs.filter(q => prog.q[q.id] === 1).length;
    const pc = qs.length ? Math.round(reussies / qs.length * 100) : 0;
    return `<a class="theme" href="${racine}entrainement/?theme=${t}" data-theme="${t}">
      <div class="haut"><span class="ic ill"><img src="${racine}assets/illustrations/theme-${t}.svg" alt="" width="34" height="34"></span>
        <div><div class="num">${T("Thème", "المحور")} ${nb(t)}</div><b>${nomTheme(t)}</b></div></div>
      <div class="droite"><span class="nb">${nb(qs.length)} ${T("questions", "سؤالًا")}</span>
        <div class="jauge" title="${pc} %"><span style="width:${pc}%"></span></div></div></a>`;
  }).join("");
}
function afficherHistorique(cible) {
  const el = document.getElementById(cible);
  if (!el) return;
  const ex = lireProgression().examens.slice(-5);
  el.hidden = !ex.length;
  if (!ex.length) return;
  el.innerHTML = `<b>${T("Vos derniers examens blancs :", "آخر امتحاناتك التجريبية:")}</b>
    <div class="historique">${ex.map(e => `<span class="pastille${e.score >= EXAMEN.seuil ? " ok" : ""}">${frac(e.score, e.total, "/")}</span>`).join("")}</div>`;
}

/* ---------- entraînement par thème ---------- */
const entrainement = { theme: null, liste: [], i: 0, choisis: [], corrige: false, bons: 0 };
// « Mes erreurs » : questions ratées à la dernière tentative (gardées dans le navigateur)
function questionsRatees() { const p = lireProgression(); return QUESTIONS.filter(q => p.q[q.id] === 0); }
function lancerEntrainement() {
  const params = new URLSearchParams(location.search);
  if (params.get("erreurs")) {
    Object.assign(entrainement, { theme: "erreurs", liste: melanger(questionsRatees()), i: 0, choisis: [], corrige: false, bons: 0 });
    rendreEntrainement(); return;
  }
  const t = +params.get("theme");
  if (!THEMES[t]) { entrainement.theme = null; rendreEntrainement(); return; }
  Object.assign(entrainement, { theme: t, liste: melanger(questionsDuTheme(t)), i: 0, choisis: [], corrige: false, bons: 0 });
  rendreEntrainement();
}
function rendreEntrainement() {
  const e = entrainement, zone = document.getElementById("quiz");
  const titre = document.getElementById("titre-page");
  if (!e.theme) {
    titre.textContent = T("Entraînement par thème", "التدريب حسب المحور");
    zone.innerHTML = `<div class="themes" id="choix-themes"></div>`;
    afficherThemes("choix-themes", "../");
    return;
  }
  const serieErreurs = e.theme === "erreurs";
  titre.textContent = serieErreurs ? T("Mes erreurs", "أخطائي") : `${T("Thème", "المحور")} ${nb(e.theme)} · ${nomTheme(e.theme)}`;
  if (serieErreurs && !e.liste.length) {
    zone.innerHTML = `<section class="carte" id="aucune-erreur"><h2>${T("Aucune erreur à revoir", "لا أخطاء للمراجعة")}</h2>
      <p class="doux">${T("Les questions que vous ratez à l'entraînement ou à l'examen blanc apparaîtront ici. Elles disparaissent quand vous y répondez juste.", "الأسئلة التي تخطئ فيها في التدريب أو الامتحان التجريبي ستظهر هنا، وتختفي عندما تجيب عنها إجابة صحيحة.")}</p>
      <div class="actions"><a class="btn" href="./">${T("S'entraîner par thème", "التدريب حسب المحور")}</a></div></section>`;
    return;
  }
  if (e.i >= e.liste.length) {
    const suivant = serieErreurs ? 1 : e.theme % 10 + 1;
    zone.innerHTML = `<section class="carte score ${e.bons === e.liste.length ? "reussi" : ""}">
      <div class="doux">${T("Série terminée", "انتهت السلسلة")}</div>
      <div class="grand" id="score-theme" dir="ltr">${e.bons}<small> / ${e.liste.length}</small></div>
      <p class="doux">${T("bonnes réponses du premier coup", "إجابات صحيحة من المحاولة الأولى")}</p>
      <div class="actions">
        <button class="btn" type="button" id="recommencer">${T("Recommencer ce thème", "إعادة هذا المحور")}</button>
        <a class="btn second" href="?theme=${suivant}">${T("Thème suivant", "المحور التالي")} ${ICONES.fleche}</a>
      </div>
      <div class="actions"><a class="btn second" href="../examen/">${T("Passer un examen blanc", "اجتياز امتحان تجريبي")}</a></div>
    </section>`;
    document.getElementById("recommencer").onclick = lancerEntrainement;
    return;
  }
  const q = e.liste[e.i];
  let bas;
  if (!e.corrige) {
    bas = `<div class="actions"><button class="btn large" type="button" id="valider"${e.choisis.length ? "" : " disabled"}>${T("Valider", "تأكيد")}</button></div>`;
  } else {
    const juste = estJuste(q, e.choisis);
    bas = `<div class="verdict ${juste ? "ok" : "ko"}">${juste ? ICONES.ok : ICONES.ko}${juste ? T("Bonne réponse !", "إجابة صحيحة!") : T("Mauvaise réponse", "إجابة خاطئة")}</div>
      ${htmlExplication(q)}
      <div class="actions"><button class="btn large" type="button" id="suivante">${e.i + 1 < e.liste.length ? T("Question suivante", "السؤال التالي") : T("Voir mon résultat", "عرض نتيجتي")} ${ICONES.fleche}</button></div>`;
  }
  zone.innerHTML = `<section class="carte protege" data-id="${q.id}">
    ${htmlProgres(e.i, e.liste.length, serieErreurs ? nomTheme(q.theme) : `${nb(e.bons)} ✓`)}
    <p class="question">${esc(txt(q, "question"))}</p>
    ${htmlSchema(q)}
    <p class="consigne">${CONSIGNE()}</p>
    ${htmlChoix(q, e.choisis, e.corrige)}
    ${bas}
    ${htmlSignalerQ(q)}</section>`;
  zone.querySelectorAll(".choix-q:not([disabled])").forEach(b => b.onclick = () => {
    const i = +b.dataset.i;
    e.choisis = e.choisis.includes(i) ? e.choisis.filter(x => x !== i) : [...e.choisis, i].sort();
    rendreEntrainement();
  });
  const v = document.getElementById("valider");
  if (v) v.onclick = () => {
    if (!e.choisis.length) return;
    e.corrige = true;
    const juste = estJuste(q, e.choisis);
    if (juste) e.bons++;
    const p = lireProgression(); p.q[q.id] = juste ? 1 : 0; ecrireProgression(p);
    rendreEntrainement();
  };
  const s = document.getElementById("suivante");
  if (s) s.onclick = () => { e.i++; e.choisis = []; e.corrige = false; rendreEntrainement(); window.scrollTo && window.scrollTo(0, 0); };
}

/* ---------- examen blanc ---------- */
const examen = { etape: "intro", questions: [], reponses: [], i: 0, choisis: [], resultat: null };
function demarrerExamen() {
  Object.assign(examen, { etape: "question", questions: tirerExamen(), reponses: [], i: 0, choisis: [], resultat: null });
  rendreExamen();
}
function rendreExamen() {
  const x = examen, zone = document.getElementById("quiz");
  if (x.etape === "intro") {
    zone.innerHTML = `<section class="carte">
      <h2>${T("Comment se passe l'examen blanc ?", "كيف يجري الامتحان التجريبي؟")}</h2>
      <ul class="liste">
        <li>${T(`<b>${EXAMEN.nb} questions</b> tirées au hasard, ${EXAMEN.parTheme} dans chacun des 10 thèmes.`, `<b>${nb(EXAMEN.nb)} سؤالًا</b> مختارة عشوائيًا، ${nb(EXAMEN.parTheme)} من كل محور من المحاور العشرة.`)}</li>
        <li>${T("Une ou plusieurs bonnes réponses par question : la réponse compte seulement si elle est complète.", "إجابة صحيحة واحدة أو أكثر لكل سؤال: لا تُحتسب الإجابة إلا إذا كانت كاملة.")}</li>
        <li>${T("Pas de correction pendant l'examen : vous verrez vos erreurs expliquées à la fin.", "لا تصحيح أثناء الامتحان: سترى أخطاءك مع الشرح في النهاية.")}</li>
        <li>${T(`Réussite à partir de <b>${EXAMEN.seuil} bonnes réponses sur ${EXAMEN.nb}</b>.`, `النجاح ابتداءً من <b>${nb(EXAMEN.seuil)} إجابة صحيحة من ${nb(EXAMEN.nb)}</b>.`)}</li>
      </ul>
      <p class="avert">${T("Chiffres à confirmer : 30 questions et 24 bonnes réponses sont les chiffres trouvés dans nos recherches sur l'examen de l'ATTT. Demandez confirmation à votre auto-école.",
        "أرقام يجب التأكد منها: 30 سؤالًا و24 إجابة صحيحة هي الأرقام التي وجدناها في بحثنا حول امتحان الوكالة الفنية للنقل البري. اسأل مدرسة تعليم السياقة للتأكد.")}</p>
      <div class="actions"><button class="btn large orange" type="button" id="commencer">${T("Commencer l'examen", "ابدأ الامتحان")} ${ICONES.fleche}</button></div>
    </section>`;
    document.getElementById("commencer").onclick = demarrerExamen;
    return;
  }
  if (x.etape === "question") {
    const q = x.questions[x.i];
    zone.innerHTML = `<section class="carte protege" data-id="${q.id}">
      ${htmlProgres(x.i, x.questions.length, nomTheme(q.theme))}
      <p class="question">${esc(txt(q, "question"))}</p>
    ${htmlSchema(q)}
      <p class="consigne">${CONSIGNE()}</p>
      ${htmlChoix(q, x.choisis, false)}
      <div class="actions"><button class="btn large" type="button" id="valider"${x.choisis.length ? "" : " disabled"}>${x.i + 1 < x.questions.length ? T("Valider et continuer", "تأكيد ومواصلة") : T("Terminer l'examen", "إنهاء الامتحان")} ${ICONES.fleche}</button></div>
      ${htmlSignalerQ(q)}
    </section>`;
    zone.querySelectorAll(".choix-q").forEach(b => b.onclick = () => {
      const i = +b.dataset.i;
      x.choisis = x.choisis.includes(i) ? x.choisis.filter(v => v !== i) : [...x.choisis, i].sort();
      rendreExamen();
    });
    document.getElementById("valider").onclick = () => {
      if (!x.choisis.length) return;
      x.reponses[x.i] = x.choisis; x.choisis = []; x.i++;
      if (x.i >= x.questions.length) terminerExamen();
      else rendreExamen();
      window.scrollTo && window.scrollTo(0, 0);
    };
    return;
  }
  // résultats
  const r = x.resultat;
  const canon = document.querySelector('link[rel="canonical"]');
  zone.innerHTML = `<section class="carte score ${r.reussi ? "reussi" : "echoue"}">
      <div class="doux">${T("Votre score", "نتيجتك")}</div>
      <div class="grand" id="score" dir="ltr">${r.score}<small> / ${r.total}</small></div>
      <span class="statut ${r.reussi ? "ok" : "ko"}" id="statut">${r.reussi ? T("Réussi", "ناجح") : T("Pas encore : continuez à réviser", "ليس بعد: واصل المراجعة")}</span>
      <p class="avert">${T(`Seuil de réussite : ${EXAMEN.seuil}/${EXAMEN.nb} (chiffres à confirmer auprès d'une auto-école).`, `عتبة النجاح: ${iso(EXAMEN.seuil + "/" + EXAMEN.nb)} (أرقام يجب التأكد منها لدى مدرسة تعليم السياقة).`)}</p>
      <div class="actions">
        <button class="btn" type="button" id="nouvel">${T("Nouvel examen blanc", "امتحان تجريبي جديد")}</button>
        <a class="partage" target="_blank" rel="noopener" id="partage" href="${lienWhatsApp(T(`J'ai eu ${r.score}/${r.total} à l'examen blanc du code de la route tunisien. Essaie toi aussi, c'est gratuit :`, `تحصلت على ${r.score}/${r.total} في الامتحان التجريبي لقانون الطرقات التونسي. جرّب أنت أيضًا، مجانًا:`), canon && canon.href)}">${ICONE_WHATSAPP}${T("Partager", "شارك")}</a>
      </div>
    </section>
    <section class="carte">
      <h2>${T("Résultat par thème", "النتيجة حسب المحور")}</h2>
      <table id="par-theme">${Object.keys(r.parTheme).sort((a, b) => a - b).map(t =>
        `<tr><td>${nomTheme(t)}</td><td>${frac(r.parTheme[t].bons, r.parTheme[t].total)}</td></tr>`).join("")}</table>
    </section>
    <div class="titre-section"><h2>${r.erreurs.length ? T("Revue de vos erreurs", "مراجعة أخطائك") : T("Aucune erreur, bravo !", "لا أخطاء، أحسنت!")}</h2>
      <span>${r.erreurs.length ? nb(r.erreurs.length) + " " + T("à revoir", "للمراجعة") : ""}</span></div>
    <div id="erreurs">${r.erreurs.map(er => `<section class="carte erreur protege" data-id="${er.q.id}">
      <div class="num">${T("Question", "السؤال")} ${nb(er.rang)} · ${nomTheme(er.q.theme)}</div>
      <p class="question">${esc(txt(er.q, "question"))}</p>
      ${htmlSchema(er.q)}
      ${htmlChoix(er.q, er.choisis, true)}
      <div style="height:12px"></div>
      ${htmlExplication(er.q)}
      ${htmlSignalerQ(er.q)}
    </section>`).join("")}</div>`;
  document.getElementById("nouvel").onclick = demarrerExamen;
}
function terminerExamen() {
  const x = examen;
  x.resultat = noter(x.questions, x.reponses);
  x.etape = "fin";
  const p = lireProgression();
  x.questions.forEach((q, i) => p.q[q.id] = estJuste(q, x.reponses[i] || []) ? 1 : 0);
  p.examens.push({ date: new Date().toISOString().slice(0, 10), score: x.resultat.score, total: x.resultat.total });
  p.examens = p.examens.slice(-20);
  ecrireProgression(p);
  rendreExamen();
}
