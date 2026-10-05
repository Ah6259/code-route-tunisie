// Dessine les schémas des questions (SVG 320 × 200, style du site : vue de dessus, aplats simples)
// et indique dans ../questions/questions-v1.json le schéma de chaque question.
//   node tools/construire_schemas.mjs   puis   node tools/construire_questions.mjs
// Règle : un schéma montre la SITUATION, jamais la réponse (pas de chiffre de vitesse, de distance ni de points).
// Couleurs : bleu = votre voiture, orange = les autres usagers.
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const ILL = join(root, "assets", "illustrations");
const SOURCE = join(root, "..", "questions", "questions-v1.json");

/* ---------------- palette ---------------- */
const C = {
  herbe: "#E9F0E6", route: "#6B7886", trait: "#fff", nuit: "#1C2A3A", routeNuit: "#3A4654",
  bleu: "#1F5FA8", bleuC: "#CFE0F5", orange: "#E8731A", orangeC: "#FDE3CC", gris: "#8A96A3", grisC: "#E3E7EB",
  encre: "#0E2238", rouge: "#C2382B", vert: "#2E8B57", jaune: "#F2B33D", trottoir: "#C9CED4", bati: "#D9CBB5", batiF: "#BFAE93",
};
const r1 = n => Math.round(n * 10) / 10;

/* ---------------- briques ---------------- */
const fond = (c = C.herbe) => `<rect width="320" height="200" rx="14" fill="${c}"/>`;
const rect = (x, y, w, h, f, rx = 0, extra = "") => `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}"${rx ? ` rx="${rx}"` : ""} fill="${f}"${extra}/>`;
const cercle = (x, y, r, f, extra = "") => `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r)}" fill="${f}"${extra}/>`;
const chemin = (d, s, w = 4, extra = "") => `<path d="${d}" stroke="${s}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"${extra}/>`;
const forme = (d, f, extra = "") => `<path d="${d}" fill="${f}"${extra}/>`;

// traits pointillés horizontaux / verticaux
function tiretsH(y, x0 = 0, x1 = 320, c = C.trait, l = 16, e = 14, h = 4) {
  let s = ""; for (let x = x0 + 6; x + l <= x1; x += l + e) s += rect(x, y - h / 2, l, h, c, 2); return s;
}
function tiretsV(x, y0 = 0, y1 = 200, c = C.trait, l = 16, e = 14, w = 4) {
  let s = ""; for (let y = y0 + 6; y + l <= y1; y += l + e) s += rect(x - w / 2, y, w, l, c, 2); return s;
}
const routeH = (y = 60, h = 80, f = C.route) => rect(0, y, 320, h, f);
const routeV = (x = 120, w = 80, f = C.route) => rect(x, 0, w, 200, f);
const carrefour = (f = C.route) => forme("M120 0h80v60h120v80H200v60h-80v-60H0V60h120z", f);

// véhicules (vue de dessus, avant vers le haut quand a = 0)
function voiture(x, y, a = 0, c = "bleu", ech = 1) {
  const [f, v] = c === "bleu" ? [C.bleu, C.bleuC] : c === "orange" ? [C.orange, C.orangeC] : [C.gris, C.grisC];
  return `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${a})${ech !== 1 ? ` scale(${ech})` : ""}">${rect(-11, -19, 22, 38, f, 6)}${rect(-8, -11, 16, 8, v, 2)}${rect(-8, 8, 16, 5, v, 2)}</g>`;
}
function camion(x, y, a = 0, c = C.orange) {
  return `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${a})">${rect(-13, -34, 26, 18, c, 4)}${rect(-10, -30, 20, 7, C.orangeC, 2)}${rect(-14, -14, 28, 50, "#B9C2CC", 3)}</g>`;
}
function ambulance(x, y, a = 0, gyro = "#fff") {
  return `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${a})">${rect(-13, -24, 26, 48, "#F4F6F8", 6, ` stroke="${C.gris}" stroke-width="1.5"`)}${rect(-9, -16, 18, 7, C.bleuC, 2)}${rect(-2.5, 0, 5, 16, C.rouge)}${rect(-8, 5.5, 16, 5, C.rouge)}${rect(-8, -24, 16, 5, gyro, 2, ` stroke="${C.gris}" stroke-width="1"`)}</g>`;
}
function moto(x, y, a = 0, c = C.orange, passager = false) {
  return `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${a})">${rect(-3, -18, 6, 36, C.encre, 3)}${rect(-9, -6, 18, 4, C.encre, 2)}${cercle(0, 2, 6, c)}${passager ? cercle(0, 12, 5.5, C.gris) : ""}</g>`;
}
function velo(x, y, a = 0, c = C.orange) {
  return `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${a})">${rect(-1.5, -16, 3, 32, C.encre, 1.5)}${rect(-7, -9, 14, 3, C.encre, 1.5)}${cercle(0, 0, 5.5, c)}</g>`;
}
function tracteur(x, y, a = 0) {
  return `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${a})">${rect(-14, -6, 28, 26, C.encre, 3)}${rect(-10, -22, 20, 18, C.vert, 4)}${rect(-7, -2, 14, 14, "#8FD1A8", 2)}</g>`;
}
const pieton = (x, y, c = C.orange) => `${cercle(x, y, 6, c)}${cercle(x, y, 3, "#FCE5D3")}`;
function agent(x, y, bras = "haut", s = 1) {
  const b = bras === "haut" ? chemin("M8 -14L14 -40", C.bleu, 6) + chemin("M-8 -14L-14 4", C.bleu, 6) + cercle(14, -42, 3.5, "#fff", ` stroke="${C.encre}" stroke-width="1.5"`)
    : chemin("M-8 -14L-32 -14", C.bleu, 6) + chemin("M8 -14L32 -14", C.bleu, 6) + cercle(-34, -14, 3.5, "#fff", ` stroke="${C.encre}" stroke-width="1.5"`) + cercle(34, -14, 3.5, "#fff", ` stroke="${C.encre}" stroke-width="1.5"`);
  return `<g transform="translate(${r1(x)} ${r1(y)}) scale(${s})">${rect(-7, 8, 6, 24, C.encre, 3)}${rect(1, 8, 6, 24, C.encre, 3)}${b}${rect(-10, -18, 20, 30, C.bleu, 6)}${rect(-10, 4, 20, 4, "#fff")}${cercle(0, -26, 8, "#E8C4A0")}${forme("M-10 -29a10 7 0 0 1 20 0z", C.encre)}${rect(-11, -30, 22, 3, C.encre, 1.5)}</g>`;
}
// flèche le long d'une ligne brisée (points [[x,y],…])
function fleche(pts, c = C.bleu, w = 4, pointille = false) {
  const d = "M" + pts.map(p => `${r1(p[0])} ${r1(p[1])}`).join("L");
  const [a, b] = [pts[pts.length - 2], pts[pts.length - 1]];
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = 8;
  const p1 = [b[0] - L * Math.cos(ang - 0.7), b[1] - L * Math.sin(ang - 0.7)];
  const p2 = [b[0] - L * Math.cos(ang + 0.7), b[1] - L * Math.sin(ang + 0.7)];
  return chemin(d, c, w, pointille ? ' stroke-dasharray="7 7"' : "") + chemin(`M${r1(p1[0])} ${r1(p1[1])}L${r1(b[0])} ${r1(b[1])}L${r1(p2[0])} ${r1(p2[1])}`, c, w);
}
// cote de distance (double flèche + point d'interrogation, jamais de chiffre)
function cote(x1, y1, x2, y2) {
  const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const ang = Math.atan2(y2 - y1, x2 - x1), L = 7;
  const tete = (bx, by, s) => chemin(`M${r1(bx - s * L * Math.cos(ang - 0.6))} ${r1(by - s * L * Math.sin(ang - 0.6))}L${r1(bx)} ${r1(by)}L${r1(bx - s * L * Math.cos(ang + 0.6))} ${r1(by - s * L * Math.sin(ang + 0.6))}`, C.encre, 2.5);
  return chemin(`M${r1(x1)} ${r1(y1)}L${r1(x2)} ${r1(y2)}`, C.encre, 2.5, ' stroke-dasharray="5 4"') + tete(x2, y2, 1) + tete(x1, y1, -1) + interro(mx, my);
}
const interro = (x, y, r = 10) => `${cercle(x, y, r, "#fff", ` stroke="${C.encre}" stroke-width="2"`)}<text x="${r1(x)}" y="${r1(y + r * 0.42)}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="${r1(r * 1.3)}" fill="${C.encre}">?</text>`;

