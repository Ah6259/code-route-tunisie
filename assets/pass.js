/* Pass Examen (partie payante, accord d'Ahmed, octobre 2026) — chargé par toutes les pages, juste après page.js.
   Gratuit pour toujours : leçons, panneaux, amendes, entraînement par thème et 1 examen blanc par jour (compté sur l'appareil).
   Pass Examen : examens blancs illimités, statistiques par thème, révision de « Mes erreurs », lecture à voix haute.

   Code d'accès (site statique, pas de serveur) :
   - Ahmed active un client depuis l'application GitHub (dépôt PRIVÉ Ah6259/code-route-pass, bouton « pass »).
     Le robot publie ici, dans donnees/pass.json, SEULEMENT l'empreinte du code (PBKDF2-SHA-256 salée) et sa date de fin
     (dernier jour inclus). Aucun nom, aucun téléphone dans ce dépôt public.
   - Le visiteur tape son code UNE fois : le navigateur calcule l'empreinte (crypto.subtle), la cherche dans pass.json,
     vérifie la date de fin, puis garde le code sur l'appareil (localStorage, toujours dans try/catch).
   - Revérification au plus une fois par jour (seulement si un code est gardé) : date prolongée = mise à jour ;
     code arrêté ou expiré = effacé de l'appareil ; pas de réseau = on garde jusqu'à la date de fin connue.
   - Limite honnête : un code peut être partagé (accepté pour ce prix). Rien n'est envoyé au chargement d'une page
     sans code gardé (aucun appel réseau). */
const PASS = {
  formules: [{ jours: 7, dt: 9 }, { jours: 30, dt: 19 }, { jours: 90, dt: 29 }],
  essai: 2,                                   // durée des anciens essais (plus AUCUN nouveau depuis le 20 octobre 2026, décision d'Ahmed)
  donnees: "donnees/pass.json",
  cle: "crt-pass-v1",                         // code gardé sur l'appareil
  cleGratuit: "crt-examen-gratuit-v1",        // jour du dernier examen gratuit terminé
  cleEssai: "crt-essai-v1",                   // { debut } d'un essai commencé avant le 20 octobre 2026 (il va jusqu'à sa fin)
  alphabet: "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", // sans O/0 ni I/1 (faciles à confondre)
  longueur: 8,
  whatsapp: "21624321390"
};

function annoncerPass() { document.dispatchEvent(new Event("pass")); }

/* ---- dates (jour du visiteur, au format AAAA-MM-JJ) ---- */
function aujourdhui(d) {
  d = d || new Date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}
function dateLisible(iso) { const p = String(iso || "").split("-"); return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : ""; }

/* ---- code gardé sur l'appareil ---- */
function normaliserCode(s) { return String(s || "").toUpperCase().replace(/[\s\-_.]/g, ""); }
function formeCodeOk(c) { return c.length === PASS.longueur && [...c].every(x => PASS.alphabet.includes(x)); }
function lirePass() {
  try {
    const p = JSON.parse(localStorage.getItem(PASS.cle) || "null");
    if (p && typeof p.code === "string" && /^\d{4}-\d{2}-\d{2}$/.test(p.fin)) return p;
  } catch (e) {}
  return null;
}
function ecrirePass(p) {
  try { if (p) localStorage.setItem(PASS.cle, JSON.stringify(p)); else localStorage.removeItem(PASS.cle); } catch (e) {}
}
/* ---- anciens essais (décision d'Ahmed du 20 octobre 2026 : « Enlève tous les essais gratuits ») ----
   Plus aucun nouvel essai : le bouton a disparu de pass/. Un essai déjà commencé sur un téléphone va jusqu'à sa fin (rien n'est coupé). */
