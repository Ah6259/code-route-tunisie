// Test automatique de « Code de la route Tunisie » — à lancer après CHAQUE modification :
//   node tools/test_site.mjs
// jsdom s'installe une fois par PC :  npm install --no-save --no-package-lock jsdom
// (le robot .github/workflows/tests.yml le lance aussi à chaque envoi sur GitHub)
import { JSDOM, VirtualConsole } from "jsdom";
import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { fileURLToPath, pathToFileURL } from "url";
import { dirname, join } from "path";
import { createRequire } from "module";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const lire = f => readFileSync(join(root, f), "utf8");
const require = createRequire(import.meta.url);
let erreurs = 0, total = 0;
const check = (desc, cond) => { total++; console.log((cond ? "OK   " : "FAIL ") + desc); if (!cond) erreurs++; };
const AR = /[؀-ۿ]/;
const PAGES = ["index.html", "lecons/index.html", "panneaux/index.html", "entrainement/index.html", "examen/index.html", "amendes/index.html", "permis/index.html", "a-propos/index.html", "pass/index.html", "pass/conditions/index.html", "video/index.html", "relecture/index.html"];
const PAGES_PUBLIQUES = PAGES.filter(p => p !== "relecture/index.html");

// ---- 1. Les questions ----------------------------------------------------------
const cheminJson = join(root, "..", "questions", "questions-v1.json");
const { REGLES_SITE } = require(join(root, "assets/regles.js"));
const { QUESTIONS, QUESTIONS_INFO } = require(join(root, "assets/questions.js"));
// Le fichier source (hors du site) n'existe que sur le PC d'Ahmed : sinon on contrôle les questions publiées.
const sourceDispo = existsSync(cheminJson);
const toutes = sourceDispo ? JSON.parse(readFileSync(cheminJson, "utf8")) : QUESTIONS;
const nomLot = sourceDispo ? "fichier source" : "questions publiées";

function defauts(q) {
  const d = [];
  if (!(q.theme >= 1 && q.theme <= 10)) d.push("thème");
  if (!q.question_fr?.trim()) d.push("question FR vide");
  if (!q.question_ar?.trim() || !AR.test(q.question_ar)) d.push("question AR vide");
  if (!Array.isArray(q.choix) || q.choix.length < 2) d.push("moins de 2 choix");
  else q.choix.forEach((c, i) => { if (!c.fr?.trim()) d.push(`choix ${i} FR vide`); if (!c.ar?.trim() || !(AR.test(c.ar) || /^[\d\s.,%/-]+$/.test(c.ar))) d.push(`choix ${i} AR vide`); });   // un nombre seul (ex. 190) est permis
  if (!Array.isArray(q.bonnes) || !q.bonnes.length) d.push("aucune bonne réponse");
  else if (q.bonnes.some(b => !Number.isInteger(b) || b < 0 || b >= q.choix.length) || new Set(q.bonnes).size !== q.bonnes.length) d.push("bonne réponse invalide");
  if (!q.explication_fr?.trim()) d.push("explication FR vide");
  if (!q.explication_ar?.trim() || !AR.test(q.explication_ar)) d.push("explication AR vide");
  if (!q.source?.trim()) d.push("source vide");
  return d;
}
const mauvaises = [...toutes, ...QUESTIONS].map(q => [q.id, defauts(q)]).filter(([, d]) => d.length);
mauvaises.slice(0, 10).forEach(([id, d]) => console.log(`      ${id} : ${d.join(", ")}`));
check(`${nomLot} (${toutes.length}) + publiées (${QUESTIONS.length}) : chaque question a une bonne réponse valide, explication FR et AR, source, rien de vide en arabe`, mauvaises.length === 0);
check("identifiants uniques", new Set(toutes.map(q => q.id)).size === toutes.length);
check("aucune question « à vérifier » publiée", QUESTIONS.every(q => !QUESTIONS_INFO.exclues.includes(q.id)) && !QUESTIONS.some(q => q.a_verifier));
if (sourceDispo) {
  const attendues = toutes.filter(q => !q.a_verifier).map(q => q.id).join();
  check("assets/questions.js à jour avec questions-v1.json (sinon : node tools/construire_questions.mjs)",
    attendues === QUESTIONS.map(q => q.id).join() &&
    JSON.stringify(toutes.filter(q => !q.a_verifier).map(q => [q.question_fr, q.question_ar, q.bonnes, q.choix, q.explication_fr, q.explication_ar, q.source])) ===
    JSON.stringify(QUESTIONS.map(q => [q.question_fr, q.question_ar, q.bonnes, q.choix, q.explication_fr, q.explication_ar, q.source])));
  check("les questions exclues sont exactement les « à vérifier »", toutes.filter(q => q.a_verifier).map(q => q.id).join() === QUESTIONS_INFO.exclues.join());
}
check("au moins 3 questions publiées par thème (pour l'examen)", [1,2,3,4,5,6,7,8,9,10].every(t => QUESTIONS.filter(q => q.theme === t).length >= 3));

// ---- 2. Pages chargées comme un navigateur ---------------------------------------
// Pass Examen actif dans le navigateur (code factice gardé sur l'appareil, date de fin lointaine)
const PASS_TEST = JSON.stringify({ code: "ABCDEF23", fin: "2099-12-31", verifie: "2099-12-31" });
async function page(chemin, { lang = "fr", query = "", stockage = null, fichier = false, pass = false, examenFait = false } = {}) {
  const dossier = dirname(join(root, chemin));
  // (les scripts externes, comme GoatCounter, ne sont pas chargés)
  const html = lire(chemin).replace(/<script([^>]*) src="(?!https?:)([^"?]+)(\?[^"]*)?"([^>]*)><\/script>/g,
    (_, a, src) => `<script>${readFileSync(join(dossier, src), "utf8")}</script>`);
  const fautes = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", e => { if (!/Not implemented/.test(e.message)) fautes.push(e.message); });
  const dom = new JSDOM(html, {
    url: fichier ? `${pathToFileURL(join(root, chemin)).href}?lang=${lang}${query}` : `https://ah6259.github.io/code-route-tunisie/${chemin.replace("index.html", "")}?lang=${lang}${query}`,
    runScripts: "dangerously", pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { if (stockage) w.localStorage.setItem("crt-progression-v1", typeof stockage === "string" ? stockage : JSON.stringify(stockage));
      if (pass) w.localStorage.setItem("crt-pass-v1", PASS_TEST);
      if (examenFait) { const n = new Date(); w.localStorage.setItem("crt-examen-gratuit-v1", n.getFullYear() + "-" + String(n.getMonth() + 1).padStart(2, "0") + "-" + String(n.getDate()).padStart(2, "0")); } }
  });
  await new Promise(ok => dom.window.addEventListener("load", ok));
  dom.window.fautes = fautes;
  return dom.window;
}
const texte = el => el ? el.textContent.replace(/[⁦-⁩  ]/g, " ").replace(/\s+/g, " ").trim() : "";
const clic = (w, el) => el.dispatchEvent(new w.MouseEvent("click", { bubbles: true }));

// -- accueil
let w = await page("index.html"), d = w.document;
check("accueil : aucune erreur JavaScript", w.fautes.length === 0);
check("accueil : 10 thèmes affichés", d.querySelectorAll("#themes .theme").length === 10);
const somme = [...d.querySelectorAll("#themes .nb")].reduce((s, e) => s + parseInt(texte(e)), 0);
check(`accueil : nombre de questions par thème (total ${somme} = ${QUESTIONS.length})`, somme === QUESTIONS.length);
check("accueil : bouton « Examen blanc (30 questions) »", texte(d.getElementById("cta-examen")).includes("Examen blanc (30 questions)") && d.getElementById("cta-examen").getAttribute("href") === "examen/");
check("accueil : pas de badges inutiles (retirés le 05/10/2026 à la demande d'Ahmed)", !d.querySelector(".confiance, .badge-c"));
check("accueil : plus aucun message « en cours de relecture par un moniteur » (demande d'Ahmed)", !/relecture par un moniteur/.test(texte(d.body)));
check("accueil : pas d'historique sans examen passé", d.getElementById("historique").hidden);
check("accueil : la date « vérifié le » vient de REGLES_SITE", texte(d.querySelector("[data-maj]")) === REGLES_SITE.verifie_le);
check("accueil : pied de page avec la date et l'année de REGLES_SITE", texte(d.getElementById("pied")).includes(REGLES_SITE.verifie_le) && texte(d.getElementById("pied")).includes(`© ${REGLES_SITE.annee}`));
w = await page("index.html", { stockage: { q: { "T2-001": 1 }, examens: [{ date: "2026-10-05", score: 25, total: 30 }, { date: "2026-10-05", score: 20, total: 30 }] } });
d = w.document;
check("accueil : historique des examens affiché depuis le navigateur", !d.getElementById("historique").hidden && d.querySelectorAll(".pastille").length === 2 && d.querySelectorAll(".pastille.ok").length === 1);
check("accueil : jauge du thème 2 remplie après une bonne réponse", d.querySelector('.theme[data-theme="2"] .jauge span').style.width !== "0%");
w = await page("index.html", { stockage: "pas du JSON" });
check("accueil : stockage abîmé = pas de plantage", w.fautes.length === 0 && w.document.querySelectorAll("#themes .theme").length === 10);
w = await page("index.html", { lang: "ar" }); d = w.document;
check("accueil en arabe : lang=ar, dir=rtl, thèmes en arabe, translate=no gardé", d.documentElement.dir === "rtl" && d.documentElement.getAttribute("translate") === "no" &&AR.test(texte(d.querySelector("#themes .theme b"))));
check("accueil en arabe : date isolée et identique", texte(d.querySelector("[data-maj]")) === REGLES_SITE.verifie_le);

