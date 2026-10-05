"""Change l'année affichée dans les titres et les balises meta des pages, et dans assets/regles.js.

    python tools/changer_annee.py 2026 2027

- Ne touche QUE le texte entre <title>…</title> et les attributs content="…" des balises <meta>.
- Ne touche jamais une date jj/mm/aaaa ni aaaa-mm-jj, ni un numéro de texte de loi (2000-150, 99-71…).
- Le reste du site (pied de page ©, « vérifié le ») lit déjà l'année dans assets/regles.js.
- Utilisé aussi automatiquement par tools/surveiller_source.py au passage à la nouvelle année.
"""
import re
import sys
from pathlib import Path

RACINE = Path(__file__).resolve().parent.parent
IGNORER = {"node_modules", "captures", "tools", ".github"}


def pages():
    for p in sorted(RACINE.rglob("*.html")):
        if not IGNORER.intersection(p.relative_to(RACINE).parts):
            yield p


def remplacer_annee(texte, ancienne, nouvelle):
    # l'année seule : pas précédée de chiffre, « / », « - » ou « . », pas suivie de chiffre, « / » ou « - »
    motif = re.compile(r"(?<![\d/\-.])" + re.escape(str(ancienne)) + r"(?![\d/\-])")
    return motif.sub(str(nouvelle), texte)


def changer(ancienne, nouvelle):
    ancienne, nouvelle = int(ancienne), int(nouvelle)
    modifies = []
    for p in pages():
        s = p.read_text(encoding="utf-8")
        n = re.sub(r"(<title>)(.*?)(</title>)", lambda m: m.group(1) + remplacer_annee(m.group(2), ancienne, nouvelle) + m.group(3), s, flags=re.S)
        n = re.sub(r'(<meta\b[^>]*\bcontent=")([^"]*)(")', lambda m: m.group(1) + remplacer_annee(m.group(2), ancienne, nouvelle) + m.group(3), n)
        if n != s:
            p.write_text(n, encoding="utf-8", newline="\n")
            modifies.append(str(p.relative_to(RACINE)))
    regles = RACINE / "assets" / "regles.js"
    s = regles.read_text(encoding="utf-8")
    n = re.sub(r"annee:\s*" + str(ancienne) + r"\b", f"annee: {nouvelle}", s)
    if n != s:
        regles.write_text(n, encoding="utf-8", newline="\n")
        modifies.append("assets/regles.js")
    return modifies


if __name__ == "__main__":
    if len(sys.argv) != 3 or not all(a.isdigit() and len(a) == 4 for a in sys.argv[1:]):
        sys.exit("Utilisation : python tools/changer_annee.py ANCIENNE NOUVELLE   (ex. 2026 2027)")
    fichiers = changer(sys.argv[1], sys.argv[2])
    print("Modifiés :", ", ".join(fichiers) if fichiers else "aucun")
    print("Ensuite : changer le ?v= des pages, lancer  node tools/test_site.mjs")
