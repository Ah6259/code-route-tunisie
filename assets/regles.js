/* SEUL endroit où sont écrites l'année et la date de vérification du texte de loi.
   Toutes les pages les reprennent d'ici (en-tête, pied de page, étiquettes « à jour au »).
   - "verifie_le" et "derniere_surveillance" sont mis à jour CHAQUE MOIS par le robot
     .github/workflows/surveillance.yml (tools/surveiller_source.py) : ne pas changer leur format (jj/mm/aaaa).
   - "annee" : année CIVILE du pied de page (© …), mise à jour seule par tools/annee.py (robot annee.yml, le 1er du mois).
     L'année des TITRES suit la règle de tools/annee.py ({{ANNEE}} dans tools/sources/ : « N », ou « N-N+1 » dès le 1er novembre).
   - "source" : empreinte du texte officiel lu pour écrire les questions. Si le fichier en ligne change,
     le robot ouvre une issue GitHub « questions à revoir ». Après relecture, mettre ici la nouvelle empreinte. */
var REGLES_SITE = {
  // Bandeau « Version de relecture » en haut de chaque page : false = site normal (choix d'Ahmed, 05/10/2026 :
  // le moniteur relit déjà). La page relecture/ reste disponible (noindex, hors menu) et les petits liens
  // « Signaler une erreur » (WhatsApp) restent sur les questions et les leçons.
  relecture: false,
  annee: 2026,
  verifie_le: "09/10/2026",
  derniere_surveillance: "03/11/2026",
  source: {
    url: "https://www.transport.tn/uploads/Loi/Route.pdf",
    taille: 2778492,
    sha256: "e6de439f9d46940bf5b40563bdf2c07c30c6d8dfe0d48b19880eaa639df00991"
  }
};
if (typeof module !== "undefined") module.exports = { REGLES_SITE };
