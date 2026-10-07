/* Protection contre la copie (consigne sécurité d’Ahmed, octobre 2026 ; renforcée en octobre 2026 :
   « nos fiches, nos examens et nos images, c'est nous qui les avons créés, c'est notre propriété »).
   - images et photos : pas de clic droit ni de glisser-déposer ;
   - contenus de valeur (.protege : leçons, questions, panneaux, tableaux d'amendes) : copie BLOQUÉE
     (le presse-papiers ne reçoit que la mention de propriété et la source) ;
   - capture sur ordinateur : quand la fenêtre perd la main (outil Capture d'écran, Win+Maj+S, autre fenêtre)
     ou à la touche « Impr. écran », le contenu se floute et le presse-papiers est vidé ;
   - impression / « Enregistrer en PDF » : page blanche « Contenu protégé » (style.css, @media print) ;
   - filigrane « © Code de la route Tunisie » sur les cartes et les images (style.css) ;
   - pas d'affichage dans le cadre (iframe) d'un autre site.
   Les liens, boutons et champs restent utilisables. Limite honnête : un navigateur ne peut pas interdire la capture
   d'écran d'un téléphone ; le filigrane fait que toute capture porte notre nom. La vraie protection = © + preuves. */
(function () {
  // Anti-iframe : si la page est dans le cadre d'un AUTRE site, on l'ouvre en plein écran.
  // (Depuis le PC en file://, ou dans un cadre du même site — captures, relecture —, on ne fait rien.)
  try {
    if (window.top !== window.self && location.protocol !== "file:") {
      let memeSite = false;
      try { memeSite = window.top.location.origin === location.origin; } catch (e) { memeSite = false; }
      if (!memeSite) window.top.location.href = location.href;
    }
  } catch (e) {}

  const estImage = el => el && el.closest && el.closest("img, svg, figure.photo, .panneau-img, .hero-visuel");
  document.addEventListener("contextmenu", e => { if (estImage(e.target)) e.preventDefault(); });
  document.addEventListener("dragstart", e => { if (estImage(e.target)) e.preventDefault(); });

  const MENTION = () => "Contenu protégé — © Code de la route Tunisie, tous droits réservés. Source : " + location.href.split("#")[0];
  const dansProtege = () => {
    const s = window.getSelection && window.getSelection();
    const noeud = s && s.anchorNode;
    const el = noeud && (noeud.nodeType === 1 ? noeud : noeud.parentElement);
    return !!(el && el.closest && el.closest(".protege, figure.photo, .hero-visuel"));
  };
  // copier / couper dans un contenu protégé : rien de notre texte ne part, seulement la mention
  ["copy", "cut"].forEach(type => document.addEventListener(type, e => {
    const sel = window.getSelection ? String(window.getSelection()) : "";
    if (!sel.trim() || !dansProtege()) return;
    if (e.clipboardData) { e.clipboardData.setData("text/plain", MENTION()); e.preventDefault(); }
  }));

  // capture d'écran sur ordinateur : flou dès que la page n'a plus la main, presse-papiers vidé à « Impr. écran »
  const html = document.documentElement;
  let minuterie = 0;
  const cacher = () => html.classList.add("cache-capture");
  const montrer = () => { clearTimeout(minuterie); html.classList.remove("cache-capture"); };
  window.addEventListener("blur", cacher);
  window.addEventListener("focus", montrer);
  document.addEventListener("visibilitychange", () => { if (document.hidden) cacher(); else if (!document.hasFocus || document.hasFocus()) montrer(); });
  document.addEventListener("keyup", e => {
    if (e.key !== "PrintScreen" && e.keyCode !== 44) return;
    cacher();
    try { if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(MENTION()).catch(() => {}); } catch (err) {}
    clearTimeout(minuterie);
    minuterie = setTimeout(() => { if (!document.hasFocus || document.hasFocus()) montrer(); }, 1500);
  });
  // revenir sur la page (clic, toucher) : le contenu réapparaît
  document.addEventListener("pointerdown", () => { if (html.classList.contains("cache-capture")) montrer(); });
})();