// -- logique de l'examen
w = await page("examen/index.html"); d = w.document;
check("examen : aucune erreur JavaScript", w.fautes.length === 0);
check("examen, examen gratuit du jour PAS encore fait : aucun bouton ni encart Pass (règle d'Ahmed)", !d.getElementById("offre-pass-examen") && !d.querySelector("#entete a.entete-pass") && !d.querySelector('#quiz a[href="../pass/"]'));
const tirerExamen = w.eval("tirerExamen"), noter = w.eval("noter"), estJuste = w.eval("estJuste"), EX = w.eval("EXAMEN");
check("examen : 30 questions, réussite à 24", EX.nb === 30 && EX.seuil === 24);
const exclues = new Set(toutes.filter(q => q.a_verifier).map(q => q.id).concat(QUESTIONS_INFO.exclues));
let tiragesOk = true, parThemeOk = true;
for (let k = 0; k < 300; k++) {
  const t = tirerExamen();
  if (t.length !== 30 || new Set(t.map(q => q.id)).size !== 30 || t.some(q => exclues.has(q.id))) tiragesOk = false;
  for (let th = 1; th <= 10; th++) if (t.filter(q => q.theme === th).length !== 3) parThemeOk = false;
}
check("examen : 300 tirages = 30 questions, sans doublon, sans « à vérifier »", tiragesOk);
check("examen : 3 questions par thème dans chaque tirage", parThemeOk);
const multi = QUESTIONS.find(q => q.bonnes.length > 1), simple = QUESTIONS.find(q => q.bonnes.length === 1);
check("correction : réponse complète = juste, ordre indifférent", estJuste(multi, [...multi.bonnes].reverse()) && estJuste(simple, simple.bonnes));
check("correction : réponse incomplète = fausse", !estJuste(multi, multi.bonnes.slice(1)));
check("correction : réponse en trop = fausse", !estJuste(simple, [...simple.bonnes, (simple.bonnes[0] + 1) % simple.choix.length]));
check("correction : aucune réponse = fausse", !estJuste(simple, []));
const lot = tirerExamen();
// une réponse fausse : un choix faux, ou (si tous les choix sont justes) une réponse incomplète
const mauvaise = q => { const f = q.choix.findIndex((_, i) => !q.bonnes.includes(i)); return f >= 0 ? [f] : q.bonnes.slice(1); };
check("test : une réponse fausse existe pour chaque question", QUESTIONS.every(q => mauvaise(q).length && !estJuste(q, mauvaise(q))));
let r = noter(lot, lot.map((q, i) => i < 24 ? q.bonnes : mauvaise(q)));
check("score : 24 justes = 24/30, réussi, 6 erreurs", r.score === 24 && r.total === 30 && r.reussi && r.erreurs.length === 6);
r = noter(lot, lot.map((q, i) => i < 23 ? q.bonnes : mauvaise(q)));
check("score : 23 justes = 23/30, pas réussi", r.score === 23 && !r.reussi);
check("score : total par thème = 30", Object.values(r.parTheme).reduce((s, x) => s + x.total, 0) === 30);

// -- examen dans la page : 25 justes, 5 fausses
check("examen : plus de paragraphe « chiffres à confirmer » (demande d'Ahmed)", !/hiffres à confirmer/.test(texte(d.getElementById("quiz"))));
clic(w, d.getElementById("commencer"));
const ex = w.eval("examen");
check("examen : bouton Valider bloqué tant que rien n'est coché", d.getElementById("valider").disabled);
const vus = new Set();
for (let i = 0; i < 30; i++) {
  const q = ex.questions[i];
  vus.add(d.querySelector("#quiz section").dataset.id);
  const voulu = i < 25 ? q.bonnes : mauvaise(q);
  voulu.forEach(n => clic(w, d.querySelector(`.choix-q[data-i="${n}"]`)));
  clic(w, d.getElementById("valider"));
}
check("examen : 30 questions différentes affichées", vus.size === 30);
check("examen : score affiché 25 / 30", texte(d.getElementById("score")) === "25 / 30");
check("examen : « Réussi » affiché", texte(d.getElementById("statut")) === "Réussi");
check("examen : seuil de réussite affiché", texte(d.getElementById("quiz")).includes("Seuil de réussite"));
check("examen : revue des 5 erreurs, avec explication et source", d.querySelectorAll("#erreurs .erreur").length === 5 &&
  [...d.querySelectorAll("#erreurs .erreur")].every(e => e.querySelector(".explication") && texte(e.querySelector(".source")).startsWith("Source :")));
check("examen : bonne réponse montrée en vert dans la revue", d.querySelectorAll("#erreurs .choix-q.bonne").length >= 5);
check("examen : résultat par thème (10 lignes)", d.querySelectorAll("#par-theme tr").length === 10);
check("examen : score gardé dans le navigateur", JSON.parse(w.localStorage.getItem("crt-progression-v1")).examens.at(-1).score === 25);
check("examen : lien WhatsApp de partage du score", d.getElementById("partage").href.startsWith("https://wa.me/?text=") && decodeURIComponent(d.getElementById("partage").href).includes("25/30"));
clic(w, d.querySelector(".langue"));
check("examen : changement de langue garde le résultat (affiché en arabe)", d.documentElement.lang === "ar" && texte(d.getElementById("score")) === "25 / 30" && AR.test(texte(d.getElementById("statut"))));
check("examen gratuit terminé : carte « Vous avez utilisé votre examen gratuit du jour » + gros bouton doré vers pass/",
  /امتحانك المجاني/.test(texte(d.getElementById("fin-gratuit"))) && d.querySelector("#fin-gratuit a.btn-pass-grand").getAttribute("href") === "../pass/");
check("examen gratuit terminé : jour noté sur l'appareil", w.localStorage.getItem("crt-examen-gratuit-v1") === w.eval("aujourdhui()"));
clic(w, d.getElementById("nouvel"));
check("2e examen le même jour sans Pass : écran « examen gratuit du jour utilisé », pas de question", !!d.getElementById("examen-utilise") && !d.getElementById("valider") &&
  d.querySelector("#examen-utilise a.btn-pass-grand").getAttribute("href") === "../pass/");
w.localStorage.setItem("crt-pass-v1", PASS_TEST);              // avec le Pass : illimité
w.eval("demarrerExamen(0)");
for (let i = 0; i < 30; i++) {
  const q = ex.questions[i];
  (i < 23 ? q.bonnes : mauvaise(q)).forEach(n => clic(w, d.querySelector(`.choix-q[data-i="${n}"]`)));
  clic(w, d.getElementById("valider"));
}
check("examen : 23 justes -> 23/30 et échec affiché", texte(d.getElementById("score")) === "23 / 30" && d.querySelector(".score.echoue") !== null);
check("examen avec Pass : pas de carte « examen gratuit utilisé »", !d.getElementById("fin-gratuit"));
check("examen : aucune erreur JavaScript pendant l'examen", w.fautes.length === 0);

// -- entraînement
w = await page("entrainement/index.html"); d = w.document;
check("entraînement sans thème : choix parmi 10 thèmes", d.querySelectorAll("#quiz .theme").length === 10);
w = await page("entrainement/index.html", { query: "&theme=2" }); d = w.document;
check("entraînement : aucune erreur JavaScript", w.fautes.length === 0);
const ent = w.eval("entrainement");
let sec = d.querySelector("#quiz section");
check("entraînement : une question du thème 2 affichée", sec && sec.dataset.id.startsWith("T2-") && texte(d.querySelector(".question")).length > 10);
check("entraînement : titre du thème", texte(d.getElementById("titre-page")).includes("Priorités"));
check("entraînement : toutes les questions du thème dans la série", ent.liste.length === QUESTIONS.filter(q => q.theme === 2).length);
let q = ent.liste[0];
mauvaise(q).forEach(n => clic(w, d.querySelector(`.choix-q[data-i="${n}"]`)));
clic(w, d.getElementById("valider"));
check("entraînement : mauvaise réponse corrigée immédiatement", d.querySelector(".verdict.ko") !== null && d.querySelectorAll(".choix-q.bonne").length === q.bonnes.length);
check("entraînement : explication et « Source : » affichées", texte(d.querySelector(".explication")).includes(q.explication_fr.slice(0, 30)) && texte(d.querySelector(".source")) === "Source : " + q.source);
check("entraînement : réponse gardée dans le navigateur", JSON.parse(w.localStorage.getItem("crt-progression-v1")).q[q.id] === 0);
clic(w, d.getElementById("suivante"));
q = ent.liste[1];
check("entraînement : question suivante affichée", d.querySelector("#quiz section").dataset.id === q.id && d.getElementById("valider").disabled);
q.bonnes.forEach(n => clic(w, d.querySelector(`.choix-q[data-i="${n}"]`)));
clic(w, d.getElementById("valider"));
check("entraînement : bonne réponse = « Bonne réponse ! »", texte(d.querySelector(".verdict.ok")).includes("Bonne réponse"));
while (d.getElementById("suivante") || d.getElementById("valider")) {
  if (d.getElementById("valider")) { clic(w, d.querySelector('.choix-q[data-i="0"]')); clic(w, d.getElementById("valider")); }
  else clic(w, d.getElementById("suivante"));
}
check("entraînement : fin de série avec score", /^\d+ \/ \d+$/.test(texte(d.getElementById("score-theme"))));
w = await page("entrainement/index.html", { lang: "ar", query: "&theme=9" }); d = w.document;
q = w.eval("entrainement").liste[0];
check("entraînement en arabe : question et choix en arabe", AR.test(texte(d.querySelector(".question"))) && [...d.querySelectorAll(".choix-q .txt")].every(e => AR.test(e.textContent) || /^[\d\s⁦-⁩.,%/-]+$/.test(e.textContent)));
clic(w, d.querySelector('.choix-q[data-i="0"]')); clic(w, d.getElementById("valider"));
check("entraînement en arabe : explication en arabe + المصدر", AR.test(texte(d.querySelector(".explication p"))) && texte(d.querySelector(".source")).startsWith("المصدر:"));

