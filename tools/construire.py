# -*- coding: utf-8 -*-
"""UNE ADRESSE PAR LANGUE (08/11/2026, plan SEO d'Ahmed, phase 2 point 7 ; méthode de robot/langues.py de l'immobilier).

Les pages sont écrites à la main, en français ET en arabe (spans data-l="fr" / data-l="ar"), dans tools/sources/<chemin>/index.html.
Ce programme fabrique, pour chaque source :
  - <chemin>/index.html      : la page FRANÇAISE seule (textes arabes retirés), lang="fr", data-langue-fixe="fr" ;
  - ar/<chemin>/index.html   : la page ARABE seule (textes français retirés), lang="ar" dir="rtl", titre et description en arabe,
                               adresse officielle (canonical) ar/…, fichiers (style, scripts, images) pris à la racine du site ;
  - les deux pages se citent (hreflang fr / ar / x-default = fr) ; assets/page.js lit data-langue-fixe : la langue est celle de
    l'adresse, le bouton de langue mène à l'autre adresse (data-autre-langue).
Avant : Google voyait des pages « françaises » à moitié arabes (« explorées, non indexées »).
Pages qui gardent une seule adresse (comme avant, ?lang=ar) : video/ (fabriquée par tools/page_video.mjs) et relecture/ (noindex).
Le plan du site (sitemap.xml) est refait : pages françaises + pages arabes + video/, avec la date du dernier changement.

  python tools/construire.py            puis  node tools/test_site.mjs …
Toute modification d'une page se fait dans tools/sources/, jamais dans <chemin>/index.html ni ar/ (refaits ici).
"""
import datetime as dt
import html as H
import os
import re
import sys

ICI = os.path.dirname(os.path.abspath(__file__))
RACINE = os.path.dirname(ICI)
SOURCES = os.path.join(ICI, "sources")
URL_SITE = "https://code.clicvia.com/"
NOM_AR = "قانون الطرقات تونس"
# titre et description arabes de chaque page (Google les lit ; <= 70 et <= 165 caractères, voir titre_seo / desc_seo)
TEXTES_AR = {
    "": ("قانون الطرقات تونس 2026: أسئلة مجانية وامتحان تجريبي",
         "راجع مجانًا الامتحان النظري لرخصة السياقة في تونس: أسئلة حسب المحور مع التصحيح ومادة القانون، امتحان تجريبي ودروس، بالعربية والفرنسية."),
    "lecons/": ("دروس قانون الطرقات تونس: 10 دروس مجانية",
                "10 دروس قصيرة ومجانية في قانون الطرقات التونسي: العلامات، الأولوية، التجاوز، السرعة، التوقف، الأضواء، الكحول، مع رسم و«ما يجب حفظه»."),
    "panneaux/": ("علامات المرور في تونس: الأشكال والألوان والمعنى",
                  "علامات المرور التونسية مرتبة حسب العائلة (خطر، منع، إلزام، إرشاد) مع معنى كل علامة ورسمها، مجانًا وبالعربية."),
    "entrainement/": ("تدريب على قانون الطرقات تونس: أسئلة حسب المحور (مجاني)",
                      "تدرّب على الامتحان النظري لرخصة السياقة: سؤال تلو الآخر مع التصحيح المفصّل ومادة القانون، 10 محاور، مجانًا وبالعربية."),
    "examen/": ("امتحان تجريبي لقانون الطرقات تونس 2026: 30 سؤالًا",
                "امتحان تجريبي مجاني على نمط الامتحان الرسمي: 30 سؤالًا، النتيجة فورًا مع التصحيح، سلاسل مختلفة، بالعربية والفرنسية."),
    "amendes/": ("الخطايا المرورية في تونس 2026: الجدول والعقوبات",
                 "جدول الخطايا المرورية في تونس (قانون المالية 2025): المبالغ حسب الصنف، سحب الرخصة، الكحول، الهاتف، السرعة، وطريقة الدفع."),
    "permis/": ("اجتياز رخصة السياقة في تونس: الأصناف والملف والمراحل",
                "كيف تجتاز رخصة السياقة في تونس: أصناف الرخصة، الوثائق المطلوبة، مدرسة السياقة، الامتحان النظري والتطبيقي، الوكالة الفنية للنقل البري."),
    "a-propos/": ("كيف يعمل الموقع؟ | " + NOM_AR,
                  "كيف يعمل موقع قانون الطرقات تونس: الدروس والأسئلة والامتحان التجريبي، المصادر الرسمية، باقة الامتحان، بياناتك تبقى في هاتفك."),
    "pass/": ("باقة الامتحان: امتحانات تجريبية بلا حدود ابتداءً من 9 دنانير",
              "باقة الامتحان: امتحانات تجريبية بلا حدود، إحصائيات حسب المحور، أخطائي، قراءة الأسئلة بالصوت. 9 د لـ 7 أيام، 19 د لـ 30 يومًا، 29 د لـ 90 يومًا."),
    "pass/conditions/": ("شروط باقة الامتحان | " + NOM_AR,
                         "شروط باقة الامتحان: المدة والسعر، الدفع عبر D17 أو IZI، لا تجديد آلي، لا استرجاع للمدة المدفوعة، البيانات الشخصية."),
}
SANS_VERSION_AR = ("video/", "relecture/")       # une seule adresse (?lang=ar), comme avant

