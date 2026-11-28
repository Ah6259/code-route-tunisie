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
// 25/11/2026 (A.17) : vrai verifier() du service d'e-mail (worker.js + sites.json de projets-ahmed, assemblés comme test_worker.mjs).
// projets-ahmed absent (GitHub) : null -> test sauté, jamais en échec.
let workerCharge;
async function verifierWorker(corps, origine) {
  if (workerCharge === undefined) {
    workerCharge = null;
    const { mkdtempSync, writeFileSync } = await import("fs"), { tmpdir } = await import("os");
    const dossiers = [join(root, "..", "projets-ahmed"), join(root, "..", "..", "projets-ahmed"), join(root, ".."), "/home/user/projets-ahmed"]
      .map(x => join(x, "outils communs", "email-clients")).filter(x => existsSync(join(x, "worker.js")) && existsSync(join(x, "sites.json")));
    if (dossiers.length) {
      const wjs = readFileSync(join(dossiers[0], "worker.js"), "utf8"), sj = readFileSync(join(dossiers[0], "sites.json"), "utf8").trim();
      if (wjs.includes("/*SITES_ICI*/ {}")) {
        const f = join(mkdtempSync(join(tmpdir(), "email-")), "worker.mjs");
        writeFileSync(f, wjs.replace("/*SITES_ICI*/ {}", sj));
        workerCharge = await import(pathToFileURL(f).href);
      }
    }
  }
  return workerCharge ? workerCharge.verifier(corps, origine) : null;
}
// 08/11/2026 (plan SEO d'Ahmed, tous les sites) : titre <= 70 caractères et description <= 170 sur chaque page publique (Google coupe au-delà)
{ const dec = x => x.replace(/&#x27;|&#39;|&apos;/g, "’").replace(/&amp;/g, "&").replace(/&quot;/g, '"'), longs = [], toutes = [];
  const voir = d => { for (const x of readdirSync(join(root, d))) { const p = (d ? d + "/" : "") + x; if (x === "node_modules" || x.startsWith(".") || x === "captures") continue;
    if (statSync(join(root, p)).isDirectory()) voir(p); else if (x === "index.html") toutes.push(p); } }; voir("");
  for (const p of toutes) { const h = lire(p); const t = dec((h.match(/<title>([^<]*)<\/title>/) || [])[1] || ""), d = dec((h.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "");
    if (t.length > 70 || t.length < 10) longs.push(`${p} titre ${t.length}`); if (d.length > 170 || d.length < 40) longs.push(`${p} description ${d.length}`); }
  check(`SEO : titre de 10 à 70 caractères et description de 40 à 170 sur les ${toutes.length} pages` + (longs.length ? " — " + longs.slice(0, 4).join(" ; ") : ""), toutes.length >= 10 && longs.length === 0); }
const AR = /[؀-ۿ]/;
const PAGES = ["index.html", "lecons/index.html", "panneaux/index.html", "entrainement/index.html", "examen/index.html", "amendes/index.html", "permis/index.html", "a-propos/index.html", "pass/index.html", "pass/conditions/index.html", "video/index.html", "relecture/index.html"];
const PAGES_PUBLIQUES = PAGES.filter(p => p !== "relecture/index.html");
const PAGES_AR = PAGES_PUBLIQUES.filter(p => p !== "video/index.html").map(p => "ar/" + p);   // une adresse par langue (08/11/2026)

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
async function page(chemin, { lang = "fr", query = "", stockage = null, fichier = false, pass = false, examenFait = false, ls = null, avant = null } = {}) {
  // UNE ADRESSE PAR LANGUE (08/11/2026) : la page arabe est ar/<chemin> ; video/ et relecture/ n'existent qu'à une adresse (?lang=)
  if (lang === "ar" && !chemin.startsWith("ar/") && existsSync(join(root, "ar", chemin))) chemin = "ar/" + chemin;
  const dossier = dirname(join(root, chemin));
  // (les scripts externes, comme GoatCounter, ne sont pas chargés)
  const html = lire(chemin).replace(/<script([^>]*) src="(?!https?:)([^"?]+)(\?[^"]*)?"([^>]*)><\/script>/g,
    (_, a, src) => `<script>${readFileSync(join(dossier, src), "utf8")}</script>`);
  const fautes = [];
  const vc = new VirtualConsole();
  vc.on("jsdomError", e => { if (!/Not implemented/.test(e.message)) fautes.push(e.message); });
  const dom = new JSDOM(html, {
    url: fichier ? `${pathToFileURL(join(root, chemin)).href}?lang=${lang}${query}` : `https://code.clicvia.com/${chemin.replace("index.html", "")}?lang=${lang}${query}`,
    runScripts: "dangerously", pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) { if (stockage) w.localStorage.setItem("crt-progression-v1", typeof stockage === "string" ? stockage : JSON.stringify(stockage));
      if (pass) w.localStorage.setItem("crt-pass-v1", PASS_TEST);
      if (ls) for (const [k, v] of Object.entries(ls)) w.localStorage.setItem(k, typeof v === "string" ? v : JSON.stringify(v));
      if (avant) avant(w);   // avant les scripts de la page (ex. faux réseau du parcours de commande)
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
// 18/10/2026 (visiteur simulé) : « toujours cocher le 1er choix » donnait 22 / 30 ; l'ordre des choix est maintenant mélangé
check("examen : la bonne réponse n'est pas presque toujours le 1er choix (choix mélangés)", ex.questions.filter(q => q.bonnes.includes(0)).length <= 20);
check("examen : score affiché 25 / 30", texte(d.getElementById("score")) === "25 / 30");
check("examen : « Réussi » affiché", texte(d.getElementById("statut")) === "Réussi");
check("examen : seuil de réussite affiché", texte(d.getElementById("quiz")).includes("Seuil de réussite"));
check("examen : revue des 5 erreurs, avec explication et source", d.querySelectorAll("#erreurs .erreur").length === 5 &&
  [...d.querySelectorAll("#erreurs .erreur")].every(e => e.querySelector(".explication") && texte(e.querySelector(".source")).startsWith("Source :")));
check("examen : bonne réponse montrée en vert dans la revue", d.querySelectorAll("#erreurs .choix-q.bonne").length >= 5);
check("examen : résultat par thème (10 lignes)", d.querySelectorAll("#par-theme tr").length === 10);
check("examen : score gardé dans le navigateur", JSON.parse(w.localStorage.getItem("crt-progression-v1")).examens.at(-1).score === 25);
check("examen : lien WhatsApp de partage du score", d.getElementById("partage").href.startsWith("https://wa.me/?text=") && decodeURIComponent(d.getElementById("partage").href).includes("25/30"));
{ const allees = []; w.allerVers = u => allees.push(u); clic(w, d.querySelector(".langue"));
  check("examen : le bouton de langue mène à la page arabe ar/examen/ (une adresse par langue) ; la page française garde son résultat", allees[0] === "../ar/examen/" && d.documentElement.lang === "fr" && texte(d.getElementById("score")) === "25 / 30"); }
check("examen gratuit terminé : carte « Vous avez utilisé votre examen gratuit du jour » + gros bouton doré vers pass/",
  /examen gratuit du jour/.test(texte(d.getElementById("fin-gratuit"))) && d.querySelector("#fin-gratuit a.btn-pass-grand").getAttribute("href") === "../pass/");
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
    /أحمر \(أ\).*برتقالي \(ب\).*أخضر \(ج\)/.test(texte((await page("examen/index.html", { lang: "ar" })).document.querySelector("#ecran-examen figcaption [data-l='ar']"))));
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
// 25/10/2026 (RÈGLE d'Ahmed, règle commune § 44 : « la page Comment fonctionne le site doit être mise à jour chaque fois qu'on modifie le site ») :
// chaque fonction visible du site (repère dans le code ou les pages) doit être expliquée dans a-propos/ ; nouvelle fonction = une ligne ici + la page
{ const ap = texte(d.body), js = lire("assets/page.js") + lire("assets/pages.js") + lire("assets/quiz.js") + lire("assets/pass.js"), acc = lire("index.html");
  const FONCTIONS = [
    ["leçons", existsSync(join(root, "lecons/index.html")), /Leçons : 10 leçons/],
    ["panneaux", existsSync(join(root, "panneaux/index.html")), /Panneaux : les panneaux rangés par famille/],
    ["entraînement par thème", existsSync(join(root, "entrainement/index.html")), /Entraînement par thème : une question à la fois/],
    ["examen blanc et séries", /serieExamen/.test(js), /Examen blanc : 30 questions[\s\S]*Série 10/],
    ["derniers scores sur l'accueil", /afficherHistorique/.test(js), /Vos derniers scores/],
    ["Mes erreurs", /erreurs=1/.test(js), /Mes erreurs : rejouer les questions ratées/],
    ["amendes", existsSync(join(root, "amendes/index.html")), /Amendes : barème 2025/],
    ["passer le permis", existsSync(join(root, "permis/index.html")), /Passer le permis : catégories/],
    ["liens Auto-écoles et Ma voiture", /auto-ecoles\.clicvia\.com/.test(js) && /voiture\.clicvia\.com/.test(js), /Auto-écoles et Ma voiture/],
    ["langue FR / AR (une adresse par langue)", /\.langue/.test(js) && existsSync(join(root, "ar/index.html")), /Français \/ arabe : chaque page existe en français[\s\S]*ar\/[\s\S]*bouton de langue/],
    ["bouton Partager", /\.partager/.test(js), /Partager : le bouton rond/],
    // 19/11/2026 (Ahmed : « les élèves peuvent se le partager pendant leur pause au lycée »)
    ["QR code à partager", /class="carte carte-qr"/.test(acc) && existsSync(join(root, "assets/qr/code-route-fr.svg")), /QR code : sur l'accueil/],
    ["Signaler une erreur", /Signaler une erreur/.test(js), /Signaler une erreur : le petit lien/],
    ["Votre avis", existsSync(join(root, "assets/avis.js")) && /id="avis"/.test(acc), /Votre avis : un formulaire/],
    ["installation et hors connexion", existsSync(join(root, "sw.js")), /Installer sur le téléphone/],
    ["vidéo de présentation", existsSync(join(root, "video/index.html")), /Vidéo de présentation : courte vidéo/],
    ["Pass Examen (prix, code, Écouter)", existsSync(join(root, "pass/index.html")) && /Écouter/.test(js), /Pass Examen \(payant\)[\s\S]*Écouter[\s\S]*9 DT pour 7 jours[\s\S]*code/],
    // 25/11/2026 (règle commune § 70) : code de commande créé au formulaire, motif du paiement, commande gardée et essayée toute seule
    ["numéro de commande du Pass (motif du paiement)", /pass-commande/.test(js), /numéro de commande[\s\S]*motif du paiement[\s\S]*essaie ce code tout seul/],
    // 25/11/2026 (A.17) : e-mail de confirmation automatique (service api-email.clicvia.com, Resend)
    ["e-mail de confirmation automatique du Pass", /emailAuto: true,/.test(lire("assets/pass-reglages.js")), /E-mail de confirmation : dans la minute qui suit, vous recevez aussi tout cela par e-mail[\s\S]*Resend/],
    // 25/11/2026 (décision d'Ahmed, pas de gratuité) : encadré vers le Pass à la fin des leçons, panneaux, amendes ; clics comptés
    ["encadré « Testez-vous en conditions réelles » vers le Pass", /id="encadre-pass"/.test(lire("lecons/index.html") + lire("panneaux/index.html") + lire("amendes/index.html")), /« Testez-vous en conditions réelles »[\s\S]*fin de chaque leçon[\s\S]*Panneaux et Amendes[\s\S]*caché si votre Pass est actif/],
    // 28/11/2026 (audit § 71) : encadrés sous l'entraînement par thème et sur la page Permis
    ["encadrés « Prêt pour l'examen ? » (entraînement) et « Préparez l'épreuve du code » (permis)", /data-clic="pass-entrainement"/.test(lire("entrainement/index.html")) && /data-clic="pass-permis"/.test(lire("permis/index.html")), /« Prêt pour l'examen \? »[\s\S]*entraînement par thème[\s\S]*page Permis[\s\S]*Préparez l'épreuve du code[\s\S]*cachés si votre Pass est actif/],
    ["clics vers le Pass comptés (GoatCounter, sans savoir qui)", /\/code-route-tunisie\/clic\//.test(js), /sans savoir qui vous êtes, les clics sur les liens qui mènent au Pass Examen/],
    ["vie privée", true, /Pas de compte\. Votre progression, vos scores et votre code restent dans votre téléphone/],
    ["surveillance mensuelle du texte officiel", existsSync(join(root, "tools/surveiller_source.py")), /Chaque mois, un robot vérifie/],
    ["site indépendant", true, /site est indépendant/]];
  const manque = FONCTIONS.filter(([, sur, re]) => sur && !re.test(ap)).map(([n]) => n);
  check(`page « Comment fonctionne le site ? » à jour : titre et chaque fonction du site expliquée (${FONCTIONS.length} fonctions)` + (manque.length ? " — manque : " + manque.join(", ") : ""),
    manque.length === 0 && /Comment fonctionne le site \?/.test(texte(d.querySelector("h1")))
    && /href="\$\{site\}a-propos\/">\$\{T\("Comment fonctionne le site \?"/.test(lire("assets/page.js")) && /id="lien-fonctionnement"/.test(acc)); }

// ---- 2 bis. ENCADRÉS VERS LE PASS + CLICS COMPTÉS (25/11/2026, décision d'Ahmed : « pas de gratuité », modèle Alerte Concours) ----
{ const enc = h => (h.match(/<!--encadre-pass-->([\s\S]*?)<!--\/encadre-pass-->/) || [])[1] || "";
  const ko = [];
  const TEXTE_ENC = { lecons: [/Testez-vous en conditions réelles : examens blancs illimités avec le Pass Examen \(dès 9&nbsp;DT\)/, /اختبر نفسك في ظروف حقيقية/],
    entrainement: [/Prêt pour l'examen \? Examens blancs illimités dans les conditions réelles avec le Pass Examen \(dès 9&nbsp;DT\)/, /مستعد للامتحان؟ امتحانات تجريبية بلا حدود/],
    permis: [/Préparez l'épreuve du code : examens blancs illimités avec le Pass Examen \(dès 9&nbsp;DT\)/, /استعد لاختبار الكود: امتحانات تجريبية بلا حدود/] };
  TEXTE_ENC.panneaux = TEXTE_ENC.amendes = TEXTE_ENC.lecons;
  for (const [f, clic] of [["lecons/index.html", "pass-lecon"], ["panneaux/index.html", "pass-panneaux"], ["amendes/index.html", "pass-amendes"],
    ["entrainement/index.html", "pass-entrainement"], ["permis/index.html", "pass-permis"]]) for (const pref of ["", "ar/"]) {
    const h = lire(pref + f), e = enc(h), m = e.match(/<a class="btn" id="encadre-btn" href="([^"]*)" data-clic="([a-z-]+)">/) || [];
    const [reFr, reAr] = TEXTE_ENC[dirname(f)];
    const bonTexte = pref ? reAr.test(e) && !/[À-ÿ]|Pass Examen|Testez|Prêt|Préparez/.test(e.replace(/<[^>]+>/g, "")) : reFr.test(e) && !AR.test(e);
    const cible = join(root, pref + dirname(f), m[1] || "x", "index.html");
    if (!(m[1] === "../pass/" && existsSync(cible) && m[2] === clic && bonTexte && /29&nbsp;DT|>29</.test(e) && (h.match(/id="encadre-pass"/g) || []).length === 1)) ko.push(pref + f);
    if (/gratuit|offert|essai|مجان/i.test(e)) ko.push(pref + f + " (gratuité)");
  }
  check("encadré vers le Pass sur leçons, panneaux, amendes, entraînement, permis (FR + ar/) : texte de la langue, prix, vrai bouton vers pass/ de la même langue, clic nommé, aucune gratuité" + (ko.length ? " — " + ko.join(", ") : ""), !ko.length);
  check("leçons : l'encadré vient APRÈS le contenu de la leçon (#lecon)", /<div id="lecon"><\/div>\s*<!--encadre-pass-->/.test(lire("lecons/index.html")) && /<div id="lecon"><\/div>\s*<!--encadre-pass-->/.test(lire("ar/lecons/index.html")));
  const wl = await page("lecons/index.html", { query: "&theme=3" }), el = wl.document.getElementById("encadre-pass");
  check("leçon 3 affichée : encadré visible sous la leçon, aucune erreur", wl.fautes.length === 0 && el && !el.hidden && wl.document.querySelector("#lecon").children.length > 0
    && (wl.document.getElementById("lecon").compareDocumentPosition(el) & 4));
  const wp = await page("lecons/index.html", { query: "&theme=3", pass: true });
  check("leçon avec un Pass actif : encadré caché", wp.document.getElementById("encadre-pass").hidden === true);
  // 28/11/2026 : entraînement (sous le quiz) et permis (sous l'étape « 3. L'examen »)
  check("entraînement : l'encadré vient juste APRÈS la zone du quiz (#quiz), FR + ar/", ["", "ar/"].every(p => /<div id="quiz"><\/div>\s*<!--encadre-pass-->/.test(lire(p + "entrainement/index.html"))));
  check("permis : l'encadré vient APRÈS l'étape « 3. L'examen » et AVANT l'étape 4, FR + ar/", ["", "ar/"].every(p => /3\. (L'examen|الامتحان)[\s\S]*<\/section>\s*<!--encadre-pass-->[\s\S]*<!--\/encadre-pass-->\s*<section class="carte">\s*<h2><span[^>]*>4\. /.test(lire(p + "permis/index.html").replace(/&#x27;|&#39;/g, "'"))));
  for (const [chemin, opts] of [["entrainement/index.html", { query: "&theme=4" }], ["entrainement/index.html", { lang: "ar" }], ["permis/index.html", {}], ["permis/index.html", { lang: "ar" }]]) {
    const w1 = await page(chemin, opts), e1 = w1.document.getElementById("encadre-pass");
    const w2 = await page(chemin, { ...opts, pass: true }), e2 = w2.document.getElementById("encadre-pass");
    check(`${opts.lang === "ar" ? "ar/" : ""}${chemin}${opts.query || ""} : encadré visible sans Pass, caché avec un Pass actif, aucune erreur`, !!e1 && !e1.hidden && !!e2 && e2.hidden === true && !w1.fautes.length && !w2.fautes.length);
  }
  const we = await page("entrainement/index.html", { query: "&erreurs=1" });
  check("« Mes erreurs » sans Pass (écran qui présente déjà le Pass) : l'encadré est caché (pas de doublon)", !!we.document.getElementById("erreurs-pass") && we.document.getElementById("encadre-pass").hidden === true);
  // clics comptés (faux GoatCounter), FR et AR ; rien (et aucune erreur) sans GoatCounter
  const essai = async (chemin, opts, sel, gc = true) => {
    const w = await page(chemin, opts), comptes = [], erreurs = [];
    w.addEventListener("error", e => erreurs.push(e.message));
    if (gc) w.goatcounter.count = o => comptes.push(o); else delete w.goatcounter.count;
    const a = w.document.querySelector(sel);
    if (a) { a.addEventListener("click", e => e.preventDefault()); a.dispatchEvent(new w.MouseEvent("click", { bubbles: true, cancelable: true })); }
    return { a, comptes, erreurs: erreurs.concat(w.fautes) };
  };
  for (const [chemin, opts, sel, nom] of [
    ["lecons/index.html", { query: "&theme=2" }, "#encadre-btn", "pass-lecon"], ["lecons/index.html", { lang: "ar", query: "&theme=2" }, "#encadre-btn", "pass-lecon"],
    ["panneaux/index.html", {}, "#encadre-btn", "pass-panneaux"], ["amendes/index.html", { lang: "ar" }, "#encadre-btn", "pass-amendes"],
    ["entrainement/index.html", { query: "&theme=1" }, "#encadre-btn", "pass-entrainement"], ["entrainement/index.html", { lang: "ar" }, "#encadre-btn", "pass-entrainement"],
    ["permis/index.html", {}, "#encadre-btn", "pass-permis"], ["permis/index.html", { lang: "ar" }, "#encadre-btn", "pass-permis"],
    ["index.html", {}, 'a[data-clic="pass-accueil"]', "pass-accueil"], ["index.html", { lang: "ar" }, 'a[data-clic="pass-accueil"]', "pass-accueil"],
    ["permis/index.html", {}, '#pied a[href$="pass/"]', "pass-pied"], ["examen/index.html", { examenFait: true }, "#entete a.entete-pass", "pass-entete"],
    ["examen/index.html", { examenFait: true }, "#cta-pass-examen", "pass-examen-du-jour"], ["entrainement/index.html", { query: "&erreurs=1" }, "#cta-pass-erreurs", "pass-erreurs"]]) {
    const r = await essai(chemin, opts, sel);
    check(`clic compté (faux GoatCounter) ${opts.lang === "ar" ? "ar/" : ""}${chemin} ${sel} → événement « /code-route-tunisie/clic/${nom} »`,
      !!r.a && r.comptes.length === 1 && r.comptes[0].path === "/code-route-tunisie/clic/" + nom && r.comptes[0].event === true && !!r.comptes[0].title && !r.erreurs.length);
  }
  const s0 = await essai("lecons/index.html", { query: "&theme=2" }, "#encadre-btn", false);
  check("sans GoatCounter (bloqué) : aucun compte, aucune erreur, le lien reste", !!s0.a && !s0.comptes.length && !s0.erreurs.length);
  for (const ch of ["entrainement/index.html", "permis/index.html"]) {
    const r0 = await essai(ch, {}, "#encadre-btn", false);
    check(`${ch} sans GoatCounter : aucun compte, aucune erreur, le lien reste`, !!r0.a && !r0.comptes.length && !r0.erreurs.length);
  }
  const s1 = await essai("lecons/index.html", { query: "&theme=2" }, '#pied a[href$="lecons/"]');
  check("lien qui ne mène pas au Pass (Leçons du pied) : rien compté", !!s1.a && !s1.comptes.length);
  const s2 = await essai("pass/index.html", {}, '#pied a[href$="pass/"]');
  check("sur la page pass/ elle-même : aucun clic compté", !!s2.a && !s2.comptes.length);
  // fin d'un examen gratuit (carte #fin-gratuit) : nom donné par l'endroit
  const wf = await page("examen/index.html"), z = wf.document.createElement("section");
  z.id = "fin-gratuit"; z.innerHTML = wf.htmlBoutonPass("cta-pass-fin", "x", "x"); wf.document.body.appendChild(z);
  check("fin d'un examen gratuit (#cta-pass-fin) → « pass-fin-examen »", wf.nomClicPass(wf.document.getElementById("cta-pass-fin")) === "pass-fin-examen");
}
// ---- 2 ter. UNE ADRESSE PAR LANGUE (08/11/2026, plan SEO d'Ahmed, phase 2 point 7 ; tools/construire.py) ----------
{
  const SOURCES = PAGES_PUBLIQUES.filter(p => p !== "video/index.html");
  const dec = x => x.replace(/&#x27;|&#39;|&apos;/g, "’").replace(/&amp;/g, "&").replace(/&quot;/g, '"');
  const existe = (depuis, rel) => { const c = rel.split("#")[0].split("?")[0]; if (!c) return true; const f = join(root, dirname(depuis), c, c.endsWith("/") ? "index.html" : ""); return existsSync(f); };
  const pb = [], titres = new Map();
  for (const p of SOURCES) {
    const src = "tools/sources/" + p, ar = "ar/" + p, chemin = p.replace("index.html", "");
    if (!existsSync(join(root, src))) { pb.push(`${p} : pas de source dans tools/sources/`); continue; }
    if (!existsSync(join(root, ar))) { pb.push(`${p} : pas de page arabe ${ar}`); continue; }
    const f = lire(p), a = lire(ar), S = lire(src);
    if (!/data-l="fr"/.test(S) || !/data-l="ar"/.test(S)) pb.push(`${src} : la source doit être bilingue`);
    if (/data-l="ar"/.test(f)) pb.push(`${p} : texte arabe resté dans la page française`);
    if (/data-l="fr"/.test(a)) pb.push(`${ar} : texte français resté dans la page arabe`);
    if (!/<html [^>]*lang="fr" dir="ltr"[^>]*data-langue-fixe="fr"[^>]*data-autre-langue="([^"]*)"/.test(f)) pb.push(`${p} : lang / data-langue-fixe / data-autre-langue`);
    if (!/<html [^>]*lang="ar" dir="rtl"[^>]*data-langue-fixe="ar"[^>]*data-autre-langue="([^"]*)"/.test(a)) pb.push(`${ar} : lang / dir / data-langue-fixe`);
    const versAr = (f.match(/data-autre-langue="([^"]*)"/) || [])[1], versFr = (a.match(/data-autre-langue="([^"]*)"/) || [])[1];
    if (!versAr || !existe(p, versAr) || !/ar\//.test(versAr)) pb.push(`${p} : bouton de langue -> ${versAr} introuvable`);
    if (!versFr || !existe(ar, versFr) || /ar\//.test(versFr)) pb.push(`${ar} : bouton de langue -> ${versFr} introuvable`);
    for (const [page, url] of [[f, "https://code.clicvia.com/" + chemin], [a, "https://code.clicvia.com/ar/" + chemin]]) {
      if (!page.includes(`<link rel="canonical" href="${url}">`)) pb.push(`${url} : canonical`);
      if (!page.includes(`<link rel="alternate" hreflang="fr" href="https://code.clicvia.com/${chemin}">`) || !page.includes(`<link rel="alternate" hreflang="ar" href="https://code.clicvia.com/ar/${chemin}">`)
          || !page.includes(`<link rel="alternate" hreflang="x-default" href="https://code.clicvia.com/${chemin}">`)) pb.push(`${url} : hreflang fr / ar / x-default`);
      const t = dec((page.match(/<title>([^<]*)<\/title>/) || [])[1] || ""), d = dec((page.match(/name="description" content="([^"]*)"/) || [])[1] || "");
      if (t.length < 15 || t.length > 70) pb.push(`${url} : titre de ${t.length} caractères`);
      if (d.length < 50 || d.length > 165) pb.push(`${url} : description de ${d.length} caractères`);
      if (titres.has(t)) pb.push(`${url} : même titre que ${titres.get(t)}`); titres.set(t, url);
    }
    if (!/[\u0600-\u06FF]/.test((a.match(/<title>([^<]*)<\/title>/) || [])[1] || "")) pb.push(`${ar} : titre pas en arabe`);
    if (!a.includes(`<meta property="og:url" content="https://code.clicvia.com/ar/${chemin}">`)) pb.push(`${ar} : og:url`);
    if (/application\/ld\+json/.test(a)) pb.push(`${ar} : FAQ Google française laissée sur la page arabe`);
    // chaque lien et fichier de la page arabe mène quelque part (fichiers à la racine, pages dans ar/, video/ et relecture/ à la racine)
    for (const m of a.matchAll(/\b(?:href|src|poster)="([^"]*)"/g)) {
      const u = m[1]; if (/^(https?:|mailto:|tel:|data:|#|\?)/.test(u) || /^\//.test(u)) continue;
      if (!existe(ar, u)) pb.push(`${ar} : ${u} introuvable`);
    }
  }
  check(`une adresse par langue : ${SOURCES.length} pages françaises + ${SOURCES.length} pages arabes (ar/), chacune dans UNE langue, hreflang, canonical, titres <= 70 uniques, liens valides` + (pb.length ? " — " + pb.slice(0, 5).join(" ; ") : ""), pb.length === 0);
  // la page arabe se comporte comme une page arabe (en-tête, lang), le bouton de langue mène à l'adresse française
  { const wa = await page("lecons/index.html", { lang: "ar", query: "&theme=2" }); const allees = []; 
    const da = wa.document; const bouton = da.querySelector("#entete .langue");
    check("page arabe ar/lecons/ : lang=ar, en-tête en arabe, aucune erreur JavaScript, menu vers les pages arabes (ar/…)", da.documentElement.lang === "ar" && wa.fautes.length === 0
      && /الدروس/.test(texte(da.querySelector("#entete .menu"))) && da.querySelector('#entete .menu a[href="../examen/"]') !== null && da.querySelector('#pied a[href="../pass/"]') !== null && /^\.\.\/\.\.\/assets\//.test(da.querySelector("#entete .logo-mark").getAttribute("src")));
    // images fabriquées par les scripts (vignettes des thèmes…) : chaque fichier existe (le visiteur simulé a vu 9 vignettes cassées sur ar/ le 08/11/2026)
    const cassees = [];
    for (const [pg, win] of [["ar/lecons/index.html", wa], ["ar/index.html", await page("index.html", { lang: "ar" })], ["ar/entrainement/index.html", await page("entrainement/index.html", { lang: "ar" })]])
      for (const im of win.document.querySelectorAll("img[src]")) { const u = im.getAttribute("src"); if (!/^(https?:|data:)/.test(u) && !existe(pg, u)) cassees.push(pg + " : " + u); }
    check("pages arabes : chaque image (y compris celles fabriquées par les scripts) existe" + (cassees.length ? " — " + cassees.slice(0, 3).join(" ; ") : ""), cassees.length === 0);
    wa.allerVers = u => allees.push(u); clic(wa, bouton);
    check("page arabe : le bouton de langue ouvre la page française (mêmes paramètres)", allees.length === 1 && allees[0] === "../../lecons/?theme=2");
    const wf = await page("lecons/index.html", { query: "&theme=3" }); const alleesF = []; wf.allerVers = u => alleesF.push(u);
    clic(wf, wf.document.querySelector("#entete .langue"));
    check("page française : lang=fr, le bouton de langue ouvre ar/lecons/ (mêmes paramètres)", wf.document.documentElement.lang === "fr" && alleesF.length === 1 && alleesF[0] === "../ar/lecons/?theme=3"); }
  // un ancien lien « ?lang=ar » vers la page française renvoie vers la page arabe ; une préférence gardée aussi, mais seulement en venant du site
  { const essai = async (chemin, lang, ls, referrer) => { const allees = []; const w2 = await (async () => {
        const html = lire(chemin).replace(/<script([^>]*) src="(?!https?:)([^"?]+)(\?[^"]*)?"([^>]*)><\/script>/g, (_, a2, src) => `<script>${readFileSync(join(root, dirname(chemin), src), "utf8")}</script>`);
        const dom = new JSDOM(html, { url: `https://code.clicvia.com/${chemin.replace("index.html", "")}${lang ? "?lang=" + lang : ""}`, referrer, runScripts: "dangerously", pretendToBeVisual: true, virtualConsole: new VirtualConsole(),
          beforeParse(w) { w.allerVers = u => allees.push(u); if (ls) w.localStorage.setItem("langue", ls); } });
        await new Promise(ok => dom.window.addEventListener("load", ok)); return dom.window; })();
      return { allees, lang: w2.document.documentElement.lang }; };
    const r1 = await essai("amendes/index.html", "ar"), r2 = await essai("ar/amendes/index.html", "fr"), r3 = await essai("amendes/index.html", "", "ar", "https://code.clicvia.com/"),
      r4 = await essai("amendes/index.html", "", "ar", "https://www.google.com/"), r5 = await essai("amendes/index.html", "", "fr", "https://code.clicvia.com/");
    check("ancien lien « ?lang=ar » sur la page française -> page arabe ; « ?lang=fr » sur la page arabe -> page française", r1.allees[0] === "../ar/amendes/" && r2.allees[0] === "../../amendes/");
    check("langue « ar » gardée dans le téléphone : renvoi vers ar/ seulement en venant d'une page du site (jamais depuis Google ou un lien partagé) ; la page reste française en attendant",
      r3.allees[0] === "../ar/amendes/" && r4.allees.length === 0 && r4.lang === "fr" && r5.allees.length === 0); }
}

// ---- 3. Date unique, référencement, aperçu, licence, cache, robots GitHub ----------
// Liens « Confidentialité » / « Conditions d'utilisation » du pied (17/11/2026) et page 404 commune (règle commune § 58 point 14 ;
// modèle : outils communs/page-404 de projets-ahmed, sinon GitHub montre sa page anglaise)
const lienPied = (doc, u, t) => [...doc.querySelectorAll("#pied nav a")].some(a => a.getAttribute("href") === u && a.textContent.trim() === t);
check("page 404 commune à la racine publiée : 404.html (nom du site, couleur) + 404.js qui cherche la page (« Recherche de la page »)",
  existsSync(join(root, "404.html")) && existsSync(join(root, "404.js")) && lire("404.html").includes("<title>Page introuvable — Code de la route Tunisie</title>")
  && lire("404.html").includes('<script src="/404.js"></script>') && lire("404.js").includes("Recherche de la page"));
check("À propos : la page introuvable et les liens Confidentialité / Conditions sont expliqués (FR + AR)", lire("a-propos/index.html").includes("Page introuvable, confidentialité, conditions") && lire("ar/a-propos/index.html").includes("صفحة غير موجودة، الخصوصية، الشروط"));
const fichiersCode = [...PAGES, "assets/page.js", "assets/pass.js", "assets/pass-reglages.js", "assets/quiz.js", "assets/pages.js", "assets/lecons.js", "assets/amendes.js", "assets/panneaux.js", "assets/protection.js"];
const datesEnDur = fichiersCode.filter(f => /\b\d{2}\/\d{2}\/20\d{2}\b/.test(lire(f)));
check(`aucune date jj/mm/aaaa écrite en dur hors de regles.js ${datesEnDur.join(" ")}`, datesEnDur.length === 0);
// 21/11/2026 : REGLES_SITE.annee = année civile (pied « © ») ; la date de vérification du texte peut dater de l'année d'avant (janvier)
check("regles.js : date au format jj/mm/aaaa, pas après l'année du site", /^\d{2}\/\d{2}\/\d{4}$/.test(REGLES_SITE.verifie_le) && Number(REGLES_SITE.verifie_le.slice(-4)) <= REGLES_SITE.annee);
// ---- ANNÉE AUTOMATIQUE des titres (21/11/2026, demande d'Ahmed ; règle de tools/annee.py, robot .github/workflows/annee.yml) ----
// du 1er janvier au 31 octobre de l'année N : « N » ; du 1er novembre au 31 décembre : « N-N+1 » (on cherche déjà l'année suivante)
{ const regle = iso => { const [y, m] = iso.split("-").map(Number); return m >= 11 ? `${y}-${y + 1}` : String(y); };
  const jour = process.env.CODE_ROUTE_DATE || new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Tunis" }).format(new Date());
  const an = Number(jour.slice(0, 4)), attendue = regle(jour);
  // même règle en Python (tools/annee.py) et ici, sur des dates fixes
  const essais = { "2026-10-31": "2026", "2026-11-01": "2026-2027", "2026-12-31": "2026-2027", "2027-01-01": "2027", "2027-06-15": "2027" };
  let py = null;
  try { const { execFileSync } = await import("child_process");
    py = Object.keys(essais).every(dt => execFileSync(process.env.PYTHON || "python3", ["-c", "import sys; sys.path.insert(0, 'tools'); import annee, datetime; print(annee.annee_seo(datetime.date.fromisoformat(sys.argv[1])))", dt], { cwd: root, encoding: "utf8" }).trim() === essais[dt]);
  } catch (e) { py = null; }
  check("année des titres : même règle dans tools/annee.py et dans ce test (31/10 -> N, 1er novembre -> N-N+1, 1er janvier -> N+1)" + (py === null ? " (Python absent : règle JS seule)" : ""),
    Object.entries(essais).every(([dt, a]) => regle(dt) === a) && py !== false);
  check(`année du pied de page (© REGLES_SITE.annee) = année civile ${an} (sinon : python tools/annee.py --appliquer)`, REGLES_SITE.annee === an);
  const annees = t => [...t.matchAll(/(?<![\d\/.\-])(20\d\d(?:-20\d\d)?)(?![\d\/\-])/g)].map(m => m[1]);
  const champs = h => [(h.match(/<title>([^<]*)<\/title>/) || [])[1] || "", (h.match(/<meta name="description" content="([^"]*)"/) || [])[1] || "",
    ((h.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1] || "").replace(/<[^>]+>/g, " ")].join(" | ");
  const fautes = [];
  for (const p of [...PAGES, ...PAGES_AR]) {
    for (const a of annees(champs(lire(p)))) if (a !== attendue && !(a.length === 4 && Number(a) < an)) fautes.push(`${p} : « ${a} »`);
    const src = "tools/sources/" + p.replace(/^ar\//, "");
    if (existsSync(join(root, src)) && /\{\{ANNEE\}\}/.test(champs(lire(src))) && !p.startsWith("ar/") && !champs(lire(p)).includes(attendue)) fautes.push(`${p} : « ${attendue} » absente`);
  }
  for (const p of PAGES.filter(x => existsSync(join(root, "tools/sources/" + x))))
    for (const a of annees(champs(lire("tools/sources/" + p)))) if (Number(a.slice(0, 4)) >= 2026) fautes.push(`tools/sources/${p} : « ${a} » écrite en dur (écrire {{ANNEE}})`);
  const blocAr = (lire("tools/construire.py").match(/TEXTES_AR = \{[\s\S]*?\n\}/) || [""])[0];
  for (const a of annees(blocAr)) if (Number(a.slice(0, 4)) >= 2026) fautes.push(`TEXTES_AR : « ${a} » écrite en dur (écrire {{ANNEE}})`);
  check(`année des titres = « ${attendue} » le ${jour} (titres, descriptions et h1 des pages FR + AR ; aucune année future ou périmée écrite en dur)` + (fautes.length ? " — " + fautes.slice(0, 5).join(" ; ") : ""), fautes.length === 0);
  check("accueil : titre avec l'année du jour (« code de la route tunisie " + attendue + " »)", lire("index.html").includes(`<title>Code de la route Tunisie ${attendue} :`) && lire("ar/index.html").includes(attendue));
  const robot = existsSync(join(root, ".github/workflows/annee.yml")) ? lire(".github/workflows/annee.yml") : "";
  check("robot annee.yml : chaque mois, refait les pages (tools/annee.py --appliquer), teste, enregistre", /cron:/.test(robot) && robot.includes("tools/annee.py --appliquer") && robot.includes("tools/test_site.mjs") && robot.includes("git push") && robot.includes("robots-site")); }
for (const p of PAGES) {
  const s = lire(p);
  check(`${p} : titre, description, canonical`, /<title>.{20,}<\/title>/.test(s) && /name="description" content=".{50,}"/.test(s) && s.includes('rel="canonical" href="https://code.clicvia.com/'));
  check(`${p} : image d'aperçu og-image-v4.jpg (page vidéo : apercu-video.jpg) et icône`, s.includes('property="og:image" content="https://code.clicvia.com/' + (p === "video/index.html" ? "assets/video/apercu-video.jpg" : "assets/og-image-v4.jpg") + '"') && !s.includes("og-image-v1") && s.includes('rel="icon"'));
  check(`${p} : même version ?v= pour tous les fichiers`, new Set(s.match(/\?v=\d+\w/g)).size === 1);
  check(`${p} : regles.js chargé en premier`, s.indexOf("assets/regles.js") > 0 && s.indexOf("assets/regles.js") < s.indexOf("assets/page.js"));
  const ww = await page(p);
  const pied = texte(ww.document.getElementById("pied"));
  check(`${p} : © et « non officiel » dans le pied de page`, pied.includes("©") && pied.includes("non officiel") && pied.includes("transport.tn"));
  check(`${p} : pied : liens « Confidentialité » et « Conditions d'utilisation » (pages communes de clicvia.com, 17/11/2026)`, lienPied(ww.document, "https://clicvia.com/confidentialite/", "Confidentialité") && lienPied(ww.document, "https://clicvia.com/conditions/", "Conditions d'utilisation"));
}
for (const p of PAGES_AR) {
  const s = lire(p);
  { const wa = await page(p, { lang: "ar" });
    check(`${p} : pied en arabe : liens « الخصوصية » et « شروط الاستعمال » vers les pages arabes de clicvia.com`, wa.document.documentElement.lang === "ar"
      && lienPied(wa.document, "https://clicvia.com/ar/confidentialite/", "الخصوصية") && lienPied(wa.document, "https://clicvia.com/ar/conditions/", "شروط الاستعمال")); }
  check(`${p} : même version ?v= que les autres pages, manifeste, icône iPhone, image d'aperçu`, new Set(s.match(/\?v=\d+\w/g)).size === 1 && s.match(/\?v=(\d+\w)/)[1] === lire("index.html").match(/\?v=(\d+\w)/)[1]
    && s.includes('<link rel="manifest" href="' + "../".repeat(p.split("/").length - 1) + 'manifest.webmanifest">') && s.includes('property="og:image" content="https://code.clicvia.com/assets/og-image-v4.jpg"'));
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
  man.id === "/" && man.start_url === "./" && man.scope === "./" && man.display === "standalone" && !!man.name && !!man.short_name
  && ["192x192", "512x512"].every(t => man.icons?.some(i => i.sizes === t)) && man.icons?.some(i => i.purpose === "maskable")
  && man.icons.every(i => existsSync(join(root, i.src))));
check("toutes les pages : lien vers le manifeste, icône iPhone et theme-color", PAGES.every(p => { const s = lire(p), r = "../".repeat(p.split("/").length - 1);
  return s.includes(`<link rel="manifest" href="${r}manifest.webmanifest">`) && s.includes(`<link rel="apple-touch-icon" href="${r}assets/icone-180.png">`) && s.includes('<meta name="theme-color"'); }));
check(`plan du site : ${PAGES_PUBLIQUES.length} pages publiques + ${PAGES_AR.length} pages arabes (sans relecture/), toutes datées`, (lire("sitemap.xml").match(/<loc>https:\/\/code\.clicvia\.com\//g) || []).length === PAGES_PUBLIQUES.length + PAGES_AR.length && !lire("sitemap.xml").includes("relecture")
  && PAGES_AR.every(p => lire("sitemap.xml").includes(`<loc>https://code.clicvia.com/${p.replace("index.html", "")}</loc>`)) && (lire("sitemap.xml").match(/<lastmod>/g) || []).length === PAGES_PUBLIQUES.length + PAGES_AR.length);
check("robots.txt indique le plan du site", lire("robots.txt").includes("code.clicvia.com/sitemap.xml"));
check("LICENSE tous droits réservés", lire("LICENSE").includes("Tous droits réservés"));
check(".gitignore : node_modules et captures", /node_modules\//.test(lire(".gitignore")) && /captures\//.test(lire(".gitignore")));
const tests = existsSync(join(root, ".github/workflows/tests.yml")) ? lire(".github/workflows/tests.yml") : "";
check("robot tests.yml : lance ce test à chaque push et ouvre une issue si échec", tests.includes("push") && tests.includes("tools/test_site.mjs") && tests.includes("issues: write") && tests.includes("failure()"));
const surv = existsSync(join(root, ".github/workflows/surveillance.yml")) ? lire(".github/workflows/surveillance.yml") : "";
check("robot surveillance.yml : mensuel, groupe de concurrence, issue + commit", /cron:\s*"\d+ \d+ \d+ \* \*"/.test(surv) && surv.includes("concurrency") && surv.includes("issues: write") && surv.includes("git commit"));

await nouvellesRubriques();
await passExamen();
await parcoursCommande();
await rappelPass();
await boutonPartager();
// ---- Affichage : éléments cachés et faux boutons (06/10/2026) ----
check("style : [hidden]{display:none!important} (écrans de l'examen, du Pass, messages : un display:flex/grid ne les fait jamais réapparaître)",
      /\[hidden\]\{display:none!important\}/.test(lire("assets/style.css").replace(/\s+/g, "")));
check("style : plus de règles .confiance / .badge-c (badges supprimés)", !/\.confiance|\.badge-c/.test(lire("assets/style.css")));
// Tuiles « icône + petit texte » qui ont l'air de boutons mais ne mènent nulle part (supprimées le 06/10/2026, demande d'Ahmed)
// (une étiquette en gras dans un encadré qui donne une vraie information, ex. « Coût : 50 DT », n'est pas une tuile)
const tuilesSansLien = doc => [...doc.body.querySelectorAll("*")].filter(el => {
  if (/^(a|button|label|summary|svg|h[1-6]|b|strong|em|small|i|option|select|input|textarea|form|header|footer|nav|main|figure|img|section|article)$/i.test(el.tagName)) return false;
  if (el.closest("a,button,label,summary,header,footer,nav,form,svg,[hidden],template,[role=note]")) return false;   // une note déclarée (role=note) n'est pas une tuile
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
    const adresse = "https://code.clicvia.com/video/?lang=ar";
    check(`${p} : sans navigator.share, « Partager » ouvre wa.me avec la page vidéo + l'adresse du site et compte le clic`, !wx.navigator.share && ouverts.length === 1
      && ouverts[0][0].startsWith("https://wa.me/?text=") && decodeURIComponent(ouverts[0][0].slice(20)).endsWith(" " + adresse)
      && decodeURIComponent(ouverts[0][0]).includes("https://code.clicvia.com/?lang=ar") && ouverts[0][1] === "_blank"
      && comptes.length === 1 && comptes[0].path.startsWith("partage/") && comptes[0].event === true);
  }
}

// 19/11/2026 (Ahmed) : QR code de l'accueil : page française -> QR de https://code.clicvia.com/, page arabe -> QR de /ar/, images
// présentes (SVG affiché, PNG à télécharger), fabriquées par tools/qr_code.py ; le SVG contient bien l'adresse (titre) qu'il code
{ const fr = lire("index.html"), ar = lire("ar/index.html"), q = f => existsSync(join(root, "assets/qr/" + f));
  check("QR code à partager : accueil FR et AR, chacun avec le QR de sa langue (SVG + PNG à télécharger), images présentes",
    /<section class="carte carte-qr" id="qr"/.test(fr) && /assets\/qr\/code-route-fr\.svg/.test(fr) && !/code-route-ar/.test(fr)
    && /assets\/qr\/code-route-ar\.svg/.test(ar) && !/code-route-fr/.test(ar) && /download=/.test(fr) && /download=/.test(ar)
    && ["code-route-fr.svg", "code-route-fr.png", "code-route-ar.svg", "code-route-ar.png"].every(q)
    && lire("assets/qr/code-route-fr.svg").includes("https://code.clicvia.com/<") && lire("assets/qr/code-route-ar.svg").includes("https://code.clicvia.com/ar/<")); }


// 25/11/2026 (PASS.1, module commun du parcours d'achat, règle commune § 70.8) : assets/pass-commun.js = COPIE EXACTE du module de
// projets-ahmed (« outils communs/pass-commun/pass-commun.js », recopié par synchroniser.py) ; assets/pass-reglages.js = ce qui est propre au site
{ const { createHash } = await import("crypto");
  const copie = readFileSync(join(root, "assets/pass-commun.js")), emp = createHash("sha256").update(copie).digest("hex");
  const attendue = existsSync(join(root, "assets/pass-commun.empreinte")) ? lire("assets/pass-commun.empreinte").trim() : "";
  check("module commun du Pass : assets/pass-commun.js NON modifié dans le site (empreinte écrite par synchroniser.py)", emp === attendue);
  // dépôt général à côté (variable PROJETS_AHMED, puis ../projets-ahmed…) ; absent sur GitHub : comparaison sautée
  const PROJ = [process.env.PROJETS_AHMED, join(root, "../projets-ahmed"), join(root, "../../projets-ahmed"), join(root, "../.."), "/home/user/projets-ahmed"]
    .filter(Boolean).find(x => existsSync(join(x, "outils communs/pass-commun/pass-commun.js")));
  if (PROJ) check("module commun du Pass : copie identique au module de projets-ahmed (sinon : python3 synchroniser.py)",
    readFileSync(join(PROJ, "outils communs/pass-commun/pass-commun.js")).equals(copie));
  else console.log("  (comparaison avec le module de projets-ahmed sautée : dépôt absent, normal sur GitHub)");
  const scripts = h => (h.match(/<script src="[^"]*assets\/[^"?]+/g) || []).map(x => x.replace(/^.*assets\//, ""));
  const sp = scripts(lire("pass/index.html")), sa = scripts(lire("ar/pass/index.html"));
  check("module commun du Pass : pass/ et ar/pass/ chargent pass.js, puis pass-commun.js, puis pass-reglages.js (seulement ces pages)",
    [sp, sa].every(x => x.indexOf("pass.js") >= 0 && x.indexOf("pass.js") < x.indexOf("pass-commun.js") && x.indexOf("pass-commun.js") === x.indexOf("pass-reglages.js") - 1)
    && !/pass-commun\.js/.test(lire("index.html") + lire("examen/index.html") + lire("pass/conditions/index.html"))
    && !/brancherFormulairePass|nouveauCodeCommande|envoyerEmail|reprendreCommande/.test(lire("assets/pass.js")));
  const wm = await page("pass/index.html");
  check(`module commun du Pass : branché sur le formulaire (version ${wm.PassCommun && wm.PassCommun.version}), réglage du site « code-route »`,
    !!wm.PassCommun && wm.PassCommun.reglage && wm.PassCommun.reglage.site === "code-route" && wm.document.getElementById("pass-form").getAttribute("data-branche") === "1"); }

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
  const mAm = dd.querySelector("main").cloneNode(true); mAm.querySelectorAll(".encadre-pass").forEach(x => x.remove());   // prix du Pass (25/11/2026) : pas des amendes
  const tAm = texte(mAm);
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
    if (u.protocol !== "https:" || !u.href.startsWith("https://code.clicvia.com/")) return null;
    let chemin = decodeURIComponent(u.pathname).replace(/^\//, "");
    if (chemin === "" || chemin.endsWith("/")) chemin += "index.html";
    return chemin;
  };
  const casses = [], menuMal = [], horsLigneMal = [];
  for (const p of PAGES) {
    for (const lang of ["fr", "ar"]) {
      const wx = await page(p, { lang }), dx = wx.document;
      const menu = [...dx.querySelectorAll("nav.menu a")].map(a => a.getAttribute("href").replace(/^(\.\.\/)+/, ""));
      if (menu.join() !== "lecons/,panneaux/,entrainement/,examen/,https://auto-ecoles.clicvia.com/,https://voiture.clicvia.com/,amendes/,a-propos/") menuMal.push(p);
      dx.querySelectorAll("a[href]").forEach(a => { const f = versFichier(wx.location.href, a.getAttribute("href")); if (f !== null && !existsSync(join(root, f))) casses.push(`${p} -> ${a.getAttribute("href")}`); });
    }
    const wf = await page(p, { fichier: true }), df = wf.document;
    df.querySelectorAll("a[href]").forEach(a => {
      const h = a.getAttribute("href"); if (/^(https?:|mailto:|#)/.test(h)) return;
      const u = new URL(h, wf.location.href), f = fileURLToPath(u.href.split("?")[0].split("#")[0]);
      if (u.pathname.endsWith("/") || !existsSync(f)) horsLigneMal.push(`${p} -> ${h}`);
    });
  }
  check(`menu présent sur toutes les pages (Leçons, Panneaux, Entraînement, Examen, Auto-écoles [notre annuaire], Ma voiture [notre site], Amendes, À propos) ${menuMal}`, menuMal.length === 0);
  check(`liens internes : chaque lien mène à un fichier existant ${casses.slice(0, 5)}`, casses.length === 0);
  check(`liens internes depuis le PC (file://) : « index.html » ajouté, fichier existant ${horsLigneMal.slice(0, 5)}`, horsLigneMal.length === 0);

  // -- « Mes erreurs »
  ww = await page("entrainement/index.html", { query: "&erreurs=1", stockage: { q: { "T2-001": 0, "T3-001": 0, "T4-001": 1 }, examens: [] }, pass: true }); dd = ww.document;
  check("« Mes erreurs » : rejoue seulement les questions ratées", ww.fautes.length === 0 && ww.eval("entrainement").liste.length === 2 && ["T2-001", "T3-001"].includes(dd.querySelector("#quiz section").dataset.id) && texte(dd.getElementById("titre-page")) === "Mes erreurs");
  ww = await page("entrainement/index.html", { query: "&erreurs=1", pass: true }); dd = ww.document;
  check("« Mes erreurs » : message clair quand il n'y a rien à revoir", !!dd.getElementById("aucune-erreur"));
  ww = await page("index.html", { stockage: { q: { "T2-001": 0 }, examens: [] } }); dd = ww.document;
  check("accueil : 7 rubriques (entraînement en premier, …, permis, annuaire des auto-écoles) avec le nombre d'erreurs", dd.querySelectorAll("#rubriques .rubrique").length === 7 && dd.querySelector("#rubriques .rubrique:last-child").getAttribute("href").includes("auto-ecoles.clicvia.com") && dd.querySelector("#rubriques .rubrique").getAttribute("href") === "entrainement/" && texte(dd.getElementById("rubriques")).includes("1 question(s) à revoir"));

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
  const IA = ["GPTBot", "ClaudeBot", "Claude-Web", "anthropic-ai", "CCBot", "Google-Extended", "Applebot-Extended", "Bytespider", "Amazonbot", "Meta-ExternalAgent", "FacebookBot", "Diffbot", "Omgilibot", "cohere-ai", "ImagesiftBot", "HTTrack", "WebCopier", "WebZIP", "Offline Explorer", "wget", "SiteSnagger"];
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
    wx.document.querySelectorAll('a[href^="http"]').forEach(a => { if (!/^https:\/\/([a-z-]+\.)?clicvia\.com\//.test(a.href) && !/noopener/.test(a.rel)) malSecu.push(p + " noopener " + a.href.slice(0, 40)); });
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

// ---- 5 ter. PARCOURS COMMUN DU PASS (25/11/2026, règle commune § 70, projets-ahmed/outils communs/pass-commun/CONSIGNES.md) ----
// code de commande créé AU FORMULAIRE (même alphabet et même longueur que les codes d'accès), « Dernière étape », mémoire « pass-commande »
async function parcoursCommande() {
  const { webcrypto, pbkdf2Sync } = await import("crypto");
  const pause = ms => new Promise(r => setTimeout(r, ms));
  const FORME = /^[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{4}$/;          // 8 caractères sans O/0/I/1 = format du bouton « pass » (dépôt privé)
  const SEL = "sel-de-test", TOURS = 1000;
  const h = c => pbkdf2Sync(c, SEL, TOURS, 32, "sha256").toString("hex");
  const jour = n => { const x = new Date(); x.setDate(x.getDate() + n); return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0"); };
  const brancher = (w, codes = []) => {                 // vraie vérification (PBKDF2 du navigateur) sur une liste factice
    Object.defineProperty(w, "crypto", { value: webcrypto, configurable: true });
    w.fetch = (u, o) => { if (/api-email\.clicvia\.com/.test(u)) { w.emails.push([u, o]); return Promise.resolve({ ok: true, status: 200 }); }
      if (o && o.method === "POST") { w.envois.push(Object.fromEntries(o.body.entries())); return Promise.resolve({ ok: true, status: 200 }); }
      return Promise.resolve({ ok: true, status: 200, json: async () => ({ sel: SEL, tours: TOURS, codes: codes.map(c => ({ h: h(c), fin: "2099-12-31" })) }) }); };
    w.envois = []; w.emails = [];
  };
  const remplir = (w, { nom = "Test Candidat", tel = "98765432", email = "candidat.test@gmail.com", conditions = true } = {}) => {
    const f = w.document.getElementById("pass-form");
    f.querySelector("[name=nom]").value = nom; f.querySelector("[name=telephone]").value = tel; f.querySelector("[name=email]").value = email;
    [...f.querySelectorAll("input[name=formule]")].find(r => r.value.startsWith("30")).checked = true;
    f.querySelector("[name=conditions]").checked = conditions;
    return f;
  };
  const envoyer = async (w, f) => { f.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true })); await pause(40); };
  const tousLs = w => Object.keys(w.localStorage).map(k => w.localStorage.getItem(k)).join(" ");

  // -- formulaire : 5 champs obligatoires (FR + AR), rien n'est envoyé s'il en manque un
  for (const lang of ["fr", "ar"]) {
    const src = lire(lang === "fr" ? "pass/index.html" : "ar/pass/index.html");
    check(`commande (${lang}) : 5 champs obligatoires dans la page (nom, téléphone, e-mail, formule, conditions)`,
      /id="pass-nom" name="nom" required/.test(src) && /id="pass-tel" name="telephone" required/.test(src) && /name="email" required/.test(src) &&
      (src.match(/type="radio" name="formule"/g) || []).length === 3 && /name="conditions" value="oui" required/.test(src));
  }
  let w = await page("pass/index.html"), d = w.document; brancher(w);
  for (const [manque, opts] of [["nom", { nom: "" }], ["téléphone", { tel: "" }], ["e-mail", { email: "" }], ["conditions", { conditions: false }]]) {
    await envoyer(w, remplir(w, opts));
    check(`commande : sans ${manque}, rien n'est envoyé ni gardé, pas de code`, w.envois.length === 0 && w.emails.length === 0 && !w.localStorage.getItem("pass-commande") && d.getElementById("apres-pass").hidden);
  }
  { const f = remplir(w); f.querySelectorAll("input[name=formule]").forEach(r => { r.checked = false; }); await envoyer(w, f);
    check("commande : sans formule, rien n'est envoyé", w.envois.length === 0 && /formule/.test(texte(d.getElementById("pass-status")))); }

  // -- envoi : code créé au formulaire, affiché en gros, motif = code, WhatsApp avec le code, Formspree, mémoire du téléphone
  { let n = 0, ne = 0; const cs = []; w.fetch = (u, o) => { if (/api-email\.clicvia\.com/.test(u)) ne++; else { n++; cs.push(o.body.get("code")); } return Promise.reject(new Error("réseau")); };
    const f = remplir(w); await envoyer(w, f); await envoyer(w, f);
    check("commande : échec du réseau -> formulaire gardé, même code au 2e essai, rien gardé dans le téléphone, e-mail automatique demandé UNE fois par commande (module commun)",
      n === 2 && ne === 1 && FORME.test(cs[0] || "") && cs[1] === cs[0] && !f.hidden && !w.localStorage.getItem("pass-commande"));
    w = await page("pass/index.html"); d = w.document; brancher(w); }   // nouvelle visite : nouvelle commande (son e-mail sera demandé)
  await envoyer(w, remplir(w));
  const env = w.envois[0] || {}, code = env.code || "";
  check("commande : code au bon format (8 caractères sans O/0/I/1, ex. ABCD-EF23 : le format que le bouton « pass » accepte)", FORME.test(code));
  check("commande : code et ligne « pour_activer … ; code: <CODE> » envoyés à Formspree (objet de l'e-mail avec le code)",
    w.envois.length === 1 && String(env.pour_activer).endsWith(" ; code: " + code) && String(env._subject).includes(code));
  const apres = d.getElementById("apres-pass"), gros = d.getElementById("cmd-code");
  const visibleEl = el => { for (let e = el; e; e = e.parentElement) if (e.hidden || w.getComputedStyle(e).display === "none") return false; return !!el; };
  check("e-mail automatique EN SERVICE (25/11/2026, A.17) : « Vous le recevez aussi par e-mail » AFFICHÉ (EMAIL_AUTO = true)",
    /emailAuto: true,/.test(lire("assets/pass-reglages.js")) && !!d.querySelector(".cmd-email") && visibleEl(d.querySelector(".cmd-email")));
  { const e = w.emails[0], j = e ? JSON.parse(e[1].body) : {};
    check("e-mail automatique (FR) : UNE demande à https://api-email.clicvia.com/inscription (POST, JSON) avec site code-route, langue fr, nom, e-mail, CE code (ABCD-EF23), formule exacte",
      w.emails.length === 1 && e[0] === "https://api-email.clicvia.com/inscription" && e[1].method === "POST" && /application\/json/.test(e[1].headers["Content-Type"])
      && j.site === "code-route" && j.langue === "fr" && j.nom === "Test Candidat" && j.email === "candidat.test@gmail.com" && j.code === code && j.formule === "30 jours - 19 DT" && !("piege" in j));
    const v = await verifierWorker(j, "https://code.clicvia.com");
    if (v) check("e-mail automatique (FR) : le JSON envoyé est ACCEPTÉ par le vrai verifier() du service (worker.js + sites.json de projets-ahmed)", !!v.d && !v.erreur && v.d.langue === "fr" && v.d.prix === 19);
    else console.log("(sauté) verifier() du service : projets-ahmed absent (normal sur GitHub)"); }
  check("CSP des pages pass/ (FR + AR) : connect-src autorise https://api-email.clicvia.com (sinon le navigateur bloque l'e-mail automatique)",
    /connect-src[^;]*https:\/\/api-email\.clicvia\.com/.test(lire("pass/index.html")) && /connect-src[^;]*https:\/\/api-email\.clicvia\.com/.test(lire("ar/pass/index.html")));
  check("Dernière étape : code en GROS (dir=ltr) + « C'est votre numéro de commande : écrivez-le dans le motif du paiement, il nous sert à reconnaître votre paiement. » + « Vous le recevez aussi par e-mail. »",
    !apres.hidden && d.getElementById("pass-form").hidden && texte(gros) === code && gros.getAttribute("dir") === "ltr" && gros.parentElement.contains(d.querySelector(".cmd-explique")) &&
    texte(d.querySelector(".cmd-explique")).includes("C'est votre numéro de commande : écrivez-le dans le motif du paiement, il nous sert à reconnaître votre paiement.") &&
    d.querySelector(".cmd-explique .cmd-email").textContent.includes("Vous le recevez aussi par e-mail."));
  const etapes = apres.querySelectorAll(".paie-etapes > li");
  check("Dernière étape : paiement en 3 étapes (D17 / IZI, écrans d'exemple, 24 321 390), motif = le code",
    etapes.length === 3 && !!apres.querySelector('img[src$="d17.png"]') && !!apres.querySelector('img[src$="izi.png"]') && !!apres.querySelector('img[src$="transfert-d17.svg"]') &&
    texte(etapes[1]).includes("24 321 390") && texte(etapes[2]).startsWith("Motif : " + code));
  const lien = d.getElementById("pass-preuve-apres");
  check("Dernière étape : bouton vert WhatsApp pré-rempli « Voici ma preuve de paiement — Code de la route Tunisie — code <CODE> — <nom> — <formule> » (code ET nom, 25/11/2026)",
    !!lien && lien.classList.contains("btn-wa") && decodeURIComponent(lien.href) === "https://wa.me/21624321390?text=Voici ma preuve de paiement — Code de la route Tunisie — code " + code + " — Test Candidat — 30 jours - 19 DT");
  check("Dernière étape : ce qui se passe ensuite + filet « Vous avez oublié le code dans le motif ? Ce n'est pas grave… »",
    /Ensuite : dès que votre paiement est vérifié/.test(texte(apres)) && texte(apres).includes("Vous avez oublié le code dans le motif ? Ce n'est pas grave : envoyez quand même la preuve sur WhatsApp, nous retrouvons votre demande.") && !!d.getElementById("nouvelle-commande"));
  let memo = {}; try { memo = JSON.parse(w.localStorage.getItem("pass-commande")); } catch (e) {}
  check("mémoire « pass-commande » = {code, formule, date} seulement", Object.keys(memo || {}).join() === "code,formule,date" && memo.code === code.replace("-", "") && memo.formule === "30 jours - 19 DT" && memo.date === jour(0));
  check("aucune donnée personnelle dans la mémoire du téléphone (ni nom, ni téléphone, ni e-mail)", !/Test Candidat|98765432|candidat\.test/.test(tousLs(w)));
  { const R = w.PassCommun.reglage.code, codes = new Set(Array.from({ length: 300 }, () => w.PassCommun.nouveauCode(R.alphabet, R.longueur)));
    check("codes créés par la page : toujours 8 caractères de l'alphabet du dépôt privé (300 essais, tous différents), crypto.getRandomValues",
      codes.size === 300 && [...codes].every(c => FORME.test(R.affiche(c))) && /crypto\.getRandomValues/.test(lire("assets/pass-commun.js"))
      && /alphabet: "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"/.test(lire("assets/pass.js")) && /longueur: 8,/.test(lire("assets/pass.js"))
      && /code: \{ alphabet: PASS\.alphabet, longueur: PASS\.longueur,/.test(lire("assets/pass-reglages.js"))); }
  { const wg = await page("pass/index.html"); brancher(wg); const f = remplir(wg); f.querySelector("[name=_gotcha]").value = "robot"; await envoyer(wg, f);
    check("piège rempli (robot) : rien envoyé (ni Formspree ni e-mail automatique), rien gardé", wg.envois.length === 0 && wg.emails.length === 0 && !wg.localStorage.getItem("pass-commande")); }

  // -- retour sur la page : bandeau « commande en attente », code essayé tout seul
  const C = code.replace("-", ""), cmd = { "pass-commande": { code: C, formule: "30 jours - 19 DT", date: jour(-3) } };
  w = await page("pass/index.html", { ls: cmd, avant: x => brancher(x) }); d = w.document; await pause(80);
  const zone = d.getElementById("commande-attente");
  check("retour : bandeau « Votre commande en attente : code <CODE> — <formule> » EN HAUT (avant « J'ai un code »), 3 étapes + WhatsApp avec le code",
    !!zone && (zone.compareDocumentPosition(d.getElementById("code-acces")) & 4) && texte(d.getElementById("cmd-attente")) === "Votre commande en attente : code " + code + " — 30 jours - 19 DT" &&
    zone.querySelectorAll(".paie-etapes > li").length === 3 && decodeURIComponent(zone.querySelector("#pass-preuve-apres").href) === "https://wa.me/21624321390?text=Voici ma preuve de paiement — Code de la route Tunisie — code " + code + " — 30 jours - 19 DT" && d.getElementById("pass-form").hidden);
  check("retour : code pas encore activé -> « En attente de votre paiement », commande gardée, Pass fermé",
    texte(d.getElementById("cmd-etat")).startsWith("En attente de votre paiement") && !!w.localStorage.getItem("pass-commande") && !w.passActif());
  clic(w, d.getElementById("nouvelle-commande"));
  check("bouton « Nouvelle commande » : commande effacée, formulaire de retour", !w.localStorage.getItem("pass-commande") && !d.getElementById("commande-attente") && !d.getElementById("pass-form").hidden && d.getElementById("apres-pass").hidden);
  w = await page("pass/index.html", { ls: cmd, avant: x => brancher(x, [C]) }); d = w.document; await pause(80);
  check("retour : code ACTIVÉ par Ahmed -> Pass ouvert tout seul (même vérification que « J'ai un code »), clé « pass-commande » effacée",
    w.passActif() && JSON.parse(w.localStorage.getItem("crt-pass-v1")).code === C && !w.localStorage.getItem("pass-commande") && !d.getElementById("commande-attente")
    && texte(d.getElementById("code-status")).includes("Votre paiement est validé"));
  w = await page("pass/index.html", { ls: { "pass-commande": { code: C, formule: "30 jours - 19 DT", date: jour(-61) } } }); d = w.document;
  check("commande gardée 60 jours au plus (plus vieille : effacée, pas de bandeau)", !w.localStorage.getItem("pass-commande") && !d.getElementById("commande-attente"));
  w = await page("pass/index.html", { ls: { "pass-commande": "{abîmé" } }); d = w.document;
  check("mémoire abîmée : pas de plantage, effacée", w.fautes.length === 0 && !w.localStorage.getItem("pass-commande") && !d.getElementById("commande-attente"));

  // -- 25/11/2026 : e-mail automatique EN SERVICE -> l'étiquette promet « vous y recevez votre code… » (FR + AR), erreur longue
  for (const lang of ["fr", "ar"]) {
    const wl = await page("pass/index.html", { lang }); brancher(wl); const dl = wl.document, lab = dl.querySelector('label[for="pass-email"]'), cache = lab && lab.querySelector(".email-auto");
    const court = lab ? texte(lab.querySelector(`:scope > [data-l="${lang}"]`)) : "";
    await envoyer(wl, remplir(wl, { email: "" }));
    check(`formulaire (${lang}) : étiquette « ${lang === "fr" ? "E-mail" : "البريد الإلكتروني"} » + promesse « ${lang === "fr" ? "vous y recevez votre code et les étapes du paiement" : "يصلك عليه رمزك وخطوات الدفع"} » AFFICHÉE (EMAIL_AUTO = true) ; sans e-mail : erreur longue, rien envoyé`,
      court === (lang === "fr" ? "E-mail" : "البريد الإلكتروني") && !!cache && visibleEl(cache)
      && cache.textContent.includes(lang === "fr" ? "vous y recevez votre code et les étapes du paiement" : "يصلك عليه رمزك وخطوات الدفع")
      && texte(dl.getElementById("pass-status")) === (lang === "fr" ? "Indiquez votre e-mail : vous y recevez votre code et les étapes du paiement." : "اكتب بريدك الإلكتروني: يصلك عليه رمزك وخطوات الدفع.") && wl.envois.length === 0 && wl.emails.length === 0);
  }

  // -- en arabe
  w = await page("pass/index.html", { lang: "ar" }); d = w.document; brancher(w);
  await envoyer(w, remplir(w));
  const ca = (w.envois[0] || {}).code || "", ap = d.getElementById("apres-pass");
  check("arabe : Dernière étape (code en gros, « هذا رقم طلبك: اكتبه في خانة سبب الدفع، يساعدنا على التعرّف على دفعتك. » ; « يصلك أيضًا عبر البريد الإلكتروني. » affiché)",
    FORME.test(ca) && texte(d.getElementById("cmd-code")) === ca && texte(ap).includes("هذا رقم طلبك: اكتبه في خانة سبب الدفع، يساعدنا على التعرّف على دفعتك.") &&
    d.querySelector(".cmd-email").textContent.includes("يصلك أيضًا عبر البريد الإلكتروني.") && visibleEl(d.querySelector(".cmd-email")));
  { const j = w.emails[0] ? JSON.parse(w.emails[0][1].body) : {};
    check("e-mail automatique (AR) : UNE demande au service en langue ar, avec CE code, le nom, l'e-mail et la formule « 30 jours - 19 DT » (valeur du formulaire)",
      w.emails.length === 1 && j.site === "code-route" && j.langue === "ar" && j.code === ca && j.nom === "Test Candidat" && j.email === "candidat.test@gmail.com" && j.formule === "30 jours - 19 DT");
    const v = await verifierWorker(j, "https://code.clicvia.com");
    if (v) check("e-mail automatique (AR) : le JSON envoyé est ACCEPTÉ par le vrai verifier() du service, en arabe", !!v.d && !v.erreur && v.d.langue === "ar"); }
  check("arabe : motif = le code, numéro 24321390 sans espaces, filet « نسيت الرمز في سبب الدفع؟ لا بأس: أرسل الوصل على واتساب وسنجد طلبك. »",
    texte(ap.querySelectorAll(".paie-etapes > li")[2]).includes(ca) && texte(ap.querySelectorAll(".paie-etapes > li")[1]).includes("24321390") && !texte(ap).includes("24 321 390") &&
    texte(ap).includes("نسيت الرمز في سبب الدفع؟ لا بأس: أرسل الوصل على واتساب وسنجد طلبك."));
  check("arabe : WhatsApp « هذا وصل الدفع — قانون الطرقات تونس — الرمز <CODE> — <الاسم> — <formule> » (code ET nom)",
    decodeURIComponent(d.getElementById("pass-preuve-apres").href) === "https://wa.me/21624321390?text=هذا وصل الدفع — قانون الطرقات تونس — الرمز " + ca + " — Test Candidat — 30 يومًا - 19 د");
  w = await page("pass/index.html", { lang: "ar", ls: cmd, avant: x => brancher(x) }); d = w.document; await pause(80);
  check("arabe : retour = bandeau « طلبك في الانتظار: الرمز <CODE> » + « في انتظار دفعتك »", texte(d.getElementById("cmd-attente")).startsWith("طلبك في الانتظار: الرمز " + code) && texte(d.getElementById("cmd-etat")).startsWith("في انتظار دفعتك"));

  // -- plus jamais « motif : nom et téléphone » (pages FR + AR, scripts) ; étape 1 = nom, téléphone WhatsApp et e-mail
  { const mal = [], MOTS = /nom et (votre )?téléphone|votre nom et votre téléphone|اسمك ورقم هاتفك|اسم المشتري ورقم هاتفه|Nom et t%C3%A9l%C3%A9phone/i;
    for (const p of PAGES) for (const f of [p, "ar/" + p]) if (existsSync(join(root, f)) && MOTS.test(lire(f))) mal.push(f);
    for (const f of ["assets/pass.js", "assets/pages.js", "llms.txt"]) if (existsSync(join(root, f)) && MOTS.test(lire(f).replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, ""))) mal.push(f);
    check(`plus aucun « motif : nom et téléphone » (pages FR + AR, scripts) ${mal}`, mal.length === 0);
    const ccm = (await page("pass/index.html")).document.querySelector(".etapes"), cca = (await page("pass/index.html", { lang: "ar" })).document.querySelector(".etapes");
    check("« Comment ça marche ? » : étape 1 = nom, téléphone WhatsApp et e-mail ; numéro de commande = motif (FR + AR)",
      texte(ccm.children[0]).includes("nom, téléphone WhatsApp et e-mail") && /motif du paiement/.test(texte(ccm.children[1])) &&
      texte(cca.children[0]).includes("الاسم وهاتف واتساب والبريد الإلكتروني") && /سبب الدفع/.test(texte(cca.children[1])));
    const cond = texte((await page("pass/conditions/index.html")).document.querySelector(".conditions")), conda = texte((await page("pass/conditions/index.html", { lang: "ar" })).document.querySelector(".conditions"));
    const apa = texte((await page("a-propos/index.html", { lang: "ar" })).document.body);
    check("« Comment fonctionne le site ? » en arabe : رقم طلب = سبب الدفع, essayé tout seul", /رقم طلب[\s\S]*سبب الدفع[\s\S]*يجرّب هذا الرمز وحده/.test(apa));
    check("conditions (FR + AR) : motif = numéro de commande, il devient le code d'accès, motif oublié = preuve WhatsApp suffit",
      cond.includes("avec pour motif ce numéro de commande") && cond.includes("devient le code d'accès") && cond.includes("Motif oublié") && conda.includes("رقم الطلب هذا في خانة سبب الدفع")); }
}

// ---- 5 bis. Rappel de fin du Pass (20/10/2026, demande d'Ahmed) : merci + date de fin + Renouveler + Donner mon avis ----
async function rappelPass() {
  const jour = n => { const x = new Date(); x.setDate(x.getDate() + n); return x.getFullYear() + "-" + String(x.getMonth() + 1).padStart(2, "0") + "-" + String(x.getDate()).padStart(2, "0"); };
  const lisible = iso => iso.split("-").reverse().join("/");
  const code = (fin, extra = {}) => ({ "crt-pass-v1": { code: "ABCDEF23", fin, verifie: jour(0), ...extra } });
  const pause = ms => new Promise(r => setTimeout(r, ms));
  const voir = async (chemin, ls, opt = {}) => { const wx = await page(chemin, { ls, ...opt }); await pause(30); return wx; };
  let wx = await voir("index.html", code(jour(7))), b = wx.document.getElementById("rappel-pass");
  check("rappel du Pass : bandeau affiché à J-7 (merci, « se termine le JJ/MM/AAAA »)", !!b && wx.fautes.length === 0 &&
    texte(b).includes("Merci pour votre inscription") && texte(b).includes("se termine le " + lisible(jour(7))));
  const ren = b && b.querySelector("a.rappel-renouveler"), av = b && b.querySelector("a.rappel-avis"), x = b && b.querySelector("button.rappel-fermer");
  check("rappel du Pass : vrai bouton « Renouveler mon Pass » vers pass/#offre, lien « Donner mon avis » vers le formulaire #avis, croix",
    !!ren && ren.getAttribute("href") === "pass/#offre" && texte(ren) === "Renouveler mon Pass" && !!av && av.getAttribute("href") === "#avis" &&
    !!wx.document.getElementById("avis") && !!x && x.getAttribute("type") === "button" && !!wx.document.getElementById("offre") === false);
  x.dispatchEvent(new wx.MouseEvent("click", { bubbles: true }));
  check("rappel du Pass : la croix ferme le bandeau", !wx.document.getElementById("rappel-pass"));
  const memo = JSON.parse(wx.localStorage.getItem("crt-pass-rappel-v1") || "{}");
  wx = await voir("index.html", { ...code(jour(7)), "crt-pass-rappel-v1": memo });
  check("rappel du Pass : une fois par jour au plus (pas de 2e bandeau le même jour)", memo.vu === jour(0) && !wx.document.getElementById("rappel-pass"));
  wx = await voir("index.html", { ...code(jour(6)), "crt-pass-rappel-v1": { ...memo, fin: jour(6), vu: jour(-1) } });
  check("rappel du Pass : de nouveau affiché le lendemain", !!wx.document.getElementById("rappel-pass"));
  wx = await voir("index.html", code(jour(20)));
  check("rappel du Pass : rien à J-20", !wx.document.getElementById("rappel-pass") && wx.fautes.length === 0);
  wx = await voir("index.html", code(jour(3), { depuis: jour(-3) }));
  check("rappel du Pass : Pass de 7 jours (début connu) -> rien à J-3 (dernier quart seulement)", !wx.document.getElementById("rappel-pass"));
  wx = await voir("index.html", code(jour(1), { depuis: jour(-5) }));
  check("rappel du Pass : Pass de 7 jours -> bandeau à J-1", !!wx.document.getElementById("rappel-pass"));
  wx = await voir("index.html", { "crt-essai-v1": { debut: jour(-1) } });
  check("rappel du Pass : un ancien essai encore en cours ne déclenche aucun bandeau (seuls les codes payés comptent)", !wx.document.getElementById("rappel-pass"));
  wx = await voir("index.html", { "crt-essai-v1": { debut: jour(-3) } });
  check("rappel du Pass : un ancien essai fini ne déclenche aucun message", !wx.document.getElementById("rappel-pass"));
  check("rappel du Pass : ne parle jamais d'essai", !/essai|تجرب/i.test((lire("assets/pass.js").match(/function afficherRappel[\s\S]*?\n}\n/) || ["essai"])[0]));
  wx = await voir("lecons/index.html", code(jour(2)));
  b = wx.document.getElementById("rappel-pass");
  check("rappel du Pass : liens justes depuis une sous-page (../pass/#offre, ../#avis)", !!b && b.querySelector("a.rappel-renouveler").getAttribute("href") === "../pass/#offre" && b.querySelector("a.rappel-avis").getAttribute("href") === "../#avis");
  wx = await voir("index.html", code(jour(-1)));
  b = wx.document.getElementById("rappel-pass");
  check("rappel du Pass : après la fin, message « Votre Pass Examen est terminé — merci ! » avec Renouveler et Donner mon avis",
    !!b && texte(b).includes("est terminé — merci") && !!b.querySelector("a.rappel-renouveler") && !!b.querySelector("a.rappel-avis") && wx.fautes.length === 0);
  const memo2 = JSON.parse(wx.localStorage.getItem("crt-pass-rappel-v1") || "{}");
  wx = await voir("index.html", { "crt-pass-rappel-v1": memo2 });
  check("rappel du Pass : message de fin montré une seule fois", memo2.finVu === true && !wx.document.getElementById("rappel-pass"));
  wx = await voir("index.html", code(jour(5)), { lang: "ar" });
  b = wx.document.getElementById("rappel-pass");
  check("rappel du Pass : en arabe (شكرًا على اشتراكك، جدّد باقتي)", !!b && texte(b).includes("شكرًا على اشتراكك") && texte(b).includes("جدّد باقتي"));
  wx = await voir("index.html", { "crt-pass-v1": "{abîmé", "crt-pass-rappel-v1": "{abîmé" });
  check("rappel du Pass : stockage abîmé = pas de plantage, pas de bandeau", wx.fautes.length === 0 && !wx.document.getElementById("rappel-pass"));
  check("rappel du Pass : aucun gestionnaire en ligne (écouteur dans pass.js)", !/onclick|on[a-z]+=/.test((lire("assets/pass.js").match(/function afficherRappel[\s\S]*?\n}\n/) || [""])[0]));
}

// ---- 5. Pass Examen (06/10/2026) : page, prix, paiement, conditions, code d'accès, 1 examen gratuit/jour, chrono, séries ----
async function passExamen() {
  const { webcrypto, pbkdf2Sync } = await import("crypto");
  const pause = ms => new Promise(r => setTimeout(r, ms));
  // -- dépôt public : aucune donnée personnelle, seulement l'empreinte et la date de fin
  let pj = {}; try { pj = JSON.parse(lire("donnees/pass.json")); } catch (e) {}
  const clesOk = Object.keys(pj).every(k => ["_lisez_moi", "maj", "sel", "tours", "codes"].includes(k));
  check("donnees/pass.json : seulement sel, tours, date et liste {empreinte, fin} (aucun nom, aucun téléphone)",
    clesOk && typeof pj.sel === "string" && pj.sel.length >= 16 && pj.tours >= 150000 && Array.isArray(pj.codes) &&
    pj.codes.every(c => Object.keys(c).join() === "h,fin" && /^[0-9a-f]{64}$/.test(c.h) && /^\d{4}-\d{2}-\d{2}$/.test(c.fin)) &&
    !/\b[2-9]\d{7}\b|\b[2-9]\d \d{3} \d{3}\b|nom|telephone|téléphone/i.test(JSON.stringify(pj.codes)));
  check("dépôt public : aucun fichier de clients (clients.json, abonnes.json) ni dossier pass (prive)",
    !["clients.json", "donnees/clients.json", "abonnes.json", "pass (prive)"].some(f => existsSync(join(root, f))));

  // -- page pass/ : prix et avantages directs, paiement, formulaire, conditions
  let w = await page("pass/index.html"), d = w.document;
  const t = texte(d.getElementById("offre"));
  check("pass/ : aucune erreur JavaScript", w.fautes.length === 0);
  check("pass/ : prix 9 DT / 7 jours, 19 DT / 30 jours, 29 DT / 90 jours visibles tout de suite", ["9 DT", "19 DT", "29 DT", "7 jours", "30 jours", "90 jours"].every(m => texte(d.getElementById("tarifs")).includes(m)));
  check("pass/ : examens illimités, statistiques, erreurs, pas de renouvellement automatique",
    ["Examens blancs illimités", "Statistiques par thème", "Révision de vos erreurs", "Pas de renouvellement automatique"].every(m => t.includes(m)));
  check("pass/ : aucun prix « TTC » ni nom de société", !/TTC|SUARL|S\.U\.A\.R\.L/i.test(lire("pass/index.html") + lire("pass/conditions/index.html")));
  const pay = d.getElementById("paiement");
  check("pass/ : bouton « Paiement » (<details>) avec D17 et IZI (liens vers les applications officielles) au 24 321 390, mode d'emploi, plus de Wafacash, motif = numéro de commande (25/11/2026)", !!pay && pay.tagName === "DETAILS" && texte(pay.querySelector("summary")).startsWith("Paiement") &&
    ["D17", "IZI", "Transfert rapide", "24 321 390", "votre numéro de commande"].every(m => texte(pay).includes(m)) && !/Wafacash/i.test(pay.outerHTML) && ["tn.mobipost", "tn.izi.consumer", "id1475640303", "id1603653941"].every(u => pay.querySelector(`a[href*="${u}"]`)));
  check("paiement : logos D17 / IZI dans les boutons, étape 2 pour les deux applications, bouton « ? » avec les deux écrans d'exemple", ["d17.png", "izi.png", "transfert-d17.svg", "transfert-izi.svg"].every(f => existsSync(join(root, "assets/paiement", f))) && /class="appli-btn"[^>]*><img src="\.\.\/assets\/paiement\/d17\.png"/.test(lire("pass/index.html")) && /class="aide-transfert"/.test(lire("pass/index.html")) && /Transfert d’argent/.test(lire("pass/index.html")));
  check("paiement simple et rassurant (règle commune du 08/10/2026) : 3 étapes numérotées, phrase de confiance, description de l'offre cachée quand « Paiement » est ouvert", /<ol class="paie-etapes">/.test(lire("pass/index.html")) && /class="paie-confiance"/.test(lire("pass/index.html")) && /class="avantages[^"]*masque-si-paiement/.test(lire("pass/index.html")) && lire("assets/style.css").includes(":has(> details.paiement[open]) > .masque-si-paiement{display:none}"));
  const wa = d.getElementById("pass-preuve");
  check("pass/ : bouton vert « Envoyer la preuve de paiement par WhatsApp » vers wa.me/21624321390, texte prérempli", !!wa && wa.classList.contains("btn-wa") &&
    wa.href.startsWith("https://wa.me/21624321390?text=") && decodeURIComponent(wa.href).includes("Pass Examen") && texte(wa).includes("Envoyer la preuve de paiement par WhatsApp"));
  const form = d.getElementById("pass-form");
  check("pass/ : formulaire Formspree mwlpakqj (nom, téléphone, 3 formules payantes, case conditions, piège)", form.getAttribute("action") === "https://formspree.io/f/mwlpakqj" &&
    !!form.querySelector("[name=nom]") && !!form.querySelector("[name=telephone]") && form.querySelectorAll("input[name=formule]").length === 3 &&
    !!form.querySelector("input[name=conditions][type=checkbox]") && !!form.querySelector("input[name=_gotcha]") && !!form.querySelector('a[href="conditions/"]'));
  const appels = []; w.fetch = (u, o) => { if (!/api-email\.clicvia\.com/.test(u)) appels.push({ u, o }); return Promise.resolve({ ok: true, status: 200 }); };
  form.querySelector("[name=nom]").value = "Test Candidat"; form.querySelector("[name=telephone]").value = "12";
  form.querySelector("[name=conditions]").checked = true;
  form.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true })); await pause(20);
  check("pass/ : téléphone faux refusé, rien envoyé", appels.length === 0 && d.getElementById("pass-status").className === "err");
  form.querySelector("[name=telephone]").value = "+216 98 765 432";
  // 24/11/2026 (règle d'Ahmed) : e-mail OBLIGATOIRE (le code et les étapes du paiement y seront envoyés)
  { const em = form.querySelector('input[name="email"]');
    check("pass/ : champ e-mail obligatoire (type email, required, juste après le téléphone) en français et en arabe",
      !!em && em.type === "email" && em.required && em.id === "pass-email" && form.querySelector("[name=telephone]").nextElementSibling === d.querySelector('label[for="pass-email"]') &&
      /<input id="pass-email" type="email" name="email" required/.test(lire("ar/pass/index.html")) && /<input id="pass-email" type="email" name="email" required/.test(lire("pass/index.html")));
    em.value = "";
    form.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true })); await pause(20);
    check("pass/ : sans e-mail -> message « Indiquez votre e-mail », rien envoyé", appels.length === 0 && d.getElementById("pass-status").className === "err" && texte(d.getElementById("pass-status")).includes("Indiquez votre e-mail"));
    em.value = "pas-un-email@x";
    form.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true })); await pause(20);
    check("pass/ : e-mail invalide refusé, rien envoyé", appels.length === 0 && d.getElementById("pass-status").className === "err" && texte(d.getElementById("pass-status")).includes("E-mail invalide"));
    em.value = "candidat.test@gmail.com"; }
  [...form.querySelectorAll("input[name=formule]")].find(r => r.value.startsWith("30")).checked = true;
  form.dispatchEvent(new w.Event("submit", { bubbles: true, cancelable: true })); await pause(30);
  const envoi = appels[0] ? Object.fromEntries(appels[0].o.body.entries()) : {};
  check("pass/ : envoi Formspree (nom, téléphone 8 chiffres, e-mail, formule, ligne « pour_activer » avec le code)", appels.length === 1 && appels[0].u === "https://formspree.io/f/mwlpakqj" &&
    envoi.nom === "Test Candidat" && envoi.telephone === "98765432" && envoi.formule === "30 jours - 19 DT" && envoi.email === "candidat.test@gmail.com" && String(envoi.pour_activer).includes("action: paye") && String(envoi.pour_activer).includes("jours: 30")
    && String(envoi.pour_activer).endsWith(" ; code: " + envoi.code));
  check("pass/ : après l'envoi, « Dernière étape » à la place du formulaire", form.hidden && !d.getElementById("apres-pass").hidden && texte(d.getElementById("cmd-titre")).includes("Dernière étape"));
  // 20/10/2026 (décision d'Ahmed : « Enlève tous les essais gratuits ») : plus de bouton d'essai ; un essai déjà commencé va jusqu'à sa fin
  w = await page("pass/index.html"); d = w.document;
  check("pass/ : plus aucun essai à commencer (ni bouton, ni section, ni lien), le bouton doré mène au formulaire",
    !d.getElementById("essai-go") && !d.getElementById("essai-immediat") && !d.querySelector('a[href="#essai-immediat"]') && !!d.querySelector('#offre a.btn-pro[href="#inscription"]')
    && ![...d.querySelectorAll("input[name=formule]")].some(r => /essai/.test(r.value)) && typeof w.commencerEssai === "undefined" && !w.passActif());
  { const wa = await page("index.html", { ls: { "crt-essai-v1": { debut: w.aujourdhui() } } }), wb = await page("index.html", { ls: { "crt-essai-v1": { debut: "2000-01-01" } } });
    check("ancien essai déjà commencé sur un téléphone : il va jusqu'à sa fin (rien n'est coupé), puis s'arrête", wa.passActif() && wa.essaiActif() && !wb.passActif()); }
  { const mots = /essai gratuit|essais gratuits|jours gratuits|يومان مجانًا|التجربة المجانية|تجربة مجانية|تجربتك المجانية|يوميّ المجانيين/i, mal = [];
    for (const p of PAGES) if (mots.test(lire(p))) mal.push(p);
    for (const f of ["manifest.webmanifest", "assets/page.js", "assets/quiz.js"]) if (existsSync(join(root, f)) && mots.test(lire(f))) mal.push(f);
    { const pj = lire("assets/pass.js").replace(/\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, ""); if (mots.test(pj)) mal.push("assets/pass.js"); }
    check(`plus aucune page ne parle d'essai gratuit (titres, descriptions, JSON-LD, textes, boutons ; FR + AR) ${mal}`, mal.length === 0); }
  w = await page("pass/conditions/index.html"); d = w.document;
  const tc = texte(d.querySelector(".conditions"));
  check("conditions : vendeur « l'éditeur du site », prix, pas de renouvellement, aucune période payée remboursée, INPDP",
    ["l'éditeur du site", "9 DT pour 7 jours", "19 DT pour 30 jours", "29 DT pour 90 jours", "Aucun renouvellement automatique", "Aucune période payée n'est remboursée", "INPDP"].every(m => tc.includes(m)));

  // -- bouton doré « Pass Examen » (règle d'Ahmed) : caché tant que l'examen gratuit du jour n'est pas fait ;
  //    dès qu'il est fait : sur TOUTES les pages jusqu'au lendemain ; toujours sur les pages Pass ; avec un Pass actif : partout (coché)
  const mauvais = [], mauvaisApres = [], mauvaisPass = [];
  for (const p of PAGES) {
    const avant = (await page(p)).document.querySelector("#entete a.entete-pass");
    if (!!avant !== /^pass\//.test(p)) mauvais.push(p);
    const wa = await page(p, { examenFait: true }); const apres = wa.document.querySelector("#entete a.entete-pass");
    if (!apres || !new URL(apres.getAttribute("href"), wa.location.href).href.endsWith("/pass/")) mauvaisApres.push(p);
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

  // -- 18/10/2026 (problème vu sur l'immobilier : code payé impossible à taper quand le téléphone gardait un autre code)
  //    la case du code est TOUJOURS visible, EN HAUT de pass/, quel que soit l'état gardé ; le code tapé remplace l'ancien ;
  //    plus d'essai gratuit (20/10/2026)
  {
    const SEL = "sel-de-test", TOURS = 1000, FUTUR = "2099-12-31";
    const h = c => pbkdf2Sync(c, SEL, TOURS, 32, "sha256").toString("hex");
    const LISTE = { sel: SEL, tours: TOURS, codes: [{ h: h("NEWC2345"), fin: FUTUR }] };
    const visible = (wx, el) => { for (let e = el; e; e = e.parentElement) if (e.hidden || wx.getComputedStyle(e).display === "none") return false; return !!el; };
    const ETATS = {
      "aucun code": {},
      "un autre code non payé gardé": { "crt-pass-v1": { code: "ZZZZ2222", fin: FUTUR, verifie: "2000-01-01" } },
      "un code payé gardé": { "crt-pass-v1": PASS_TEST },
      "un code expiré gardé": { "crt-pass-v1": { code: "ABCDEF23", fin: "2000-01-01", verifie: "2000-01-01" } },
      "essai déjà utilisé": { "crt-essai-v1": { debut: "2000-01-01" } }
    };
    const mal = [];
    for (const [nom, ls] of Object.entries(ETATS)) {
      const wx = await page("pass/index.html", { ls }), dx = wx.document, bloc = dx.getElementById("code-acces"), offre = dx.getElementById("offre");
      const champ = bloc && bloc.querySelector("input[name=code]"), bouton = bloc && bloc.querySelector("button[type=submit]");
      if (!visible(wx, champ) || !visible(wx, bouton) || !(bloc.compareDocumentPosition(offre) & 4)) mal.push(nom);
    }
    check(`Pass : case du code visible EN HAUT de pass/ (avant l'offre) dans tous les états ${mal}`, mal.length === 0);
    const wx = await page("pass/index.html", { ls: ETATS["un autre code non payé gardé"] }), dx = wx.document;
    Object.defineProperty(wx, "crypto", { value: webcrypto, configurable: true });
    wx.fetch = () => Promise.resolve({ ok: true, status: 200, json: async () => JSON.parse(JSON.stringify(LISTE)) });
    const cf = dx.getElementById("code-form");
    cf.querySelector("input[name=code]").value = "newc-2345";
    cf.dispatchEvent(new wx.Event("submit", { bubbles: true, cancelable: true })); await pause(300);
    const garde = JSON.parse(wx.localStorage.getItem("crt-pass-v1") || "{}");
    check("Pass : le code tapé REMPLACE l'ancien code gardé (nouveau code, nouvelle date de fin, Pass actif)",
      garde.code === "NEWC2345" && garde.fin === FUTUR && wx.eval("passActif()") && dx.getElementById("code-status").className === "ok");
    check("Pass : plus d'essai gratuit annoncé ni proposé (décision d'Ahmed du 20/10/2026)",
      !/essai gratuit|تجربة مجانية/i.test(lire("pass/index.html") + lire("pass/conditions/index.html")) && !dx.getElementById("essai-go"));
    const sansCode = [];
    let we = await page("entrainement/index.html", { query: "&erreurs=1", stockage: { q: { "T2-001": 0 }, examens: [] } });
    if (!we.document.querySelector('#erreurs-pass a[href="../pass/#code-acces"]')) sansCode.push("Mes erreurs");
    check(`Pass : lien « J'ai déjà un code » sur les écrans payants ${sansCode}`, sansCode.length === 0 && lire("assets/quiz.js").split("htmlLienCode()").length >= 3);
  }

  // -- permis à points : non appliqué en Tunisie (06/10/2026) -> aucune question publiée sur le nombre de points
  const pointsPublies = QUESTIONS.filter(q => /\bpoints?\b/i.test(q.question_fr + " " + q.choix.map(c => c.fr).join(" ")) && !/rainures|4 points mesurés/.test(q.question_fr));
  check(`permis à points (non appliqué) : aucune question publiée sur les points ${pointsPublies.map(q => q.id)}`, pointsPublies.length === 0);
}