check("arabe : heures et nombres isolés d'un bloc (20:30 reste 20:30)", w.eval('isoAr("بين الساعة 20:30 و6:00")') === "بين الساعة ⁦20:30⁩ و⁦6:00⁩");
check("arabe : fraction de score isolée d'un bloc (pas « 30 / 25 »)", w.eval("frac(25, 30)") === "⁦25 / 30⁩");

// -- illustrations (SVG faits par nous)
const svgOk = f => { if (!existsSync(join(root, f))) return false;
  const doc = new w.DOMParser().parseFromString(lire(f), "image/svg+xml");
  return !doc.querySelector("parsererror") && doc.documentElement.nodeName === "svg" && doc.documentElement.getAttribute("viewBox"); };
const avecImage = QUESTIONS.filter(q => q.image);
// règle du 05/10/2026 : chaque question publiée a son image (comme à l'examen officiel) ; sinon on ne publie pas
const sansImage = QUESTIONS.filter(q => !q.image).map(q => q.id);
check(`chaque question publiée a une image${sansImage.length ? " — manque : " + sansImage.join(", ") : ""}`, !sansImage.length);
check(`illustrations : accueil + 10 thèmes + ${avecImage.length} schémas de questions, fichiers SVG valides`, avecImage.length >= 5 &&
  ["assets/illustrations/accueil.svg", ...[1,2,3,4,5,6,7,8,9,10].map(t => `assets/illustrations/theme-${t}.svg`), ...avecImage.map(q => "assets/illustrations/" + q.image)].every(svgOk));
check("illustrations : légères (moins de 8 Ko chacune)", [...new Set(["accueil.svg", ...avecImage.map(q => q.image)])].every(f => existsSync(join(root, "assets/illustrations", f)) && lire("assets/illustrations/" + f).length < 8000));
w = await page("entrainement/index.html", { query: "&theme=2" }); d = w.document;
{ const e = w.eval("entrainement"); const k = e.liste.findIndex(q => q.image); e.i = k; w.eval("rendreEntrainement()");
  const img = d.querySelector("#quiz img.schema");
  check("entraînement : le schéma de la question est affiché", img && img.getAttribute("src") === "../assets/illustrations/" + e.liste[k].image && img.alt.length > 5);
  let toutes = true;
  for (let i = 0; i < e.liste.length; i++) { e.i = i; w.eval("rendreEntrainement()");
    const im = d.querySelectorAll("#quiz img.schema");
    if (im.length !== 1 || im[0].getAttribute("src") !== "../assets/illustrations/" + e.liste[i].image) toutes = false; }
  check("entraînement : chaque question du thème affiche une seule image, la sienne", toutes); }
w = await page("examen/index.html"); d = w.document;
// 06/10/2026 (demande d'Ahmed) : le bandeau montre l'écran de l'examen officiel et le boîtier à 3 boutons (dessin maison)
{ const im = d.querySelector(".hero figure#ecran-examen img.hero-ill"), svg = lire("assets/illustrations/examen-ecran.svg");
  const doc = new w.DOMParser().parseFromString(svg, "image/svg+xml");
  check("examen : dessin de l'écran d'examen + boîtier affiché dans le bandeau (SVG valide, ?v=)", !!im && /^\.\.\/assets\/illustrations\/examen-ecran\.svg\?v=\d+\w$/.test(im.getAttribute("src")) && im.alt.length > 20 &&
    !doc.querySelector("parsererror") && doc.documentElement.nodeName === "svg" && doc.documentElement.getAttribute("viewBox") === "0 0 840 360");
  check("examen : le dessin montre les 3 boutons rouge, orange, vert (mêmes couleurs que les réponses)", ["#C2382B", "#F28C28", "#14804A"].every(c => (svg.match(new RegExp(`<circle[^>]*fill="${c}"`, "g")) || []).length === 1));
  check("examen : dessin sans emblème ni logo officiel, sans photo ni texte (pas d'ATTT, République, drapeau, croissant, étoile, <text>, <image>)",
    !/attt|r[ée]publique|tunisi|الجمهورية|التونسية|تونس|الوكالة|armoirie|drapeau|flag|croissant|crescent|[ée]toile|star|<text|<image|xlink:href|\.(png|jpe?g|webp)/i.test(svg));
  check("examen : légende FR + AR sous le dessin (rouge A, orange B, vert C)", texte(d.querySelector("#ecran-examen figcaption [data-l='fr']")) === "À l'examen officiel, vous répondez sur un écran avec un boîtier à 3 boutons : rouge (A), orange (B), vert (C)." &&
    /أحمر \(أ\).*برتقالي \(ب\).*أخضر \(ج\)/.test(texte(d.querySelector("#ecran-examen figcaption [data-l='ar']"))));
  check("examen : plus de photo dans le bandeau (donc plus de crédit à afficher)", !d.querySelector(".hero img[src*='assets/photos/']") && !d.getElementById("credit-hero"));
  const off = texte(d.getElementById("examen-officiel"));
  check("examen : encadré « Comment se passe l'examen officiel » (écran, boîtier rouge/orange/vert, 30 questions, demi-heure selon les guides, durée non publiée)",
    ["Comment se passe l'examen officiel", "écran d'ordinateur", "rouge = A", "orange = B", "vert = C", "30 questions", "demi-heure selon les guides", "durée officielle n'est pas publiée"].every(m => off.includes(m)));
  w.eval("demarrerExamen(0)");
  const btn = [...d.querySelectorAll("#quiz .choix-liste.boitier .choix-q")], css = lire("assets/style.css");
  check("examen : réponses aux couleurs du boîtier (A rouge, B orange, C vert), lettre visible", btn.length >= 2 && ["bouton-rouge", "bouton-orange", "bouton-vert"].slice(0, Math.min(3, btn.length)).every((c, i) => btn[i].classList.contains(c) && texte(btn[i].querySelector(".lettre")) === "ABC"[i]) &&
    [".bouton-rouge{--c:#C2382B}", ".bouton-orange{--c:#F28C28}", ".bouton-vert{--c:#14804A}", ".bouton-orange .lettre{color:#0E2238}"].every(r => css.includes(r)));
  const QD = w.eval("QUESTIONS").find(q => q.choix.length > 3);
  if (QD) { w.eval("examen").questions[0] = QD; w.eval("rendreExamen()");
    check("examen : une 4e réponse (D) reste neutre (le boîtier n'a que 3 boutons)", !/bouton-/.test(d.querySelector('#quiz .choix-q[data-i="3"]').className)); }
  w.eval("examen.etape = 'intro'; rendreExamen()"); }
{ const wa = await page("examen/index.html", { lang: "ar" }); wa.eval("demarrerExamen(0)");
  const b = [...wa.document.querySelectorAll("#quiz .choix-liste.boitier .choix-q")];
  check("examen en arabe : mêmes couleurs, lettres أ ب ج", b[0].classList.contains("bouton-rouge") && b[1].classList.contains("bouton-orange") && texte(b[0].querySelector(".lettre")) === "أ" && texte(b[1].querySelector(".lettre")) === "ب");
  const we = await page("entrainement/index.html", { query: "&theme=2" });
  check("entraînement : couleurs habituelles (pas de boîtier : rouge et vert y veulent dire faux et juste)", !we.document.querySelector("#quiz .boitier, #quiz .bouton-rouge")); }
w = await page("index.html"); d = w.document;
check("accueil : vraie photo + carte permis SPÉCIMEN dans le bandeau, et 10 illustrations de thèmes", d.querySelector(".hero img.hero-photo[src='assets/photos/accueil-route.webp']") && d.querySelector(".hero img.hero-permis[src^='assets/specimen/permis-specimen-attt.webp']") && d.querySelectorAll("#themes .ill img").length === 10 &&
  [...d.querySelectorAll("#themes .ill img")].every((im, i) => im.getAttribute("src") === `assets/illustrations/theme-${i + 1}.svg`));

// -- à propos
w = await page("a-propos/index.html"); d = w.document;
check("à propos : aucune erreur JavaScript", w.fautes.length === 0);
check("à propos : recueil IORT 2012, transport.tn, loi 99-71", ["IORT", "2012", "transport.tn", "99-71", "2000-150"].every(m => texte(d.body).includes(m)));
check("à propos : méthode (pas de copie) et limites (amendes 2025)", texte(d.body).includes("copiée") && texte(d.body).includes("loi de finances 2025"));
check("à propos : date vérifiée = REGLES_SITE", texte(d.getElementById("verifie-le")) === REGLES_SITE.verifie_le);

