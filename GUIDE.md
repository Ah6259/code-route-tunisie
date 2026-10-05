# Guide — les étapes de création de « Code de la route Tunisie »

Guide réutilisable pour créer un autre site du même genre. Une ligne par étape, dans l'ordre.

## 04/10/2026 — Préparation
1. **Étude** des concurrents (applications payantes, pas de site bilingue gratuit) : voir `../etude et plan.md`.
2. **Texte officiel** téléchargé (recueil IORT 2012 sur transport.tn) avec preuves : robots.txt, en-têtes, SHA-256, Internet Archive.
3. **126 questions** écrites par nous à partir des articles, en français et en arabe, avec l'article cité.
   Les questions douteuses sont marquées `"a_verifier": true`.

## 05/10/2026 — Construction du site (local, non publié)
4. **Style** repris d'« Outils pratiques Tunisie » (même famille), couleur bleu route `#1F5FA8` + orange signalisation.
5. **Questions → JS** : `tools/construire_questions.mjs` fabrique `assets/questions.js` (sans les « à vérifier »).
6. **Pages** : accueil (thèmes, examen, badges, FAQ JSON-LD), entraînement par thème, examen blanc, à propos et sources.
7. **Logique** dans `assets/quiz.js` : tirage 3 questions par thème, correction stricte (réponse complète), revue des erreurs.
8. **Progression** dans le navigateur (localStorage, toujours dans try/catch).
9. **Date unique** : `assets/regles.js` ; aucune date écrite ailleurs.
10. **Illustrations SVG faites par nous** : bandeau d'accueil, une par thème, 6 schémas de questions (champ `image`).
11. **Logo SVG**, icône 180 px et **image d'aperçu** 1200×630 (`og-image-v1.png`, remplacée le même jour par `og-image-v2.png`) faites avec Chrome sans écran.
12. **Fichiers de base** : robots.txt, sitemap.xml (4 pages), LICENSE « tous droits réservés », .gitignore, .nojekyll.
13. **Test automatique** `tools/test_site.mjs` (100 vérifications) + **sabotage volontaire** d'une copie (7 sabotages,
    tous détectés : bonne réponse invalide, date en dur, correction trop gentille, tirage faux, © retiré,
    explication arabe vide, score faux). Le sabotage a révélé un test instable (question où tout est juste) : corrigé.
14. **Captures mobiles** 340/390 px FR et AR (`tools/captures.sh`) ; corrigé : nom coupé dans l'en-tête, bouton sur 2 lignes,
    « 15 questions » coupé, scores et heures inversés en arabe, étiquette de réponse qui écrasait le texte.
15. **Robots GitHub** : `tests.yml` (test à chaque envoi, issue si échec) et `surveillance.yml` (mensuel : texte officiel
    inchangé ? date mise à jour, commit = battement de cœur ; sinon issue « questions à revoir »).
16. **README** (plan de continuité), **CLAUDE.md** (mémoire du projet) et ce guide.

## 05/10/2026 (suite) — Nouvelles rubriques, vraies photos, sécurité
17. **Concurrents** regardés seulement pour leurs rubriques (fichier PRIVÉ `../idees vues chez les concurrents.md`, jamais cité sur le site).
18. **Leçons** (`lecons/`, `assets/lecons.js`) : 10 cours écrits par nous à partir des articles, schéma, « à retenir », lien vers l'entraînement.
19. **Panneaux** (`panneaux/`) : `node tools/construire_panneaux.mjs` dessine 31 panneaux en SVG (6 familles du décret 2000-150).
20. **Amendes** (`amendes/`) : texte de la loi de finances 2025 retrouvé (copie du JORT n° 149, **article 49**) ; décret de
    répartition introuvable → pas de montant par infraction (règle : ne jamais inventer). Délits avec les peines de la loi.
21. **Démarches** (`permis/`) d'après le décret 2000-142 ; ce qui n'est pas dans le texte = « à vérifier ».
22. **Mes erreurs** (`entrainement/?erreurs=1`), rubriques sur l'accueil, menu commun en haut de chaque page.
23. **Vraies photos** (Ahmed : « plus réelles ») : Wikimedia Commons par l'API (licence vérifiée, page de licence sauvegardée
    + SHA-256, crédit sous chaque photo), WebP ≤ 150 Ko, plaques floutées. Le permis reste un **dessin SPÉCIMEN** posé sur une photo.
24. **Sécurité** : robots.txt anti-IA, meta noai, CSP (scripts sortis des pages vers `assets/pages.js`), anti-copie, anti-cadre.
25. **Relecture** : page `relecture/` (noindex, hors menu) pour le moniteur + liens « Signaler une erreur » WhatsApp.
26. **Liens hors ligne** : en file:// on ajoute « index.html » aux liens « dossier/ » (Ahmed ouvre le site depuis son PC).
27. **Test** : 165 vérifications + sabotage de 20 copies (tous détectés) ; captures via un petit serveur local (CSP active).

## Avant publication (à faire)
- Relecture par un moniteur ; confirmer 30 / 24.
- Créer le dépôt public `Ah6259/code-route-tunisie` avec le contenu de `site/`, activer GitHub Pages.
- Search Console + sitemap ; GoatCounter ; lancer une fois `surveillance.yml` à la main pour vérifier qu'il lit transport.tn depuis GitHub.

## 05/10/2026 — Installation complète sur le téléphone (service worker)
- `sw.js` à la racine (portée `/code-route-tunisie/`), enregistré par `assets/page.js` (https seulement, jamais en `file:`).
- **Réseau d'abord** pour les pages et les données (dernière version toujours servie ; cache seulement hors connexion,
  sinon page « Hors connexion » FR + AR) ; fichiers `?v=` : cache puis mise à jour. `relecture/` jamais en cache.
- Meta iPhone sur chaque page : `apple-mobile-web-app-capable`, `apple-mobile-web-app-title`.
- Test `node tools/test_sw.mjs` (faux navigateur) ; sabotage vérifié (HTML en cache d'abord, POST, portée, relecture/).
- Vieille version bloquée sur un téléphone : changer `CACHE_VERSION` dans `sw.js`.
