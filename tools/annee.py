# -*- coding: utf-8 -*-
"""ANNÉE AUTOMATIQUE des titres (21/11/2026, demande d'Ahmed : « l'année doit changer toute seule chaque année »).

Les gens tapent l'année dans Google (« code de la route tunisie 2026 », « … 2026 pdf », « test … 2026 »). Les titres et
descriptions des pages suivent donc une RÈGLE, calculée à la date du jour (heure de Tunis) :
  - du 1er janvier au 31 octobre de l'année N  : « N »           (ex. « Code de la route Tunisie 2027 : … ») ;
  - du 1er novembre au 31 décembre de l'année N : « N-N+1 »      (ex. « Code de la route Tunisie 2026-2027 : … »),
    car les élèves commencent à chercher l'année suivante avant janvier, et l'année en cours reste dans le titre
    (en novembre 2026, toutes les recherches qui amènent des visiteurs contiennent encore « 2026 »).
Seule l'ANNÉE DES TITRES change : jamais le texte officiel, jamais une date de vérification, jamais un barème.

Dans les pages écrites à la main (tools/sources/…) et dans TEXTES_AR de tools/construire.py, l'année s'écrit {{ANNEE}} ;
tools/construire.py la remplace. L'année du pied de page (© …) est l'année civile : REGLES_SITE.annee (assets/regles.js).

  python tools/annee.py               affiche l'année du jour selon la règle
  python tools/annee.py --appliquer   met REGLES_SITE.annee à l'année civile (et le ?v= si elle change), puis refait les pages
                                      (lancé par le robot .github/workflows/annee.yml et par la surveillance mensuelle)
Pour essayer une autre date : CODE_ROUTE_DATE=2026-12-31 python tools/annee.py
"""
import datetime as dt
import os
import re
import sys
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
REGLES = RACINE / "assets" / "regles.js"
MARQUE = "{{ANNEE}}"
DEBUT_DOUBLE = (11, 1)          # à partir du 1er novembre : « N-N+1 »
FORME_LA_PLUS_LONGUE = "2026-2027"   # pour vérifier dès aujourd'hui que chaque titre tiendra en novembre


def aujourdhui():
    force = os.environ.get("CODE_ROUTE_DATE", "").strip()
    if force:
        return dt.date.fromisoformat(force)
    try:
        from zoneinfo import ZoneInfo
        return dt.datetime.now(ZoneInfo("Africa/Tunis")).date()
    except Exception:
        return (dt.datetime.now(dt.timezone.utc) + dt.timedelta(hours=1)).date()


def annee_seo(jour=None):
    jour = jour or aujourdhui()
    if (jour.month, jour.day) >= DEBUT_DOUBLE:
        return f"{jour.year}-{jour.year + 1}"
    return str(jour.year)


def remplacer(texte, jour=None):
    return texte.replace(MARQUE, annee_seo(jour))


def pages_versionnees():
    """Fichiers HTML qui portent le ?v= : sources des pages + pages à une seule adresse (vidéo, relecture)."""
    yield from sorted((RACINE / "tools" / "sources").rglob("*.html"))
    for p in ("video/index.html", "relecture/index.html"):
        if (RACINE / p).exists():
            yield RACINE / p


def changer_version_cache(jour, lettre):
    v = jour.strftime("%Y%m%d") + lettre
    for p in pages_versionnees():
        s = p.read_text(encoding="utf-8")
        n = re.sub(r"\?v=\d+\w", "?v=" + v, s)
        if n != s:
            p.write_text(n, encoding="utf-8", newline="\n")


def annee_civile_a_jour(jour=None):
    """REGLES_SITE.annee = année civile (pied de page « © »). Renvoie True si le fichier a changé."""
    jour = jour or aujourdhui()
    s = REGLES.read_text(encoding="utf-8")
    n = re.sub(r"annee:\s*\d{4}\b", f"annee: {jour.year}", s, count=1)
    if n != s:
        REGLES.write_text(n, encoding="utf-8", newline="\n")
        return True
    return False


def appliquer(jour=None, lettre="a"):
    jour = jour or aujourdhui()
    if annee_civile_a_jour(jour):
        changer_version_cache(jour, lettre)       # regles.js a changé : les téléphones doivent le recharger
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    import construire                             # noqa: E402
    construire.main()


if __name__ == "__main__":
    j = aujourdhui()
    if "--appliquer" in sys.argv[1:]:
        appliquer(j)
    print(f"Date {j.isoformat()} : année des titres « {annee_seo(j)} », année civile {j.year}")