BALISE = re.compile(r"<(/?)([a-zA-Z][a-zA-Z0-9]*)\b([^>]*?)(/?)>", re.S)
VIDES = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}


def titre_seo(t, maxi=70, suffixes=(" | Code de la route Tunisie", " | " + NOM_AR)):
    """SEO (règle commune § 56) : titre <= 70 caractères ; le suffixe « | nom du site » saute s'il fait dépasser (le suffixe arabe est
    gardé et la base coupée) ; puis coupe à un séparateur s'il reste au moins 38 caractères, sinon au dernier mot + « … »."""
    t = " ".join(str(t).split())
    if len(t) <= maxi:
        return t
    suffixe = ""
    for sfx in suffixes:
        if t.endswith(sfx):
            t, suffixe = t[:-len(sfx)].rstrip(), (sfx if sfx.endswith(NOM_AR) else "")
            break
    place = maxi - len(suffixe)
    if len(t) <= place:
        return t + suffixe
    for sep in (" : ", ": ", " — ", " (", " – ", ", ", "، "):
        i = t.rfind(sep, 0, place)
        if i >= 38:
            return t[:i].rstrip(" ,;:—-،") + suffixe
    return t[:place - 1].rsplit(" ", 1)[0].rstrip(" ,;:—-،(") + "…" + suffixe


def desc_seo(d, maxi=165):
    """Description <= 165 caractères : fin de la dernière phrase entière, sinon dernier mot + « … »."""
    d = " ".join(str(d).split())
    if len(d) <= maxi:
        return d
    coupe = d[:maxi]
    i = max(coupe.rfind(". "), coupe.rfind(" ! "), coupe.rfind(" ? "), coupe.rfind("؟ "), coupe.rfind("۔ "))
    if i >= 60:
        return coupe[:i + 1].strip()
    return coupe[:maxi - 1].rsplit(" ", 1)[0].rstrip(" ,;:—-(،") + "…"


def retirer_langue(page, autre):
    """Enlève chaque élément data-l="<autre>" (et tout ce qu'il contient)."""
    sortie, i, saut = [], 0, 0
    for m in BALISE.finditer(page):
        if m.start() < max(i, saut):
            continue
        ferme, nom, attrs = m.group(1), m.group(2).lower(), m.group(3)
        if nom in ("script", "style") and not ferme:          # jamais de balise cherchée dans un script ou un style
            fin = page.find(f"</{nom}", m.end())
            saut = len(page) if fin < 0 else fin
            continue
        if ferme or f'data-l="{autre}"' not in attrs:
            continue
        sortie.append(page[i:m.start()])
        if nom in VIDES or m.group(4):
            i = m.end()
            continue
        prof, j = 1, m.end()                                   # fin de l'élément : même nom de balise, en comptant l'imbrication
        for n in BALISE.finditer(page, m.end()):
            if n.group(2).lower() != nom or n.group(4):
                continue
            prof += -1 if n.group(1) else 1
            if prof == 0:
                j = n.end()
                break
        else:
            j = len(page)
        i = j
    sortie.append(page[i:])
    # lignes vides laissées par les retraits
    return re.sub(r"\n[ \t]*\n([ \t]*\n)+", "\n\n", "".join(sortie))


