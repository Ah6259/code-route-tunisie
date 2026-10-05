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
1. `node tools/test_site.mjs` (170 vérifications) puis `node tools/test_sw.mjs` (service worker) et `node tools/test_avis.mjs` (Votre avis). jsdom : `npm install --no-save --no-package-lock jsdom` (une fois par PC).
2. Changer le `?v=` des fichiers `assets/` dans **toutes** les pages (le test vérifie qu'il est le même partout).
3. `bash tools/captures.sh` (ou `bash tools/captures.sh amendes`) : captures 340/390 px FR et AR dans `captures/`
   (non publié), servies par `python -m http.server 8917` (lancé par le script) — les regarder.
4. Texte arabe : nombres et mots latins isolés (`iso()`, `isoAr()`, `frac()` pour « 25 / 30 », `<bdi dir="ltr">`).
5. Image d'aperçu `assets/og-image-v3.jpg` (modèle `tools/og-image.html`, photo + carte SPÉCIMEN) : si on la change,
   **nouveau nom** (`og-image-v4.jpg`) et mettre à jour toutes les pages. Toujours en **JPEG < 250 Ko** (capture PNG puis
   conversion Pillow qualité 88) : au-delà, WhatsApp n'affiche qu'une petite vignette. L'ancien `og-image-v2.png` n'est plus utilisé.
6. Statistiques **GoatCounter** (anonymes, sans cookies, 05/10/2026) sur les 8 pages publiques, **jamais sur `relecture/`** :
   compteur partagé `https://prix-eaux-tunisie.goatcounter.com` (pages séparées par chemin) ; CSP : `script-src` + `https://gc.zgo.at`,
   `connect-src` / `img-src` + le compteur. Mentionné dans À propos. Le test le vérifie.
7. Installation sur le téléphone : `manifest.webmanifest` avec `"id": "/code-route-tunisie/"` (UNIQUE : tous les sites d'Ahmed
   partagent l'origine ah6259.github.io ; sans id, Chrome disait « cette page est déjà installée »), icônes `assets/icons/`
   (192, 512, maskable) tirées de `assets/logo.svg`. Lien sur chaque page ; vérifié par le test.
8. **Service worker** (05/10/2026, installation complète Chrome/Android + iPhone) : `sw.js` à la racine, portée `/code-route-tunisie/`,
   enregistré à la fin de `assets/page.js` (https seulement, try/catch). **Réseau d'abord** pour les pages HTML et les données (le cache
   ne sert que hors connexion ; sinon page « Hors connexion » FR+AR) ; CSS/JS/images avec `?v=` : cache puis mise à jour en arrière-plan.
   Jamais en cache : non-GET, autres origines, autres sites d'Ahmed, **`relecture/`**. Caches `code-route-tunisie-<CACHE_VERSION>`
   (on ne supprime QUE les nôtres : origine partagée). Vieille version bloquée sur un téléphone → changer `CACHE_VERSION`.
   Meta iPhone (`apple-mobile-web-app-capable`, `-title` « Code route ») sur chaque page.
   Test : `node tools/test_sw.mjs` (faux navigateur ; accepte un dossier en argument pour tester une copie sabotée).

9. **Votre avis** (05/10/2026, règle d'Ahmed : sur chacun de ses sites) : section `#avis` sur l'accueil (carte FR + AR, note 😀🙂😐🙁
   facultative, message obligatoire ≤ 1000 caractères, e-mail facultatif), lien « Votre avis » dans le pied de page (`page.js`).
   Envoi par `assets/avis.js` (fichier externe, `fetch` vers `https://formspree.io/f/mwlpakqj`, Accept JSON) seulement au clic ;
   champs cachés `site` = « Code de la route Tunisie », `page` = adresse, `_subject`, piège `_gotcha`. CSP : `connect-src` et
   `form-action` + `https://formspree.io` sur toutes les pages. Le service worker laisse passer formspree.io (autre origine, POST).
   Formspree gratuit = 50 envois/mois pour TOUS les sites (même formulaire). Test : `node tools/test_avis.mjs` (envoi simulé ;
   accepte un dossier en argument), aussi dans tests.yml.

## Reste à faire avant publication
- Relecture des 126 questions par un moniteur ; confirmer 30 questions / 24 bonnes réponses.
- Trouver le **décret** qui répartit les contraventions dans les 3 catégories de 2025 ; vérifier l'article 49 sur iort.gov.tn.
- Version arabe officielle du code.
- Annexes A à H du décret 2000-150 (modèles officiels des panneaux) : comparer nos 31 dessins.
- Démarches actuelles ATTT (inscription en ligne, contrat d'auto-école 2025) : marquées « à vérifier » sur `permis/`.
- Puis : dépôt public, GitHub Pages, Search Console + sitemap, moyen de signaler une erreur (formulaire).

## Images des questions (05/10/2026, décision d'Ahmed)
- **Chaque question publiée a une image** (comme l'examen officiel) : le test bloque la publication sinon.
- Schémas dessinés par `tools/construire_schemas.mjs` (SVG 320 × 200 dans `assets/illustrations/q-*.svg`, style du site :
  vue de dessus, bleu = votre voiture, orange = les autres, panneaux repris de `assets/panneaux/`). Le script écrit aussi le
  champ `image` dans `../questions/questions-v1.json` ; ensuite `node tools/construire_questions.mjs`, changer le `?v=` des pages.
- **Un schéma montre la situation, jamais la réponse** (pas de chiffre de vitesse, distance, points ; pas d'objet qui trahit
  la réponse). Nouvelle question = nouveau schéma dans `S` + ligne dans `ASSOC`.
- Page Examen : photo du bandeau `lecons-route` avec crédit (`#credit-hero[data-photo]`, rempli par pages.js).

## Mise à jour du 05/10/2026 (soir)
- **Icône (famille commune des 5 sites)** : un seul symbole en aplats 2-3 tons, accent doré `#F2B33D`, sans texte ni brillance (règle d'Ahmed : jamais d'effet « image IA » ni de clip-art). Ce site : **route en S avec tirets dorés**. Source = `assets/logo.svg` ; PNG 192/512 = dessin arrondi, maskable 512 et iPhone 180 = même dessin sur carré plein, symbole à 78 %. Générateur (hors dépôt) : `_claude code project/icones des sites - generateur.py`. Changer l'icône → renouveler `CACHE_VERSION` de `sw.js`.
- **« Gratuit » mis en avant** (titres Google, descriptions, aperçus de partage, manifeste), seulement là où c'est vrai. La future partie payante n'est jamais annoncée à l'avance (décision d'Ahmed).
- **Aperçus WhatsApp** : tous les sites sont réglés pareil (1200 × 630, JPEG léger). WhatsApp sur PC fait de petites vignettes : envoyer les liens depuis le téléphone (ou transférer un message préparé sur le téléphone).
- **Règle d'Ahmed : tout tourne sur internet (GitHub), sans son PC ni son intervention, « même s'il meurt ».**
- Page Amendes : lien vers le site officiel du ministère des Finances (consulter et payer ses amendes : CIN, carte de séjour, matricule fiscal, immatriculation ; reçu, SMS, centre d'appel 81 100 700).
- **Vérification des 127 questions (05/10/2026)** : rapport privé `../verification des questions 2026-10-05.md`. **Alcool corrigé : 0,3 g/l** (0 g/l stagiaires, poids lourds, transport, moniteurs ; décret gouvernemental 2016-292, confirmé par l'ISST) dans la question T7-001, la leçon, la page Amendes et l'illustration ; nouvelle question T7-013 (0 g/l stagiaires). Ceinture : obligatoire partout depuis le 27/04/2017, à l'arrière depuis le 27/01/2018 (T8-012 publiée, réponse corrigée). Téléphone : 60 DT (T7-009 réécrite). SAMU 190 et panneau « 50 » publiés. **123 questions publiées**, 4 en attente : T9-010 et T9-011 (secourisme : moniteur ou secouriste), T10-010 (feu rouge : règle en cours de changement), T10-013 (catégories d'amendes : sources contradictoires).
- 56 questions ne reposent que sur le texte officiel de 2012 (points, peines, pneus, durée du stage) : à faire relire par un moniteur ; l'alcool a montré que des règles ont changé.
- Accueil (05/10/2026, demande d'Ahmed) : raccourci « Entraînement » ajouté en tête des rubriques (6 au lieu de 5) ; les 3 badges « texte officiel / gratuit / français et arabe » retirés (inutiles, déjà dans le titre). Test mis à jour.
- Rubriques de l'accueil (05/10/2026) : images en couleur `assets/illustrations/rub-<nom>.svg` (même style que les thèmes, fond pastel), à la place des icônes au trait.
