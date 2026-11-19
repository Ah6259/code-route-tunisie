"""QR code du site (19/11/2026, Ahmed : « ajoute un QR code au site Code de la route : les élèves peuvent se le partager pendant
leur pause au lycée »). Un camarade scanne l'écran avec l'appareil photo de son téléphone et arrive sur le site.

Fabrique, dans assets/qr/ : code-route-fr.svg / .png (https://code.clicvia.com/) et code-route-ar.svg / .png (https://code.clicvia.com/ar/).
SVG = affiché dans la page (léger, net sur tous les écrans) ; PNG 1024 px = « Télécharger » (à envoyer sur WhatsApp ou à imprimer).
Noir sur blanc, marge de 4 modules, correction d'erreur « M » : se lit même sur un écran un peu sale ou abîmé.
Usage : python tools/qr_code.py    (outil `segno`, déjà installé sur le PC ; les images sont dans le dépôt, le robot n'en a pas besoin)."""
import os
import segno

ICI = os.path.dirname(os.path.abspath(__file__))
DOSSIER = os.path.join(os.path.dirname(ICI), "assets", "qr")
ADRESSES = {"fr": "https://code.clicvia.com/", "ar": "https://code.clicvia.com/ar/"}


def main():
    os.makedirs(DOSSIER, exist_ok=True)
    for langue, url in ADRESSES.items():
        qr = segno.make(url, error="m")
        base = os.path.join(DOSSIER, f"code-route-{langue}")
        qr.save(base + ".svg", scale=8, border=4, dark="#111111", light="#ffffff", xmldecl=False, svgns=True, title=url)
        qr.save(base + ".png", scale=max(1, 1024 // (qr.symbol_size(border=4)[0])), border=4, dark="#111111", light="#ffffff")
        print(f"{langue} : {url} -> {base}.svg / .png ({qr.version}-{qr.error})")


if __name__ == "__main__":
    main()