// panneau du site (assets/panneaux/<nom>.svg) sur un poteau ; s = taille du panneau
const cachePanneaux = {};
function panneau(nom, x, y, s = 40, poteau = true) {
  if (!cachePanneaux[nom]) {
    const t = readFileSync(join(root, "assets", "panneaux", nom + ".svg"), "utf8");
    cachePanneaux[nom] = t.replace(/^[\s\S]*?<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
  }
  return (poteau ? rect(x - 2, y + s * 0.45, 4, s * 0.75, "#7C8794", 2) : "") +
    `<svg x="${r1(x - s / 2)}" y="${r1(y - s / 2)}" width="${s}" height="${s}" viewBox="0 0 100 100">${cachePanneaux[nom]}</svg>`;
}
function feu(x, y, etat = "rouge", ech = 1) {
  const allume = { rouge: [1, 0, 0], orange: [0, 1, 0], vert: [0, 0, 1], aucun: [0, 0, 0] }[etat] || [0, 0, 0];
  const cs = [C.rouge, C.jaune, C.vert];
  let s = rect(-9, -26, 18, 52, C.encre, 5);
  [-16, 0, 16].forEach((dy, i) => { s += cercle(0, dy, 6, allume[i] ? cs[i] : "#3A4654"); });
  return `<g transform="translate(${r1(x)} ${r1(y)}) scale(${ech})">${rect(-2, 26, 4, 30, "#7C8794", 2)}${s}</g>`;
}
const eclat = (x, y, c = C.jaune) => [0, 60, 120, 180, 240, 300].map(a => chemin(`M${r1(x + 13 * Math.cos(a * Math.PI / 180))} ${r1(y + 13 * Math.sin(a * Math.PI / 180))}L${r1(x + 19 * Math.cos(a * Math.PI / 180))} ${r1(y + 19 * Math.sin(a * Math.PI / 180))}`, c, 3)).join("");
const arbre = (x, y, r = 12) => `${cercle(x, y, r, "#9CC79A")}${cercle(x - r * 0.3, y - r * 0.3, r * 0.45, "#B8DDB5")}`;
const immeuble = (x, y, w, h) => rect(x, y, w, h, C.bati, 3) + rect(x + 4, y + 4, w - 8, h - 8, C.batiF, 2);
const ville = () => immeuble(8, 6, 50, 44) + immeuble(70, 6, 40, 44) + immeuble(210, 6, 46, 44) + immeuble(266, 6, 46, 44) + immeuble(8, 150, 60, 44) + immeuble(222, 150, 90, 44);
const campagne = () => arbre(30, 28) + arbre(70, 22, 10) + arbre(250, 30, 14) + arbre(292, 22, 9) + arbre(40, 172, 13) + arbre(280, 174, 12);
const trottoirsH = (y = 60, h = 80) => rect(0, y - 10, 320, 10, C.trottoir) + rect(0, y + h, 320, 10, C.trottoir);
const brouillard = () => rect(0, 0, 320, 200, "#fff", 14, ' opacity=".55"') + rect(0, 40, 320, 30, "#fff", 0, ' opacity=".35"') + rect(0, 120, 320, 40, "#fff", 0, ' opacity=".35"');
const pluie = () => { let s = ""; for (let i = 0; i < 26; i++) { const x = (i * 47) % 320, y = (i * 83) % 190; s += chemin(`M${x} ${y}l-5 12`, "#5B8FD1", 2); } return s; };
const phares = (x, y, a = 0, long = 70, larg = 26) => `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${a})"><path d="M-8 -19L${-larg} ${-19 - long}H${larg}L8 -19z" fill="${C.jaune}" opacity=".45"/></g>`;
const lune = (x, y) => forme(`M${x} ${y - 14}a14 14 0 1 0 12 22a11 11 0 1 1 -12 -22z`, "#F6E7A8");
const zzz = (x, y) => `<text x="${x}" y="${y}" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="20" fill="${C.bleu}">z<tspan font-size="15" dy="-8">z</tspan><tspan font-size="11" dy="-7">z</tspan></text>`;

/* ---------------- icônes (scènes « connaissance ») ---------------- */
const carte = (x, y, w, h) => rect(x, y, w, h, "#fff", 14, ` stroke="${C.grisC}" stroke-width="2"`);
function compteur(x, y, r = 46) {
  let s = forme(`M${x - r} ${y}A${r} ${r} 0 0 1 ${x + r} ${y}`, "none") + chemin(`M${x - r} ${y}A${r} ${r} 0 0 1 ${x + r} ${y}`, C.encre, 8);
  for (let k = 0; k <= 8; k++) { const a = Math.PI + k * Math.PI / 8; s += chemin(`M${r1(x + (r - 12) * Math.cos(a))} ${r1(y + (r - 12) * Math.sin(a))}L${r1(x + (r - 4) * Math.cos(a))} ${r1(y + (r - 4) * Math.sin(a))}`, C.encre, 3); }
  return s + chemin(`M${x} ${y}L${r1(x + (r - 14) * Math.cos(-0.9))} ${r1(y + (r - 14) * Math.sin(-0.9))}`, C.rouge, 5) + cercle(x, y, 6, C.encre) + interro(x, y + 22, 11);
}
const verre = (x, y) => forme(`M${x - 14} ${y - 26}h28l-4 44a4 4 0 0 1 -4 4h-12a4 4 0 0 1 -4 -4z`, "#FFF6DB", ` stroke="${C.encre}" stroke-width="3"`) + forme(`M${x - 12.5} ${y - 8}h25l-2.6 26h-19.8z`, C.jaune) + rect(x - 10, y - 30, 20, 6, "#fff", 3, ` stroke="${C.encre}" stroke-width="2"`);
const telephone = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">${rect(-14, -26, 28, 52, C.encre, 6)}${rect(-10, -20, 20, 36, C.bleuC, 2)}${cercle(0, 21, 2.5, "#fff")}</g>`;
const pilule = (x, y) => `<g transform="translate(${x} ${y}) rotate(-35)">${rect(-26, -11, 52, 22, "#fff", 11, ` stroke="${C.encre}" stroke-width="3"`)}${forme("M0 -11h15a11 11 0 0 1 0 22H0z", C.rouge)}</g>`;
function horloge(x, y, r = 26) { return cercle(x, y, r, "#fff", ` stroke="${C.encre}" stroke-width="4"`) + chemin(`M${x} ${y}v-${r * 0.6}M${x} ${y}l${r * 0.45} ${r * 0.3}`, C.encre, 4); }
function calendrier(x, y, w = 70, h = 64) {
  let s = rect(x, y, w, h, "#fff", 8, ` stroke="${C.encre}" stroke-width="3"`) + rect(x, y, w, 16, C.rouge, 8) + rect(x, y + 8, w, 8, C.rouge);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) s += rect(x + 8 + j * ((w - 16) / 4), y + 24 + i * 12, (w - 16) / 4 - 5, 7, C.grisC, 2);
  return s;
}
const marteau = (x, y) => `<g transform="translate(${x} ${y}) rotate(-35)">${rect(-26, -10, 34, 20, "#8B5A2B", 4)}${rect(-3, -3, 46, 6, "#A0703F", 3)}</g>` + rect(x - 30, y + 22, 50, 8, "#8B5A2B", 3);
function permis(x, y, w = 96, h = 60, barre = false) {
  let s = rect(x, y, w, h, "#F7D9E3", 8, ` stroke="${C.encre}" stroke-width="2.5"`) + rect(x + 8, y + 10, w * 0.26, h * 0.62, "#fff", 4) + cercle(x + 8 + w * 0.13, y + 10 + h * 0.22, 6, C.gris) +
    rect(x + w * 0.42, y + 12, w * 0.48, 6, C.encre, 3) + rect(x + w * 0.42, y + 25, w * 0.4, 5, C.gris, 2.5) + rect(x + w * 0.42, y + 36, w * 0.44, 5, C.gris, 2.5);
  if (barre) s += chemin(`M${x - 6} ${y + h + 6}L${x + w + 6} ${y - 6}`, C.rouge, 6);
  return s;
}
function jaugePoints(x, y, w = 120, part = 0.7) { return rect(x, y, w, 18, C.grisC, 9) + rect(x, y, w * part, 18, C.vert, 9) + cercle(x - 14, y + 9, 11, C.encre) + `<text x="${x - 14}" y="${y + 14}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="13" fill="#fff">P</text>`; }
function contravention(x, y) { return rect(x, y, 62, 78, "#fff", 6, ` stroke="${C.encre}" stroke-width="2.5"`) + rect(x, y, 62, 14, C.orange, 6) + rect(x, y + 7, 62, 7, C.orange) + [24, 36, 48, 60].map(d => rect(x + 9, y + d, d === 60 ? 26 : 44, 5, C.grisC, 2.5)).join(""); }
function pneu(x, y, r = 34) { return cercle(x, y, r, C.encre) + cercle(x, y, r * 0.55, "#B9C2CC") + cercle(x, y, r * 0.2, C.gris); }
function bande(x, y, w = 90, h = 120) { let s = rect(x, y, w, h, "#2B3440", 8); for (let k = 0; k < 4; k++) s += rect(x + 12 + k * (w - 24) / 3.4, y + 6, 6, h - 12, "#151B22", 3); return s; }
const triangle = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})">${forme("M0 -16L15 11H-15z", "none", ` stroke="${C.rouge}" stroke-width="5" stroke-linejoin="round"`)}${rect(-3, 11, 6, 6, C.encre)}</g>`;
const casque = (x, y) => forme(`M${x - 20} ${y + 8}a20 20 0 0 1 40 0v6h-40z`, C.bleu) + rect(x - 4, y - 4, 22, 9, C.bleuC, 4);
const trousse = (x, y) => rect(x - 30, y - 22, 60, 44, "#fff", 8, ` stroke="${C.encre}" stroke-width="3"`) + rect(x - 5, y - 14, 10, 28, C.rouge) + rect(x - 14, y - 5, 28, 10, C.rouge) + rect(x - 10, y - 30, 20, 8, C.encre, 3);
const volant = (x, y) => cercle(x, y, 28, "none", ` stroke="${C.encre}" stroke-width="7"`) + cercle(x, y, 7, C.encre) + chemin(`M${x - 26} ${y + 4}L${x - 7} ${y + 2}M${x + 26} ${y + 4}L${x + 7} ${y + 2}M${x} ${y + 7}V${y + 27}`, C.encre, 6);
const ethylo = (x, y) => rect(x - 14, y - 30, 28, 56, C.encre, 6) + rect(x - 9, y - 22, 18, 12, "#8FD1A8", 2) + rect(x - 3, y - 44, 6, 16, "#fff", 2, ` stroke="${C.encre}" stroke-width="2"`) + cercle(x, y + 10, 5, C.rouge);
const papiers = (x, y) => rect(x, y + 14, 70, 46, C.bleuC, 6, ` stroke="${C.encre}" stroke-width="2"`) + rect(x + 20, y + 6, 70, 46, "#FFF1C9", 6, ` stroke="${C.encre}" stroke-width="2"`) + permis(x + 44, y, 70, 44);
const tableau = (x, y) => rect(x, y, 140, 70, C.encre, 12) + cercle(x + 40, y + 35, 24, "#24364A") + cercle(x + 100, y + 35, 24, "#24364A") + rect(x + 58, y + 50, 24, 16, "#3A4654", 4) + forme(`M${x + 70} ${y + 52}l6 11h-12z`, C.rouge);
const echappement = (x, y) => rect(x - 50, y - 9, 70, 18, C.gris, 6) + rect(x + 16, y - 6, 26, 12, "#7C8794", 4) + [0, 1, 2].map(k => chemin(`M${x + 52 + k * 10} ${y - 14 + k * 2}q8 14 0 28`, C.orange, 3)).join("");
const disque = (x, y) => cercle(x, y, 32, "#B9C2CC", ` stroke="${C.encre}" stroke-width="3"`) + cercle(x, y, 10, C.encre) + forme(`M${x + 18} ${y - 26}h16v26h-16z`, C.rouge);
const retro = (x, y) => forme(`M${x - 26} ${y - 14}h52a8 8 0 0 1 8 8v12a8 8 0 0 1 -8 8h-52a8 8 0 0 1 -8 -8v-12a8 8 0 0 1 8 -8z`, C.encre) + rect(x - 22, y - 9, 44, 18, C.bleuC, 4) + rect(x - 3, y + 14, 6, 12, C.encre);
const parebrise = (x, y) => forme(`M${x - 80} ${y + 40}l20 -60h120l20 60z`, C.bleuC, ` stroke="${C.encre}" stroke-width="4"`) + chemin(`M${x - 30} ${y + 36}l40 -34M${x + 18} ${y + 36}l40 -34`, C.encre, 3);
const salle = (x, y) => rect(x, y, 120, 70, "#2F5D3A", 6) + rect(x + 6, y + 6, 108, 58, "#3E7A4C", 4) + chemin(`M${x + 20} ${y + 24}h50M${x + 20} ${y + 38}h70M${x + 20} ${y + 52}h40`, "#E9F0E6", 3) + [0, 1, 2, 3].map(k => cercle(x + 14 + k * 30, y + 92, 9, k % 2 ? C.orange : C.bleu)).join("");
const gateau = (x, y) => rect(x - 32, y - 6, 64, 34, "#F7D9E3", 6, ` stroke="${C.encre}" stroke-width="2.5"`) + rect(x - 32, y + 6, 64, 6, C.rouge) + [-14, 0, 14].map(d => rect(x + d - 2, y - 22, 4, 16, C.bleu, 2) + cercle(x + d, y - 25, 3.5, C.jaune)).join("");
const usine = (x, y) => rect(x, y, 110, 60, C.bati, 4) + rect(x + 10, y + 26, 30, 34, C.batiF, 2) + rect(x + 52, y + 14, 48, 22, "#fff", 3) + chemin(`M${x + 58} ${y + 20}h30M${x + 58} ${y + 28}h22`, C.vert, 3);

