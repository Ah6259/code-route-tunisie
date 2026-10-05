# Mémoire du projet — Code de la route Tunisie

Fichier lu automatiquement par Claude Code au début de chaque session dans ce dossier.
**Dépôt PUBLIC (prévu) : rien de personnel ni de secret ici.** À tenir à jour avec README et GUIDE à chaque modification importante.

## Qui et comment travailler
- Propriétaire : Ahmed (compte GitHub `Ah6259`), débutant. Expliquer simplement, **en français**.
- **Demander l'accord d'Ahmed avant de modifier le site** (sauf s'il dit « fais »). **Demander avant d'installer un logiciel.**
- Appliquer les **règles communes à tous ses sites** : `regles communes a tous les sites.md` dans le dossier parent des projets.
- Ahmed veut un site **automatique**, qui reste en vie seul le plus longtemps possible.

## État (05/10/2026)
- Construit **localement** dans `site/`. **Pas publié, pas de dépôt GitHub, pas de commit** : les questions doivent
  d'abord être relues par un **moniteur d'auto-école**.
- Adresse prévue : https://ah6259.github.io/code-route-tunisie/ (dépôt `Ah6259/code-route-tunisie`, GitHub Pages, branche main).
- Pages : accueil, `lecons/` (`?theme=1..10`), `panneaux/`, `entrainement/` (`?theme=1..10`, `?erreurs=1` = « Mes erreurs »),
  `examen/`, `amendes/`, `permis/` (démarches, décret 2000-142), `a-propos/`, et `relecture/` (moniteur : hors menu, noindex).
  Français + arabe (`?lang=ar`). Menu commun en haut (`MENU_SITE` dans `assets/page.js`).
- Ouvert depuis le PC (file://) : `page.js` ajoute « index.html » aux liens « dossier/ » (le test le vérifie).

## Contenus ajoutés le 05/10/2026
- **Leçons** : `assets/lecons.js` (10 leçons écrites par nous, article cité, « à retenir », photo + schéma `lecon-*.svg`).
- **Panneaux** : `node tools/construire_panneaux.mjs` fabrique `assets/panneaux/*.svg` + `assets/panneaux.js` (31 panneaux,
  6 familles du décret 2000-150). Dessins faits par nous : **à comparer aux annexes A-H officielles** (pas encore trouvées).
- **Amendes** : `assets/amendes.js`. Barème 2025 **lu** : loi 2024-48, **article 49** (pas 45), JORT n° 149 : 20/40/60 DT.
  Le **décret de répartition** des contraventions n'est pas trouvé → aucun montant par infraction (seulement l'ancienne
  catégorie 2010-262, sur 5). Quand on le trouve : `decret_repartition_trouve: true` + catégorie 2025 de chaque ligne.
  `montants_autorises` = seuls montants que le test laisse afficher.
- **Photos réelles** (Wikimedia Commons, licences libres) : `assets/photos/*.webp` (≤ 150 Ko) + crédits `assets/photos.js`
  (affichés sous chaque photo et dans À propos). Preuves : `../preuves conditions d'utilisation/2026-10-05/photos/`
  (pages de licence, SHA-256, script `telecharger_photos.py`). Plaques floutées (accueil, leçon 5).
- **Permis** : jamais une photo de vrai permis. `assets/illustrations/permis-specimen.svg` = dessin SPÉCIMEN / نموذج,
  sans emblème, sans « République », sans numéro (le test le vérifie), posé sur des photos (accueil, page permis, aperçu).
- **Relecture** : `REGLES_SITE.relecture` (false = pas de bandeau). Page `relecture/` : toutes les questions + leçons,
  OK / À corriger gardé dans le navigateur, bilan WhatsApp. Lien « Signaler une erreur » (WhatsApp) sur questions et leçons.
- **Sécurité** (consigne commune) : robots.txt (Google oui, robots d'IA non, `/relecture/` non), meta `noai, noimageai`,
  CSP en meta (aucun script dans les pages : tout est dans `assets/pages.js`), `assets/protection.js` (anti-copie, source
  ajoutée au texte copié, anti-cadre).

## Questions
- Source : `../questions/questions-v1.json` (126 questions, hors du dossier `site/`). Format dans `../questions/LISEZ-MOI.md`.
- `node tools/construire_questions.mjs` fabrique `assets/questions.js` (à relancer après chaque modification des questions).
- **Choix de prudence** : les questions `"a_verifier": true` (8) ne sont **pas publiées du tout** (ni entraînement, ni examen).
  Quand le moniteur les valide : `"a_verifier": false`, relancer le script.
- Champ facultatif `"image"` : schéma SVG dans `assets/illustrations/` (montre la situation, jamais la réponse).
- Examen : `EXAMEN = {nb:30, parTheme:3, seuil:24}` dans `assets/quiz.js` — **chiffres à confirmer** auprès d'une auto-école.
- Une réponse compte seulement si elle est complète (toutes les bonnes cases, aucune fausse).

## Date unique
- `assets/regles.js` (`REGLES_SITE`) : année, « texte vérifié le », dernière surveillance, adresse/taille/empreinte du PDF officiel.
  **Aucune date jj/mm/aaaa ailleurs** (le test le vérifie). Titres/meta : `python tools/changer_annee.py ANCIENNE NOUVELLE`.

## Robots (.github/workflows/)
- `tests.yml` : à chaque push, test automatique ; échec → issue GitHub.
- `surveillance.yml` : le 3 du mois ; vérifie le PDF officiel (transport.tn), met à jour la date, commit (= battement de cœur) ;
  texte changé/disparu → issue « questions à revoir ». Groupe de concurrence `robots-site`.
- Détails et marche à suivre en cas d'alerte : README, « Plan de continuité ».

## Avant chaque publication / après chaque modification
1. `node tools/test_site.mjs` (165 vérifications). jsdom : `npm install --no-save --no-package-lock jsdom` (une fois par PC).
2. Changer le `?v=` des fichiers `assets/` dans **toutes** les pages (le test vérifie qu'il est le même partout).
3. `bash tools/captures.sh` (ou `bash tools/captures.sh amendes`) : captures 340/390 px FR et AR dans `captures/`
   (non publié), servies par `python -m http.server 8917` (lancé par le script) — les regarder.
4. Texte arabe : nombres et mots latins isolés (`iso()`, `isoAr()`, `frac()` pour « 25 / 30 », `<bdi dir="ltr">`).
5. Image d'aperçu `assets/og-image-v2.png` (modèle `tools/og-image.html`, photo + carte SPÉCIMEN) : si on la change,
   **nouveau nom** (`og-image-v3.png`) et mettre à jour toutes les pages.

## Reste à faire avant publication
- Relecture des 126 questions par un moniteur ; confirmer 30 questions / 24 bonnes réponses.
- Trouver le **décret** qui répartit les contraventions dans les 3 catégories de 2025 ; vérifier l'article 49 sur iort.gov.tn.
- Version arabe officielle du code.
- Annexes A à H du décret 2000-150 (modèles officiels des panneaux) : comparer nos 31 dessins.
- Démarches actuelles ATTT (inscription en ligne, contrat d'auto-école 2025) : marquées « à vérifier » sur `permis/`.
- Puis : dépôt public, GitHub Pages, Search Console + sitemap, GoatCounter, moyen de signaler une erreur (formulaire).