function plusJours(iso, n) { const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return aujourdhui(d); }
function debutEssai() { try { const e = JSON.parse(localStorage.getItem(PASS.cleEssai) || "null"); return e && /^\d{4}-\d{2}-\d{2}$/.test(e.debut) ? e.debut : ""; } catch (e) { return ""; } }
function finEssai() { const d = debutEssai(); return d ? plusJours(d, PASS.essai - 1) : ""; }       // dernier jour inclus
function essaiActif() { const f = finEssai(); return !!f && f >= aujourdhui() && debutEssai() <= aujourdhui(); }
function codeActif() { const p = lirePass(); return !!p && p.fin >= aujourdhui(); }
function passActif() { return codeActif() || essaiActif(); }
function finPass() { const p = lirePass(); return codeActif() ? p.fin : (essaiActif() ? finEssai() : (p ? p.fin : "")); }

/* ---- 1 examen blanc gratuit par jour, compté sur l'appareil ---- */
function examenGratuitDispo() { try { return localStorage.getItem(PASS.cleGratuit) !== aujourdhui(); } catch (e) { return true; } }
function marquerExamenGratuit() { try { localStorage.setItem(PASS.cleGratuit, aujourdhui()); } catch (e) {} }
// "pass" = illimité ; "gratuit" = l'examen gratuit du jour est disponible ; "bloque" = déjà utilisé aujourd'hui
function accesExamen() { return passActif() ? "pass" : examenGratuitDispo() ? "gratuit" : "bloque"; }

/* ---- vérification d'un code ---- */
async function empreinteCode(code, sel, tours) {
  const enc = new TextEncoder();
  const cle = await crypto.subtle.importKey("raw", enc.encode(code), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: enc.encode(sel), iterations: tours }, cle, 256);
  return Array.from(new Uint8Array(bits), b => b.toString(16).padStart(2, "0")).join("");
}
async function chargerListePass() {
  const racine = document.documentElement.dataset.racine || "";
  const r = await fetch(racine + PASS.donnees, { cache: "no-store" });
  if (!r.ok) throw new Error("HTTP " + r.status);
  const d = await r.json();
  if (!d || typeof d.sel !== "string" || !Array.isArray(d.codes) || !(d.tours > 0)) throw new Error("liste illisible");
  return d;
}
// résultat : { etat: "ok" | "expire" | "inconnu" | "forme" | "reseau" | "impossible", fin, code }
async function verifierCode(saisie) {
  const code = normaliserCode(saisie);
  if (!formeCodeOk(code)) return { etat: "forme", code };
  if (!(window.crypto && window.crypto.subtle) || typeof fetch !== "function") return { etat: "impossible", code };
  let liste, h;
  try { liste = await chargerListePass(); } catch (e) { return { etat: "reseau", code }; }
  try { h = await empreinteCode(code, liste.sel, liste.tours); } catch (e) { return { etat: "impossible", code }; }
  const trouve = liste.codes.find(c => c && c.h === h);
  if (!trouve) return { etat: "inconnu", code };
  if (!(trouve.fin >= aujourdhui())) return { etat: "expire", fin: trouve.fin, code };
  return { etat: "ok", fin: trouve.fin, code };
}
async function activerCode(saisie) {
  const r = await verifierCode(saisie);
  if (r.etat === "ok") { ecrirePass({ code: r.code, fin: r.fin, verifie: aujourdhui(), depuis: aujourdhui() }); annoncerPass(); }
  return r;
}
// Code déjà gardé : revérifié au plus une fois par jour (ou chaque fois s'il semble expiré : il a peut-être été prolongé)
async function reverifierPass() {
  const p = lirePass();
  if (!p) return;
  const auj = aujourdhui();
  if (p.verifie === auj && p.fin >= auj) return;
  const r = await verifierCode(p.code);
  const avant = passActif();
  if (r.etat === "ok") ecrirePass({ code: p.code, fin: r.fin, verifie: auj, depuis: p.depuis });
  else if (r.etat === "inconnu" || r.etat === "expire" || r.etat === "forme") ecrirePass(null);   // arrêté, expiré : nettoyé
  // "reseau" / "impossible" : on garde le code jusqu'à sa date de fin connue
  if (avant !== passActif() || r.etat === "ok" && r.fin !== p.fin) annoncerPass();
}

