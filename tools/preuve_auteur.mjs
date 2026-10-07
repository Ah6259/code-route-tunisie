// Preuve d'auteur (demande d'Ahmed : nos fiches, nos examens et nos images sont notre propriété).
//   node tools/preuve_auteur.mjs
// Calcule l'empreinte SHA-256 de tout ce que NOUS avons créé (questions, leçons, schémas, panneaux dessinés, spécimen,
// tableau des amendes) et l'écrit, avec une COPIE de la source des questions, dans le dépôt PRIVÉ code-route-pass
// (dossier ../pass (prive)/preuves-auteur/). Le commit GitHub date la preuve. À relancer après chaque ajout de contenu,
// puis : cd "../pass (prive)" ; git add preuves-auteur ; git commit -m "Preuve d'auteur" ; git push.
// Les photos (Wikimedia Commons, licences libres) ne sont PAS à nous : jamais dans la preuve.
import { createHash } from "crypto";
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, copyFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join, relative } from "path";

const site = join(dirname(fileURLToPath(import.meta.url)), "..");
const projet = join(site, "..");
const prive = join(projet, "pass (prive)");
if (!existsSync(prive)) { console.log("Dépôt privé introuvable : " + prive); process.exit(1); }

const fichiers = [];
const parcourir = d => { if (!existsSync(d)) return; for (const f of readdirSync(d).sort()) { const c = join(d, f); statSync(c).isDirectory() ? parcourir(c) : fichiers.push(c); } };
for (const d of ["site/assets/illustrations", "site/assets/panneaux", "site/assets/specimen", "questions"]) parcourir(join(projet, d));
for (const f of ["site/assets/lecons.js", "site/assets/panneaux.js", "site/assets/amendes.js", "site/assets/questions.js"]) if (existsSync(join(projet, f))) fichiers.push(join(projet, f));

const jour = new Date().toISOString().slice(0, 10);
const liste = fichiers.map(f => ({ fichier: relative(projet, f).replace(/\\/g, "/"), octets: statSync(f).size,
  sha256: createHash("sha256").update(readFileSync(f)).digest("hex") }));
const global = createHash("sha256").update(liste.map(x => x.sha256 + "  " + x.fichier).join("\n")).digest("hex");

const sortie = join(prive, "preuves-auteur");
mkdirSync(join(sortie, "questions"), { recursive: true });
for (const f of fichiers.filter(f => relative(projet, f).startsWith("questions"))) {
  const cible = join(sortie, relative(projet, f)); mkdirSync(dirname(cible), { recursive: true }); copyFileSync(f, cible);
}
writeFileSync(join(sortie, `empreintes-${jour}.json`), JSON.stringify({
  auteur: "Code de la route Tunisie (Ah6259) — tous droits réservés", date: jour,
  note: "Empreintes SHA-256 des contenus créés par nous (questions, leçons, schémas, panneaux dessinés, spécimen, amendes). Le commit GitHub de ce fichier date la preuve. Photos Wikimedia Commons exclues (pas à nous).",
  empreinte_globale: global, fichiers: liste }, null, 1) + "\n", "utf8");
console.log(`${liste.length} fichiers, empreinte globale ${global.slice(0, 16)}… → preuves-auteur/empreintes-${jour}.json (+ copie de questions/)`);
