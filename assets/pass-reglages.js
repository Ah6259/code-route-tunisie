/* Réglage de Code de la route Tunisie pour le parcours commun du Pass (assets/pass-commun.js, copie du module de projets-ahmed :
   « outils communs/pass-commun/ » ; NE PAS modifier pass-commun.js ici, voir son LISEZMOI.md). Page pass/ (FR) et ar/pass/ (AR),
   chargé après assets/pass.js (vérification des codes d'accès, Pass ouvert) dont il reprend PASS, T, iso, activerCode, lirePass…
   Ici seulement ce qui est PROPRE à ce site : nom, 3 formules, format du code (8 caractères sans O/0/I/1, affiché ABCD-EF23 : celui
   des codes déjà vendus, PASS.alphabet / PASS.longueur), textes de ce site, ligne « pour_activer » du bouton « pass » du dépôt
   privé code-route-pass, mise en page du retour (la « Dernière étape » remonte en haut de la page, au-dessus de « J'ai un code »).
   Fichier externe : aucun script en ligne (CSP). */
(function () {
  var PC = window.PassCommun;
  if (!PC) return;
  function joli(c) { return c.slice(0, 4) + "-" + c.slice(4); }
  // la « Dernière étape » revient à sa place (sous le formulaire) et la zone du haut disparaît
  function remettre() {
    var apres = document.getElementById("apres-pass"), form = document.getElementById("pass-form"), zone = document.getElementById("commande-attente");
    if (apres && form && apres.parentNode !== form.parentNode) form.parentNode.appendChild(apres);
    if (zone) zone.remove();
  }
  PC.brancher({
    site: "code-route",                             // clé du site dans email-clients/sites.json (e-mail automatique)
    type: "pass-code",                              // code tapé sur le site (« J'ai un code »)
    langues: ["fr", "ar"],
    nomSite: { fr: "Code de la route Tunisie", ar: "قانون الطرقات تونس" },
    // E-mail automatique (A.17) EN SERVICE depuis le 25 novembre 2026 ; false = phrases [data-email-auto] cachées et rien envoyé
    emailAuto: true,
    // attente = la ligne « Votre commande en attente : … » de la « Dernière étape » (remontée en haut de la page au retour)
    ids: { form: "pass-form", statut: "pass-status", apres: "apres-pass", attente: "cmd-attente", nouvelle: "nouvelle-commande" },
    code: { alphabet: PASS.alphabet, longueur: PASS.longueur, affiche: function (brut) { return joli(brut); } },
    // valeur exacte du formulaire -> texte arabe (sans caractères d'isolement : il part aussi dans WhatsApp)
    formules: { "7 jours - 9 DT": { ar: "7 أيام - 9 د" }, "30 jours - 19 DT": { ar: "30 يومًا - 19 د" }, "90 jours - 29 DT": { ar: "90 يومًا - 29 د" } },
    selecteurWa: "a.btn-wa#pass-preuve, a.btn-wa#pass-preuve-apres",
    textes: {
      emailInvalide: { fr: "E-mail invalide : vérifiez l'adresse.", ar: "البريد الإلكتروني غير صحيح: تحقّق من العنوان." },
      conditions: { fr: "Cochez « J'accepte les conditions du Pass Examen ».", ar: "يجب الموافقة على شروط باقة الامتحان." },
      merci: { fr: "Merci ! Votre demande a bien été envoyée.", ar: "شكرًا! تم إرسال طلبك." }
    },
    apresAuRetour: true,
    focusNouvelle: false,
    // bouton WhatsApp de l'offre (avant toute commande) : message simple ; avec une commande, il contient le code
    brancher: function () {
      var preuve = document.getElementById("pass-preuve");
      if (preuve) preuve.setAttribute("href", "https://wa.me/" + PASS.whatsapp + "?text=" + encodeURIComponent(T("Voici ma preuve de paiement — Code de la route Tunisie — Pass Examen", "هذا وصل الدفع — قانون الطرقات تونس — باقة الامتحان")));
    },
    // retour sur la page : ligne « Votre commande en attente », titre caché, la « Dernière étape » remonte au-dessus de « J'ai un code »
    auRetour: function (x) {
      var f = PC.reglage.formules[x.cmd.formule], fo = f && T(x.cmd.formule, f.ar) || x.cmd.formule;
      x.attente.textContent = T("Votre commande en attente : code " + x.code + " — " + fo, "طلبك في الانتظار: الرمز " + x.code + " — " + fo);
      var titre = document.getElementById("cmd-titre");
      if (titre) titre.hidden = true;
      var zone = document.getElementById("commande-attente");
      if (!zone) {
        zone = document.createElement("section");
        zone.className = "carte commande-attente";
        zone.id = "commande-attente";
        var repere = document.getElementById("code-acces");
        if (repere) repere.parentNode.insertBefore(zone, repere);
      }
      if (zone.parentNode) zone.appendChild(x.apres);
    },
    // juste après le formulaire : la « Dernière étape » avec son titre, sans la ligne du retour
    apresEnvoi: function () {
      var att = document.getElementById("cmd-attente"), titre = document.getElementById("cmd-titre");
      if (att) att.textContent = "";
      if (titre) titre.hidden = false;
    },
    formspree: function (d, c) {
      d.set("email", c.email);
      d.set("code", c.code);
      d.set("_subject", "Pass Examen — Code de la route Tunisie — code " + c.code);
    },
    // ligne prête à recopier dans le bouton GitHub « pass » (dépôt privé code-route-pass) : le robot active CE code tel quel
    pourActiver: function (c) {
      return "action: paye ; nom: " + c.nom + " ; telephone: " + c.tel + " ; email: " + c.email + " ; jours: " + ((c.formule.match(/\d+/) || [""])[0]) + " ; code: " + c.code;
    },
    // déjà activé sur ce téléphone : rien à montrer
    dejaActif: function (cmd) { var p = lirePass(); return !!(p && p.code === cmd.code && p.fin >= aujourdhui()); },
    // même vérification que la case « J'ai un code » (le Pass s'ouvre s'il est payé)
    essayerCode: function (code) { return activerCode(code); },
    passOuvert: function (r) {
      remettre();
      if (r.etat !== "ok") return;                  // code expiré : commande effacée, rien d'autre
      var st = document.getElementById("code-status");
      if (st) { st.className = "ok"; st.textContent = T("Votre paiement est validé : votre Pass Examen est actif sur ce téléphone jusqu'au " + dateLisible(r.fin) + " inclus.",
        "تم التثبت من دفعتك: باقة الامتحان مفعّلة على هذا الهاتف إلى غاية " + iso(dateLisible(r.fin)) + "."); }
    },
    nouvelle: function (p) {
      remettre();
      p.form.reset();
      var st = document.getElementById("pass-status");
      if (st) { st.className = ""; st.textContent = ""; }
      try { p.form.scrollIntoView({ block: "start" }); } catch (x) {}
    }
  });
})();