/* ---- lecture à voix haute (synthèse vocale du téléphone ; réservée au Pass) ---- */
function peutEcouter() { return typeof window.speechSynthesis !== "undefined" && typeof window.SpeechSynthesisUtterance === "function"; }
function htmlEcouter() {
  if (!passActif() || !peutEcouter()) return "";
  return `<button type="button" class="ecouter" id="ecouter"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>${T("Écouter", "استمع")}</button><span class="ecouter-info" id="ecouter-info" role="status"></span>`;
}
function lireAVoixHaute(texte) {
  const ar = document.documentElement.lang === "ar";
  const s = window.speechSynthesis, info = document.getElementById("ecouter-info");
  try {
    s.cancel();
    const u = new SpeechSynthesisUtterance(texte.replace(/[⁦-⁩⁨]/g, ""));
    u.lang = ar ? "ar-SA" : "fr-FR";
    const voix = (s.getVoices && s.getVoices()) || [];
    const bonne = voix.find(v => (v.lang || "").toLowerCase().startsWith(ar ? "ar" : "fr"));
    if (bonne) u.voice = bonne;
    else if (voix.length && info) info.textContent = T("Aucune voix française sur ce téléphone.", "لا يوجد صوت عربي على هذا الهاتف.");
    s.speak(u);
  } catch (e) { if (info) info.textContent = T("Lecture impossible sur ce téléphone.", "القراءة غير ممكنة على هذا الهاتف."); }
}
// Branche le bouton « Écouter » d'une question (question + réponses proposées)
function brancherEcouter(q) {
  const b = document.getElementById("ecouter");
  if (!b || !q) return;
  const ar = document.documentElement.lang === "ar";
  b.onclick = () => lireAVoixHaute((ar ? q.question_ar : q.question_fr) + ". " +
    q.choix.map((c, i) => lettre(i) + ". " + (ar ? c.ar : c.fr)).join(". "));
}

/* ---- textes communs (gros bouton doré, prix) ---- */
function prixCourt() { return T("dès 9 DT", "ابتداءً من " + iso("9") + " د"); }
function htmlBoutonPass(id, titreFr, titreAr) {
  const racine = document.documentElement.dataset.racine || "";
  return `<a class="btn-pass-grand" id="${id}" href="${(window.racinePages ? racinePages() : racine)}pass/"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4z"/><path d="M14 7v12"/></svg>
    <span>${T(titreFr, titreAr)}<small>${T("Examens blancs illimités dès 9 DT", "امتحانات تجريبية بلا حدود ابتداءً من " + iso("9") + " د")}</small></span></a>`;
}

// lien « J'ai déjà un code » sous chaque écran payant (octobre 2026 : le visiteur qui a payé doit trouver où taper son code)
function htmlLienCode() {
  const racine = document.documentElement.dataset.racine || "";
  return `<p class="petit lien-code"><a href="${(window.racinePages ? racinePages() : racine)}pass/#code-acces">${T("J'ai déjà un code d'accès", "لدي رمز دخول")}</a></p>`;
}

/* ---- page pass/ : formulaire d'inscription (Formspree) et saisie du code ---- */
function telephoneTn(v) {
  let n = String(v || "").replace(/\D/g, "");
  if (n.length === 11 && n.indexOf("216") === 0) n = n.slice(3);
  return n.length === 8 ? n : "";
}
/* ---- parcours commun du Pass (25 novembre 2026, règle commune § 70, décision d'Ahmed : « fais-le sur tous les sites ») ----
   Le code est créé ICI, au formulaire (avant le paiement), dans le même alphabet et la même longueur que les codes d'accès :
   c'est le « numéro de commande » que le client écrit dans le motif du paiement ; Ahmed l'active tel quel (bouton « pass »
   du dépôt privé, champ code) et il devient le code d'accès. Le téléphone garde la commande (clé « pass-commande » :
   code, formule, date ; rien d'autre) pendant 60 jours et essaie le code tout seul à chaque retour sur pass/. */
