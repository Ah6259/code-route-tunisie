/* Amendes et sanctions — à partir des textes officiels.
   RÈGLE : aucun montant par contravention n'est affiché tant que le décret qui répartit les contraventions dans les
   3 catégories de 2025 n'a pas été trouvé au JORT. Les montants affichés sont seulement :
     - le barème 2025 (loi n° 2024-48, art. 49, JORT n° 149 du 10 décembre 2024) : 20 / 40 / 60 DT ;
     - les peines des délits écrites dans la loi (Code de la route, art. 85 à 87, version 2009 du recueil IORT 2012).
   Le test (tools/test_site.mjs) vérifie qu'aucun autre montant n'apparaît. */
var AMENDES = {
  verification: {
    decret_repartition_trouve: false,   // passer à true + remplir "categorie_2025" de chaque contravention quand le décret est trouvé
    note_fr: "Montants par infraction en cours de vérification (loi de finances 2025) : le décret qui range chaque contravention dans les nouvelles catégories n'a pas encore été trouvé au Journal officiel.",
    note_ar: "مبالغ كل مخالفة قيد التثبت (قانون المالية لسنة 2025): لم نعثر بعد في الرائد الرسمي على الأمر الذي يصنّف كل مخالفة في الأصناف الجديدة."
  },
  bareme_2025: {
    source: "Loi n° 2024-48 du 9 décembre 2024 (loi de finances 2025), article 49 — JORT n° 149 du 10 décembre 2024 ; Code de la route, art. 83 (modifié)",
    categories: [
      { cat: 1, montant: 20 }, { cat: 2, montant: 40 }, { cat: 3, montant: 60 }
    ]
  },
  // Ancienne catégorie = celle du décret n° 2010-262 (tableau, sur 5 catégories). Ce n'est PAS un montant.
  contraventions: [
    { n: "16", fr: "Utiliser le téléphone mobile en conduisant (sauf mains libres)", ar: "استعمال الهاتف الجوال أثناء السياقة (إلا دون استعمال اليدين)", cat2010: 5, ref: "Décret 2000-151, art. 2" },
    { n: "4", fr: "Circuler en sens interdit", ar: "الجولان في اتجاه ممنوع", cat2010: 5, ref: "Décret 2000-150, annexe C" },
    { n: "13", fr: "Franchir ou chevaucher une ligne continue", ar: "اجتياز خط متواصل أو السير فوقه", cat2010: 4, ref: "Code de la route, art. 10" },
    { n: "17", fr: "Ne pas garder une distance de sécurité suffisante", ar: "عدم ترك مسافة أمان كافية", cat2010: 3, ref: "Code de la route, art. 14" },
    { n: "18", fr: "Excès de vitesse de moins de 20 km/h", ar: "تجاوز السرعة بأقل من 20 كم/س", cat2010: 4, ref: "Décret 2000-151, art. 5 à 13" },
    { n: "19", fr: "Excès de vitesse de 20 à moins de 50 km/h", ar: "تجاوز السرعة من 20 إلى أقل من 50 كم/س", cat2010: 5, ref: "Décret 2000-151, art. 5 à 13" },
    { n: "21 c", fr: "Ne pas ralentir près d'une école", ar: "عدم تخفيض السرعة قرب مدرسة", cat2010: 4, ref: "Décret 2000-151, art. 4" },
    { n: "24", fr: "Croiser par la gauche", ar: "الالتقاء من اليسار", cat2010: 5, ref: "Code de la route, art. 16" },
    { n: "26", fr: "Dépasser sans avertir les autres usagers", ar: "التجاوز دون تنبيه مستعملي الطريق", cat2010: 3, ref: "Code de la route, art. 19" },
    { n: "33", fr: "Ne pas respecter la priorité", ar: "عدم احترام الأولوية", cat2010: 5, ref: "Code de la route, art. 25 à 32" },
    { n: "34", fr: "Ne pas laisser passer une ambulance ou un véhicule prioritaire", ar: "عدم إفساح الطريق لسيارة إسعاف أو عربة ذات أولوية", cat2010: 5, ref: "Code de la route, art. 30" },
    { n: "39 c", fr: "En tournant, ne pas céder le passage aux piétons", ar: "عدم إعطاء الأولوية للمترجلين عند الانعطاف", cat2010: 3, ref: "Code de la route, art. 26" },
    { n: "40", fr: "S'engager dans une intersection bloquée", ar: "الدخول إلى تقاطع مكتظ", cat2010: 3, ref: "Code de la route, art. 27" },
    { n: "42", fr: "Klaxonner hors des cas autorisés", ar: "استعمال المنبه الصوتي في غير الحالات المسموح بها", cat2010: 2, ref: "Code de la route, art. 33, 35 et 36" },
    { n: "47", fr: "Stationner là où un panneau ou une marque l'interdit", ar: "الوقوف حيث تمنعه علامة أو علامة أرضية", cat2010: 2, ref: "Décret 2000-150, art. 29" },
    { n: "49", fr: "S'arrêter là où l'arrêt est interdit", ar: "التوقف حيث يُمنع التوقف", cat2010: 3, ref: "Décret 2000-150, art. 29" },
    { n: "51 d", fr: "Arrêt ou stationnement trop près d'une intersection", ar: "التوقف أو الوقوف قريبًا جدًا من تقاطع", cat2010: 4, ref: "Décret 2000-151, art. 20" },
    { n: "52 a", fr: "Stationner sur un trottoir ou un passage pour piétons", ar: "الوقوف على الرصيف أو على ممر المترجلين", cat2010: 3, ref: "Décret 2000-151, art. 21" },
    { n: "53 a", fr: "Stationner en double file", ar: "الوقوف في صف ثانٍ", cat2010: 3, ref: "Décret 2000-151, art. 22" },
    { n: "58", fr: "Rouler sans feux la nuit ou par brouillard", ar: "الجولان دون أضواء ليلًا أو في الضباب", cat2010: 5, ref: "Code de la route, art. 42" },
    { n: "59", fr: "Garder les feux de route en croisant ou en suivant un véhicule", ar: "الإبقاء على أضواء الطريق عند الالتقاء أو السير خلف عربة", cat2010: 5, ref: "Décret 2000-151, art. 27" },
    { n: "69", fr: "Ne pas mettre le clignotant avant une manœuvre", ar: "عدم استعمال ضوء تغيير الاتجاه قبل المناورة", cat2010: 2, ref: "Décret 2000-151, art. 40" },
    { n: "88", fr: "Moto sans casque (conducteur ou passager)", ar: "دراجة نارية دون خوذة (السائق أو المرافق)", cat2010: 4, ref: "Code de la route, art. 73" },
    { n: "93", fr: "Piéton : traverser sans attendre le signal qui le permet", ar: "المترجل: العبور دون انتظار الإشارة التي تسمح بذلك", cat2010: 3, ref: "Code de la route, art. 55" },
    { n: "111", fr: "Pneus usés (rainures de moins de 1 mm)", ar: "عجلات متآكلة (أخاديد أقل من 1 مم)", cat2010: 3, ref: "Décret 2000-147, art. 16" },
    { n: "112", fr: "Ne pas porter la ceinture (places avant, autoroute et hors communes)", ar: "عدم وضع حزام الأمان (المقاعد الأمامية، الطريق السيارة وخارج المناطق البلدية)", cat2010: 4, ref: "Décret 2000-147, art. 82" },
    { n: "132", fr: "Conduire avec un permis suspendu", ar: "السياقة برخصة معلّقة", cat2010: 5, ref: "Code de la route, art. 101 ter et 114" },
    { n: "135", fr: "Ne pas présenter les papiers du véhicule au contrôle", ar: "عدم تقديم وثائق العربة عند المراقبة", cat2010: 2, ref: "Décret 2000-152, art. 1 et 2" },
    { n: "136", fr: "Enfant de moins de 10 ans assis à l'avant", ar: "طفل دون 10 سنوات في المقعد الأمامي", cat2010: 2, ref: "Décret 2000-151, art. 56" },
    { n: "137", fr: "Manœuvres dangereuses en conduisant", ar: "القيام بمناورات خطيرة أثناء السياقة", cat2010: 5, ref: "Décret 2000-151, art. 2" }
  ],
  // Délits : jugés par le tribunal. Peines écrites dans le Code de la route (version 2009, recueil IORT 2012).
  delits: [
    { fr: "Ne pas respecter un signal ou une indication d'arrêt", ar: "عدم احترام إشارة أو أمر بالتوقف", peine_fr: "100 à 200 DT", peine_ar: "من 100 إلى 200 د", ref: "Code de la route, art. 85 (1)" },
    { fr: "S'arrêter, stationner ou reculer sur la chaussée d'une autoroute", ar: "التوقف أو الوقوف أو الرجوع إلى الخلف على الطريق السيارة", peine_fr: "100 à 200 DT", peine_ar: "من 100 إلى 200 د", ref: "Code de la route, art. 85 (2)" },
    { fr: "Rouler sans visite technique ou avec une visite périmée", ar: "الجولان دون فحص فني أو بفحص منتهي الصلوحية", peine_fr: "100 à 200 DT", peine_ar: "من 100 إلى 200 د", ref: "Code de la route, art. 85 (9)" },
    { fr: "Excès de vitesse de 50 km/h ou plus", ar: "تجاوز السرعة بـ 50 كم/س أو أكثر", peine_fr: "120 à 240 DT", peine_ar: "من 120 إلى 240 د", ref: "Code de la route, art. 86 (al. 2)" },
    { fr: "Dépassement interdit", ar: "التجاوز الممنوع", peine_fr: "jusqu'à 1 mois de prison et/ou 120 à 200 DT", peine_ar: "سجن إلى شهر و/أو من 120 إلى 200 د", ref: "Code de la route, art. 86 (al. 3, 4)" },
    { fr: "Ne pas respecter un passage à niveau ou franchir ses barrières", ar: "عدم احترام ممر السكة الحديدية أو اجتياز حواجزه", peine_fr: "jusqu'à 1 mois de prison et/ou 120 à 200 DT", peine_ar: "سجن إلى شهر و/أو من 120 إلى 200 د", ref: "Code de la route, art. 86 (al. 3, 3)" },
    { fr: "Fuir après des dégâts matériels", ar: "الفرار بعد إحداث أضرار مادية", peine_fr: "jusqu'à 1 mois de prison et/ou 120 à 200 DT", peine_ar: "سجن إلى شهر و/أو من 120 إلى 200 د", ref: "Code de la route, art. 86 (al. 3, 5)" },
    { fr: "Détecteur de radar dans le véhicule", ar: "جهاز كشف الرادار في العربة", peine_fr: "jusqu'à 1 mois de prison et/ou 120 à 200 DT", peine_ar: "سجن إلى شهر و/أو من 120 إلى 200 د", ref: "Code de la route, art. 86 (al. 3, 6)" },
    { fr: "Conduire sous l'empire d'un état alcoolique (0,3 g/l ou plus ; 0 g/l pour les stagiaires)", ar: "السياقة تحت تأثير حالة كحولية (0,3 غ/ل أو أكثر؛ 0 غ/ل للمتربصين)", peine_fr: "jusqu'à 6 mois de prison et/ou 200 à 500 DT", peine_ar: "سجن إلى 6 أشهر و/أو من 200 إلى 500 د", ref: "Code de la route, art. 87 (1)" },
    { fr: "Conduire sans permis ou sans la catégorie requise", ar: "السياقة دون رخصة أو دون الصنف المطلوب", peine_fr: "jusqu'à 6 mois de prison et/ou 200 à 500 DT", peine_ar: "سجن إلى 6 أشهر و/أو من 200 إلى 500 د", ref: "Code de la route, art. 87 (2)" },
    { fr: "Sens contraire ou demi-tour sur autoroute", ar: "السير عكس الاتجاه أو الدوران على الطريق السيارة", peine_fr: "jusqu'à 6 mois de prison et/ou 200 à 500 DT", peine_ar: "سجن إلى 6 أشهر و/أو من 200 إلى 500 د", ref: "Code de la route, art. 87 (3)" },
    { fr: "Refuser de s'arrêter au contrôle ou le dépistage d'alcool", ar: "رفض التوقف عند المراقبة أو رفض فحص الكحول", peine_fr: "jusqu'à 6 mois de prison et/ou 200 à 500 DT", peine_ar: "سجن إلى 6 أشهر و/أو من 200 إلى 500 د", ref: "Code de la route, art. 87 (4 et 5)" }
  ],
  // Montants qu'on a le droit d'afficher (vérifiés dans un texte lu). Tout autre montant = erreur du test.
  montants_autorises: [20, 40, 60, 100, 120, 200, 240, 500]
};
if (typeof module !== "undefined") module.exports = { AMENDES };
