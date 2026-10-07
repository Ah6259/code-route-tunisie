// Fabrique assets/questions.js à partir de ../questions/questions-v1.json
//   node tools/construire_questions.mjs
// À relancer après chaque modification des questions (puis changer le ?v= des pages et lancer le test).
//
// PRUDENCE : les questions marquées "a_verifier": true ne sont PAS mises sur le site
// (ni en entraînement, ni à l'examen blanc). Quand le moniteur les a validées, mettre
// "a_verifier": false dans le fichier JSON, relancer ce script : elles apparaissent toutes seules.
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = join(root, "..", "questions", "questions-v1.json");
const toutes = JSON.parse(readFileSync(source, "utf8"));

const gardees = toutes.filter(q => !q.a_verifier).map(q => ({
  id: q.id, theme: q.theme,
  question_fr: q.question_fr, question_ar: q.question_ar,
  choix: q.choix, bonnes: q.bonnes,
  explication_fr: q.explication_fr, explication_ar: q.explication_ar,
  source: q.source,
  ...(q.image ? { image: q.image } : {})   // schéma facultatif (assets/illustrations/)
}));
const exclues = toutes.filter(q => q.a_verifier).map(q => q.id);

// Questions BROUILLÉES dans le fichier publié (07/10/2026, demande d'Ahmed : nos examens sont notre propriété) :
// un robot qui aspire le site ne lit pas les questions en clair ; le navigateur les remet en ordre au chargement.
// (Protection dissuasive : un programmeur décidé peut toujours les décoder — la preuve d'auteur est dans le dépôt privé.)
const CLE = "CRT-tn-©-2026-propriete";
const octets = Buffer.from(JSON.stringify(gardees), "utf8"), cle = Buffer.from(CLE, "latin1");
for (let i = 0; i < octets.length; i++) octets[i] ^= cle[i % cle.length];
const js = `/* Questions du site — fichier FABRIQUÉ par tools/construire_questions.mjs, ne pas modifier à la main.
   Source : questions/questions-v1.json (${toutes.length} questions, ${exclues.length} « à vérifier » non publiées).
   © Code de la route Tunisie, tous droits réservés : questions rédigées par nous, reproduction interdite. */
var QUESTIONS_INFO = ${JSON.stringify({ total_fichier: toutes.length, publiees: gardees.length, exclues })};
var QUESTIONS = (function (d, k) {
  var b = atob(d), s = "";
  for (var i = 0; i < b.length; i++) s += String.fromCharCode(b.charCodeAt(i) ^ k.charCodeAt(i % k.length));
  return JSON.parse(decodeURIComponent(escape(s)));
})("${octets.toString("base64")}", ${JSON.stringify(CLE)});
if (typeof module !== "undefined") module.exports = { QUESTIONS, QUESTIONS_INFO };
`;
writeFileSync(join(root, "assets", "questions.js"), js, "utf8");
console.log(`${gardees.length} questions publiées, ${exclues.length} exclues (à vérifier) : ${exclues.join(", ")}`);