PASS.cleCommande = "pass-commande";
// E-mail automatique au client (A.17) : EN SERVICE depuis le 25 novembre 2026 (service « email-clients » de Clicvia + Resend, copie à Ahmed).
// EMAIL_AUTO = true : phrases « vous y recevez votre code… » / « Vous le recevez aussi par e-mail » affichées et demande envoyée au service ;
// false = tout caché, rien envoyé (retour en arrière en un mot si le service tombe).
const EMAIL_AUTO = true;
const EMAIL_API = "https://api-email.clicvia.com/inscription";
// envoi au service d'e-mail : sans attendre la réponse, jamais bloquant (Formspree et le code restent la voie principale)
function envoyerEmail(d) {
  if (!EMAIL_AUTO || !window.fetch) return;
  try {
    fetch(EMAIL_API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d), keepalive: true })
      .catch(function () {});
  } catch (e) {}
}
PASS.joursCommande = 60;
function joliCode(c) { return c.slice(0, 4) + "-" + c.slice(4); }
function nouveauCodeCommande() {
  const n = PASS.longueur, a = PASS.alphabet, t = new Uint8Array(n);
  try { crypto.getRandomValues(t); } catch (e) { for (let i = 0; i < n; i++) t[i] = Math.floor(Math.random() * 256); }
  return Array.from(t, b => a[b % a.length]).join("");             // 256 = 8 × 32 : chaque caractère a la même chance
}
function lireCommande() {
  try {
    const c = JSON.parse(localStorage.getItem(PASS.cleCommande) || "null");
    if (c && typeof c.code === "string" && formeCodeOk(c.code) && typeof c.formule === "string" && /^\d{4}-\d{2}-\d{2}$/.test(c.date)) {
      if (joursEntre(c.date, aujourdhui()) <= PASS.joursCommande) return { code: c.code, formule: c.formule, date: c.date };
    }
    if (c !== null) localStorage.removeItem(PASS.cleCommande);       // abîmée ou plus vieille que 60 jours : effacée
  } catch (e) { try { localStorage.removeItem(PASS.cleCommande); } catch (x) {} }
  return null;
}
function ecrireCommande(c) {
  try { if (c) localStorage.setItem(PASS.cleCommande, JSON.stringify({ code: c.code, formule: c.formule, date: c.date })); else localStorage.removeItem(PASS.cleCommande); } catch (e) {}
}
// « 30 jours - 19 DT » -> texte de la langue de la page (sans caractères d'isolement : il part aussi dans WhatsApp)
function formuleTexte(f) {
  const m = String(f || "").match(/(\d+)\D+(\d+)/);
  if (!m || document.documentElement.lang !== "ar") return String(f || "");
  return m[1] + " " + (m[1] === "7" ? "أيام" : "يومًا") + " - " + m[2] + " د";
}
// Message WhatsApp de la preuve : code + NOM + formule (25 novembre 2026, demande d’Ahmed). Le nom vient du formulaire au moment de
// l'envoi ; il n'est JAMAIS gardé par le téléphone : au retour sur la page (bandeau), le message garde le code et la formule.
function lienPreuve(code, formule, nom) {
  const ar = document.documentElement.lang === "ar", c = joliCode(code), f = formuleTexte(formule), n = nom ? " — " + nom : "";
  const txt = ar ? "هذا وصل الدفع — قانون الطرقات تونس — الرمز " + c + n + " — " + f
                 : "Voici ma preuve de paiement — Code de la route Tunisie — code " + c + n + " — " + f;
  return "https://wa.me/" + PASS.whatsapp + "?text=" + encodeURIComponent(txt);
}
// Affiche la « Dernière étape » (mode "nouvelle" : juste après le formulaire ; "attente" : retour sur la page, en haut)
function afficherCommande(cmd, mode, nom) {
  const apres = document.getElementById("apres-pass"), form = document.getElementById("pass-form");
  if (!apres) return;
  const c = joliCode(cmd.code);
  const code = document.getElementById("cmd-code"); if (code) code.textContent = c;
  apres.querySelectorAll(".cmd-code-motif").forEach(x => { x.textContent = c; });
  apres.querySelectorAll(".cmd-email").forEach(x => { x.hidden = !EMAIL_AUTO; });
  document.querySelectorAll("a.btn-wa#pass-preuve, a.btn-wa#pass-preuve-apres").forEach(x => x.setAttribute("href", lienPreuve(cmd.code, cmd.formule, nom)));
  const att = document.getElementById("cmd-attente"), titre = document.getElementById("cmd-titre");
  if (att) {
    att.hidden = mode !== "attente";
    att.textContent = mode === "attente" ? T("Votre commande en attente : code " + c + " — " + formuleTexte(cmd.formule),
      "طلبك في الانتظار: الرمز " + c + " — " + formuleTexte(cmd.formule)) : "";
  }
  if (titre) titre.hidden = mode === "attente";
  if (form) form.hidden = true;
  apres.hidden = false;
  if (mode === "attente") {
    let zone = document.getElementById("commande-attente");
    if (!zone) {
      zone = document.createElement("section");
      zone.className = "carte commande-attente";
      zone.id = "commande-attente";
      const repere = document.getElementById("code-acces");
      if (repere) repere.parentNode.insertBefore(zone, repere);
    }
    if (zone.parentNode) zone.appendChild(apres);
  }
}
function direCommande(fr, ar) { const e = document.getElementById("cmd-etat"); if (e) e.textContent = fr ? T(fr, ar) : ""; }
// Retour au formulaire (bouton « Nouvelle commande », ou commande activée)
function fermerCommande() {
  const apres = document.getElementById("apres-pass"), form = document.getElementById("pass-form");
  const zone = document.getElementById("commande-attente");
  if (apres && form && apres.parentNode !== form.parentNode) form.parentNode.appendChild(apres);
  if (zone) zone.remove();
  if (apres) apres.hidden = true;
  if (form) { form.hidden = false; delete form.dataset.code; }
  direCommande("");
}
// Commande gardée : bandeau + paiement + WhatsApp ; le code est essayé tout seul (même vérification que « J'ai un code »)
async function reprendreCommande() {
  const cmd = lireCommande();
  if (!cmd || !document.getElementById("apres-pass")) return;
  const p = lirePass();
  if (p && p.code === cmd.code && p.fin >= aujourdhui()) { ecrireCommande(null); return; }   // déjà activée sur ce téléphone
  afficherCommande(cmd, "attente");
  direCommande("Vérification de votre commande…", "جارٍ التثبت من طلبك…");
  const r = await activerCode(cmd.code);
  if (r.etat === "ok") {
    ecrireCommande(null);
    fermerCommande();
    const st = document.getElementById("code-status");
    if (st) { st.className = "ok"; st.textContent = T("Votre paiement est validé : votre Pass Examen est actif sur ce téléphone jusqu'au " + dateLisible(r.fin) + " inclus.",
      "تم التثبت من دفعتك: باقة الامتحان مفعّلة على هذا الهاتف إلى غاية " + iso(dateLisible(r.fin)) + "."); }
  } else if (r.etat === "expire") {
    ecrireCommande(null);
    fermerCommande();
  } else if (r.etat === "inconnu") {
    direCommande("En attente de votre paiement : dès qu'il est vérifié, votre Pass s'ouvrira tout seul ici.", "في انتظار دفعتك: بعد التثبت منها تُفتح باقتك هنا وحدها.");
  } else {
    direCommande("En attente de votre paiement (vérification impossible pour le moment : revenez plus tard).", "في انتظار دفعتك (التثبت غير ممكن الآن: عد لاحقًا).");
  }
}
function brancherFormulairePass() {
  const form = document.getElementById("pass-form");
  if (!form || form.dataset.branche) return;
  form.dataset.branche = "1";
  // « vous y recevez votre code et les étapes du paiement » : montré seulement quand l'e-mail automatique marche
  document.querySelectorAll(".email-auto").forEach(x => { x.hidden = !EMAIL_AUTO; });
  const statut = document.getElementById("pass-status"), bouton = form.querySelector("button[type=submit]");
  const dire = (classe, fr, ar) => { statut.className = classe; statut.textContent = T(fr, ar); };
  const champ = n => form.querySelector('[name="' + n + '"]');
  const val = n => { const x = champ(n); return x ? String(x.value || "").trim() : ""; };
  // bouton WhatsApp de l'offre (avant toute commande) : message simple ; avec une commande, il contient le code (afficherCommande)
  const preuve = document.getElementById("pass-preuve");
  if (preuve) preuve.setAttribute("href", "https://wa.me/" + PASS.whatsapp + "?text=" + encodeURIComponent(T("Voici ma preuve de paiement — Code de la route Tunisie — Pass Examen", "هذا وصل الدفع — قانون الطرقات تونس — باقة الامتحان")));
  const nouvelle = document.getElementById("nouvelle-commande");
  if (nouvelle) nouvelle.addEventListener("click", () => {
    ecrireCommande(null);
    fermerCommande();
    form.reset();
    statut.className = ""; statut.textContent = "";
    try { form.scrollIntoView({ block: "start" }); } catch (x) {}
  });
  form.addEventListener("submit", e => {
    e.preventDefault();
    if (bouton.disabled) return;
    const tel = telephoneTn(val("telephone"));
    const f = form.querySelector('input[name="formule"]:checked');
    if (!val("nom")) { dire("err", "Indiquez votre nom.", "اكتب اسمك."); champ("nom").focus(); return; }
    if (!tel) { dire("err", "Téléphone : 8 chiffres, par exemple 24 321 390.", "الهاتف: " + iso("8") + " أرقام، مثال " + iso("24 321 390") + "."); champ("telephone").focus(); return; }
    const email = val("email");
    if (!email) {
      if (EMAIL_AUTO) dire("err", "Indiquez votre e-mail : vous y recevez votre code et les étapes du paiement.", "اكتب بريدك الإلكتروني: يصلك عليه رمزك وخطوات الدفع.");
      else dire("err", "Indiquez votre e-mail.", "اكتب بريدك الإلكتروني.");
      champ("email").focus(); return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { dire("err", "E-mail invalide : vérifiez l'adresse.", "البريد الإلكتروني غير صحيح: تحقّق من العنوان."); champ("email").focus(); return; }
    if (!f) { dire("err", "Choisissez une formule.", "اختر صيغة."); return; }
    if (!champ("conditions").checked) { dire("err", "Cochez « J'accepte les conditions du Pass Examen ».", "يجب الموافقة على شروط باقة الامتحان."); return; }
    // formulaire valide : le numéro de commande est créé maintenant (le même s'il faut renvoyer après un échec du réseau)
    if (!form.dataset.code) form.dataset.code = nouveauCodeCommande();
    const cmd = { code: form.dataset.code, formule: f.value, date: aujourdhui() };
    const fini = robot => {
      if (!robot) ecrireCommande(cmd);
      afficherCommande(cmd, "nouvelle", val("nom"));             // nom dans le message WhatsApp, jamais dans la mémoire
      const apres = document.getElementById("apres-pass");
      if (apres) { try { apres.scrollIntoView({ block: "start" }); } catch (x) {} }
    };
    if (val("_gotcha")) { fini(true); return; }            // champ piège rempli = robot : rien n'est envoyé ni gardé
    champ("page").value = location.href.split("#")[0];
    const donnees = new FormData(form);
    donnees.set("telephone", tel);
    donnees.set("email", email);
    donnees.set("code", joliCode(cmd.code));
    donnees.set("_subject", "Pass Examen — Code de la route Tunisie — code " + joliCode(cmd.code));
    // ligne prête à recopier dans le bouton GitHub « pass » (dépôt privé) : le robot active CE code tel quel
    const jours = (f.value.match(/\d+/) || [""])[0];
    donnees.set("pour_activer", "action: paye ; nom: " + val("nom") + " ; telephone: " + tel + " ; email: " + email + " ; jours: " + jours + " ; code: " + joliCode(cmd.code));
    // e-mail automatique au client (code, prix, paiement, WhatsApp, page du Pass ; langue de la page ; Ahmed en copie)
    envoyerEmail({ site: "code-route", langue: document.documentElement.lang === "ar" ? "ar" : "fr", nom: val("nom"), email: email,
      code: joliCode(cmd.code), formule: f.value });
    bouton.disabled = true;
    dire("", "Envoi…", "جارٍ الإرسال…");
    fetch(form.getAttribute("action"), { method: "POST", body: donnees, headers: { "Accept": "application/json" } })
      .then(r => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        dire("ok", "Merci ! Votre demande a bien été envoyée.", "شكرًا! تم إرسال طلبك.");
        fini(false);
      })
      .catch(() => dire("err", "Échec de l'envoi — vérifiez votre connexion et réessayez, ou écrivez-nous sur WhatsApp au 24 321 390.",
        "تعذّر الإرسال — تحقّق من الاتصال وأعد المحاولة، أو راسلنا عبر واتساب على " + iso("24321390") + "."))
      .then(() => { bouton.disabled = false; });
  });
}
function brancherCodeAcces() {
  const form = document.getElementById("code-form");
  if (!form || form.dataset.branche) return;
  form.dataset.branche = "1";
  const statut = document.getElementById("code-status"), bouton = form.querySelector("button[type=submit]");
  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (bouton.disabled) return;
    const champ = form.querySelector("input[name=code]");
    bouton.disabled = true;
    statut.className = ""; statut.textContent = T("Vérification…", "جارٍ التثبت…");
    const r = await activerCode(champ.value);
    bouton.disabled = false;
    const M = {
      ok: ["Code accepté : votre Pass Examen est actif sur ce téléphone jusqu'au " + dateLisible(r.fin) + " inclus.", "تم قبول الرمز: باقة الامتحان مفعّلة على هذا الهاتف إلى غاية " + iso(dateLisible(r.fin)) + "."],
      forme: ["Le code a 8 caractères (lettres et chiffres), par exemple ABCD-EF23.", "الرمز يتكون من " + iso("8") + " حروف وأرقام، مثال " + iso("ABCD-EF23") + "."],
      inconnu: ["Code non reconnu. Vérifiez-le ; si vous venez de le recevoir, réessayez dans 10 minutes.", "رمز غير معروف. تثبّت منه؛ إن وصلك للتو، أعد المحاولة بعد " + iso("10") + " دقائق."],
      expire: ["Ce code a expiré le " + dateLisible(r.fin) + ". Pour continuer, choisissez une formule ci-dessous.", "انتهت صلاحية هذا الرمز في " + iso(dateLisible(r.fin)) + ". للمواصلة، اختر صيغة أسفله."],
      reseau: ["Pas de connexion : vérifiez Internet et réessayez.", "لا يوجد اتصال: تحقّق من الإنترنت وأعد المحاولة."],
      impossible: ["Votre navigateur ne peut pas vérifier le code : mettez-le à jour ou essayez Chrome.", "متصفحك لا يستطيع التثبت من الرمز: حدّثه أو جرّب ⁨Chrome⁩."]
    }[r.etat];
    statut.className = r.etat === "ok" ? "ok" : "err";
    statut.textContent = T(M[0], M[1]);
    if (r.etat === "ok") champ.value = "";
  });
}