def _resoudre(chemin, rel):
    parts = [x for x in chemin.split("/") if x]        # dossier de la page (chemin = "lecons/" -> ["lecons"])
    for x in rel.split("/"):
        if x in ("", "."):
            continue
        if x == "..":
            if parts:
                parts.pop()
        else:
            parts.append(x)
    return "/".join(parts) + ("/" if parts and (rel.endswith("/") or rel in ("", ".", "..")) else "")


def _plus_un_niveau(url, chemin, miroir):
    """Adresse relative vue depuis la page arabe (un dossier plus bas) : une page qui existe aussi en arabe reste dans ar/ ;
    tout le reste (style, scripts, images, données, video/, relecture/) est pris à la racine du site."""
    if not url or re.match(r"^([a-z][a-z0-9+.-]*:|//|/|#|\?)", url, re.I):
        return url
    p = url.split("#")[0].split("?")[0]
    if p == "" or p.endswith("/") or p in (".", ".."):
        cible = _resoudre(chemin, p)
        if cible in miroir:
            return url
    return "../" + url


def _reecrire_liens(page, chemin, miroir):
    def attr(m):
        nom, val = m.group(1), m.group(2)
        if nom == "srcset":
            morceaux = [s.strip() for s in val.split(",")]
            val = ", ".join(" ".join([_plus_un_niveau(s.split()[0], chemin, miroir)] + s.split()[1:]) for s in morceaux if s)
        else:
            val = _plus_un_niveau(val, chemin, miroir)
        return f'{nom}="{val}"'
    return re.sub(r'\b(href|src|srcset|action|poster)="([^"]*)"', attr, page)


def tete_langues(chemin):
    fr, ar = URL_SITE + chemin, URL_SITE + "ar/" + chemin
    return (f'<link rel="alternate" hreflang="fr" href="{fr}">\n<link rel="alternate" hreflang="ar" href="{ar}">\n'
            f'<link rel="alternate" hreflang="x-default" href="{fr}">')


def versions(source, chemin, miroir):
    """source = page bilingue écrite à la main ; chemin = "" (accueil), "lecons/", "pass/conditions/"… Renvoie (française, arabe)."""
    m = re.search(r'<html translate="no" lang="fr" dir="ltr" data-racine="([^"]*)">', source)
    if not m:
        raise SystemExit(f"ÉCHEC - {chemin or 'accueil'} : balise <html …data-racine> attendue dans la source")
    racine = m.group(1)                                   # "" pour l'accueil, "../" pour lecons/, "../../" pour pass/conditions/
    tete = tete_langues(chemin)
    vers_ar = racine + "ar/" + chemin                    # bouton de langue : adresse relative de l'autre version
    vers_fr = "../" + racine + chemin

    fr = retirer_langue(source, "ar")
    fr = fr.replace(m.group(0), f'<html translate="no" lang="fr" dir="ltr" data-racine="{racine}" data-langue-fixe="fr" data-autre-langue="{vers_ar}">', 1)
    fr = fr.replace('<link rel="canonical"', tete + '\n<link rel="canonical"', 1)

    ar = retirer_langue(source, "fr")
    ar = _reecrire_liens(ar, chemin, miroir)
    ar = ar.replace(m.group(0), f'<html translate="no" lang="ar" dir="rtl" data-racine="../{racine}" data-site="{racine}" data-langue-fixe="ar" data-autre-langue="{vers_fr}">', 1)
    url_ar = URL_SITE + "ar/" + chemin
    ar = re.sub(r'<link rel="canonical" href="[^"]*">', lambda x: tete + f'\n<link rel="canonical" href="{url_ar}">', ar, count=1)
    ar = re.sub(r'<meta property="og:url" content="[^"]*">', f'<meta property="og:url" content="{url_ar}">', ar, count=1)
    ar = re.sub(r'<script type="application/ld\+json">.*?</script>\n?', "", ar, flags=re.S)   # FAQ Google écrite en français : pas sur la page arabe
    titre_ar, desc_ar = TEXTES_AR.get(chemin, ("", ""))
    if not titre_ar:
        raise SystemExit(f"ÉCHEC - {chemin or 'accueil'} : titre arabe manquant dans TEXTES_AR")
    t, d = H.escape(titre_seo(titre_ar), quote=False), H.escape(desc_seo(desc_ar))
    ar = re.sub(r"<title>.*?</title>", lambda x: f"<title>{t}</title>", ar, count=1, flags=re.S)
    ar = re.sub(r'<meta name="description" content="[^"]*">', lambda x: f'<meta name="description" content="{d}">', ar, count=1)
    ar = re.sub(r'<meta property="og:title" content="[^"]*">', lambda x: f'<meta property="og:title" content="{H.escape(titre_ar.split(" | ")[0])}">', ar, count=1)
    ar = re.sub(r'<meta property="og:description" content="[^"]*">', lambda x: f'<meta property="og:description" content="{d}">', ar, count=1)
    ar = ar.replace('<meta name="apple-mobile-web-app-title" content="Code route">', '<meta name="apple-mobile-web-app-title" content="قانون الطرقات">', 1)
    return fr, ar


