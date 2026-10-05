"""Surveillance mensuelle du texte officiel (lancée par .github/workflows/surveillance.yml).

1. Télécharge le PDF officiel (adresse, taille et empreinte SHA-256 notées dans assets/regles.js).
2. Compare : « inchange », « change » (taille ou empreinte différente) ou « disparu » (erreur, page qui n'est plus un PDF).
3. Met à jour assets/regles.js : derniere_surveillance = aujourd'hui (toujours),
   verifie_le = aujourd'hui (SEULEMENT si le texte n'a pas changé).
   Au passage à une nouvelle année : change aussi l'année (tools/changer_annee.py).
4. Change le ?v= des pages (cache des téléphones) et écrit le résultat pour le robot (GITHUB_OUTPUT).

Lecture lente et honnête : un seul fichier par mois, User-Agent qui dit qui nous sommes.
"""
import hashlib
import os
import re
import ssl
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from changer_annee import changer, pages  # noqa: E402

RACINE = Path(__file__).resolve().parent.parent
REGLES = RACINE / "assets" / "regles.js"
UA = "CodeRouteTunisie-surveillance/1.0 (site gratuit de revision du permis; verification mensuelle du texte officiel)"


def aujourdhui():
    try:
        from zoneinfo import ZoneInfo
        return datetime.now(ZoneInfo("Africa/Tunis")).date()
    except Exception:
        return (datetime.now(timezone.utc) + timedelta(hours=1)).date()


def lire_regles():
    s = REGLES.read_text(encoding="utf-8")
    url = re.search(r'url:\s*"([^"]+)"', s).group(1)
    taille = int(re.search(r"taille:\s*(\d+)", s).group(1))
    sha = re.search(r'sha256:\s*"([0-9a-f]{64})"', s).group(1)
    annee = int(re.search(r"annee:\s*(\d{4})", s).group(1))
    return s, url, taille, sha, annee


def telecharger(url, essais=3):
    derniere = None
    for i in range(essais):
        for verifier in (True, False):   # certificat invalide : on lit quand même, l'empreinte fait foi
            try:
                ctx = ssl.create_default_context() if verifier else ssl._create_unverified_context()
                req = urllib.request.Request(url, headers={"User-Agent": UA})
                with urllib.request.urlopen(req, timeout=120, context=ctx) as r:
                    return r.status, r.read()
            except ssl.SSLError as e:
                derniere = e
                continue
            except urllib.error.URLError as e:
                if isinstance(getattr(e, "reason", None), ssl.SSLError):
                    derniere = e
                    continue
                derniere = e
                break
            except Exception as e:  # coupure, délai dépassé…
                derniere = e
                break
        if i < essais - 1:
            time.sleep(60)
    raise RuntimeError(f"téléchargement impossible : {derniere}")


def changer_version_cache(jour):
    v = jour.strftime("%Y%m%d") + "s"
    for p in pages():
        s = p.read_text(encoding="utf-8")
        n = re.sub(r"\?v=\d+\w", "?v=" + v, s)
        if n != s:
            p.write_text(n, encoding="utf-8", newline="\n")


def sortie(**kv):
    f = os.environ.get("GITHUB_OUTPUT")
    for k, v in kv.items():
        print(f"{k} = {v}")
        if f:
            with open(f, "a", encoding="utf-8") as o:
                o.write(f"{k}={v}\n")


def main():
    s, url, taille_ref, sha_ref, annee = lire_regles()
    try:
        statut, contenu = telecharger(url)
        if not contenu.startswith(b"%PDF"):
            etat, detail = "disparu", f"la page répond (code {statut}) mais ce n'est plus un PDF ({len(contenu)} octets)"
        else:
            sha = hashlib.sha256(contenu).hexdigest()
            if sha == sha_ref and len(contenu) == taille_ref:
                etat, detail = "inchange", f"identique ({len(contenu)} octets, empreinte {sha[:12]}…)"
            else:
                etat, detail = "change", f"taille {len(contenu)} (avant {taille_ref}), empreinte {sha} (avant {sha_ref})"
    except Exception as e:
        etat, detail = "disparu", str(e).replace("\n", " ")

    jour = aujourdhui()
    date = jour.strftime("%d/%m/%Y")
    n = re.sub(r'derniere_surveillance:\s*"[^"]*"', f'derniere_surveillance: "{date}"', s)
    if etat == "inchange":
        n = re.sub(r'verifie_le:\s*"[^"]*"', f'verifie_le: "{date}"', n)
    REGLES.write_text(n, encoding="utf-8", newline="\n")
    if etat == "inchange" and jour.year != annee:
        changer(annee, jour.year)       # nouvelle année : titres, meta et regles.js
    changer_version_cache(jour)
    sortie(etat=etat, detail=detail, date=date)


if __name__ == "__main__":
    main()
