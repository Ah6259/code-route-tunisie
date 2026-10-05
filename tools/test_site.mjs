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
const PAGES = ["index.html", "lecons/index.html", "panneaux/index.html", "entrainement/index.html", "examen/index.html", "amendes/index.html", "permis/index.html", "a-propos/index.html", "relecture/index.html"];
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
async function page(chemin, { lang = "fr", query = "", stockage = null, fichier = false } = {}) {
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
    beforeParse(w) { if (stockage) w.localStorage.setItem("crt-progression-v1", typeof stockage === "string" ? stockage : JSON.stringify(stockage)); }
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
check("accueil : avertissement « relecture par un moniteur »", texte(d.querySelector(".relecture")).includes("relecture par un moniteur"));
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
check("examen : écran d'accueil avec « chiffres à confirmer »", texte(d.getElementById("quiz")).includes("Chiffres à confirmer"));
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
check("examen : seuil avec « chiffres à confirmer »", texte(d.getElementById("quiz")).includes("chiffres à confirmer"));
check("examen : revue des 5 erreurs, avec explication et source", d.querySelectorAll("#erreurs .erreur").length === 5 &&
  [...d.querySelectorAll("#erreurs .erreur")].every(e => e.querySelector(".explication") && texte(e.querySelector(".source")).startsWith("Source :")));
check("examen : bonne réponse montrée en vert dans la revue", d.querySelectorAll("#erreurs .choix-q.bonne").length >= 5);
check("examen : résultat par thème (10 lignes)", d.querySelectorAll("#par-theme tr").length === 10);
check("examen : score gardé dans le navigateur", JSON.parse(w.localStorage.getItem("crt-progression-v1")).examens.at(-1).score === 25);
check("examen : lien WhatsApp de partage du score", d.getElementById("partage").href.startsWith("https://wa.me/?text=") && decodeURIComponent(d.getElementById("partage").href).includes("25/30"));
clic(w, d.querySelector(".langue"));
check("examen : changement de langue garde le résultat (affiché en arabe)", d.documentElement.lang === "ar" && texte(d.getElementById("score")) === "25 / 30" && AR.test(texte(d.getElementById("statut"))));
clic(w, d.getElementById("nouvel"));
for (let i = 0; i < 30; i++) {
  const q = ex.questions[i];
  (i < 23 ? q.bonnes : mauvaise(q)).forEach(n => clic(w, d.querySelector(`.choix-q[data-i="${n}"]`)));
  clic(w, d.getElementById("valider"));
}
check("examen : 23 justes -> 23/30 et échec affiché", texte(d.getElementById("score")) === "23 / 30" && d.querySelector(".score.echoue") !== null);
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
check("examen : photo dans le bandeau et son crédit (auteur, licence, Wikimedia)", d.querySelector(".hero img.hero-photo[src='../assets/photos/lecons-route.webp']") &&
  /Wikimedia Commons/.test(d.getElementById("credit-hero").textContent) && d.querySelector("#credit-hero a[rel~='license']"));
w = await page("index.html"); d = w.document;
check("accueil : vraie photo + carte permis SPÉCIMEN dans le bandeau, et 10 illustrations de thèmes", d.querySelector(".hero img.hero-photo[src='assets/photos/accueil-route.webp']") && d.querySelector(".hero img.hero-permis[src='assets/illustrations/permis-specimen.svg']") && d.querySelectorAll("#themes .ill img").length === 10 &&
  [...d.querySelectorAll("#themes .ill img")].every((im, i) => im.getAttribute("src") === `assets/illustrations/theme-${i + 1}.svg`));

// -- à propos
w = await page("a-propos/index.html"); d = w.document;
check("à propos : aucune erreur JavaScript", w.fautes.length === 0);
check("à propos : recueil IORT 2012, transport.tn, loi 99-71", ["IORT", "2012", "transport.tn", "99-71", "2000-150"].every(m => texte(d.body).includes(m)));
check("à propos : méthode (pas de copie) et limites (amendes 2025)", texte(d.body).includes("copiée") && texte(d.body).includes("loi de finances 2025"));
check("à propos : date vérifiée = REGLES_SITE", texte(d.getElementById("verifie-le")) === REGLES_SITE.verifie_le);

// ---- 3. Date unique, référencement, aperçu, licence, cache, robots GitHub ----------
const fichiersCode = [...PAGES, "assets/page.js", "assets/quiz.js", "assets/pages.js", "assets/lecons.js", "assets/amendes.js", "assets/panneaux.js", "assets/protection.js"];
const datesEnDur = fichiersCode.filter(f => /\b\d{2}\/\d{2}\/20\d{2}\b/.test(lire(f)));
check(`aucune date jj/mm/aaaa écrite en dur hors de regles.js ${datesEnDur.join(" ")}`, datesEnDur.length === 0);
check("regles.js : date au format jj/mm/aaaa et année cohérente", /^\d{2}\/\d{2}\/\d{4}$/.test(REGLES_SITE.verifie_le) && REGLES_SITE.verifie_le.endsWith(String(REGLES_SITE.annee)));
for (const p of PAGES) {
  const s = lire(p);
  check(`${p} : titre, description, canonical`, /<title>.{20,}<\/title>/.test(s) && /name="description" content=".{50,}"/.test(s) && s.includes('rel="canonical" href="https://ah6259.github.io/code-route-tunisie/'));
  check(`${p} : image d'aperçu og-image-v3.jpg et icône`, s.includes('property="og:image" content="https://ah6259.github.io/code-route-tunisie/assets/og-image-v3.jpg"') && !s.includes("og-image-v1") && s.includes('rel="icon"'));
  check(`${p} : même version ?v= pour tous les fichiers`, new Set(s.match(/\?v=\d+\w/g)).size === 1);
  check(`${p} : regles.js chargé en premier`, s.indexOf("assets/regles.js") > 0 && s.indexOf("assets/regles.js") < s.indexOf("assets/page.js"));
  const ww = await page(p);
  const pied = texte(ww.document.getElementById("pied"));
  check(`${p} : © et « non officiel » dans le pied de page`, pied.includes("©") && pied.includes("non officiel") && pied.includes("transport.tn"));
}
const ld = JSON.parse(lire("index.html").match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
check("FAQ Google (JSON-LD) valide sur l'accueil", ld["@type"] === "FAQPage" && ld.mainEntity.length >= 3);
check("image d'aperçu, logo et icône présents", ["assets/og-image-v3.jpg", "assets/logo.svg", "assets/icone-180.png"].every(f => existsSync(join(root, f))));
const ogJpg = readFileSync(join(root, "assets/og-image-v3.jpg"));
check(`image d'aperçu JPEG < 250 Ko (sinon WhatsApp n'affiche qu'une petite vignette), og:image:type sur chaque page : ${Math.round(ogJpg.length / 1024)} Ko`,
  ogJpg[0] === 0xFF && ogJpg[1] === 0xD8 && ogJpg.length < 250000 && PAGES.every(p => lire(p).includes('<meta property="og:image:type" content="image/jpeg">')));
// manifeste : id UNIQUE = chemin du site (sinon Chrome croit le site « déjà installé » : tous les sites partagent ah6259.github.io)
let man = {}; try { man = JSON.parse(lire("manifest.webmanifest")); } catch (e) {}
check("manifeste présent, id unique = chemin du site, start_url/scope ./, icônes 192, 512 et maskable existantes",
  man.id === "/code-route-tunisie/" && man.start_url === "./" && man.scope === "./" && man.display === "standalone" && !!man.name && !!man.short_name
  && ["192x192", "512x512"].every(t => man.icons?.some(i => i.sizes === t)) && man.icons?.some(i => i.purpose === "maskable")
  && man.icons.every(i => existsSync(join(root, i.src))));
check("toutes les pages : lien vers le manifeste, icône iPhone et theme-color", PAGES.every(p => { const s = lire(p), r = p.includes("/") ? "../" : "";
  return s.includes(`<link rel="manifest" href="${r}manifest.webmanifest">`) && s.includes(`<link rel="apple-touch-icon" href="${r}assets/icone-180.png">`) && s.includes('<meta name="theme-color"'); }));
check("plan du site : 8 pages publiques (sans relecture/)", (lire("sitemap.xml").match(/<loc>https:\/\/ah6259\.github\.io\/code-route-tunisie\//g) || []).length === 8 && !lire("sitemap.xml").includes("relecture"));
check("robots.txt indique le plan du site", lire("robots.txt").includes("code-route-tunisie/sitemap.xml"));
check("LICENSE tous droits réservés", lire("LICENSE").includes("Tous droits réservés"));
check(".gitignore : node_modules et captures", /node_modules\//.test(lire(".gitignore")) && /captures\//.test(lire(".gitignore")));
const tests = existsSync(join(root, ".github/workflows/tests.yml")) ? lire(".github/workflows/tests.yml") : "";
check("robot tests.yml : lance ce test à chaque push et ouvre une issue si échec", tests.includes("push") && tests.includes("tools/test_site.mjs") && tests.includes("issues: write") && tests.includes("failure()"));
const surv = existsSync(join(root, ".github/workflows/surveillance.yml")) ? lire(".github/workflows/surveillance.yml") : "";
check("robot surveillance.yml : mensuel, groupe de concurrence, issue + commit", /cron:\s*"\d+ \d+ \d+ \* \*"/.test(surv) && surv.includes("concurrency") && surv.includes("issues: write") && surv.includes("git commit"));

await nouvellesRubriques();
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
  check("carte permis : posée sur une vraie photo (accueil et page permis) et dans l'image d'aperçu", lire("index.html").includes("hero-permis") && lire("permis/index.html").includes("carte-permis") && lire("tools/og-image.html").includes("permis-specimen.svg"));

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
      if (menu.join() !== "lecons/,panneaux/,entrainement/,examen/,amendes/,a-propos/") menuMal.push(p);
      dx.querySelectorAll("a[href]").forEach(a => { const f = versFichier(wx.location.href, a.getAttribute("href")); if (f !== null && !existsSync(join(root, f))) casses.push(`${p} -> ${a.getAttribute("href")}`); });
    }
    const wf = await page(p, { fichier: true }), df = wf.document;
    df.querySelectorAll("a[href]").forEach(a => {
      const h = a.getAttribute("href"); if (/^(https?:|mailto:|#)/.test(h)) return;
      const u = new URL(h, wf.location.href), f = fileURLToPath(u.href.split("?")[0].split("#")[0]);
      if (u.pathname.endsWith("/") || !existsSync(f)) horsLigneMal.push(`${p} -> ${h}`);
    });
  }
  check(`menu présent sur toutes les pages (Leçons, Panneaux, Entraînement, Examen, Amendes, À propos) ${menuMal}`, menuMal.length === 0);
  check(`liens internes : chaque lien mène à un fichier existant ${casses.slice(0, 5)}`, casses.length === 0);
  check(`liens internes depuis le PC (file://) : « index.html » ajouté, fichier existant ${horsLigneMal.slice(0, 5)}`, horsLigneMal.length === 0);

  // -- « Mes erreurs »
  ww = await page("entrainement/index.html", { query: "&erreurs=1", stockage: { q: { "T2-001": 0, "T3-001": 0, "T4-001": 1 }, examens: [] } }); dd = ww.document;
  check("« Mes erreurs » : rejoue seulement les questions ratées", ww.fautes.length === 0 && ww.eval("entrainement").liste.length === 2 && ["T2-001", "T3-001"].includes(dd.querySelector("#quiz section").dataset.id) && texte(dd.getElementById("titre-page")) === "Mes erreurs");
  ww = await page("entrainement/index.html", { query: "&erreurs=1" }); dd = ww.document;
  check("« Mes erreurs » : message clair quand il n'y a rien à revoir", !!dd.getElementById("aucune-erreur"));
  ww = await page("index.html", { stockage: { q: { "T2-001": 0 }, examens: [] } }); dd = ww.document;
  check("accueil : 6 rubriques (entraînement en premier, leçons, panneaux, amendes, mes erreurs, permis) avec le nombre d'erreurs", dd.querySelectorAll("#rubriques .rubrique").length === 6 && dd.querySelector("#rubriques .rubrique").getAttribute("href") === "entrainement/" && texte(dd.getElementById("rubriques")).includes("1 question(s) à revoir"));

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
  const tous = []; (function parcourir(dir) { for (const f of readdirSync(dir)) { if (["node_modules", "captures", ".git"].includes(f)) continue; const c = join(dir, f); statSync(c).isDirectory() ? parcourir(c) : tous.push(c); } })(root);
  const secrets = tous.filter(f => /\.(js|mjs|html|md|yml|py|txt|json|sh)$/.test(f) && f !== fileURLToPath(import.meta.url)).filter(f => {
    const s = readFileSync(f, "utf8");
    return /(api[_-]?key|secret|password|mot de passe)\s*[:=]\s*["'][^"']{6,}/i.test(s) || /\b(ghp_|github_pat_|sk-|AIza)[A-Za-z0-9_]{10,}/.test(s) || /[\w.+-]+@(?!example\.)[\w-]+\.(com|tn|fr|net|org)\b/i.test(s);
  });
  check(`aucun secret ni adresse e-mail dans le site ${secrets.map(f => f.slice(root.length))}`, secrets.length === 0);
}