def ecrire(chemin_fichier, contenu):
    dest = os.path.join(RACINE, chemin_fichier)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    ancien = open(dest, encoding="utf-8").read() if os.path.exists(dest) else None
    if ancien != contenu:
        open(dest, "w", encoding="utf-8", newline="\n").write(contenu)
    return ancien != contenu


def pages_sources():
    chemins = []
    for dossier, _, fichiers in os.walk(SOURCES):
        if "index.html" in fichiers:
            rel = os.path.relpath(dossier, SOURCES).replace(os.sep, "/")
            chemins.append("" if rel == "." else rel + "/")
    return sorted(chemins)


def sitemap(chemins, changes):
    """Plan du site : pages françaises, pages arabes, video/ ; lastmod = aujourd'hui pour une page refaite différemment, sinon la date gardée."""
    fichier = os.path.join(RACINE, "sitemap.xml")
    anciennes = {}
    if os.path.exists(fichier):
        for loc, date in re.findall(r"<loc>([^<]+)</loc>(?:<lastmod>([^<]+)</lastmod>)?", open(fichier, encoding="utf-8").read()):
            anciennes[loc] = date
    auj = dt.date.today().isoformat()
    lignes = []
    for c in chemins + [("ar/" + c) for c in chemins] + ["video/"]:
        loc = URL_SITE + c
        date = auj if c in changes or loc not in anciennes else (anciennes[loc] or auj)
        lignes.append(f"  <url><loc>{loc}</loc><lastmod>{date}</lastmod></url>")
    contenu = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "\n".join(lignes) + "\n</urlset>\n"
    ecrire("sitemap.xml", contenu)


def main():
    chemins = pages_sources()
    miroir = set(chemins)
    changes = set()
    for chemin in chemins:
        source = open(os.path.join(SOURCES, chemin, "index.html"), encoding="utf-8").read()
        fr, ar = versions(source, chemin, miroir)
        if ecrire(chemin + "index.html", fr):
            changes.add(chemin)
        if ecrire("ar/" + chemin + "index.html", ar):
            changes.add("ar/" + chemin)
    # une page arabe sans source = retirée (page supprimée)
    base = os.path.join(RACINE, "ar")
    if os.path.isdir(base):
        for dossier, _, fichiers in os.walk(base, topdown=False):
            if "index.html" in fichiers:
                rel = os.path.relpath(dossier, base).replace(os.sep, "/")
                if ("" if rel == "." else rel + "/") not in miroir:
                    os.remove(os.path.join(dossier, "index.html"))
            if dossier != base and not os.listdir(dossier):
                os.rmdir(dossier)
    sitemap(chemins, changes)
    print(f"{len(chemins)} page(s) : français + arabe (ar/) ; {len(changes)} fichier(s) changé(s) ; plan du site refait")


if __name__ == "__main__":
    sys.exit(main())
