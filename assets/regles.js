/* SEUL endroit où sont écrites l'année et la date de vérification du texte de loi.
   Toutes les pages les reprennent d'ici (en-tête, pied de page, étiquettes « à jour au »).
   - "verifie_le" et "derniere_surveillance" sont mis à jour CHAQUE MOIS par le robot
     .github/workflows/surveillance.yml (tools/surveiller_source.py) : ne pas changer leur format (jj/mm/aaaa).
   - "annee" : changer aussi les titres des pages avec  python tools/changer_annee.py 2026 2027
   - "source" : empreinte du texte officiel lu pour écrire les questions. Si le fichier en ligne change,
     le robot ouvre une issue GitHub « questions à revoir ». Après relecture, mettre ici la nouvelle empreinte. */
var REGLES_SITE = {
  // Bandeau « Version de relecture » en haut de chaque page : false = site normal (choix d'Ahmed, 05/10/2026 :
  // le moniteur relit déjà). La page relecture/ reste disponible (noindex, hors menu) et les petits liens
  // « Signaler une erreur » (WhatsApp) restent sur les questions et les leçons.
  relecture: false,
  annee: 2026,
  verifie_le: "05/10/2026",
  derniere_surveillance: "05/10/2026",
  source: {
    url: "https://www.transport.tn/uploads/Loi/Route.pdf",
    taille: 2778492,
    sha256: "e6de439f9d46940bf5b40563bdf2c07c30c6d8dfe0d48b19880eaa639df00991"
  }
};
if (typeof module !== "undefined") module.exports = { REGLES_SITE };
