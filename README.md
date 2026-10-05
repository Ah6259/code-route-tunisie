# Code de la route Tunisie

Site gratuit pour réviser l'examen théorique du permis de conduire en Tunisie (ATTT), en français et en arabe.
Adresse prévue : https://ah6259.github.io/code-route-tunisie/

> **Pas encore publié** : les questions doivent d'abord être relues par un moniteur d'auto-école.

## Ce que fait le site
- **Menu** en haut de chaque page : Leçons / Panneaux / Entraînement / Examen / Amendes / À propos.
- **Leçons** (`lecons/`, `?theme=1..10`) : cours court, vraie photo, schéma, « à retenir », article de loi, lien vers l'entraînement.
- **Panneaux** (`panneaux/`) : 31 panneaux dessinés par nous, rangés dans les 6 familles du décret 2000-150, sens FR + AR.
- **Amendes** (`amendes/`) : barème 2025 (20/40/60 DT, loi de finances 2025 art. 49), contraventions courantes (ancienne
  catégorie, **sans montant** tant que le décret de répartition n'est pas trouvé), délits, permis à points.
- **Passer le permis** (`permis/`) : catégories, âge, dossier, épreuves, validité (décret 2000-142).
- **Mes erreurs** (`entrainement/?erreurs=1`) : rejoue les questions ratées.
- **Relecture** (`relecture/`, hors menu, non indexée) : pour le moniteur, bilan envoyé par WhatsApp.
- **Accueil** : présentation, illustration, bouton « Examen blanc (30 questions) », 10 thèmes avec le nombre de questions
  et la progression, badges de confiance, avertissement « en cours de relecture », FAQ.
- **Entraînement par thème** (`entrainement/?theme=1` à `10`) : une question à la fois, une ou plusieurs bonnes réponses,
  correction immédiate avec explication et article de loi (« Source : … »), schéma pour certaines questions.
- **Examen blanc** (`examen/`) : 30 questions tirées au hasard (3 par thème), score sur 30, réussite à 24
  (**chiffres à confirmer**), résultat par thème, revue des erreurs expliquées, partage WhatsApp.
- **À propos et sources** (`a-propos/`) : texte officiel utilisé, méthode, limites connues.
- **Votre avis** (accueil, `#avis`, lien dans le pied de page de toutes les pages) : note facultative (😀🙂😐🙁), message
  (obligatoire, 1000 caractères max), e-mail facultatif ; envoyé **seulement au clic** à Formspree (formulaire `mwlpakqj`, le même
  que le site des prix de l'eau) avec les champs cachés `site` = « Code de la route Tunisie » et `page`. Code : `assets/avis.js`.
- Progression gardée **dans le navigateur** (localStorage), jamais envoyée. Aucun serveur.

## Fichiers
| Fichier | Rôle |
|---|---|
| `assets/regles.js` | **Seul endroit** où sont écrites l'année, la date « texte vérifié le » et l'empreinte du texte officiel |
| `assets/questions.js` | Questions publiées, **fabriqué** par `tools/construire_questions.mjs` depuis `../questions/questions-v1.json` |
| `assets/page.js` | Langue FR/AR (`?lang=ar`), en-tête et pied de page communs, isolation des nombres en arabe, stockage |
| `assets/quiz.js` | Thèmes, tirage de l'examen, correction, affichage de l'entraînement et de l'examen |
| `assets/illustrations/` | Dessins SVG faits par nous : bandeau d'accueil, 10 thèmes, schémas de questions |
| `assets/lecons.js` | Les 10 leçons (texte FR/AR, sources, photo, schéma) |
| `assets/panneaux.js`, `assets/panneaux/` | Panneaux, **fabriqués** par `tools/construire_panneaux.mjs` |
| `assets/amendes.js` | Barème 2025, contraventions (sans montant), délits, montants autorisés |
| `assets/photos.js`, `assets/photos/` | Photos Wikimedia Commons + crédits (auteur, licence, lien) |
| `assets/pages.js` | Affichage propre à chaque page (aucun script dans les pages HTML : CSP) |
| `assets/protection.js` | Anti-copie légère, source ajoutée au texte copié, anti-cadre |
| `tools/test_site.mjs` | Test automatique (165 vérifications) |
| `sw.js`, `tools/test_sw.mjs` | Service worker (réseau d'abord, installation sur le téléphone) et son test |
| `assets/avis.js`, `tools/test_avis.mjs` | Section « Votre avis » (envoi Formspree) et son test (envoi simulé) |
| `tools/surveiller_source.py` | Surveillance mensuelle du texte officiel (appelé par le robot) |
| `tools/changer_annee.py` | Change l'année des titres et balises meta |
| `tools/captures.sh` | Captures mobiles 340/390 px, FR et AR (dossier `captures/`, non publié), via un serveur local |

## Plan de continuité

### Ce qui tourne tout seul
| Robot | Quand | Ce qu'il fait |
|---|---|---|
| `tests.yml` | à chaque envoi sur GitHub | installe jsdom, lance `node tools/test_site.mjs`, `node tools/test_sw.mjs` et `node tools/test_avis.mjs` |
| `surveillance.yml` | le 3 de chaque mois, 7h17 (Tunis) | télécharge le PDF officiel du Code de la route (transport.tn), compare sa taille et son empreinte SHA-256 ; si rien n'a changé, avance la date « texte vérifié le » ; au 1er passage d'une nouvelle année, change l'année des titres ; change le `?v=` des pages ; lance le test ; **commit** |

Le commit mensuel sert aussi de **battement de cœur** : GitHub met les robots en pause après 60 jours sans activité.
Le site lui-même n'a besoin de rien : tout se passe dans le téléphone du visiteur.

**Installation sur le téléphone** : `sw.js` (service worker) = **réseau d'abord** pour les pages et les données (le cache ne sert
que hors connexion ; `relecture/` jamais en cache) ; CSS/JS/images versionnés (?v=) = cache puis mise à jour. Si un téléphone garde
une vieille version : changer `CACHE_VERSION` dans `sw.js`.

### Ce qui alerte (issues GitHub, notification par e-mail au propriétaire du dépôt)
| Issue | Cause |
|---|---|
| « Le test automatique du site a échoué » | une modification a cassé quelque chose |
| « Le texte du Code de la route a changé : questions à revoir » | le PDF officiel a une autre taille ou empreinte |
| « Le texte du Code de la route a disparu : questions à revoir » | le PDF ne répond plus, ou ce n'est plus un PDF |
| « Le robot de surveillance a échoué » | le robot lui-même a planté (lire le journal) |

Une alerte déjà ouverte reçoit un commentaire au lieu d'une nouvelle issue (pas de doublons).

### Quoi faire si une alerte arrive
1. **Test échoué** : ouvrir le lien du journal, lire les lignes `FAIL`, corriger, relancer `node tools/test_site.mjs`
   sur le PC, renvoyer. Ne jamais laisser le site avec un test rouge.
2. **Texte changé** : télécharger le nouveau PDF, le ranger dans `../sources/` avec sa date et sa preuve
   (`../preuves conditions d'utilisation/<date>/`), comparer avec l'ancien, corriger les questions concernées
   (`../questions/questions-v1.json`, passer en `"a_verifier": true` ce qui est douteux), relancer
   `node tools/construire_questions.mjs`, puis mettre la nouvelle **taille** et la nouvelle **empreinte** dans
   `assets/regles.js`. Tant que ce n'est pas fait, la date « vérifié le » n'avance plus (c'est voulu). Fermer l'issue.
3. **Texte disparu** : vérifier à la main dans un navigateur (le site du ministère est peut-être en panne ou a déménagé).
   Si le fichier a seulement changé d'adresse, mettre la nouvelle adresse dans `assets/regles.js`.
   Si c'est une panne passagère, fermer l'issue : le robot réessaiera le mois suivant.
4. **Robot en échec** : lire le journal ; relancer à la main avec
   `gh workflow run surveillance.yml -R Ah6259/code-route-tunisie`.

### Chaque année (rien à faire)
L'année des titres, du © et la date « vérifié le » changent seules au premier passage du robot de l'année
(si le texte officiel n'a pas changé). À la main si besoin : `python tools/changer_annee.py 2026 2027`.
À surveiller en janvier : la **loi de finances** peut modifier les amendes (article 83 du Code de la route ; en 2025 : article 49,
3 catégories 20/40/60 DT). Si le décret de répartition paraît : remplir `assets/amendes.js` puis lancer le test.

### Si GitHub ou le PC disparaît
Tout le site est dans ce dépôt : le cloner sur un nouveau PC suffit. Les questions sources (`../questions/`) et les
preuves (`../sources/`, `../preuves…/`) sont hors du dépôt : les garder sauvegardées (Dropbox / disque).

## Nouveautés
- 05/10/2026 : nouvelle icône ; une image pour chaque question ; taux d'alcool corrigé (0,3 g/l) ; lien vers le paiement officiel des amendes.
