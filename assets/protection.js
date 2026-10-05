/* Protection légère contre la copie (consigne sécurité d’Ahmed, octobre 2026).
   - images et photos : pas de clic droit ni de glisser-déposer ;
   - contenus de valeur (.protege : leçons, questions, panneaux, tableaux d'amendes) : texte copié suivi de la source et du © ;
   - pas d'affichage dans le cadre (iframe) d'un autre site.
   Les liens, boutons et champs restent utilisables. Limite : ce qu'on voit peut toujours être capturé ;
   la vraie protection = licence « tous droits réservés » + © + preuves. */
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

  document.addEventListener("copy", e => {
    const sel = window.getSelection ? String(window.getSelection()) : "";
    if (!sel.trim()) return;
    const noeud = window.getSelection().anchorNode;
    const el = noeud && (noeud.nodeType === 1 ? noeud : noeud.parentElement);
    if (!el || !el.closest || !el.closest(".protege")) return;
    const source = "\n\nSource : " + location.href.split("#")[0] + " — © Code de la route Tunisie, tous droits réservés.";
    if (e.clipboardData) { e.clipboardData.setData("text/plain", sel + source); e.preventDefault(); }
  });
})();