// ---- 3. Date unique, référencement, aperçu, licence, cache, robots GitHub ----------
const fichiersCode = [...PAGES, "assets/page.js", "assets/pass.js", "assets/quiz.js", "assets/pages.js", "assets/lecons.js", "assets/amendes.js", "assets/panneaux.js", "assets/protection.js"];
const datesEnDur = fichiersCode.filter(f => /\b\d{2}\/\d{2}\/20\d{2}\b/.test(lire(f)));
check(`aucune date jj/mm/aaaa écrite en dur hors de regles.js ${datesEnDur.join(" ")}`, datesEnDur.length === 0);
check("regles.js : date au format jj/mm/aaaa et année cohérente", /^\d{2}\/\d{2}\/\d{4}$/.test(REGLES_SITE.verifie_le) && REGLES_SITE.verifie_le.endsWith(String(REGLES_SITE.annee)));
for (const p of PAGES) {
  const s = lire(p);
  check(`${p} : titre, description, canonical`, /<title>.{20,}<\/title>/.test(s) && /name="description" content=".{50,}"/.test(s) && s.includes('rel="canonical" href="https://ah6259.github.io/code-route-tunisie/'));
  check(`${p} : image d'aperçu og-image-v4.jpg (page vidéo : apercu-video.jpg) et icône`, s.includes('property="og:image" content="https://ah6259.github.io/code-route-tunisie/' + (p === "video/index.html" ? "assets/video/apercu-video.jpg" : "assets/og-image-v4.jpg") + '"') && !s.includes("og-image-v1") && s.includes('rel="icon"'));
  check(`${p} : même version ?v= pour tous les fichiers`, new Set(s.match(/\?v=\d+\w/g)).size === 1);
  check(`${p} : regles.js chargé en premier`, s.indexOf("assets/regles.js") > 0 && s.indexOf("assets/regles.js") < s.indexOf("assets/page.js"));
  const ww = await page(p);
  const pied = texte(ww.document.getElementById("pied"));
  check(`${p} : © et « non officiel » dans le pied de page`, pied.includes("©") && pied.includes("non officiel") && pied.includes("transport.tn"));
}
const ld = JSON.parse(lire("index.html").match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
check("FAQ Google (JSON-LD) valide sur l'accueil", ld["@type"] === "FAQPage" && ld.mainEntity.length >= 3);
check("image d'aperçu, logo et icône présents", ["assets/og-image-v4.jpg", "assets/logo.svg", "assets/icone-180.png"].every(f => existsSync(join(root, f))));
const ogJpg = readFileSync(join(root, "assets/og-image-v4.jpg"));
check(`image d'aperçu JPEG < 250 Ko (sinon WhatsApp n'affiche qu'une petite vignette), og:image:type sur chaque page : ${Math.round(ogJpg.length / 1024)} Ko`,
  ogJpg[0] === 0xFF && ogJpg[1] === 0xD8 && ogJpg.length < 250000 && PAGES.every(p => lire(p).includes('<meta property="og:image:type" content="image/jpeg">')));
// manifeste : id UNIQUE = chemin du site (sinon Chrome croit le site « déjà installé » : tous les sites partagent ah6259.github.io)
let man = {}; try { man = JSON.parse(lire("manifest.webmanifest")); } catch (e) {}
check("manifeste présent, id unique = chemin du site, start_url/scope ./, icônes 192, 512 et maskable existantes",
  man.id === "/code-route-tunisie/" && man.start_url === "./" && man.scope === "./" && man.display === "standalone" && !!man.name && !!man.short_name
  && ["192x192", "512x512"].every(t => man.icons?.some(i => i.sizes === t)) && man.icons?.some(i => i.purpose === "maskable")
  && man.icons.every(i => existsSync(join(root, i.src))));
check("toutes les pages : lien vers le manifeste, icône iPhone et theme-color", PAGES.every(p => { const s = lire(p), r = "../".repeat(p.split("/").length - 1);
  return s.includes(`<link rel="manifest" href="${r}manifest.webmanifest">`) && s.includes(`<link rel="apple-touch-icon" href="${r}assets/icone-180.png">`) && s.includes('<meta name="theme-color"'); }));
check(`plan du site : ${PAGES_PUBLIQUES.length} pages publiques (sans relecture/)`, (lire("sitemap.xml").match(/<loc>https:\/\/ah6259\.github\.io\/code-route-tunisie\//g) || []).length === PAGES_PUBLIQUES.length && !lire("sitemap.xml").includes("relecture"));
check("robots.txt indique le plan du site", lire("robots.txt").includes("code-route-tunisie/sitemap.xml"));
check("LICENSE tous droits réservés", lire("LICENSE").includes("Tous droits réservés"));
check(".gitignore : node_modules et captures", /node_modules\//.test(lire(".gitignore")) && /captures\//.test(lire(".gitignore")));
const tests = existsSync(join(root, ".github/workflows/tests.yml")) ? lire(".github/workflows/tests.yml") : "";
check("robot tests.yml : lance ce test à chaque push et ouvre une issue si échec", tests.includes("push") && tests.includes("tools/test_site.mjs") && tests.includes("issues: write") && tests.includes("failure()"));
const surv = existsSync(join(root, ".github/workflows/surveillance.yml")) ? lire(".github/workflows/surveillance.yml") : "";
check("robot surveillance.yml : mensuel, groupe de concurrence, issue + commit", /cron:\s*"\d+ \d+ \d+ \* \*"/.test(surv) && surv.includes("concurrency") && surv.includes("issues: write") && surv.includes("git commit"));

await nouvellesRubriques();
await passExamen();
await boutonPartager();
// ---- Affichage : éléments cachés et faux boutons (06/10/2026) ----
check("style : [hidden]{display:none!important} (écrans de l'examen, du Pass, messages : un display:flex/grid ne les fait jamais réapparaître)",
      /\[hidden\]\{display:none!important\}/.test(lire("assets/style.css").replace(/\s+/g, "")));
check("style : plus de règles .confiance / .badge-c (badges supprimés)", !/\.confiance|\.badge-c/.test(lire("assets/style.css")));
// Tuiles « icône + petit texte » qui ont l'air de boutons mais ne mènent nulle part (supprimées le 06/10/2026, demande d'Ahmed)
// (une étiquette en gras dans un encadré qui donne une vraie information, ex. « Coût : 50 DT », n'est pas une tuile)
const tuilesSansLien = doc => [...doc.body.querySelectorAll("*")].filter(el => {
  if (/^(a|button|label|summary|svg|h[1-6]|b|strong|em|small|i|option|select|input|textarea|form|header|footer|nav|main|figure|img|section|article)$/i.test(el.tagName)) return false;
  if (el.closest("a,button,label,summary,header,footer,nav,form,svg,[hidden],template")) return false;
  const f = el.firstElementChild;
  if (!f || f.tagName.toLowerCase() !== "svg" || el.querySelector("a,button,input,select,textarea")) return false;
  const t = el.textContent.replace(/\s+/g, " ").trim();
  return t.length > 0 && t.length < 90;
}).map(el => el.textContent.replace(/\s+/g, " ").trim().slice(0, 40));
for (const p of PAGES) {
  const morts = tuilesSansLien(new JSDOM(lire(p)).window.document);
  check(`${p} : aucune carte avec une icône sans lien (pas de faux bouton)${morts.length ? " → " + morts.join(" | ") : ""}`, !morts.length);
}
// ---- Bouton « Partager » (demande d'Ahmed, 06/10/2026 : plus de partages entre visiteurs) ----
async function boutonPartager() {
  const ko = [];
  for (const p of PAGES) for (const lang of ["fr", "ar"]) {
    const wx = await page(p, { lang }), b = wx.document.querySelector("#entete button.partager");
    if (!b || b.getAttribute("aria-label") !== (lang === "fr" ? "Partager cette page" : "شارك هذه الصفحة") || !b.querySelector("svg")) ko.push(p + " " + lang);
  }
  check(`en-tête : bouton « Partager » (« Partager cette page » / « شارك هذه الصفحة ») sur toutes les pages ${ko.join(", ")}`, ko.length === 0);
  for (const p of [PAGES[0], PAGES[PAGES.length - 1]]) {
    const wx = await page(p, { lang: "ar" }), ouverts = [], comptes = [];
    wx.open = (...a) => { ouverts.push(a); return null; };
    wx.goatcounter = { count: o => comptes.push(o) };
    wx.document.querySelector("#entete button.partager").click();
    await new Promise(ok => setTimeout(ok, 0));
    // partage par lien (demande d'Ahmed) : la page vidéo du site + l'adresse du site, dans la langue de la page
    const adresse = "https://ah6259.github.io/code-route-tunisie/video/?lang=ar";
    check(`${p} : sans navigator.share, « Partager » ouvre wa.me avec la page vidéo + l'adresse du site et compte le clic`, !wx.navigator.share && ouverts.length === 1
      && ouverts[0][0].startsWith("https://wa.me/?text=") && decodeURIComponent(ouverts[0][0].slice(20)).endsWith(" " + adresse)
      && decodeURIComponent(ouverts[0][0]).includes("https://ah6259.github.io/code-route-tunisie/?lang=ar") && ouverts[0][1] === "_blank"
      && comptes.length === 1 && comptes[0].path.startsWith("partage/") && comptes[0].event === true);
  }
}

console.log(erreurs ? `\n${erreurs} PROBLÈME(S) sur ${total} vérifications` : `\nTOUT PASSE (${total} vérifications)`);
process.exit(erreurs ? 1 : 0);

// ---- 4. Nouvelles rubriques (05/10/2026) : leçons, panneaux, amendes, permis, photos, menu, liens, sécurité, relecture ----
async function nouvellesRubriques() {
  const { LECONS } = require(join(root, "assets/lecons.js"));
  const { PANNEAUX, PANNEAUX_FAMILLES } = require(join(root, "assets/panneaux.js"));
  const { AMENDES } = require(join(root, "assets/amendes.js"));
  const { PHOTOS } = require(join(root, "assets/photos.js"));
  const svgValide = f => { if (!existsSync(join(root, f))) return false;
    const doc = new w.DOMParser().parseFromString(lire(f), "image/svg+xml");
    return !doc.querySelector("parsererror") && doc.documentElement.nodeName === "svg" && !!doc.documentElement.getAttribute("viewBox"); };
  const vide = x => !x || !String(x).trim();

  // -- leçons
  check("leçons : 10 leçons, une par thème", LECONS.length === 10 && new Set(LECONS.map(l => l.theme)).size === 10 && LECONS.every(l => l.theme >= 1 && l.theme <= 10));
  const malLecons = LECONS.filter(l => vide(l.sources) || !/art\./.test(l.sources) || vide(l.intro_fr) || !AR.test(l.intro_ar) ||
    l.blocs.length < 2 || l.blocs.some(b => vide(b.fr) || vide(b.t_fr) || !AR.test(b.ar) || !AR.test(b.t_ar)) ||
    l.retenir.length < 3 || l.retenir.some(r => vide(r.fr) || !AR.test(r.ar)) || !PHOTOS[l.photo] || !svgValide("assets/illustrations/" + l.schema));
  check(`leçons : chacune a une source (article cité), FR + AR, « à retenir », une photo créditée et un schéma SVG valide ${malLecons.map(l => l.theme)}`, malLecons.length === 0);
  check("leçons : schémas légers (moins de 8 Ko)", LECONS.every(l => lire("assets/illustrations/" + l.schema).length < 8000));
  let ww = await page("lecons/index.html"), dd = ww.document;
  check("page leçons : aucune erreur JavaScript, 10 leçons listées", ww.fautes.length === 0 && dd.querySelectorAll(".lecon-carte").length === 10);
  for (const t of [1, 7, 10]) {
    ww = await page("lecons/index.html", { query: `&theme=${t}` }); dd = ww.document;
    const L = LECONS.find(l => l.theme === t);
    check(`leçon ${t} : source affichée, lien vers l'entraînement du thème, photo avec crédit, « Signaler une erreur »`, ww.fautes.length === 0 &&
      texte(dd.querySelector(".lecon .source")).includes(L.sources.slice(0, 20)) &&
      dd.getElementById("vers-entrainement").getAttribute("href") === `../entrainement/?theme=${t}` &&
      texte(dd.querySelector(".lecon figure.photo .credit")).includes(PHOTOS[L.photo].licence) &&
      dd.querySelector(".lecon a.signaler").href.startsWith("https://wa.me/"));
  }
  ww = await page("lecons/index.html", { lang: "ar", query: "&theme=4" }); dd = ww.document;
  check("leçon en arabe : titre, blocs et « à retenir » en arabe", AR.test(texte(dd.getElementById("titre-page"))) && AR.test(texte(dd.querySelector(".lecon .bloc"))) && AR.test(texte(dd.querySelector(".retenir"))));

  // -- panneaux
  const malPanneaux = PANNEAUX.filter(p => !/^[A-F]$/.test(p.famille) || vide(p.fr) || vide(p.sens_fr) || !AR.test(p.ar) || !AR.test(p.sens_ar) || vide(p.source) || !svgValide(`assets/panneaux/${p.id}.svg`));
  check(`panneaux (${PANNEAUX.length}) : chaque dessin SVG existe et est valide, sens FR + AR, source ${malPanneaux.map(p => p.id)}`, PANNEAUX.length >= 25 && malPanneaux.length === 0);
  check("panneaux : les 6 familles du décret 2000-150 (art. 13), au moins 2 panneaux chacune", Object.keys(PANNEAUX_FAMILLES).join() === "A,B,C,D,E,F" && "ABCDEF".split("").every(f => PANNEAUX.filter(p => p.famille === f).length >= 2));
  ww = await page("panneaux/index.html"); dd = ww.document;
  check("page panneaux : tous affichés, avertissement « dessins faits par nous / annexe officielle »", ww.fautes.length === 0 && dd.querySelectorAll(".panneau img").length === PANNEAUX.length &&
    texte(dd.getElementById("avert-panneaux")).includes("annexe officielle"));

  // -- amendes : aucun montant non vérifié
  ww = await page("amendes/index.html"); dd = ww.document;
  const tAm = texte(dd.querySelector("main"));
  const montants = [...tAm.matchAll(/(?<![\d,])(\d{1,3}(?: \d{3})*)\s*(?:DT|dinars?)\b/g)].map(m => +m[1].replace(/\s/g, ""));
  check(`amendes : seuls des montants vérifiés sont affichés (${[...new Set(montants)].join(", ")})`, ww.fautes.length === 0 && montants.length > 0 && montants.every(m => AMENDES.montants_autorises.includes(m)));
  const bs = texte(dd.getElementById("bareme-source"));
  check("amendes : barème 2025 = 20 / 40 / 60 DT avec la source (loi n° 2024-48, art. 49, JORT n° 149)", ["20DT", "40DT", "60DT"].every(m => texte(dd.getElementById("bareme")).replace(/\s/g, "").includes(m)) &&
    bs.includes("2024-48") && bs.includes("article 49") && bs.includes("JORT n° 149"));
  const lignesC = [...dd.querySelectorAll("#table-contraventions tbody tr")];
  check("amendes : tableau des contraventions SANS montant (tant que le décret de répartition n'est pas trouvé)", !AMENDES.verification.decret_repartition_trouve &&
    lignesC.length === AMENDES.contraventions.length && lignesC.every(tr => !/\d\s*(DT\b|د(?![ء-ي])|dinar)/.test(texte(tr))));
  check("amendes : avertissement « montants en cours de vérification (loi de finances 2025) »", texte(dd.querySelector(".relecture")).includes("Montants en cours de vérification (loi de finances 2025)"));
  check("amendes : ni 6 ni 10 DT (ancien barème abrogé) affichés comme montant", !/(^|[^\d])(6|10)\s*DT/.test(tAm));
  check("amendes : chaque contravention cite le décret 2010-262 et son article, catégorie 1 à 5", AMENDES.contraventions.every(c => c.cat2010 >= 1 && c.cat2010 <= 5 && !vide(c.ref) && AR.test(c.ar)) && lignesC.every(tr => texte(tr).includes("2010-262")));
  check("amendes : chaque délit cite son article (85 à 87)", AMENDES.delits.every(x => /art\. 8[5-7]/.test(x.ref) && AR.test(x.peine_ar)));

  // -- photos réelles : crédit + licence + preuve
  const LIBRES = /^(CC0|Public domain|CC BY(-SA)? \d\.\d|Licence Ouverte)/;
  const preuves = join(root, "..", "preuves conditions d'utilisation", "2026-10-05", "photos");
  const malPhotos = Object.entries(PHOTOS).filter(([id, p]) => !existsSync(join(root, p.fichier)) || readFileSync(join(root, p.fichier)).length > 150000 ||
    vide(p.auteur) || !LIBRES.test(p.licence) || !/^https:\/\/commons\.wikimedia\.org\//.test(p.source) || vide(p.alt_fr) || !AR.test(p.alt_ar) ||
    (existsSync(preuves) && !existsSync(join(preuves, p.preuve))));
  check(`photos (${Object.keys(PHOTOS).length}) : fichier ≤ 150 Ko, auteur, licence libre, lien Commons, texte FR + AR${existsSync(preuves) ? ", preuve sauvegardée" : ""} ${malPhotos.map(x => x[0])}`, malPhotos.length === 0);
  const sansCredit = [];
  for (const p of PAGES) {
    for (const q of p === "lecons/index.html" ? ["", "&theme=3"] : [""]) {
      const wx = await page(p, { query: q }), dx = wx.document;
      dx.querySelectorAll('img[src*="assets/photos/"]').forEach(img => {
        const id = img.getAttribute("src").match(/photos\/([\w-]+)\.webp/)[1], P = PHOTOS[id];
        const fig = img.closest("figure.photo");
        const zone = fig ? fig.querySelector(".credit") : img.classList.contains("lecon-vignette") || img.closest(".lecon-carte") ? null : img.closest("section, .hero").querySelector(".credit");
        if (img.closest(".lecon-carte")) return;     // vignette de la liste : la photo complète et son crédit sont dans la leçon
        if (!zone || !texte(zone).includes(P.licence) || !texte(zone).includes(P.auteur.slice(0, 10))) sansCredit.push(`${p}:${id}`);
      });
    }
  }
  check(`photos : chaque photo affichée a son crédit (auteur + licence) à côté ${sansCredit}`, sansCredit.length === 0);
  ww = await page("a-propos/index.html"); dd = ww.document;
  check("à propos : liste des crédits de toutes les photos", dd.querySelectorAll("#credits-photos li").length === Object.keys(PHOTOS).length);

  // -- carte « permis » : dessin SPÉCIMEN sans emblème
  const permis = lire("assets/illustrations/permis-specimen.svg");
  // on regarde le TEXTE DESSINÉ (balises <text>), pas les commentaires ni l'étiquette d'accessibilité
  const textesPermis = [...permis.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].map(m => m[1].trim());
  check("carte permis : SVG valide, mentions dessinées SPÉCIMEN et نموذج, PERMIS DE CONDUIRE · رخصة السياقة, catégorie B", svgValide("assets/illustrations/permis-specimen.svg") &&
    ["SPÉCIMEN", "نموذج", "PERMIS DE CONDUIRE", "رخصة السياقة", "B"].every(t => textesPermis.includes(t)));
  check("carte permis : sans emblème ni État ni numéro (pas de République, Tunisie, armoiries, croissant, étoile, chiffres)",
    !/r[ée]publique|tunisi|الجمهورية|التونسية|تونس|armoirie|croissant|[ée]toile|star|crescent/i.test(permis) && !/\d/.test(textesPermis));
  check("carte permis : spécimen officiel ATTT (accueil et page permis) avec son crédit, dessin SPÉCIMEN dans l'image d'aperçu", ["index.html", "permis/index.html"].every(f => lire(f).includes("permis-specimen-attt.webp") && /image ATTT|Transports Terrestres/.test(lire(f))) && existsSync(join(root, "assets/specimen/permis-specimen-attt.webp")) && lire("tools/og-image.html").includes("permis-specimen.svg"));

  // -- menu présent partout, liens internes vers des fichiers existants (en ligne ET depuis le PC en file://)
  const versFichier = (base, href) => {
    const u = new URL(href, base);
    if (u.protocol !== "https:" || !u.href.startsWith("https://ah6259.github.io/code-route-tunisie/")) return null;
    let chemin = decodeURIComponent(u.pathname).replace("/code-route-tunisie/", "");
    if (chemin === "" || chemin.endsWith("/")) chemin += "index.html";
    return chemin;
  };
  const casses = [], menuMal = [], horsLigneMal = [];
  for (const p of PAGES) {
    for (const lang of ["fr", "ar"]) {
      const wx = await page(p, { lang }), dx = wx.document;
      const menu = [...dx.querySelectorAll("nav.menu a")].map(a => a.getAttribute("href").replace(/^(\.\.\/)+/, ""));
      if (menu.join() !== "lecons/,panneaux/,entrainement/,examen/,https://ah6259.github.io/auto-ecoles-tunisie/,amendes/,a-propos/") menuMal.push(p);
      dx.querySelectorAll("a[href]").forEach(a => { const f = versFichier(wx.location.href, a.getAttribute("href")); if (f !== null && !existsSync(join(root, f))) casses.push(`${p} -> ${a.getAttribute("href")}`); });
    }
    const wf = await page(p, { fichier: true }), df = wf.document;
    df.querySelectorAll("a[href]").forEach(a => {
      const h = a.getAttribute("href"); if (/^(https?:|mailto:|#)/.test(h)) return;
      const u = new URL(h, wf.location.href), f = fileURLToPath(u.href.split("?")[0].split("#")[0]);
      if (u.pathname.endsWith("/") || !existsSync(f)) horsLigneMal.push(`${p} -> ${h}`);
    });
  }
  check(`menu présent sur toutes les pages (Leçons, Panneaux, Entraînement, Examen, Auto-écoles [notre annuaire], Amendes, À propos) ${menuMal}`, menuMal.length === 0);
  check(`liens internes : chaque lien mène à un fichier existant ${casses.slice(0, 5)}`, casses.length === 0);
  check(`liens internes depuis le PC (file://) : « index.html » ajouté, fichier existant ${horsLigneMal.slice(0, 5)}`, horsLigneMal.length === 0);

  // -- « Mes erreurs »
  ww = await page("entrainement/index.html", { query: "&erreurs=1", stockage: { q: { "T2-001": 0, "T3-001": 0, "T4-001": 1 }, examens: [] }, pass: true }); dd = ww.document;
  check("« Mes erreurs » : rejoue seulement les questions ratées", ww.fautes.length === 0 && ww.eval("entrainement").liste.length === 2 && ["T2-001", "T3-001"].includes(dd.querySelector("#quiz section").dataset.id) && texte(dd.getElementById("titre-page")) === "Mes erreurs");
  ww = await page("entrainement/index.html", { query: "&erreurs=1", pass: true }); dd = ww.document;
  check("« Mes erreurs » : message clair quand il n'y a rien à revoir", !!dd.getElementById("aucune-erreur"));
  ww = await page("index.html", { stockage: { q: { "T2-001": 0 }, examens: [] } }); dd = ww.document;
  check("accueil : 7 rubriques (entraînement en premier, …, permis, annuaire des auto-écoles) avec le nombre d'erreurs", dd.querySelectorAll("#rubriques .rubrique").length === 7 && dd.querySelector("#rubriques .rubrique:last-child").getAttribute("href").includes("auto-ecoles-tunisie") && dd.querySelector("#rubriques .rubrique").getAttribute("href") === "entrainement/" && texte(dd.getElementById("rubriques")).includes("1 question(s) à revoir"));

  // -- « Signaler une erreur » (WhatsApp) sur les questions
  ww = await page("entrainement/index.html", { query: "&theme=5" }); dd = ww.document;
  { const id = dd.querySelector("#quiz section").dataset.id, a = dd.querySelector("#quiz a.signaler");
    check("questions : petit lien « Signaler une erreur » WhatsApp avec l'identifiant de la question", !!a && a.href.startsWith("https://wa.me/?text=") && decodeURIComponent(a.href).includes(id)); }

  // -- relecture (moniteur) : hors menu, noindex, toutes les questions
  check("relecture désactivée (REGLES_SITE.relecture = false) : pas de bandeau", REGLES_SITE.relecture === false && !(await page("index.html")).document.getElementById("bandeau-relecture"));
  ww = await page("relecture/index.html"); dd = ww.document;
  check("page relecture : toutes les questions publiées + 10 leçons, avec bonne réponse, explication et source", ww.fautes.length === 0 && dd.querySelectorAll(".relu").length === QUESTIONS.length + 10 && dd.querySelectorAll(".bonne-relu").length >= QUESTIONS.length);
  clic(ww, dd.querySelector('.relu[data-id="T2-001"] .btn-ko'));
  check("page relecture : « À corriger » gardé dans le navigateur et bilan WhatsApp, champs utilisables", JSON.parse(ww.localStorage.getItem("crt-relecture-v1"))["T2-001"].etat === "corriger" && decodeURIComponent(dd.getElementById("envoyer-bilan").href).includes("T2-001") && !dd.querySelector(".relu textarea").disabled);
  check("page relecture : noindex, absente du menu et du plan du site, interdite dans robots.txt", lire("relecture/index.html").includes('content="noindex') && !lire("assets/page.js").includes('["relecture/') && /Disallow: \/relecture\//.test(lire("robots.txt")));

  // -- sécurité (consigne commune)
  const robots = lire("robots.txt");
  const IA = ["GPTBot", "ChatGPT-User", "OAI-SearchBot", "ClaudeBot", "Claude-Web", "anthropic-ai", "CCBot", "Google-Extended", "Applebot-Extended", "PerplexityBot", "Bytespider", "Amazonbot", "Meta-ExternalAgent", "FacebookBot", "Diffbot", "Omgilibot", "cohere-ai", "ImagesiftBot", "HTTrack", "WebCopier", "WebZIP", "Offline Explorer", "wget", "SiteSnagger"];
  const groupes = robots.split(/\n\s*\n/).map(g => ({ agents: [...g.matchAll(/^User-agent:\s*(.+)$/gm)].map(m => m[1].trim()), regles: g }));
  const interdit = a => groupes.some(g => g.agents.includes(a) && /^Disallow:\s*\/\s*$/m.test(g.regles));
  check("robots.txt : tous les robots d'IA et aspirateurs interdits", IA.every(interdit));
  check("robots.txt : Google, Bing et les autres moteurs NON interdits", !interdit("Googlebot") && !interdit("*") && !interdit("Bingbot") && groupes.some(g => g.agents.includes("Googlebot")));
  const malSecu = [], malTrad = [], malGc = [];
  for (const p of PAGES) {
    const s = lire(p);
    if (!/<meta name="robots" content="[^"]*noai, noimageai"/.test(s)) malSecu.push(p + " noai");
    if ((p === "relecture/index.html") !== /content="noindex/.test(s)) malSecu.push(p + " noindex");
    const publique = p !== "relecture/index.html";
    if (!s.includes('http-equiv="Content-Security-Policy"') || !s.includes(publique ? "script-src 'self' https://gc.zgo.at;" : "script-src 'self';")) malSecu.push(p + " CSP");
    // statistiques GoatCounter (anonymes, sans cookies) : sur les pages publiques, jamais sur relecture/
    const gc = s.includes('<script data-goatcounter="https://prix-eaux-tunisie.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>')
      && /connect-src[^;]*https:\/\/prix-eaux-tunisie\.goatcounter\.com/.test(s) && /img-src[^;]*https:\/\/prix-eaux-tunisie\.goatcounter\.com/.test(s);
    if (gc !== publique || (!publique && /goatcounter|gc\.zgo\.at/.test(s))) malGc.push(p);
    if (!s.includes('name="referrer" content="strict-origin-when-cross-origin"')) malSecu.push(p + " referrer");
    if (!s.includes("assets/protection.js")) malSecu.push(p + " anti-copie");
    if (/<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)[^>]*>/.test(s)) malSecu.push(p + " script dans la page");
    if (!/<html translate="no"[ >]/.test(s) || !/<meta charset="utf-8">\s*<meta name="google" content="notranslate">/.test(s)) malTrad.push(p);
    const wx = await page(p);
    if (wx.document.documentElement.getAttribute("translate") !== "no") malTrad.push(p + " (retiré par le JS)");
    wx.document.querySelectorAll('a[href^="http"]').forEach(a => { if (!a.href.startsWith("https://ah6259.github.io/") && !/noopener/.test(a.rel)) malSecu.push(p + " noopener " + a.href.slice(0, 40)); });
  }
  check(`sécurité : chaque page a noai, CSP, referrer, anti-copie, aucun script dans la page, liens externes noopener ; noindex seulement sur relecture/ ${malSecu.slice(0, 6)}`, malSecu.length === 0);
  check(`statistiques GoatCounter (sans cookies) sur les pages publiques avec CSP compatible, absentes de relecture/ ${malGc.slice(0, 6)}`, malGc.length === 0);
  check(`pas de traduction automatique : translate="no" sur <html> (gardé après le JS) et meta google notranslate sur toutes les pages ${malTrad.slice(0, 6)}`, malTrad.length === 0);
  const prot = lire("assets/protection.js");
  check("anti-copie : images protégées, texte copié suivi de la source, anti-cadre", prot.includes("contextmenu") && prot.includes("Source : ") && prot.includes("window.top !== window.self") && lire("assets/style.css").includes("user-select:none"));
  // ---- protection renforcée (07/10/2026, demande d'Ahmed : fiches, examens et images = notre propriété) ----
  const css = lire("assets/style.css");
  check("filigrane « © Code de la route Tunisie » par-dessus les cartes protégées, les photos et l'image d'accueil (sans gêner les clics)",
    /\.protege::after,figure\.photo::after,\.hero-visuel::after\{[^}]*pointer-events:none[^}]*background-image:url\("data:image\/svg\+xml,[^"]*%C2%A9 Code de la route Tunisie/.test(css));
  check("impression / « Enregistrer en PDF » : page blanche « Contenu protégé »", /@media print\{\s*body \*\{visibility:hidden!important\}\s*body::before\{content:"Contenu protégé/.test(css));
  { const wp = await page("lecons/index.html", { query: "&theme=1" }), h = wp.document.documentElement;
    wp.dispatchEvent(new wp.Event("blur"));
    const floute = h.classList.contains("cache-capture");
    wp.dispatchEvent(new wp.Event("focus"));
    const net = !h.classList.contains("cache-capture");
    wp.document.dispatchEvent(new wp.KeyboardEvent("keyup", { key: "PrintScreen" }));
    check("capture sur ordinateur : la page se floute quand elle perd la main ou à « Impr. écran », redevient nette au retour",
      floute && net && h.classList.contains("cache-capture") && /html\.cache-capture main[^{]*\{filter:blur\(18px\)/.test(css));
    // copie dans une leçon : le presse-papiers ne reçoit que la mention, jamais notre texte
    const bloc = wp.document.querySelector(".protege .bloc, .protege p");
    const r = wp.document.createRange(); r.selectNodeContents(bloc); wp.getSelection().removeAllRanges(); wp.getSelection().addRange(r);
    let mis = null; const ev = new wp.Event("copy", { bubbles: true, cancelable: true });
    ev.clipboardData = { setData: (t, v) => { mis = v; } };
    bloc.dispatchEvent(ev);
    check("copie BLOQUÉE dans les fiches : le presse-papiers ne reçoit que « Contenu protégé — © … Source », pas le texte",
      ev.defaultPrevented && /^Contenu protégé — © Code de la route Tunisie, tous droits réservés\. Source : /.test(mis || "") && !mis.includes(bloc.textContent.trim().slice(0, 30))); }
  { const brut = lire("assets/questions.js");
    check("questions BROUILLÉES dans le fichier publié (aucune question ni explication en clair), remises en ordre par le navigateur",
      QUESTIONS.length > 100 && QUESTIONS.every(q => !brut.includes(q.question_fr) && !brut.includes(q.question_ar) && !brut.includes(q.explication_fr)) && /© Code de la route Tunisie, tous droits réservés/.test(brut)); }
  const tous = []; (function parcourir(dir) { for (const f of readdirSync(dir)) { if (["node_modules", "captures", ".git"].includes(f)) continue; const c = join(dir, f); statSync(c).isDirectory() ? parcourir(c) : tous.push(c); } })(root);
  const secrets = tous.filter(f => /\.(js|mjs|html|md|yml|py|txt|json|sh)$/.test(f) && f !== fileURLToPath(import.meta.url)).filter(f => {
    const s = readFileSync(f, "utf8");
    return /(api[_-]?key|secret|password|mot de passe)\s*[:=]\s*["'][^"']{6,}/i.test(s) || /\b(ghp_|github_pat_|sk-|AIza)[A-Za-z0-9_]{10,}/.test(s) || /[\w.+-]+@(?!example\.)[\w-]+\.(com|tn|fr|net|org)\b/i.test(s);
  });
  check(`aucun secret ni adresse e-mail dans le site ${secrets.map(f => f.slice(root.length))}`, secrets.length === 0);
}

// ---- 5. Pass Examen (06/10/2026) : page, prix, paiement, conditions, code d'accès, 1 examen gratuit/jour, chrono, séries ----
async function passExamen() {
  const { webcrypto, pbkdf2Sync } = await import("crypto");
  const pause = ms => new Promise(r => setTimeout(r, ms));
  // -- dépôt public : aucune donnée personnelle, seulement l'empreinte et la date de fin
  let pj = {}; try { pj = JSON.parse(lire("donnees/pass.json")); } catch (e) {}
  const clesOk = Object.keys(pj).every(k => ["_lisez_moi", "maj", "sel", "tours", "codes"].includes(k));
  check("donnees/pass.json : seulement sel, tours, date et liste {empreinte, fin} (aucun nom, aucun téléphone)",
    clesOk && typeof pj.sel === "string" && pj.sel.length >= 16 && pj.tours >= 100000 && Array.isArray(pj.codes) &&
    pj.codes.every(c => Object.keys(c).join() === "h,fin" && /^[0-9a-f]{64}$/.test(c.h) && /^\d{4}-\d{2}-\d{2}$/.test(c.fin)) &&
    !/\b[2-9]\d{7}\b|\b[2-9]\d \d{3} \d{3}\b|nom|telephone|téléphone/i.test(JSON.stringify(pj.codes)));
  check("dépôt public : aucun fichier de clients (clients.json, abonnes.json) ni dossier pass (prive)",
    !["clients.json", "donnees/clients.json", "abonnes.json", "pass (prive)"].some(f => existsSync(join(root, f))));

  // -- page pass/ : prix et avantages directs, paiement, formulaire, conditions
  let w = await page("pass/index.html"), d = w.document;
  const t = texte(d.getElementById("offre"));
  check("pass/ : aucune erreur JavaScript", w.fautes.length === 0);
  check("pass/ : prix 9 DT / 7 jours, 19 DT / 30 jours, 29 DT / 90 jours visibles tout de suite", ["9 DT", "19 DT", "29 DT", "7 jours", "30 jours", "90 jours"].every(m => texte(d.getElementById("tarifs")).includes(m)));
  check("pass/ : essai gratuit 2 jours, examens illimités, statistiques, erreurs, pas de renouvellement automatique",
    ["2 jours d'essai gratuit", "Examens blancs illimités", "Statistiques par thème", "Révision de vos erreurs", "Pas de renouvellement automatique"].every(m => t.includes(m)));
  check("pass/ : aucun prix « TTC » ni nom de société", !/TTC|SUARL|S\.U\.A\.R\.L/i.test(lire("pass/index.html") + lire("pass/conditions/index.html")));
  const pay = d.getElementById("paiement");
  check("pass/ : bouton « Paiement » (<details>) avec D17 et IZI (liens vers les applications officielles) au 24 321 390, mode d'emploi, plus de Wafacash, motif nom + téléphone", !!pay && pay.tagName === "DETAILS" && texte(pay.querySelector("summary")).startsWith("Paiement") &&
    ["D17", "IZI", "Transfert rapide", "24 321 390", "votre nom et votre téléphone"].every(m => texte(pay).includes(m)) && !/Wafacash/i.test(pay.outerHTML) && ["tn.mobipost", "tn.izi.consumer", "id1475640303", "id1603653941"].every(u => pay.querySelector(`a[href*="${u}"]`)));
  check("paiement : logos D17 / IZI dans les boutons, étape 2 pour les deux applications, bouton « ? » avec les deux écrans d'exemple", ["d17.png", "izi.png", "transfert-d17.svg", "transfert-izi.svg"].every(f => existsSync(join(root, "assets/paiement", f))) && /class="appli-btn"[^>]*><img src="\.\.\/assets\/paiement\/d17\.png"/.test(lire("pass/index.html")) && /class="aide-transfert"/.test(lire("pass/index.html")) && /Transfert d’argent/.test(lire("pass/index.html")));
  check("paiement simple et rassurant (règle commune du 08/10/2026) : 3 étapes numérotées, phrase de confiance, description de l'offre cachée quand « Paiement » est ouvert", /<ol class="paie-etapes">/.test(lire("pass/index.html")) && /class="paie-confiance"/.test(lire("pass/index.html")) && /class="avantages[^"]*masque-si-paiement/.test(lire("pass/index.html")) && lire("assets/style.css").includes(":has(> details.paiement[open]) > .masque-si-paiement{display:none}"));
  const wa = d.getElementById("pass-preuve");
  check("pass/ : bouton vert « Envoyer la preuve de paiement par WhatsApp » vers wa.me/21624321390, texte prérempli", !!wa && wa.classList.contains("btn-wa") &&
    wa.href.startsWith("https://wa.me/21624321390?text=") && decodeURIComponent(wa.href).includes("Pass Examen") && texte(wa).includes("Envoyer la preuve de paiement par WhatsApp"));
  const form = d.getElementById("pass-form");
  check("pass/ : formulaire Formspree mwlpakqj (nom, téléphone, 4 formules, case conditions, piège)", form.getAttribute("action") === "https://formspree.io/f/mwlpakqj" &&
    !!form.querySelector("[name=nom]") && !!form.querySelector("[name=telephone]") && form.querySelectorAll("input[name=formule]").length === 4 &&
    !!form.querySelector("input[name=conditions][type=checkbox]") && !!form.querySelector("input[name=_gotcha]") && !!form.querySelector('a[href="conditions/"]'));
  const appels = []; w.fetch = (u, o) => { appels.push({ u, o }); return Promise.resolve({ ok: true, status: 200 }); };
  form.querySelector("[name=nom]").value = "Test Candidat"; form.querySelector("[name=telephone]").value = "12";
  form.querySelector("[name=conditions]").checked = true;
  form.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true })); await pause(20);
  check("pass/ : téléphone faux refusé, rien envoyé", appels.length === 0 && d.getElementById("pass-status").className === "err");
  form.querySelector("[name=telephone]").value = "+216 98 765 432";
  [...form.querySelectorAll("input[name=formule]")].find(r => r.value.startsWith("30")).checked = true;
  form.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true })); await pause(30);
  const envoi = appels[0] ? Object.fromEntries(appels[0].o.body.entries()) : {};
  check("pass/ : envoi Formspree (nom, téléphone 8 chiffres, formule, ligne « pour_activer »)", appels.length === 1 && appels[0].u === "https://formspree.io/f/mwlpakqj" &&
    envoi.nom === "Test Candidat" && envoi.telephone === "98765432" && envoi.formule === "30 jours - 19 DT" && String(envoi.pour_activer).includes("action: paye") && String(envoi.pour_activer).includes("jours: 30"));
  check("pass/ : après l'envoi, confirmation + paiement + « Vous recevrez votre code d'accès par WhatsApp »", form.hidden && !d.getElementById("apres-pass").hidden &&
    !d.getElementById("apres-paye").hidden && d.getElementById("apres-essai").hidden && texte(d.getElementById("apres-paye")).includes("Vous recevrez votre code d'accès par WhatsApp") &&
    decodeURIComponent(d.getElementById("pass-preuve-apres").href).includes("Test Candidat — 98765432"));
  w = await page("pass/conditions/index.html"); d = w.document;
  const tc = texte(d.querySelector(".conditions"));
  check("conditions : vendeur « l'éditeur du site », prix, essai 2 jours, pas de renouvellement, aucune période payée remboursée, INPDP",
    ["l'éditeur du site", "9 DT pour 7 jours", "19 DT pour 30 jours", "29 DT pour 90 jours", "2 jours d'essai gratuit", "Aucun renouvellement automatique", "Aucune période payée n'est remboursée", "INPDP"].every(m => tc.includes(m)));

  // -- bouton doré « Pass Examen » (règle d'Ahmed) : caché tant que l'examen gratuit du jour n'est pas fait ;
  //    dès qu'il est fait : sur TOUTES les pages jusqu'au lendemain ; toujours sur les pages Pass ; avec un Pass actif : partout (coché)
  const mauvais = [], mauvaisApres = [], mauvaisPass = [];
  for (const p of PAGES) {
    const avant = (await page(p)).document.querySelector("#entete a.entete-pass");
    if (!!avant !== /^pass\//.test(p)) mauvais.push(p);
    const wa = await page(p, { examenFait: true }); const apres = wa.document.querySelector("#entete a.entete-pass");
    if (!apres || !new URL(apres.getAttribute("href"), wa.location.href).href.endsWith("/code-route-tunisie/pass/")) mauvaisApres.push(p);
    if (!(await page(p, { pass: true })).document.querySelector("#entete a.entete-pass.actif")) mauvaisPass.push(p);
  }
  check(`examen gratuit pas encore fait : bouton Pass seulement sur les pages Pass ${mauvais}`, mauvais.length === 0);
  check(`examen gratuit du jour fait : bouton Pass dans l'en-tête de TOUTES les pages ${mauvaisApres}`, mauvaisApres.length === 0);
  check(`Pass actif : bouton « Pass » coché sur toutes les pages ${mauvaisPass}`, mauvaisPass.length === 0);
  w = await page("index.html"); d = w.document;
  check("accueil : pas de gros bouton Pass dans le bandeau", !d.getElementById("cta-pass") && !d.getElementById("cta-pass-zone"));
  { const hier = await page("index.html"); hier.localStorage.setItem("crt-examen-gratuit-v1", "2000-01-01");
    check("le lendemain : examen gratuit de nouveau disponible, donc plus de bouton Pass", hier.eval("accesExamen()") === "gratuit"); }

  w = await page("index.html");
  { let n = 0; w.fetch = () => { n++; return Promise.reject(new Error("x")); }; await w.eval("reverifierPass()");
    check("aucun appel réseau au chargement d'une page sans code gardé", n === 0); }

  // -- 1 examen gratuit par jour (compté sur l'appareil)
  w = await page("examen/index.html"); d = w.document;
  check("examen : « Examen gratuit du jour » annoncé, pas de statistiques sans Pass", texte(d.getElementById("acces-examen")).includes("1 examen blanc gratuit par jour") && !d.getElementById("stats"));
  w.localStorage.setItem("crt-examen-gratuit-v1", "2000-01-01");
  check("examen gratuit utilisé un AUTRE jour : de nouveau disponible", w.eval("accesExamen()") === "gratuit");
  w.localStorage.setItem("crt-examen-gratuit-v1", w.eval("aujourdhui()"));
  check("examen gratuit utilisé AUJOURD'HUI : bloqué", w.eval("accesExamen()") === "bloque");
  w.eval("examen.etape = 'intro'; rendreExamen()");
  check("examen bloqué : écran « Vous avez utilisé votre examen gratuit du jour » + bouton Pass + lien « J'ai déjà un code »",
    texte(d.getElementById("examen-utilise")).includes("Vous avez utilisé votre examen gratuit du jour") && !!d.querySelector('#examen-utilise a[href="../pass/#code-acces"]') && !d.getElementById("commencer"));
  w.localStorage.setItem("crt-pass-v1", PASS_TEST);
  check("avec le Pass : illimité même si l'examen gratuit du jour est utilisé", w.eval("accesExamen()") === "pass");

  // -- séries et nouvel examen au hasard
  const serie = n => w.eval(`serieExamen(${n})`).map(q => q.id);
  const s1 = serie(1), s1b = serie(1), s2 = serie(2);
  check("séries : la série 1 est toujours la même (30 questions différentes, 3 par thème)", s1.join() === s1b.join() && new Set(s1).size === 30 &&
    [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].every(th => w.eval("serieExamen(1)").filter(q => q.theme === th).length === 3));
  check("séries : 10 séries différentes les unes des autres", new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => serie(n).slice().sort().join())).size === 10 && s1.join() !== s2.join());
  const parTh = {}; QUESTIONS.forEach(q => parTh[q.theme] = (parTh[q.theme] || 0) + 1);
  const forcees = Object.values(parTh).reduce((s, n) => s + Math.max(0, 3 - (n - 3)), 0);
  let eviteOk = true;
  for (let k = 0; k < 50; k++) {
    const a = w.eval("tirerExamen()"), ids = new Set(a.map(q => q.id));
    w.__eviter = ids; const b = w.eval("tirerExamen(Math.random, QUESTIONS, window.__eviter)");
    if (b.length !== 30 || new Set(b.map(q => q.id)).size !== 30 || b.filter(q => ids.has(q.id)).length > forcees) eviteOk = false;
  }
  check(`nouvel examen au hasard : 30 questions sans reprendre celles du dernier examen (sauf ${forcees} si un thème manque de questions)`, eviteOk);
  w = await page("examen/index.html", { pass: true }); d = w.document;
  check("examen avec Pass : pas d'encart de vente", !d.getElementById("offre-pass-examen"));
  check("examen avec Pass : statistiques par thème (10 thèmes) et 10 boutons de série", d.querySelectorAll("#stats-themes tr").length === 10 && d.querySelectorAll("#series .serie").length === 10);
  clic(w, d.querySelector('#series .serie[data-serie="3"]'));
  const ex = w.eval("examen");
  check("série 3 choisie : les 30 questions de la série 3", ex.serie === 3 && ex.questions.map(q => q.id).join() === w.eval("serieExamen(3)").map(q => q.id).join());
  ex.debut = Date.now() - 125000; w.eval("majChrono()");
  check("chronomètre affiché pendant l'examen : 02:05 après 2 min 5 s", texte(d.getElementById("chrono")) === "02:05");
  for (let i = 0; i < 30; i++) { ex.questions[i].bonnes.forEach(n => clic(w, d.querySelector(`.choix-q[data-i="${n}"]`))); clic(w, d.getElementById("valider")); }
  const dernier = JSON.parse(w.localStorage.getItem("crt-progression-v1")).examens.at(-1);
  check("fin de la série : 30/30, temps affiché, série et durée gardées", texte(d.getElementById("score")) === "30 / 30" && /Temps : 2 min 0[5-9] s/.test(texte(d.getElementById("duree"))) && dernier.serie === 3 && dernier.duree >= 125);
  clic(w, d.getElementById("choisir-serie"));
  check("retour au choix des séries : série 3 marquée faite (30/30)", d.querySelector('#series .serie[data-serie="3"]').classList.contains("faite") && texte(d.querySelector('#series .serie[data-serie="3"]')).includes("30/30"));
  check("paragraphe « Un chronomètre affiche le temps passé… » retiré (demande d'Ahmed), chronomètre toujours présent pendant l'examen", !/Un chronomètre affiche le temps passé/.test(texte(d.getElementById("quiz"))));
  const dits = [];
  w.speechSynthesis = { cancel() {}, getVoices: () => [{ lang: "fr-FR" }], speak: u => dits.push(u) };
  w.SpeechSynthesisUtterance = function (x) { this.text = x; };
  w.eval("demarrerExamen(0)");
  clic(w, d.getElementById("ecouter"));
  check("Pass : bouton « Écouter » lit la question et les réponses (voix du téléphone)", dits.length === 1 && dits[0].text.includes(w.eval("examen").questions[0].question_fr.slice(0, 20)) && dits[0].lang === "fr-FR");
  w = await page("examen/index.html"); w.speechSynthesis = { cancel() {}, getVoices: () => [], speak() {} }; w.SpeechSynthesisUtterance = function () {};
  w.eval("demarrerExamen(0)");
  check("sans Pass : pas de bouton « Écouter »", !w.document.getElementById("ecouter"));
  w = await page("entrainement/index.html", { query: "&erreurs=1", stockage: { q: { "T2-001": 0 }, examens: [] } });
  check("« Mes erreurs » sans Pass : présentation du Pass (1 question à revoir)",
    texte(w.document.getElementById("erreurs-pass")).includes("1 question(s)") && !!w.document.querySelector("#erreurs-pass a.btn-pass-grand"));
  w = await page("pass/index.html", { lang: "ar" }); d = w.document;
  check("pass/ en arabe : titre, prix et formulaire en arabe", AR.test(texte(d.querySelector("h1"))) && AR.test(texte(d.getElementById("tarifs"))) && AR.test(texte(d.querySelector("#pass-formules legend"))));

  // -- permis à points : non appliqué en Tunisie (06/10/2026) -> aucune question publiée sur le nombre de points
  const pointsPublies = QUESTIONS.filter(q => /\bpoints?\b/i.test(q.question_fr + " " + q.choix.map(c => c.fr).join(" ")) && !/rainures|4 points mesurés/.test(q.question_fr));
  check(`permis à points (non appliqué) : aucune question publiée sur les points ${pointsPublies.map(q => q.id)}`, pointsPublies.length === 0);
}
