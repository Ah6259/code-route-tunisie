// Fabrique les dessins des panneaux (assets/panneaux/*.svg) et la liste assets/panneaux.js.
//   node tools/construire_panneaux.mjs
// Dessins faits par nous (formes et couleurs usuelles). Les modèles officiels sont dans les annexes A à H du
// décret 2000-150, publiées « dans une édition spéciale » absente du recueil IORT 2012 : à comparer dès qu'on les a.
import { writeFileSync, mkdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const R = "#C2382B", B = "#1F5FA8", J = "#F2B705", N = "#0E2238", W = "#fff";

// ---- formes ----
const triangle = p => `<path d="M50 8 94 86H6z" fill="${W}" stroke="${R}" stroke-width="9" stroke-linejoin="round"/>${p}`;
const triangleBas = p => `<path d="M6 12h88L50 90z" fill="${W}" stroke="${R}" stroke-width="9" stroke-linejoin="round"/>${p}`;
const rond = (fond, bord, p) => `<circle cx="50" cy="50" r="43" fill="${fond}"${bord ? ` stroke="${bord}" stroke-width="9"` : ""}/>${p}`;
const carre = (p, fond = B) => `<rect x="7" y="7" width="86" height="86" rx="8" fill="${fond}"/><rect x="11" y="11" width="78" height="78" rx="5" fill="none" stroke="${W}" stroke-width="2"/>${p}`;
const trait = (d, c = N, w = 7) => `<path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const fleche = (d, c = W, w = 9) => trait(d, c, w);
const voiture = (x, y, c, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})" fill="${c}"><path d="M-12 4v-6l4-7h16l4 7v6z"/><circle cx="-7" cy="5" r="3"/><circle cx="7" cy="5" r="3"/></g>`;
const pieton = c => `<g fill="${c}"><circle cx="52" cy="38" r="5"/></g>${trait("M50 45l-3 14 7 7 2 12M47 59l-7 15M50 48l10 6M50 48l-8 7", c, 5)}`;

// ---- liste : id, famille (art. 13 du décret 2000-150), nom FR/AR, sens FR/AR, source ----
const P = [
  // A — danger (triangle pointe en haut, bord rouge)
  ["A-virage", "A", "Virage à droite", "منعرج إلى اليمين", "Annonce un virage dangereux vers la droite : ralentir.", "يعلن عن منعرج خطير نحو اليمين: خفّف السرعة.", "Décret 2000-150, art. 15 à 18 (annexe A)",
    triangle(trait("M42 76V58c0-10 6-16 16-20", N, 7) + trait("M52 34l7 4-4 7", N, 6))],
  ["A-intersection", "A", "Intersection : priorité à droite", "تقاطع: الأولوية لليمين", "Intersection où s'applique la priorité à droite : céder le passage aux véhicules venant de droite.", "تقاطع تُطبَّق فيه الأولوية لليمين: أعط الأولوية للعربات القادمة من اليمين.", "Décret 2000-150, annexe A ; Code de la route, art. 28",
    triangle(trait("M38 46l24 30M62 46L38 76", N, 7))],
  ["A-pietons", "A", "Passage pour piétons", "ممر للمترجلين", "Annonce un passage pour piétons : ralentir et céder le passage aux piétons engagés.", "يعلن عن ممر للمترجلين: خفّف السرعة وأعط الأولوية للمترجلين.", "Décret 2000-150, annexe A et art. 40",
    triangle(`<g transform="translate(0 6) scale(.9) translate(5 0)">${pieton(N)}</g>`)],
  ["A-giratoire", "A", "Carrefour à sens giratoire", "مفترق دوراني", "Annonce un giratoire : céder le passage aux usagers qui circulent déjà dans l'anneau.", "يعلن عن مفترق دوراني: أعط الأولوية لمن يجول داخل الدائرة.", "Décret 2000-150, art. 20 (annexe A)",
    triangle(trait("M40 66a12 12 0 0 1 4-18M56 47a12 12 0 0 1 6 16M58 72a12 12 0 0 1-16 1", N, 5) + trait("M41 44l3 4 5-2M64 59l-2 5-5-1M41 76l1-4 5 0", N, 4))],
  ["A-glissante", "A", "Chaussée glissante", "طريق زلقة", "La chaussée peut être glissante (pluie, huile, gravier) : ralentir, freiner en douceur.", "قد تكون الطريق زلقة (مطر، زيت، حصى): خفّف السرعة وافرمل بلطف.", "Décret 2000-150, annexe A",
    triangle(voiture(50, 50, N, 1.1) + trait("M36 76c4-6 8 6 12 0s8-6 12 0", N, 4) + trait("M40 66c2-4 4 4 6 0M56 66c2-4 4 4 6 0", N, 3))],
  ["A-passage-niveau", "A", "Passage à niveau avec barrières", "ممر على السكة الحديدية بحواجز", "Annonce un passage à niveau muni de barrières : ralentir, s'arrêter si les feux rouges clignotent.", "يعلن عن ممر على السكة الحديدية بحواجز: خفّف وتوقف إذا اشتعلت الأضواء الحمراء.", "Décret 2000-150, annexe A et art. 11",
    triangle(`<rect x="30" y="52" width="40" height="18" fill="${N}"/>` + trait("M34 52v18M42 52v18M50 52v18M58 52v18M66 52v18", W, 3) + `<rect x="30" y="70" width="4" height="10" fill="${N}"/><rect x="66" y="70" width="4" height="10" fill="${N}"/>`)],
  ["A-autres", "A", "Autres dangers", "أخطار أخرى", "Danger dont la nature peut être précisée par un panonceau : vigilance et ralentissement.", "خطر يمكن توضيح نوعه بلوحة إضافية: يقظة وتخفيف السرعة.", "Décret 2000-150, art. 14 et 15",
    triangle(trait("M50 38v22", N, 9) + `<circle cx="50" cy="72" r="5" fill="${N}"/>`)],
  // B — priorité
  ["B-cedez", "B", "Cédez le passage", "أعط الأولوية", "À l'intersection, céder le passage aux véhicules de la route abordée (s'arrêter si besoin).", "في التقاطع، أعط الأولوية للعربات التي تجول في الطريق الأخرى (توقف عند الحاجة).", "Décret 2000-150, art. 19 à 21 (annexe B) et art. 36",
    triangleBas("")],
  ["B-stop", "B", "Arrêt obligatoire (STOP)", "قف (الوقوف الإجباري)", "Arrêt obligatoire à la limite de la chaussée abordée, puis passer seulement sans danger.", "الوقوف إجباري عند حافة الطريق، ثم المرور فقط إذا لم يكن هناك خطر.", "Code de la route, art. 29 ; décret 2000-150, annexe B",
    `<path d="M33 6h34l27 27v34L67 94H33L6 67V33z" fill="${R}" stroke="${W}" stroke-width="4"/><text x="50" y="59" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="25" fill="${W}">STOP</text>`],
  ["B-prioritaire", "B", "Route prioritaire", "طريق ذات أولوية", "Vous avez la priorité aux prochaines intersections (exception à la priorité à droite).", "لك الأولوية في التقاطعات القادمة (استثناء من الأولوية لليمين).", "Code de la route, art. 28 (al. 2) ; décret 2000-150, annexe B",
    `<path d="M50 6l44 44-44 44L6 50z" fill="${W}" stroke="${N}" stroke-width="2"/><path d="M50 20l30 30-30 30-30-30z" fill="${J}"/>`],
  ["B-fin-prioritaire", "B", "Fin de route prioritaire", "نهاية الطريق ذات الأولوية", "Vous n'avez plus la priorité : les règles générales (priorité à droite) s'appliquent de nouveau.", "لم تعد لك الأولوية: تعود القواعد العامة (الأولوية لليمين).", "Code de la route, art. 28 ; décret 2000-150, annexe B",
    `<path d="M50 6l44 44-44 44L6 50z" fill="${W}" stroke="${N}" stroke-width="2"/><path d="M50 20l30 30-30 30-30-30z" fill="${J}"/>` + trait("M28 72L72 28", N, 7)],
  ["B-intersection-prio", "B", "Intersection avec une route non prioritaire", "تقاطع مع طريق غير ذات أولوية", "À la prochaine intersection, vous avez la priorité sur la route qui la croise.", "في التقاطع القادم، لك الأولوية على الطريق التي تقطعها.", "Décret 2000-150, annexe B",
    triangle(trait("M50 36v42", N, 9) + trait("M36 58h28", N, 4))],
  // C — interdiction
  ["C-sens-interdit", "C", "Sens interdit", "اتجاه ممنوع", "Interdit d'entrer dans cette voie pour tous les véhicules.", "يُمنع الدخول إلى هذه الطريق على كل العربات.", "Décret 2000-150, art. 22 à 25 (annexe C) ; décret 2010-262, n° 4",
    rond(R, "", `<rect x="22" y="42" width="56" height="16" rx="2" fill="${W}"/>`)],
  ["C-interdit-tous", "C", "Circulation interdite à tout véhicule", "الجولان ممنوع على كل العربات", "Aucun véhicule ne doit circuler dans les deux sens à partir de ce panneau.", "يُمنع جولان كل العربات في الاتجاهين ابتداءً من هذه العلامة.", "Décret 2000-150, art. 23 et 25 (annexe C)",
    rond(W, R, "")],
  ["C-depasser", "C", "Interdiction de dépasser", "ممنوع التجاوز", "Interdit de dépasser les véhicules à moteur autres que les deux-roues, jusqu'au panneau de fin.", "يُمنع تجاوز العربات ذات المحرك غير ذات العجلتين، إلى غاية علامة النهاية.", "Décret 2000-150, annexe C ; Code de la route, art. 86 (dépassement interdit)",
    rond(W, R, voiture(36, 50, R, 1.05) + voiture(64, 50, N, 1.05))],
  ["C-vitesse", "C", "Limitation de vitesse", "تحديد السرعة", "Vitesse maximale autorisée à partir du panneau (ici l'exemple 50 km/h).", "السرعة القصوى المسموح بها ابتداءً من العلامة (هنا مثال 50 كم/س).", "Décret 2000-150, art. 23 et 25 (annexe C) ; décret 2000-151, art. 5 à 13",
    rond(W, R, `<text x="50" y="62" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="34" fill="${N}">50</text>`)],
  ["C-gauche", "C", "Interdiction de tourner à gauche", "ممنوع الانعطاف إلى اليسار", "Interdit de tourner à gauche à la prochaine intersection.", "يُمنع الانعطاف إلى اليسار في التقاطع القادم.", "Décret 2000-150, annexe C",
    rond(W, R, trait("M58 74V48c0-6-4-10-10-10H34", N, 7) + trait("M42 30l-9 8 9 8", N, 6) + trait("M28 70L72 30", R, 7))],
  ["C-klaxon", "C", "Signaux sonores interdits", "ممنوع استعمال المنبه الصوتي", "Interdit d'utiliser l'avertisseur sonore (klaxon), sauf pour éviter un accident.", "يُمنع استعمال المنبه الصوتي، إلا لتفادي حادث.", "Décret 2000-150, annexe C ; Code de la route, art. 33 à 36",
    rond(W, R, `<path d="M30 44h8l14-10v32L38 56h-8z" fill="${N}"/>` + trait("M60 40c4 6 4 14 0 20M66 34c7 10 7 22 0 32", N, 4) + trait("M28 70L72 30", R, 7))],
  ["C-fin", "C", "Fin de toutes les interdictions", "نهاية كل الممنوعات", "Les interdictions signalées auparavant cessent de s'appliquer.", "تنتهي الممنوعات المعلن عنها سابقًا.", "Décret 2000-150, art. 23 (annexe C)",
    rond(W, N, trait("M28 72L72 28", N, 5)).replace(`stroke-width="9"`, `stroke-width="3"`)],
  // D — obligation (rond bleu)
  ["D-droite", "D", "Direction obligatoire à droite", "اتجاه إجباري إلى اليمين", "À la prochaine intersection, seule la direction à droite est permise.", "في التقاطع القادم، الاتجاه إلى اليمين فقط مسموح به.", "Décret 2000-150, art. 26 à 28 (annexe D)",
    rond(B, "", fleche("M38 72V50c0-6 4-10 10-10h16") + fleche("M58 30l10 10-10 10", W, 8))],
  ["D-tout-droit", "D", "Direction obligatoire tout droit", "اتجاه إجباري إلى الأمام", "Seule la direction tout droit est permise.", "الاتجاه إلى الأمام فقط مسموح به.", "Décret 2000-150, annexe D",
    rond(B, "", fleche("M50 76V28") + fleche("M38 38l12-12 12 12", W, 8))],
  ["D-contournement", "D", "Contournement obligatoire par la droite", "الاجتياز الإجباري من اليمين", "Passer obligatoirement à droite de l'obstacle ou de l'îlot.", "المرور إجباريًا على يمين الحاجز أو الجزيرة.", "Décret 2000-150, annexe D ; Code de la route, art. 12",
    rond(B, "", fleche("M34 34l30 30") + fleche("M48 66h18V48", W, 8))],
  ["D-cycles", "D", "Piste obligatoire pour cycles", "مسلك إجباري للدراجات", "Voie réservée aux cycles et obligatoire pour eux.", "مسلك مخصّص للدراجات وإجباري لها.", "Décret 2000-150, annexe D ; Code de la route, art. 52",
    rond(B, "", `<circle cx="34" cy="60" r="11" fill="none" stroke="${W}" stroke-width="4"/><circle cx="66" cy="60" r="11" fill="none" stroke="${W}" stroke-width="4"/>` + trait("M34 60l10-18h16l6 18M44 42l8 18h-18M56 36h8", W, 4))],
  ["D-fin", "D", "Fin d'obligation (exemple : fin de piste cyclable)", "نهاية الإجبار (مثال: نهاية مسلك الدراجات)", "L'obligation signalée auparavant cesse.", "ينتهي الإجبار المعلن عنه سابقًا.", "Décret 2000-150, art. 26 à 28 (annexe D)",
    rond(B, "", `<circle cx="34" cy="60" r="11" fill="none" stroke="${W}" stroke-width="4"/><circle cx="66" cy="60" r="11" fill="none" stroke="${W}" stroke-width="4"/>` + trait("M34 60l10-18h16l6 18M44 42l8 18h-18", W, 4) + trait("M24 76L76 24", R, 7))],
  // E — arrêt et stationnement (rond bleu bord rouge)
  ["E-stationnement", "E", "Stationnement interdit", "الوقوف ممنوع", "Interdit de stationner du côté où se trouve le panneau ; l'arrêt bref reste possible.", "يُمنع الوقوف في جهة العلامة؛ يبقى التوقف القصير ممكنًا.", "Décret 2000-150, art. 29 (annexe E) ; décret 2010-262, n° 47",
    rond(B, R, trait("M24 76L76 24", R, 8))],
  ["E-arret", "E", "Arrêt et stationnement interdits", "التوقف والوقوف ممنوعان", "Interdit de s'arrêter et de stationner du côté où se trouve le panneau.", "يُمنع التوقف والوقوف في جهة العلامة.", "Décret 2000-150, art. 29 (annexe E) ; décret 2010-262, n° 49",
    rond(B, R, trait("M24 76L76 24M24 24l52 52", R, 8))],
  // F — indication (carré bleu)
  ["F-parking", "F", "Lieu aménagé pour le stationnement", "مكان مهيأ للوقوف", "Indique un parking ou un emplacement de stationnement.", "يشير إلى مأوى أو مكان مهيأ للوقوف.", "Décret 2000-150, art. 30 (annexe F)",
    carre(`<text x="50" y="70" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-weight="700" font-size="52" fill="${W}">P</text>`)],
  ["F-pietons", "F", "Passage pour piétons", "ممر للمترجلين", "Indique l'emplacement d'un passage pour piétons : céder le passage aux piétons engagés.", "يشير إلى مكان ممر المترجلين: أعط الأولوية للمترجلين.", "Décret 2000-150, art. 30 et 40",
    carre(`<path d="M50 16 84 80H16z" fill="${W}"/><g transform="translate(0 8) scale(.85) translate(9 0)">${pieton(N)}</g>`)],
  ["F-sens-unique", "F", "Route à sens unique", "طريق ذات اتجاه وحيد", "La circulation se fait dans un seul sens, celui de la flèche.", "الجولان في اتجاه واحد هو اتجاه السهم.", "Décret 2000-150, art. 30 (annexe F)",
    carre(`<rect x="18" y="40" width="64" height="20" fill="${W}"/>` + `<path d="M58 34l20 16-20 16z" fill="${W}"/>` + `<rect x="18" y="40" width="46" height="20" fill="${W}"/><path d="M24 50h34" stroke="${B}" stroke-width="0"/>`)],
  ["F-impasse", "F", "Impasse", "طريق مسدودة", "Voie sans issue : il faudra faire demi-tour.", "طريق بلا منفذ: يجب الرجوع.", "Décret 2000-150, art. 30 (annexe F)",
    carre(`<rect x="42" y="38" width="16" height="44" fill="${W}"/><rect x="26" y="20" width="48" height="16" fill="${R}"/>`)],
  ["F-autoroute", "F", "Début d'autoroute", "بداية الطريق السيارة", "Les règles des autoroutes s'appliquent (vitesse minimale, pas de marche arrière ni de demi-tour).", "تُطبَّق قواعد الطرقات السيارة (سرعة دنيا، لا رجوع إلى الخلف ولا دوران).", "Décret 2000-150, art. 30 ; décret 2000-151, art. 45 à 49",
    carre(`<path d="M34 84l10-50h12l10 50z" fill="${W}"/><path d="M50 40v8M50 56v10M50 74v8" stroke="${B}" stroke-width="3"/><path d="M22 36c8-14 48-14 56 0" fill="none" stroke="${W}" stroke-width="6"/>`)],
];

const FAMILLES = {
  A: { fr: "Signaux de danger", ar: "علامات الخطر", art: "Décret 2000-150, art. 15 à 18", regle_fr: "Triangle à bord rouge. Placés à environ 150 m du danger hors agglomération et 50 m en agglomération. Ils imposent une vigilance spéciale et un ralentissement.", regle_ar: "مثلث بحافة حمراء. توضع على بعد نحو 150 م من الخطر خارج المناطق العمرانية و50 م داخلها. تفرض يقظة خاصة وتخفيض السرعة." },
  B: { fr: "Signaux de priorité", ar: "علامات الأولوية", art: "Décret 2000-150, art. 19 à 21", regle_fr: "Ils disent qui passe en premier à l'intersection : céder le passage, s'arrêter (STOP) ou avoir la priorité.", regle_ar: "تحدد من يمر أولًا في التقاطع: إعطاء الأولوية، الوقوف (قف) أو التمتع بالأولوية." },
  C: { fr: "Interdiction et fin d'interdiction", ar: "علامات المنع ونهاية المنع", art: "Décret 2000-150, art. 22 à 25", regle_fr: "L'interdiction commence au panneau et cesse au panneau de fin d'interdiction.", regle_ar: "يبدأ المنع من العلامة وينتهي عند علامة نهاية المنع." },
  D: { fr: "Obligation et fin d'obligation", ar: "علامات الإجبار ونهاية الإجبار", art: "Décret 2000-150, art. 26 à 28", regle_fr: "Rond bleu : ce que vous devez faire. Un panonceau peut annoncer la distance.", regle_ar: "دائرة زرقاء: ما يجب عليك فعله. يمكن للوحة إضافية أن تعلن عن المسافة." },
  E: { fr: "Arrêt et stationnement", ar: "علامات التوقف والوقوف", art: "Décret 2000-150, art. 29", regle_fr: "Rond bleu à bord rouge : une barre interdit le stationnement, une croix interdit l'arrêt et le stationnement.", regle_ar: "دائرة زرقاء بحافة حمراء: خط واحد يمنع الوقوف، وعلامة X تمنع التوقف والوقوف." },
  F: { fr: "Indication", ar: "علامات الإرشاد", art: "Décret 2000-150, art. 30", regle_fr: "Carré ou rectangle : ils informent (parking, sens unique, autoroute…).", regle_ar: "مربع أو مستطيل: للإعلام (مأوى، اتجاه وحيد، طريق سيارة…)." },
};

mkdirSync(join(root, "assets/panneaux"), { recursive: true });
const liste = P.map(([id, famille, fr, ar, sens_fr, sens_ar, source, dessin]) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="${fr}">${dessin}</svg>\n`;
  writeFileSync(join(root, `assets/panneaux/${id}.svg`), svg);
  return { id, famille, fr, ar, sens_fr, sens_ar, source };
});
writeFileSync(join(root, "assets/panneaux.js"),
  `/* FABRIQUÉ par tools/construire_panneaux.mjs — ne pas modifier à la main.\n` +
  `   Dessins faits par nous ; modèles officiels = annexes A à H du décret 2000-150 (non publiées dans le recueil IORT 2012) : à comparer. */\n` +
  `var PANNEAUX_FAMILLES = ${JSON.stringify(FAMILLES, null, 1)};\nvar PANNEAUX = ${JSON.stringify(liste, null, 1)};\n` +
  `if (typeof module !== "undefined") module.exports = { PANNEAUX, PANNEAUX_FAMILLES };\n`);
console.log(`${liste.length} panneaux écrits dans assets/panneaux/ et assets/panneaux.js`);