/* ---- rappel de fin du Pass (demande d'Ahmed, octobre 2026) ----
   Pas de Telegram ni d'e-mail : la page elle-même remercie le client et lui rappelle la fin.
   - Pass payé (code) valide qui finit dans 7 jours ou moins (Pass court de moins de 30 jours dont on connaît le début,
     c'est-à-dire activé sur ce téléphone depuis cette version (« depuis ») : seulement le dernier quart de sa durée)
     -> petit bandeau, au plus une fois par jour.
   - Pass terminé (au plus 30 jours après la fin) -> message « Votre Pass Examen est terminé — merci ! », une seule fois.
   Seuls les codes comptent (jamais les anciens essais).
   Mémoire sur l'appareil : PASS.cleRappel = { fin, debut, vu (jour du dernier bandeau), finVu (message de fin montré) }. */
PASS.cleRappel = "crt-pass-rappel-v1";
function lireRappel() { try { const r = JSON.parse(localStorage.getItem(PASS.cleRappel) || "null"); return r && typeof r === "object" ? r : {}; } catch (e) { return {}; } }
function ecrireRappel(r) { try { localStorage.setItem(PASS.cleRappel, JSON.stringify(r)); } catch (e) {} }
function joursEntre(a, b) { return Math.round((Date.parse(b + "T12:00:00") - Date.parse(a + "T12:00:00")) / 864e5); }
// note la fin connue AVANT la revérification (qui efface un code expiré) : le message de fin reste possible
function noterFinPass() {
  const r = lireRappel(), p = lirePass();
  if (!p || !p.fin) return;
  const debut = p.depuis || "";
  if (p.fin !== r.fin) ecrireRappel({ fin: p.fin, debut, vu: r.vu || "", finVu: false });
  else if (debut && r.debut !== debut) { r.debut = debut; ecrireRappel(r); }
}
// { type: "proche" | "fini", fin } ou null
function etatRappel() {
  const auj = aujourdhui(), r = lireRappel();
  if (codeActif()) {
    const fin = lirePass().fin, debut = r.fin === fin ? r.debut : "";
    const reste = joursEntre(auj, fin), total = debut ? joursEntre(debut, fin) + 1 : 0;
    const proche = total > 0 && total < 30 ? reste + 1 <= Math.max(1, Math.ceil(total / 4)) : reste <= 7;
    return proche && r.vu !== auj ? { type: "proche", fin } : null;
  }
  if (r.fin && r.fin < auj && !r.finVu && joursEntre(r.fin, auj) <= 30) return { type: "fini", fin: r.fin };
  return null;
}
function afficherRappel() {
  const e = etatRappel(), main = document.querySelector("main");
  const ancien = document.getElementById("rappel-zone");
  if (ancien) ancien.remove();
  if (!e || !main) return;
  const racine = document.documentElement.dataset.racine || "";
  const r = lireRappel();
  if (e.type === "proche") r.vu = aujourdhui(); else r.finVu = true;
  ecrireRappel(r);
  const b = document.createElement("aside");
  b.className = "rappel-pass" + (e.type === "fini" ? " fini" : "");
  b.id = "rappel-pass";
  b.setAttribute("role", "status");
  const date = dateLisible(e.fin);
  b.innerHTML = '<button type="button" class="rappel-fermer" aria-label="' + T("Fermer", "إغلاق") + '">×</button>' +
    (e.type === "proche"
      ? "<p><b>" + T("Merci pour votre inscription !", "شكرًا على اشتراكك!") + "</b> " +
        T("Votre Pass Examen se termine le " + date + ".", "تنتهي باقة الامتحان في " + iso(date) + ".") + "</p>"
      : "<p><b>" + T("Votre Pass Examen est terminé — merci !", "انتهت باقة الامتحان — شكرًا لك!") + "</b> " +
        T("Il a pris fin le " + date + ".", "انتهت في " + iso(date) + ".") + "</p>") +
    '<p class="rappel-actions"><a class="btn-pro rappel-renouveler" href="' + (window.racinePages ? racinePages() : racine) + 'pass/#offre">' + T("Renouveler mon Pass", "جدّد باقتي") + "</a>" +
    '<a class="rappel-avis" href="' + (window.racinePages ? racinePages() : racine) + '#avis">' + T("Donner mon avis", "أعطِ رأيك") + "</a></p>";
  // tout en haut, sous l'en-tête (avant le grand bandeau de la page) : vu sans faire défiler
  const zone = document.createElement("div");
  zone.className = "wrap rappel-zone";
  zone.id = "rappel-zone";
  zone.appendChild(b);
  b.querySelector(".rappel-fermer").addEventListener("click", () => zone.remove());
  const avant = document.querySelector("body > .hero") || main;
  avant.parentNode.insertBefore(zone, avant);
}

/* ---- en-tête : bouton doré « Pass Examen » (dessiné par page.js) ---- */
function majBoutonEntete() {
  document.querySelectorAll(".entete-pass").forEach(a => a.classList.toggle("actif", passActif()));
}
document.addEventListener("pass", majBoutonEntete);
document.addEventListener("DOMContentLoaded", () => {
  brancherFormulairePass();
  brancherCodeAcces();
  reprendreCommande().catch(() => {});
  noterFinPass();
  reverifierPass().catch(() => {}).then(() => { noterFinPass(); afficherRappel(); });
});