/* ---------------- éléments de route ---------------- */
const passagePietons = (x, y, w = 40, h = 80, vertical = true) => { let s = ""; if (vertical) for (let k = 0; k < 7; k++) s += rect(x, y + 4 + k * (h / 7), w, h / 14, "#fff", 1); else for (let k = 0; k < 7; k++) s += rect(x + 4 + k * (w / 7), y, w / 14, h, "#fff", 1); return s; };
const ligneContinue = (y, x0 = 0, x1 = 320, c = C.trait) => rect(x0, y - 2, x1 - x0, 4, c, 2);
const voieFerree = x => rect(x - 18, 0, 36, 200, "#A08F78") + rect(x - 11, 0, 3, 200, C.encre) + rect(x + 8, 0, 3, 200, C.encre) + Array.from({ length: 10 }, (_, k) => rect(x - 16, 6 + k * 20, 32, 5, "#6E5B44", 1)).join("");
const train = (x, y) => rect(x - 14, y - 50, 28, 100, C.rouge, 6) + rect(x - 10, y - 44, 20, 12, "#FDE3CC", 2) + rect(x - 10, y - 8, 20, 10, "#FDE3CC", 2) + rect(x - 10, y + 22, 20, 10, "#FDE3CC", 2);
function feuxPN(x, y, allumes = true) { return rect(x - 2, y, 4, 34, "#7C8794", 2) + rect(x - 20, y - 12, 40, 18, C.encre, 9) + cercle(x - 10, y - 3, 6, allumes ? C.rouge : "#3A4654") + cercle(x + 10, y - 3, 6, allumes ? "#7A2A22" : "#3A4654") + (allumes ? eclat(x - 10, y - 3, C.rouge) : ""); }
const giratoire = () => cercle(160, 100, 78, C.route) + cercle(160, 100, 34, "#B8DDB5") + rect(140, 0, 40, 40, C.route) + rect(140, 160, 40, 40, C.route) + rect(0, 80, 90, 40, C.route) + rect(230, 80, 90, 40, C.route);
function zebra(x, y, w, h) { let s = forme(`M${x} ${y + h / 2}L${x + w * 0.2} ${y}H${x + w * 0.8}L${x + w} ${y + h / 2}L${x + w * 0.8} ${y + h}H${x + w * 0.2}z`, "none", ` stroke="#fff" stroke-width="3"`); for (let k = 1; k < 8; k++) s += chemin(`M${x + w * 0.1 + k * w * 0.1} ${y + 3}l-12 ${h - 6}`, "#fff", 2.5); return s; }
const bus = (x, y) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="22" fill="#fff">BUS</text>`;
const coup = (x, y) => [0, 45, 90, 135, 180, 225, 270, 315].map(a => chemin(`M${r1(x + 8 * Math.cos(a * Math.PI / 180))} ${r1(y + 8 * Math.sin(a * Math.PI / 180))}L${r1(x + 18 * Math.cos(a * Math.PI / 180))} ${r1(y + 18 * Math.sin(a * Math.PI / 180))}`, C.rouge, 3)).join("");
const sonore = (x, y, c = C.orange) => [0, 1, 2].map(k => chemin(`M${x + k * 9} ${y - 10 - k * 3}q8 ${10 + k * 3} 0 ${20 + k * 6}`, c, 3)).join("");
const clignote = (x, y, c = C.jaune) => cercle(x, y, 5, c) + eclat(x, y, c);

/* ---------------- les schémas (un par question publiée) ---------------- */
const S = {};
// 1. Panneaux et signalisation
S["q-familles-panneaux"] = () => fond() + routeH(110, 60) + tiretsH(140) + panneau("A-virage", 60, 52, 46) + panneau("C-sens-interdit", 130, 52, 46) + panneau("D-droite", 200, 52, 46) + panneau("F-parking", 266, 52, 46);
S["q-danger-hors-agglo"] = () => fond() + campagne() + routeH(70, 60) + tiretsH(100) + forme("M250 70Q320 70 320 20V70z", C.herbe) + panneau("A-virage", 70, 40, 34) + voiture(20, 112, 90) + cote(70, 150, 280, 150);
S["q-danger-agglo"] = () => fond() + ville() + trottoirsH(70, 60) + routeH(70, 60) + tiretsH(100) + passagePietons(240, 70, 36, 60) + panneau("A-pietons", 100, 40, 32) + voiture(30, 112, 90) + cote(100, 146, 240, 146);
S["q-panneau-danger"] = () => fond() + campagne() + routeV(120, 80) + tiretsV(160) + panneau("A-autres", 232, 70, 56) + voiture(180, 150, 0) + interro(260, 150);
S["q-panonceau"] = () => fond() + routeH(130, 60) + tiretsH(160) + panneau("A-intersection", 160, 44, 56, false) + rect(132, 76, 56, 22, "#fff", 4, ` stroke="${C.encre}" stroke-width="3"`) + rect(142, 84, 36, 6, C.encre, 3) + rect(158, 98, 4, 30, "#7C8794", 2);
S["q-debut-interdiction"] = () => fond() + routeH(60, 80) + tiretsH(100) + panneau("C-depasser", 190, 30, 34) + chemin("M190 60v80", C.rouge, 3, ' stroke-dasharray="6 5"') + voiture(70, 120, 90) + voiture(130, 120, 90, "orange") + interro(250, 160);
S["q-ligne-continue"] = () => fond() + campagne() + routeH(60, 80) + ligneContinue(100) + voiture(80, 120, 90) + voiture(230, 80, -90, "orange");
S["q-ligne-jaune-continue"] = () => fond() + ville() + rect(0, 60, 320, 16, C.trottoir) + rect(0, 74, 320, 5, C.jaune) + routeH(79, 70) + tiretsH(114) + voiture(160, 96, 90, "gris") + interro(160, 160);
S["q-ligne-jaune-discontinue"] = () => fond() + ville() + rect(0, 60, 320, 16, C.trottoir) + tiretsH(76.5, 0, 320, C.jaune, 18, 10, 5) + routeH(79, 70) + tiretsH(114) + voiture(160, 96, 90, "gris") + interro(160, 160);
S["q-zebras"] = () => fond() + routeH(50, 100) + zebra(110, 82, 120, 36) + tiretsH(66, 0, 100) + tiretsH(66, 240, 320) + voiture(50, 128, 90) + fleche([[80, 128], [120, 128]]) + interro(170, 170);
S["q-fleches-rabattement"] = () => fond() + routeH(60, 80) + tiretsH(100, 0, 320, C.trait, 30, 10) + [70, 150, 230].map(x => fleche([[x, 94], [x + 26, 94], [x + 40, 86]], "#fff", 3)).join("") + voiture(40, 120, 90) + voiture(280, 80, -90, "orange");
S["q-agent-bras-leve"] = () => fond() + carrefour() + agent(160, 96, "haut", 1.1) + voiture(180, 168, 0) + voiture(244, 80, -90, "orange") + voiture(76, 120, 90, "gris");
S["q-agent-feu-vert"] = () => fond() + carrefour() + feu(222, 168, "vert", 0.8) + agent(160, 96, "cote", 1.1) + voiture(180, 168, 0) + interro(260, 40);
S["q-voie-bus"] = () => fond() + ville() + routeH(60, 90) + rect(0, 118, 320, 4, "#fff") + rect(0, 120, 320, 30, "#7A6A86") + bus(250, 142) + tiretsH(90) + voiture(70, 136, 90) + interro(130, 136);
// 2. Priorités et intersections
S["q-route-prioritaire"] = () => fond() + carrefour() + panneau("B-prioritaire", 226, 170, 30) + voiture(180, 168, 0) + voiture(244, 80, -90, "orange") + fleche([[180, 145], [180, 120]]);
S["q-stop"] = () => fond() + carrefour() + rect(124, 140, 32, 5, "#fff") + panneau("B-stop", 100, 168, 30) + voiture(140, 168, 0) + voiture(244, 80, -90, "orange") + voiture(40, 120, 90, "gris");
S["q-ambulance-derriere"] = () => fond() + routeV(110, 100) + tiretsV(160) + voiture(185, 70, 0) + ambulance(185, 150, 0, "#7FB2F0") + eclat(185, 126, "#5B8FD1") + sonore(212, 150, C.bleu);
S["q-gyrophare"] = () => fond() + routeH(60, 80) + tiretsH(100) + ambulance(160, 100, 90) + interro(205, 70, 12);
S["q-carrefour-bloque"] = () => fond() + carrefour() + feu(222, 168, "vert", 0.8) + voiture(140, 100, 90, "orange") + voiture(185, 100, 90, "gris") + voiture(100, 100, 90, "orange") + voiture(180, 172, 0) + interro(260, 40);
S["q-sortie-parking"] = () => fond() + routeH(30, 80) + tiretsH(70) + rect(130, 110, 60, 90, "#B7A88F") + rect(150, 150, 20, 4, "#9C8D74") + voiture(160, 150, 0) + fleche([[160, 126], [160, 100], [190, 90]]) + voiture(60, 90, 90, "orange");
S["q-feu-orange"] = () => fond() + carrefour() + feu(222, 150, "orange", 0.9) + voiture(180, 172, 0);
S["q-orange-clignotant"] = () => fond() + carrefour() + feu(222, 150, "orange", 0.9) + eclat(222, 150, C.jaune) + voiture(180, 172, 0) + voiture(244, 80, -90, "orange");
S["q-tourner-gauche"] = () => fond() + carrefour() + passagePietons(124, 26, 72, 28, false) + voiture(180, 172, 0) + fleche([[180, 150], [180, 110], [150, 85], [100, 82]]) + voiture(140, 30, 180, "orange") + pieton(110, 40);
S["q-passage-niveau-feux"] = () => fond() + routeH(60, 80) + tiretsH(100) + voieFerree(200) + train(200, 40) + feuxPN(150, 30) + voiture(60, 120, 90);
// 3. Croisement et dépassement
S["q-croisement-depassement"] = () => fond() + campagne() + routeH(60, 80) + tiretsH(100) + voiture(70, 120, 90) + voiture(150, 120, 90, "gris") + voiture(260, 80, -90, "orange") + interro(110, 168);
S["q-depasser-voiture"] = () => fond() + routeH(50, 100) + tiretsH(100) + voiture(170, 128, 90, "orange") + voiture(170, 72, 90) + chemin("M200 84V116", C.encre, 2.5, ' stroke-dasharray="4 3"') + interro(222, 100, 9) + fleche([[60, 120], [100, 120], [130, 88]], C.bleu, 3, true);
S["q-depasser-droite"] = () => fond() + routeH(40, 120) + tiretsH(80) + tiretsH(120) + voiture(200, 100, 90, "orange") + voiture(110, 100, 90) + fleche([[135, 100], [160, 140], [240, 140]], C.bleu, 3, true) + interro(262, 140);
S["q-etre-depasse"] = () => fond() + campagne() + routeH(60, 80) + tiretsH(100) + voiture(170, 120, 90) + voiture(150, 80, 90, "orange") + fleche([[178, 80], [222, 80]], C.orange, 3) + interro(170, 166);
S["q-cas-depassement"] = () => fond() + routeH(60, 80) + tiretsH(100) + camion(170, 120, 90) + voiture(90, 120, 90) + fleche([[110, 120], [130, 84], [200, 84]], C.bleu, 3, true) + interro(260, 40);
S["q-trois-voies"] = () => fond() + routeH(40, 120) + tiretsH(80) + tiretsH(120) + voiture(80, 140, 90) + voiture(180, 140, 90, "gris") + voiture(250, 60, -90, "orange") + interro(160, 100, 12);
S["q-forte-pente"] = () => fond() + forme("M0 190L320 40V200H0z", C.route) + forme("M0 190L320 40", "none") + chemin("M0 180L320 30", "#fff", 3, ' stroke-dasharray="14 12"') + `<g transform="translate(90 152) rotate(-25)">${rect(-26, -10, 52, 20, C.bleu, 6)}${cercle(-16, 12, 7, C.encre)}${cercle(16, 12, 7, C.encre)}</g>` + `<g transform="translate(230 86) rotate(-25)">${rect(-26, -10, 52, 20, C.orange, 6)}${cercle(-16, 12, 7, C.encre)}${cercle(16, 12, 7, C.encre)}</g>` + interro(160, 60);
S["q-route-etroite"] = () => fond() + campagne() + routeH(78, 44) + voiture(110, 100, 90) + camion(220, 100, -90) + interro(160, 150);
S["q-avant-depasser"] = () => fond() + campagne() + routeV(110, 100) + tiretsV(160) + camion(185, 70, 0) + voiture(185, 160, 0) + fleche([[185, 136], [140, 100], [140, 40]], C.bleu, 3, true) + interro(260, 100);
S["q-files-paralleles"] = () => fond() + routeH(30, 140) + tiretsH(76) + tiretsH(124) + [40, 110, 180, 250].map((x, i) => voiture(x, 53, 90, "gris") + voiture(x + 20, 100, 90, i === 1 ? "bleu" : "orange") + voiture(x + 8, 147, 90, "gris")).join("");
S["q-vehicule-lent"] = () => fond() + campagne() + routeH(72, 56) + tracteur(200, 100, 90) + voiture(130, 100, 90, "orange") + voiture(80, 100, 90, "gris") + interro(260, 150);
// 4. Vitesse et distances
S["q-vitesse-agglo"] = () => fond() + ville() + trottoirsH(70, 60) + routeH(70, 60) + tiretsH(100) + voiture(70, 112, 90) + carte(196, 64, 108, 74) + compteur(250, 118, 36);
S["q-vitesse-route"] = () => fond() + campagne() + routeH(70, 60) + tiretsH(100) + voiture(70, 112, 90) + carte(196, 64, 108, 74) + compteur(250, 118, 36);
S["q-vitesse-autoroute"] = () => fond() + routeH(30, 140) + rect(0, 96, 320, 8, "#B9C2CC") + tiretsH(63) + tiretsH(137) + panneau("F-autoroute", 40, 18, 26, false) + voiture(80, 150, 90) + carte(196, 108, 108, 74) + compteur(250, 162, 36);
S["q-vitesse-mini-autoroute"] = () => fond() + routeH(30, 140) + rect(0, 96, 320, 8, "#B9C2CC") + tiretsH(63) + tiretsH(137) + voiture(80, 150, 90) + voiture(200, 120, 90, "orange") + forme("M60 158l-30 0", "none") + chemin("M54 150h-30M54 158h-22", C.gris, 3) + interro(150, 66);
S["q-pluie-autoroute"] = () => fond("#DCE6EE") + routeH(30, 140) + rect(0, 96, 320, 8, "#B9C2CC") + tiretsH(63) + tiretsH(137) + voiture(120, 150, 90) + voiture(230, 120, 90, "gris") + pluie() + interro(270, 60);
S["q-brouillard-agglo"] = () => fond() + ville() + trottoirsH(70, 60) + routeH(70, 60) + tiretsH(100) + voiture(120, 112, 90) + phares(120, 112, 90, 50, 18) + brouillard() + interro(260, 100);
S["q-jeune-conducteur"] = () => fond() + routeH(110, 80) + rect(0, 146, 320, 8, "#B9C2CC") + panneau("F-autoroute", 270, 128, 30, false) + voiture(70, 128, 90) + permis(60, 16, 96, 60) + calendrier(186, 14, 64, 62);
S["q-periode-stage"] = () => fond() + permis(40, 64, 110, 70) + calendrier(190, 56, 90, 84) + interro(235, 160);
S["q-cyclomoteur"] = () => fond() + campagne() + routeH(70, 60) + tiretsH(100) + moto(110, 112, 90, C.bleu) + carte(196, 64, 108, 74) + compteur(250, 118, 36);
S["q-distance-securite"] = () => fond() + routeH(60, 80) + tiretsH(100) + voiture(70, 120, 90) + voiture(230, 120, 90, "orange") + cote(84, 150, 216, 150);
S["q-ralentir"] = () => fond() + ville() + trottoirsH(70, 60) + routeH(70, 60) + passagePietons(180, 70, 36, 60) + pieton(198, 88) + pieton(192, 112, C.bleu) + panneau("A-pietons", 250, 36, 30) + voiture(80, 112, 90);
// 5. Arrêt et stationnement
S["q-arret-stationnement"] = () => fond() + ville() + rect(0, 60, 320, 14, C.trottoir) + routeH(74, 76) + voiture(90, 92, 90) + cercle(100, 92, 4, C.jaune) + voiture(220, 92, 90, "gris") + horloge(260, 160, 18) + interro(160, 160);
S["q-stationnement-abusif"] = () => fond() + ville() + rect(0, 60, 320, 14, C.trottoir) + routeH(74, 76) + voiture(80, 92, 90, "gris") + calendrier(150, 112, 70, 64) + interro(260, 145);
S["q-se-garer-double-sens"] = () => fond() + ville() + trottoirsH(70, 60) + routeH(70, 60) + tiretsH(100) + voiture(120, 112, 90) + fleche([[60, 112], [96, 112]]) + voiture(250, 84, -90, "orange") + interro(160, 150);
S["q-accotement"] = () => fond() + campagne() + rect(0, 120, 320, 30, "#C9B99A") + routeH(60, 60) + tiretsH(90) + voiture(160, 102, 90) + interro(200, 160);
S["q-arret-intersection"] = () => fond() + ville() + carrefour() + voiture(160, 120 - 26, 0, "gris") + rect(122, 60, 4, 80, "#fff") + voiture(80, 128, 90, "gris") + cote(52, 150, 120, 150);
S["q-arret-passage-niveau"] = () => fond() + campagne() + routeH(60, 80) + tiretsH(100) + voieFerree(250) + voiture(140, 120, 90, "gris") + cote(160, 152, 232, 152);
S["q-virage-visibilite"] = () => fond() + campagne() + forme("M0 70H180Q260 70 260 150V200H180V150Q180 140 170 140H0z", C.route) + immeuble(196, 0, 120, 60) + voiture(220, 160, 0, "gris") + voiture(60, 105, 90) + interro(150, 40);
S["q-stationnements-genants"] = () => fond() + ville() + rect(0, 54, 320, 22, C.trottoir) + routeH(76, 74) + voiture(90, 66, 90, "gris") + rect(200, 54, 40, 22, "#B7A88F") + voiture(220, 96, 90, "gris") + voiture(150, 128, 90, "orange") + interro(270, 140);
S["q-arret-passage-pietons"] = () => fond() + ville() + rect(0, 60, 320, 14, C.trottoir) + routeH(74, 76) + passagePietons(200, 74, 36, 76) + voiture(150, 92, 90, "gris") + cote(166, 150, 198, 150);
S["q-stationnement-alterne"] = () => fond() + ville() + trottoirsH(70, 60) + routeH(70, 60) + panneau("E-stationnement", 270, 40, 30) + voiture(100, 82, 90, "gris") + calendrier(140, 110, 60, 56) + horloge(240, 150, 20);
S["q-ouvrir-portiere"] = () => fond() + rect(0, 50, 320, 20, C.trottoir) + routeH(70, 90) + voiture(150, 90, 90) + forme("M140 101l-22 22l-4 -4l20 -20z", C.bleu) + velo(60, 124, 90, C.orange) + fleche([[80, 124], [104, 124]], C.orange, 3);
S["q-bande-arret-urgence"] = () => fond() + routeH(20, 130) + rect(0, 120, 320, 4, "#fff") + rect(0, 124, 320, 26, "#7C8794") + tiretsH(70) + voiture(200, 137, 90) + telephone(60, 175, 0.7) + horloge(110, 175, 14) + interro(270, 175, 11);
// 6. Feux, éclairage, avertisseurs
S["q-feux-obligatoires"] = () => fond(C.nuit) + routeH(60, 80, C.routeNuit) + tiretsH(100, 0, 320, "#9AA5B1") + lune(270, 30) + voiture(80, 120, 90) + interro(200, 160);
S["q-suivre-nuit"] = () => fond(C.nuit) + routeH(60, 80, C.routeNuit) + tiretsH(100, 0, 320, "#9AA5B1") + lune(270, 30) + voiture(100, 120, 90) + voiture(170, 120, 90, "orange") + phares(100, 120, 90, 30, 16) + interro(240, 160);
S["q-rue-eclairee"] = () => fond(C.nuit) + routeH(60, 80, C.routeNuit) + [40, 140, 240].map(x => rect(x, 36, 4, 24, "#7C8794") + cercle(x + 2, 34, 10, "#FFE9A8", ' opacity=".9"') + cercle(x + 2, 34, 26, "#FFE9A8", ' opacity=".2"')).join("") + voiture(120, 110, 90) + interro(260, 170);
S["q-brouillard"] = () => fond() + campagne() + routeH(60, 80) + tiretsH(100) + voiture(120, 120, 90) + phares(120, 120, 90, 60, 20) + brouillard() + interro(260, 60);
S["q-stationner-nuit"] = () => fond(C.nuit) + routeH(60, 80, C.routeNuit) + tiretsH(100, 0, 320, "#9AA5B1") + lune(270, 30) + arbre(40, 170) + voiture(160, 128, 90, "gris") + interro(220, 170);
S["q-moto-jour"] = () => fond() + campagne() + routeH(60, 80) + tiretsH(100) + cercle(270, 32, 16, C.jaune) + eclat(270, 32) + moto(120, 120, 90, C.bleu) + interro(200, 160);
S["q-avertir-nuit"] = () => fond(C.nuit) + routeH(60, 80, C.routeNuit) + tiretsH(100, 0, 320, "#9AA5B1") + voiture(90, 120, 90) + voiture(240, 80, -90, "orange") + interro(160, 160);
S["q-klaxon-ville"] = () => fond() + ville() + trottoirsH(70, 60) + routeH(70, 60) + tiretsH(100) + voiture(110, 112, 90) + sonore(130, 112) + pieton(200, 64) + interro(250, 112);
S["q-portee-feux"] = () => fond(C.nuit) + routeH(60, 80, C.routeNuit) + tiretsH(100, 0, 320, "#9AA5B1") + voiture(50, 120, 90) + phares(50, 120, 90, 150, 22) + cote(70, 150, 230, 150);
S["q-feux-detresse"] = () => fond() + tableau(90, 50) + voiture(70, 160, 90, "gris") + interro(250, 160);
// 7. Alcool, fatigue, téléphone
S["q-taux-alcool"] = () => fond() + verre(90, 100) + voiture(200, 100, 0, "bleu", 1.6) + interro(270, 50);
S["q-peine-alcool"] = () => fond() + verre(80, 100) + marteau(210, 90);
S["q-refus-depistage"] = () => fond() + ethylo(110, 110) + agent(220, 130, "cote", 1.3) + interro(280, 40);
S["q-retrait-alcool"] = () => fond() + verre(70, 100) + permis(140, 60, 120, 76) + calendrier(250, 128, 50, 46);
S["q-agent-retrait"] = () => fond() + agent(80, 124, "cote", 1.3) + permis(150, 40, 120, 76) + verre(270, 160);
S["q-fatigue"] = () => fond() + volant(110, 110) + lune(220, 70) + zzz(230, 130);
S["q-medicament"] = () => fond() + pilule(100, 100) + volant(220, 110);
S["q-telephone"] = () => fond() + volant(110, 110) + telephone(230, 100);
S["q-camion-pause"] = () => fond() + routeH(100, 60) + tiretsH(130) + camion(140, 130, 90) + horloge(250, 60, 28);
S["q-points-alcool"] = () => fond() + verre(70, 100) + jaugePoints(150, 92, 130, 0.45);
S["q-accident-alcool"] = () => fond() + routeH(60, 80) + voiture(120, 100, 70, "orange") + voiture(165, 106, -60, "bleu") + coup(143, 100) + verre(270, 150).replace(/scale/, "scale") + marteau(60, 160).replace(/scale/, "scale");
// 8. Mécanique et entretien
S["q-temoin-usure"] = () => fond() + bande(115, 40, 90, 120) + rect(115, 96, 90, 8, "#4B5563") + interro(250, 100);
S["q-mesure-pneu"] = () => fond() + pneu(110, 100, 60) + [0, 90, 180, 270].map(a => cercle(110 + 48 * Math.cos(a * Math.PI / 180), 100 + 48 * Math.sin(a * Math.PI / 180), 7, C.jaune)).join("") + interro(230, 100);
S["q-pneus-dimensions"] = () => fond() + rect(70, 96, 180, 8, C.encre, 4) + pneu(70, 100, 44) + pneu(250, 100, 32) + interro(160, 160);
S["q-pneus-essieu"] = () => fond() + rect(90, 96, 140, 8, C.encre, 4) + bande(40, 50, 60, 100) + bande(220, 50, 60, 100) + interro(160, 160);
S["q-changer-roue"] = () => fond() + rect(0, 150, 320, 50, "#B9C2CC") + `<g transform="translate(150 110)">${rect(-90, -30, 180, 44, C.bleu, 14)}${rect(-60, -54, 110, 30, C.bleuC, 10)}${cercle(-52, 20, 20, C.encre)}${cercle(-52, 20, 8, C.gris)}${forme("M36 40h40q4 0 2 -6l-6 -12h-32l-6 12q-2 6 2 6z", C.encre)}</g>` + interro(270, 50);
S["q-freinage"] = () => fond() + disque(120, 100) + voiture(240, 100, 0, "bleu", 1.4) + interro(270, 40);
S["q-retroviseurs"] = () => fond() + voiture(160, 100, 0, "bleu", 2.4) + retro(60, 60) + interro(260, 150);
S["q-pare-brise"] = () => fond() + parebrise(160, 100) + interro(270, 50);
S["q-silencieux"] = () => fond() + echappement(140, 100) + interro(270, 50);
S["q-visite-technique"] = () => fond() + usine(40, 70) + voiture(220, 120, 0, "bleu", 1.3) + interro(270, 40);
S["q-documents-controle"] = () => fond() + papiers(40, 50) + agent(250, 130, "cote", 1.3);
S["q-casque-moto"] = () => fond() + campagne() + routeH(60, 80) + tiretsH(100) + `<g transform="translate(150 120) scale(1.6)">${moto(0, 0, 90, C.bleu, true)}</g>` + interro(250, 150);
// 9. Accidents et premiers secours
S["q-accident-premiere"] = () => fond() + carrefour() + voiture(150, 104, 90, "orange") + voiture(170, 120, 0) + coup(160, 110) + interro(260, 40);
S["q-accident-blesse"] = () => fond() + routeH(60, 80) + voiture(100, 100, 80, "orange") + voiture(140, 108, -60) + coup(120, 102) + pieton(220, 120, C.rouge) + trousse(270, 50);
S["q-accident-materiel"] = () => fond() + routeH(60, 80) + voiture(120, 100, 90, "orange") + voiture(165, 100, 90) + coup(143, 100) + rect(230, 120, 60, 70, "#fff", 6, ` stroke="${C.encre}" stroke-width="2.5"`) + [136, 150, 164, 178].map(y => rect(240, y, 40, 5, C.grisC, 2.5)).join("");
S["q-voiture-garee-abimee"] = () => fond() + ville() + rect(0, 60, 320, 14, C.trottoir) + routeH(74, 76) + voiture(140, 92, 90, "gris") + coup(160, 100) + voiture(170, 124, 70) + interro(260, 150);
S["q-triangle-route"] = () => fond() + campagne() + routeH(60, 80) + tiretsH(100) + voiture(240, 120, 90) + clignote(254, 110) + triangle(90, 120) + cote(100, 152, 226, 152);
S["q-triangle-autoroute"] = () => fond() + routeH(30, 130) + rect(0, 130, 320, 4, "#fff") + rect(0, 134, 320, 26, "#7C8794") + tiretsH(80) + voiture(260, 147, 90) + triangle(80, 147, 0.8) + cote(92, 178, 246, 178);
S["q-panne-autoroute"] = () => fond() + routeH(30, 130) + rect(0, 130, 320, 4, "#fff") + rect(0, 134, 320, 26, "#7C8794") + tiretsH(80) + voiture(180, 147, 90) + clignote(196, 138) + voiture(80, 110, 90, "orange") + interro(270, 60);
S["q-enlever-vehicule"] = () => fond() + routeH(60, 80) + tiretsH(100) + voiture(130, 120, 70, "gris") + coup(140, 104) + calendrier(210, 20, 70, 64);
S["q-delit-fuite"] = () => fond() + routeH(60, 80) + voiture(150, 100, 90) + fleche([[175, 100], [260, 100]], C.bleu, 3) + pieton(110, 120, C.rouge) + coup(118, 112) + marteau(250, 160);
// 10. Infractions et sanctions
S["q-capital-points"] = () => fond() + permis(40, 52, 110, 70) + jaugePoints(180, 80, 110, 1);
S["q-points-vitesse"] = () => fond() + carte(30, 50, 120, 100) + compteur(90, 118, 42) + jaugePoints(185, 90, 110, 0.6) + chemin("M300 70v-26M290 60l10 10 10 -10", C.rouge, 4);
S["q-recuperer-points"] = () => fond() + calendrier(40, 60, 90, 84) + jaugePoints(170, 92, 120, 0.8) + chemin("M300 110v-26M290 94l10 -10 10 10", C.vert, 4);
S["q-stage-points"] = () => fond() + salle(40, 40) + jaugePoints(190, 92, 110, 0.7) + chemin("M310 110v-26M300 94l10 -10 10 10", C.vert, 4);
S["q-points-perdus"] = () => fond() + permis(40, 52, 110, 70, true) + jaugePoints(190, 80, 100, 0.02) + calendrier(205, 120, 60, 56);
S["q-amende-15-jours"] = () => fond() + contravention(60, 60) + calendrier(170, 64, 90, 84);
S["q-amende-un-mois"] = () => fond() + contravention(40, 60) + calendrier(120, 64, 70, 64) + permis(210, 74, 90, 56);
S["q-amende-vitesse"] = () => fond() + carte(30, 50, 120, 100) + compteur(90, 118, 42) + contravention(200, 60);
S["q-sanction-depassement"] = () => fond() + routeH(40, 80) + ligneContinue(80) + voiture(80, 100, 90, "orange") + voiture(100, 60, 70) + fleche([[120, 60], [180, 60], [200, 96]], C.bleu, 3, true) + marteau(250, 160);
S["q-sans-permis"] = () => fond() + permis(40, 60, 120, 76, true) + volant(240, 100);
S["q-sens-inverse-autoroute"] = () => fond() + routeH(20, 70) + rect(0, 90, 320, 16, "#9CC79A") + routeH(106, 70) + tiretsH(55) + tiretsH(141) + voiture(80, 40, 90, "gris") + voiture(220, 72, 90, "gris") + voiture(160, 123, -90, "gris") + voiture(170, 72, -90) + chemin("M150 72h-30", C.rouge, 4) + interro(260, 160);
S["q-age-permis"] = () => fond() + permis(40, 60, 120, 76) + gateau(240, 110);

// question -> schéma (les 6 schémas d'origine sont gardés)
const ASSOC = {
  "T1-001": "q-familles-panneaux", "T1-002": "q-danger-hors-agglo", "T1-003": "q-danger-agglo", "T1-004": "q-panneau-danger",
  "T1-005": "q-panonceau", "T1-006": "q-debut-interdiction", "T1-007": "q-ligne-continue", "T1-009": "q-ligne-jaune-continue",
  "T1-010": "q-ligne-jaune-discontinue", "T1-011": "q-zebras", "T1-012": "q-fleches-rabattement", "T1-013": "q-agent-bras-leve",
  "T1-014": "q-agent-feu-vert", "T1-015": "q-voie-bus",
  "T2-002": "q-route-prioritaire", "T2-004": "q-stop", "T2-005": "q-ambulance-derriere", "T2-006": "q-gyrophare",
  "T2-007": "q-carrefour-bloque", "T2-008": "q-sortie-parking", "T2-009": "q-feu-orange", "T2-010": "q-orange-clignotant",
  "T2-012": "q-tourner-gauche", "T2-013": "q-passage-niveau-feux",
  "T3-001": "q-croisement-depassement", "T3-003": "q-depasser-voiture", "T3-004": "q-depasser-droite", "T3-005": "q-etre-depasse",
  "T3-006": "q-cas-depassement", "T3-007": "q-trois-voies", "T3-008": "q-forte-pente", "T3-009": "q-route-etroite",
  "T3-010": "q-avant-depasser", "T3-011": "q-files-paralleles", "T3-012": "q-vehicule-lent",
  "T4-001": "q-vitesse-agglo", "T4-002": "q-vitesse-route", "T4-003": "q-vitesse-autoroute", "T4-004": "q-vitesse-mini-autoroute",
  "T4-005": "q-pluie-autoroute", "T4-006": "q-brouillard-agglo", "T4-007": "q-jeune-conducteur", "T4-008": "q-periode-stage",
  "T4-009": "q-cyclomoteur", "T4-010": "q-distance-securite", "T4-011": "q-ralentir",
  "T5-001": "q-arret-stationnement", "T5-002": "q-stationnement-abusif", "T5-003": "q-se-garer-double-sens", "T5-004": "q-accotement",
  "T5-005": "q-arret-intersection", "T5-006": "q-arret-passage-niveau", "T5-007": "q-virage-visibilite", "T5-008": "q-stationnements-genants",
  "T5-009": "q-arret-passage-pietons", "T5-010": "q-stationnement-alterne", "T5-011": "q-ouvrir-portiere", "T5-012": "q-bande-arret-urgence",
  "T6-001": "q-feux-obligatoires", "T6-003": "q-suivre-nuit", "T6-004": "q-rue-eclairee", "T6-005": "q-brouillard",
  "T6-006": "q-stationner-nuit", "T6-007": "q-moto-jour", "T6-008": "q-avertir-nuit", "T6-009": "q-klaxon-ville",
  "T6-010": "q-portee-feux", "T6-011": "q-feux-detresse",
  "T7-001": "q-taux-alcool", "T7-002": "q-peine-alcool", "T7-003": "q-refus-depistage", "T7-004": "q-retrait-alcool",
  "T7-005": "q-agent-retrait", "T7-006": "q-fatigue", "T7-007": "q-medicament", "T7-008": "q-telephone",
  "T7-010": "q-camion-pause", "T7-011": "q-points-alcool", "T7-012": "q-accident-alcool",
  "T8-001": "q-temoin-usure", "T8-002": "q-mesure-pneu", "T8-003": "q-pneus-dimensions", "T8-004": "q-pneus-essieu",
  "T8-005": "q-changer-roue", "T8-006": "q-freinage", "T8-007": "q-retroviseurs", "T8-008": "q-pare-brise",
  "T8-009": "q-silencieux", "T8-010": "q-visite-technique", "T8-011": "q-documents-controle", "T8-013": "q-casque-moto",
  "T9-001": "q-accident-premiere", "T9-002": "q-accident-blesse", "T9-003": "q-accident-materiel", "T9-004": "q-voiture-garee-abimee",
  "T9-005": "q-triangle-route", "T9-006": "q-triangle-autoroute", "T9-007": "q-panne-autoroute", "T9-008": "q-enlever-vehicule",
  "T9-009": "q-delit-fuite",
  "T10-001": "q-capital-points", "T10-002": "q-points-vitesse", "T10-003": "q-recuperer-points", "T10-004": "q-stage-points",
  "T10-005": "q-points-perdus", "T10-006": "q-amende-15-jours", "T10-007": "q-amende-un-mois", "T10-008": "q-amende-vitesse",
  "T10-009": "q-sanction-depassement", "T10-011": "q-sans-permis", "T10-012": "q-sens-inverse-autoroute", "T10-014": "q-age-permis",
};

const seuls = process.argv.slice(2);
let n = 0;
for (const [nom, f] of Object.entries(S)) {
  if (seuls.length && !seuls.includes(nom)) continue;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200">${f()}</svg>`;
  writeFileSync(join(ILL, nom + ".svg"), svg, "utf8"); n++;
}
const questions = JSON.parse(readFileSync(SOURCE, "utf8"));
let lies = 0;
for (const q of questions) if (ASSOC[q.id]) { if (!S[ASSOC[q.id]]) throw new Error("schéma inconnu : " + ASSOC[q.id]); q.image = ASSOC[q.id] + ".svg"; lies++; }
writeFileSync(SOURCE, JSON.stringify(questions, null, 2) + "\n", "utf8");
const sans = questions.filter(q => !q.a_verifier && !q.image).map(q => q.id);
console.log(`${n} schémas dessinés, ${lies} questions reliées ; questions publiées sans image : ${sans.length ? sans.join(", ") : "aucune"}`);
