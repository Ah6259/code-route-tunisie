/* FABRIQUÉ par tools/construire_panneaux.mjs — ne pas modifier à la main.
   Dessins faits par nous ; modèles officiels = annexes A à H du décret 2000-150 (non publiées dans le recueil IORT 2012) : à comparer. */
var PANNEAUX_FAMILLES = {
 "A": {
  "fr": "Signaux de danger",
  "ar": "علامات الخطر",
  "art": "Décret 2000-150, art. 15 à 18",
  "regle_fr": "Triangle à bord rouge. Placés à environ 150 m du danger hors agglomération et 50 m en agglomération. Ils imposent une vigilance spéciale et un ralentissement.",
  "regle_ar": "مثلث بحافة حمراء. توضع على بعد نحو 150 م من الخطر خارج المناطق العمرانية و50 م داخلها. تفرض يقظة خاصة وتخفيض السرعة."
 },
 "B": {
  "fr": "Signaux de priorité",
  "ar": "علامات الأولوية",
  "art": "Décret 2000-150, art. 19 à 21",
  "regle_fr": "Ils disent qui passe en premier à l'intersection : céder le passage, s'arrêter (STOP) ou avoir la priorité.",
  "regle_ar": "تحدد من يمر أولًا في التقاطع: إعطاء الأولوية، الوقوف (قف) أو التمتع بالأولوية."
 },
 "C": {
  "fr": "Interdiction et fin d'interdiction",
  "ar": "علامات المنع ونهاية المنع",
  "art": "Décret 2000-150, art. 22 à 25",
  "regle_fr": "L'interdiction commence au panneau et cesse au panneau de fin d'interdiction.",
  "regle_ar": "يبدأ المنع من العلامة وينتهي عند علامة نهاية المنع."
 },
 "D": {
  "fr": "Obligation et fin d'obligation",
  "ar": "علامات الإجبار ونهاية الإجبار",
  "art": "Décret 2000-150, art. 26 à 28",
  "regle_fr": "Rond bleu : ce que vous devez faire. Un panonceau peut annoncer la distance.",
  "regle_ar": "دائرة زرقاء: ما يجب عليك فعله. يمكن للوحة إضافية أن تعلن عن المسافة."
 },
 "E": {
  "fr": "Arrêt et stationnement",
  "ar": "علامات التوقف والوقوف",
  "art": "Décret 2000-150, art. 29",
  "regle_fr": "Rond bleu à bord rouge : une barre interdit le stationnement, une croix interdit l'arrêt et le stationnement.",
  "regle_ar": "دائرة زرقاء بحافة حمراء: خط واحد يمنع الوقوف، وعلامة X تمنع التوقف والوقوف."
 },
 "F": {
  "fr": "Indication",
  "ar": "علامات الإرشاد",
  "art": "Décret 2000-150, art. 30",
  "regle_fr": "Carré ou rectangle : ils informent (parking, sens unique, autoroute…).",
  "regle_ar": "مربع أو مستطيل: للإعلام (مأوى، اتجاه وحيد، طريق سيارة…)."
 }
};
var PANNEAUX = [
 {
  "id": "A-virage",
  "famille": "A",
  "fr": "Virage à droite",
  "ar": "منعرج إلى اليمين",
  "sens_fr": "Annonce un virage dangereux vers la droite : ralentir.",
  "sens_ar": "يعلن عن منعرج خطير نحو اليمين: خفّف السرعة.",
  "source": "Décret 2000-150, art. 15 à 18 (annexe A)"
 },
 {
  "id": "A-intersection",
  "famille": "A",
  "fr": "Intersection : priorité à droite",
  "ar": "تقاطع: الأولوية لليمين",
  "sens_fr": "Intersection où s'applique la priorité à droite : céder le passage aux véhicules venant de droite.",
  "sens_ar": "تقاطع تُطبَّق فيه الأولوية لليمين: أعط الأولوية للعربات القادمة من اليمين.",
  "source": "Décret 2000-150, annexe A ; Code de la route, art. 28"
 },
 {
  "id": "A-pietons",
  "famille": "A",
  "fr": "Passage pour piétons",
  "ar": "ممر للمترجلين",
  "sens_fr": "Annonce un passage pour piétons : ralentir et céder le passage aux piétons engagés.",
  "sens_ar": "يعلن عن ممر للمترجلين: خفّف السرعة وأعط الأولوية للمترجلين.",
  "source": "Décret 2000-150, annexe A et art. 40"
 },
 {
  "id": "A-giratoire",
  "famille": "A",
  "fr": "Carrefour à sens giratoire",
  "ar": "مفترق دوراني",
  "sens_fr": "Annonce un giratoire : céder le passage aux usagers qui circulent déjà dans l'anneau.",
  "sens_ar": "يعلن عن مفترق دوراني: أعط الأولوية لمن يجول داخل الدائرة.",
  "source": "Décret 2000-150, art. 20 (annexe A)"
 },
 {
  "id": "A-glissante",
  "famille": "A",
  "fr": "Chaussée glissante",
  "ar": "طريق زلقة",
  "sens_fr": "La chaussée peut être glissante (pluie, huile, gravier) : ralentir, freiner en douceur.",
  "sens_ar": "قد تكون الطريق زلقة (مطر، زيت، حصى): خفّف السرعة وافرمل بلطف.",
  "source": "Décret 2000-150, annexe A"
 },
 {
  "id": "A-passage-niveau",
  "famille": "A",
  "fr": "Passage à niveau avec barrières",
  "ar": "ممر على السكة الحديدية بحواجز",
  "sens_fr": "Annonce un passage à niveau muni de barrières : ralentir, s'arrêter si les feux rouges clignotent.",
  "sens_ar": "يعلن عن ممر على السكة الحديدية بحواجز: خفّف وتوقف إذا اشتعلت الأضواء الحمراء.",
  "source": "Décret 2000-150, annexe A et art. 11"
 },
 {
  "id": "A-autres",
  "famille": "A",
  "fr": "Autres dangers",
  "ar": "أخطار أخرى",
  "sens_fr": "Danger dont la nature peut être précisée par un panonceau : vigilance et ralentissement.",
  "sens_ar": "خطر يمكن توضيح نوعه بلوحة إضافية: يقظة وتخفيف السرعة.",
  "source": "Décret 2000-150, art. 14 et 15"
 },
 {
  "id": "B-cedez",
  "famille": "B",
  "fr": "Cédez le passage",
  "ar": "أعط الأولوية",
  "sens_fr": "À l'intersection, céder le passage aux véhicules de la route abordée (s'arrêter si besoin).",
  "sens_ar": "في التقاطع، أعط الأولوية للعربات التي تجول في الطريق الأخرى (توقف عند الحاجة).",
  "source": "Décret 2000-150, art. 19 à 21 (annexe B) et art. 36"
 },
 {
  "id": "B-stop",
  "famille": "B",
  "fr": "Arrêt obligatoire (STOP)",
  "ar": "قف (الوقوف الإجباري)",
  "sens_fr": "Arrêt obligatoire à la limite de la chaussée abordée, puis passer seulement sans danger.",
  "sens_ar": "الوقوف إجباري عند حافة الطريق، ثم المرور فقط إذا لم يكن هناك خطر.",
  "source": "Code de la route, art. 29 ; décret 2000-150, annexe B"
 },
 {
  "id": "B-prioritaire",
  "famille": "B",
  "fr": "Route prioritaire",
  "ar": "طريق ذات أولوية",
  "sens_fr": "Vous avez la priorité aux prochaines intersections (exception à la priorité à droite).",
  "sens_ar": "لك الأولوية في التقاطعات القادمة (استثناء من الأولوية لليمين).",
  "source": "Code de la route, art. 28 (al. 2) ; décret 2000-150, annexe B"
 },
 {
  "id": "B-fin-prioritaire",
  "famille": "B",
  "fr": "Fin de route prioritaire",
  "ar": "نهاية الطريق ذات الأولوية",
  "sens_fr": "Vous n'avez plus la priorité : les règles générales (priorité à droite) s'appliquent de nouveau.",
  "sens_ar": "لم تعد لك الأولوية: تعود القواعد العامة (الأولوية لليمين).",
  "source": "Code de la route, art. 28 ; décret 2000-150, annexe B"
 },
 {
  "id": "B-intersection-prio",
  "famille": "B",
  "fr": "Intersection avec une route non prioritaire",
  "ar": "تقاطع مع طريق غير ذات أولوية",
  "sens_fr": "À la prochaine intersection, vous avez la priorité sur la route qui la croise.",
  "sens_ar": "في التقاطع القادم، لك الأولوية على الطريق التي تقطعها.",
  "source": "Décret 2000-150, annexe B"
 },
 {
  "id": "C-sens-interdit",
  "famille": "C",
  "fr": "Sens interdit",
  "ar": "اتجاه ممنوع",
  "sens_fr": "Interdit d'entrer dans cette voie pour tous les véhicules.",
  "sens_ar": "يُمنع الدخول إلى هذه الطريق على كل العربات.",
  "source": "Décret 2000-150, art. 22 à 25 (annexe C) ; décret 2010-262, n° 4"
 },
 {
  "id": "C-interdit-tous",
  "famille": "C",
  "fr": "Circulation interdite à tout véhicule",
  "ar": "الجولان ممنوع على كل العربات",
  "sens_fr": "Aucun véhicule ne doit circuler dans les deux sens à partir de ce panneau.",
  "sens_ar": "يُمنع جولان كل العربات في الاتجاهين ابتداءً من هذه العلامة.",
  "source": "Décret 2000-150, art. 23 et 25 (annexe C)"
 },
 {
  "id": "C-depasser",
  "famille": "C",
  "fr": "Interdiction de dépasser",
  "ar": "ممنوع التجاوز",
  "sens_fr": "Interdit de dépasser les véhicules à moteur autres que les deux-roues, jusqu'au panneau de fin.",
  "sens_ar": "يُمنع تجاوز العربات ذات المحرك غير ذات العجلتين، إلى غاية علامة النهاية.",
  "source": "Décret 2000-150, annexe C ; Code de la route, art. 86 (dépassement interdit)"
 },
 {
  "id": "C-vitesse",
  "famille": "C",
  "fr": "Limitation de vitesse",
  "ar": "تحديد السرعة",
  "sens_fr": "Vitesse maximale autorisée à partir du panneau (ici l'exemple 50 km/h).",
  "sens_ar": "السرعة القصوى المسموح بها ابتداءً من العلامة (هنا مثال 50 كم/س).",
  "source": "Décret 2000-150, art. 23 et 25 (annexe C) ; décret 2000-151, art. 5 à 13"
 },
 {
  "id": "C-gauche",
  "famille": "C",
  "fr": "Interdiction de tourner à gauche",
  "ar": "ممنوع الانعطاف إلى اليسار",
  "sens_fr": "Interdit de tourner à gauche à la prochaine intersection.",
  "sens_ar": "يُمنع الانعطاف إلى اليسار في التقاطع القادم.",
  "source": "Décret 2000-150, annexe C"
 },
 {
  "id": "C-klaxon",
  "famille": "C",
  "fr": "Signaux sonores interdits",
  "ar": "ممنوع استعمال المنبه الصوتي",
  "sens_fr": "Interdit d'utiliser l'avertisseur sonore (klaxon), sauf pour éviter un accident.",
  "sens_ar": "يُمنع استعمال المنبه الصوتي، إلا لتفادي حادث.",
  "source": "Décret 2000-150, annexe C ; Code de la route, art. 33 à 36"
 },
 {
  "id": "C-fin",
  "famille": "C",
  "fr": "Fin de toutes les interdictions",
  "ar": "نهاية كل الممنوعات",
  "sens_fr": "Les interdictions signalées auparavant cessent de s'appliquer.",
  "sens_ar": "تنتهي الممنوعات المعلن عنها سابقًا.",
  "source": "Décret 2000-150, art. 23 (annexe C)"
 },
 {
  "id": "D-droite",
  "famille": "D",
  "fr": "Direction obligatoire à droite",
  "ar": "اتجاه إجباري إلى اليمين",
  "sens_fr": "À la prochaine intersection, seule la direction à droite est permise.",
  "sens_ar": "في التقاطع القادم، الاتجاه إلى اليمين فقط مسموح به.",
  "source": "Décret 2000-150, art. 26 à 28 (annexe D)"
 },
 {
  "id": "D-tout-droit",
  "famille": "D",
  "fr": "Direction obligatoire tout droit",
  "ar": "اتجاه إجباري إلى الأمام",
  "sens_fr": "Seule la direction tout droit est permise.",
  "sens_ar": "الاتجاه إلى الأمام فقط مسموح به.",
  "source": "Décret 2000-150, annexe D"
 },
 {
  "id": "D-contournement",
  "famille": "D",
  "fr": "Contournement obligatoire par la droite",
  "ar": "الاجتياز الإجباري من اليمين",
  "sens_fr": "Passer obligatoirement à droite de l'obstacle ou de l'îlot.",
  "sens_ar": "المرور إجباريًا على يمين الحاجز أو الجزيرة.",
  "source": "Décret 2000-150, annexe D ; Code de la route, art. 12"
 },
 {
  "id": "D-cycles",
  "famille": "D",
  "fr": "Piste obligatoire pour cycles",
  "ar": "مسلك إجباري للدراجات",
  "sens_fr": "Voie réservée aux cycles et obligatoire pour eux.",
  "sens_ar": "مسلك مخصّص للدراجات وإجباري لها.",
  "source": "Décret 2000-150, annexe D ; Code de la route, art. 52"
 },
 {
  "id": "D-fin",
  "famille": "D",
  "fr": "Fin d'obligation (exemple : fin de piste cyclable)",
  "ar": "نهاية الإجبار (مثال: نهاية مسلك الدراجات)",
  "sens_fr": "L'obligation signalée auparavant cesse.",
  "sens_ar": "ينتهي الإجبار المعلن عنه سابقًا.",
  "source": "Décret 2000-150, art. 26 à 28 (annexe D)"
 },
 {
  "id": "E-stationnement",
  "famille": "E",
  "fr": "Stationnement interdit",
  "ar": "الوقوف ممنوع",
  "sens_fr": "Interdit de stationner du côté où se trouve le panneau ; l'arrêt bref reste possible.",
  "sens_ar": "يُمنع الوقوف في جهة العلامة؛ يبقى التوقف القصير ممكنًا.",
  "source": "Décret 2000-150, art. 29 (annexe E) ; décret 2010-262, n° 47"
 },
 {
  "id": "E-arret",
  "famille": "E",
  "fr": "Arrêt et stationnement interdits",
  "ar": "التوقف والوقوف ممنوعان",
  "sens_fr": "Interdit de s'arrêter et de stationner du côté où se trouve le panneau.",
  "sens_ar": "يُمنع التوقف والوقوف في جهة العلامة.",
  "source": "Décret 2000-150, art. 29 (annexe E) ; décret 2010-262, n° 49"
 },
 {
  "id": "F-parking",
  "famille": "F",
  "fr": "Lieu aménagé pour le stationnement",
  "ar": "مكان مهيأ للوقوف",
  "sens_fr": "Indique un parking ou un emplacement de stationnement.",
  "sens_ar": "يشير إلى مأوى أو مكان مهيأ للوقوف.",
  "source": "Décret 2000-150, art. 30 (annexe F)"
 },
 {
  "id": "F-pietons",
  "famille": "F",
  "fr": "Passage pour piétons",
  "ar": "ممر للمترجلين",
  "sens_fr": "Indique l'emplacement d'un passage pour piétons : céder le passage aux piétons engagés.",
  "sens_ar": "يشير إلى مكان ممر المترجلين: أعط الأولوية للمترجلين.",
  "source": "Décret 2000-150, art. 30 et 40"
 },
 {
  "id": "F-sens-unique",
  "famille": "F",
  "fr": "Route à sens unique",
  "ar": "طريق ذات اتجاه وحيد",
  "sens_fr": "La circulation se fait dans un seul sens, celui de la flèche.",
  "sens_ar": "الجولان في اتجاه واحد هو اتجاه السهم.",
  "source": "Décret 2000-150, art. 30 (annexe F)"
 },
 {
  "id": "F-impasse",
  "famille": "F",
  "fr": "Impasse",
  "ar": "طريق مسدودة",
  "sens_fr": "Voie sans issue : il faudra faire demi-tour.",
  "sens_ar": "طريق بلا منفذ: يجب الرجوع.",
  "source": "Décret 2000-150, art. 30 (annexe F)"
 },
 {
  "id": "F-autoroute",
  "famille": "F",
  "fr": "Début d'autoroute",
  "ar": "بداية الطريق السيارة",
  "sens_fr": "Les règles des autoroutes s'appliquent (vitesse minimale, pas de marche arrière ni de demi-tour).",
  "sens_ar": "تُطبَّق قواعد الطرقات السيارة (سرعة دنيا، لا رجوع إلى الخلف ولا دوران).",
  "source": "Décret 2000-150, art. 30 ; décret 2000-151, art. 45 à 49"
 }
];
if (typeof module !== "undefined") module.exports = { PANNEAUX, PANNEAUX_FAMILLES };
