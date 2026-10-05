#!/bin/bash
# Captures mobiles (Chrome sans écran) : chaque page dans des cadres de 340 et 390 px, en français et en arabe.
#   bash tools/captures.sh            -> toutes les pages, images dans captures/ (dossier ignoré par git)
#   bash tools/captures.sh lecons     -> seulement les captures dont le nom contient « lecons »
# Les pages sont servies par un petit serveur local (python -m http.server, déjà installé avec Python) :
# la politique de sécurité (CSP) et l'anti-cadre se comportent alors comme en ligne.
# Les écrans « question corrigée » et « résultat d'examen » sont obtenus en cliquant depuis la page cadre (action=...).
cd "$(dirname "$0")/.."
CH="/c/Program Files/Google/Chrome/Application/chrome.exe"
D=$(cygpath -m "$PWD")
TMPD=$(cygpath -m "${TEMP:-/tmp}")/chrome-crt-captures
PORT=8917
FILTRE="$1"
mkdir -p captures
rm -rf "$(cygpath -u "$TMPD")" 2>/dev/null   # pas de cache : on voit les fichiers du moment
if ! curl -s -o /dev/null "http://127.0.0.1:$PORT/index.html"; then
  (python -m http.server $PORT --bind 127.0.0.1 --directory "$(cygpath -w "$PWD")" >/dev/null 2>&1 &)
  sleep 2
fi
SRV="http://127.0.0.1:$PORT"

capture() {   # $1 = nom, $2 = page relative + paramètres, $3 = action, $4 = hauteur
  [ -n "$FILTRE" ] && [[ "$1" != *"$FILTRE"* ]] && return
  local H=${4:-2200}
  cat > captures/_cadre.html <<EOF
<!doctype html><html><head><meta charset="utf-8"><style>body{margin:0;background:#888;display:flex;gap:20px;padding:20px;align-items:flex-start}
iframe{border:0;background:#fff;height:${H}px}</style></head><body>
<iframe id="a" src="$SRV/$2" style="width:340px"></iframe><iframe id="b" src="$SRV/$2" style="width:390px"></iframe>
<script>
const action = "$3";
function agir(w){
  try {
    const d = w.document, clic = s => { const e = d.querySelector(s); if (e) e.click(); };
    if (action === "erreurs") { w.localStorage.setItem("crt-progression-v1", JSON.stringify({q:{"T2-001":0,"T5-003":0,"T6-002":0},examens:[]})); w.location.reload(); }
    if (action === "schema") { const e = w.eval("entrainement"); e.i = e.liste.findIndex(q => q.image); w.eval("rendreEntrainement()"); }
    if (action === "corriger") { clic('.choix-q[data-i="0"]'); clic('#valider'); }
    if (action === "examen") {
      clic('#commencer');
      for (let i = 0; i < 30; i++) { const q = w.eval('examen').questions[i];
        const r = i < 26 ? q.bonnes : [q.choix.findIndex((_, k) => !q.bonnes.includes(k))];
        r.forEach(n => clic('.choix-q[data-i="' + n + '"]')); clic('#valider'); }
    }
  } catch (e) { document.title = "ERREUR " + e.message; }
}
document.querySelectorAll("iframe").forEach(f => f.addEventListener("load", () => { if (!f.dataset.fait) { f.dataset.fait = 1; setTimeout(() => agir(f.contentWindow), 400); } }));
</script></body></html>
EOF
  "$CH" --headless=new --hide-scrollbars --user-data-dir="$TMPD" --virtual-time-budget=12000 \
    --window-size=790,$((H + 40)) --screenshot="$D/captures/$1.png" "$SRV/captures/_cadre.html" 2>/dev/null
  echo "captures/$1.png"
}

for L in fr ar; do
  capture "accueil-$L" "index.html?lang=$L" "" 3800
  capture "lecons-liste-$L" "lecons/index.html?lang=$L" "" 2400
  capture "lecons-theme2-$L" "lecons/index.html?lang=$L&theme=2" "" 3000
  capture "panneaux-$L" "panneaux/index.html?lang=$L" "" 5200
  capture "amendes-$L" "amendes/index.html?lang=$L" "" 5600
  capture "permis-$L" "permis/index.html?lang=$L" "" 3600
  capture "entrainement-question-$L" "entrainement/index.html?lang=$L&theme=2" "" 1200
  capture "entrainement-schema-$L" "entrainement/index.html?lang=$L&theme=2" "schema" 1400
  capture "entrainement-corrige-$L" "entrainement/index.html?lang=$L&theme=3" "corriger" 1600
  capture "mes-erreurs-$L" "entrainement/index.html?lang=$L&erreurs=1" "erreurs" 1300
  capture "examen-debut-$L" "examen/index.html?lang=$L" "" 1400
  capture "examen-resultat-$L" "examen/index.html?lang=$L" "examen" 3200
  capture "a-propos-$L" "a-propos/index.html?lang=$L" "" 4600
  capture "relecture-$L" "relecture/index.html?lang=$L" "" 2000
done
rm -f captures/_cadre.html
# planche de toutes les illustrations et des panneaux (pour les relire d'un coup d'oeil)
[ -n "$FILTRE" ] && exit 0
{ echo '<!doctype html><body style="margin:0;padding:16px;background:#F3F6FA;font:13px sans-serif;display:flex;flex-wrap:wrap;gap:14px">'
  for f in assets/illustrations/*.svg assets/panneaux/*.svg; do
    n=$(basename "$f"); case $n in theme-*) W=72;; accueil.svg) W=420;; [A-F]-*) W=90;; *) W=260;; esac
    echo "<figure style=\"margin:0;background:#1F5FA8;padding:8px;border-radius:10px\"><img src=\"$SRV/$f\" width=\"$W\"><figcaption style=\"color:#fff\">$n</figcaption></figure>"
  done; } > captures/_planche.html
"$CH" --headless=new --hide-scrollbars --user-data-dir="$TMPD" --virtual-time-budget=6000 --window-size=1100,1700 --screenshot="$D/captures/illustrations.png" "$SRV/captures/_planche.html" 2>/dev/null
rm -f captures/_planche.html; echo captures/illustrations.png
