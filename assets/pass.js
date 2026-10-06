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
  essai: 2,                                   // jours d'essai gratuit
  donnees: "donnees/pass.json",
  cle: "crt-pass-v1",                         // code gardé sur l'appareil
  cleGratuit: "crt-examen-gratuit-v1",        // jour du dernier examen gratuit terminé
  alphabet: "ABCDEFGHJKLMNPQRSTUVWXYZ23456789", // sans O/0 ni I/1 (faciles à confondre)
  longueur: 8,
  whatsapp: "21624321390"
};

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
function passActif() { const p = lirePass(); return !!p && p.fin >= aujourdhui(); }
function finPass() { const p = lirePass(); return p ? p.fin : ""; }

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
function annoncerPass() { document.dispatchEvent(new Event("pass")); }
async function activerCode(saisie) {
  const r = await verifierCode(saisie);
  if (r.etat === "ok") { ecrirePass({ code: r.code, fin: r.fin, verifie: aujourdhui() }); annoncerPass(); }
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
  if (r.etat === "ok") ecrirePass({ code: p.code, fin: r.fin, verifie: auj });
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
  return `<a class="btn-pass-grand" id="${id}" href="${racine}pass/"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4z"/><path d="M14 7v12"/></svg>
    <span>${T(titreFr, titreAr)}<small>${T("Examens blancs illimités dès 9 DT · 2 jours d'essai gratuit", "امتحانات تجريبية بلا حدود ابتداءً من " + iso("9") + " د · تجربة مجانية ليومين")}</small></span></a>`;
}

/* ---- page pass/ : formulaire d'inscription (Formspree) et saisie du code ---- */
function telephoneTn(v) {
  let n = String(v || "").replace(/\D/g, "");
  if (n.length === 11 && n.indexOf("216") === 0) n = n.slice(3);
  return n.length === 8 ? n : "";
}
function brancherFormulairePass() {
  const form = document.getElementById("pass-form");
  if (!form || form.dataset.branche) return;
  form.dataset.branche = "1";
  const statut = document.getElementById("pass-status"), bouton = form.querySelector("button[type=submit]");
  const apres = document.getElementById("apres-pass");
  const dire = (classe, fr, ar) => { statut.className = classe; statut.textContent = T(fr, ar); };
  const champ = n => form.querySelector('[name="' + n + '"]');
  const val = n => { const x = champ(n); return x ? String(x.value || "").trim() : ""; };
  form.addEventListener("submit", e => {
    e.preventDefault();
    if (bouton.disabled) return;
    const tel = telephoneTn(val("telephone"));
    const f = form.querySelector('input[name="formule"]:checked');
    if (!val("nom")) { dire("err", "Indiquez votre nom.", "اكتب اسمك."); champ("nom").focus(); return; }
    if (!tel) { dire("err", "Téléphone : 8 chiffres, par exemple 24 321 390.", "الهاتف: " + iso("8") + " أرقام، مثال " + iso("24 321 390") + "."); champ("telephone").focus(); return; }
    if (!f) { dire("err", "Choisissez une formule.", "اختر صيغة."); return; }
    if (!champ("conditions").checked) { dire("err", "Cochez « J'accepte les conditions du Pass Examen ».", "يجب الموافقة على شروط باقة الامتحان."); return; }
    const fini = () => {
      // message WhatsApp de la preuve de paiement : on ajoute le nom et le téléphone (= motif du paiement)
      document.querySelectorAll("a.btn-wa[data-texte]").forEach(a =>
        a.setAttribute("href", "https://wa.me/" + PASS.whatsapp + "?text=" + encodeURIComponent(a.getAttribute("data-texte") + val("nom") + " — " + tel + " — " + f.value)));
      const essai = document.getElementById("apres-essai"), paye = document.getElementById("apres-paye");
      if (essai) essai.hidden = f.value.indexOf("essai") !== 0;
      if (paye) paye.hidden = f.value.indexOf("essai") === 0;
      form.hidden = true;
      if (apres) { apres.hidden = false; try { apres.scrollIntoView({ block: "start" }); } catch (x) {} }
    };
    if (val("_gotcha")) { fini(); return; }                // champ piège rempli = robot : rien n'est envoyé
    champ("page").value = location.href.split("#")[0];
    const donnees = new FormData(form);
    donnees.set("telephone", tel);
    // ligne prête à recopier dans le bouton GitHub « pass » (dépôt privé)
    const jours = (f.value.match(/\d+/) || [""])[0];
    donnees.set("pour_activer", "action: " + (f.value.indexOf("essai") === 0 ? "essai" : "paye") + " ; nom: " + val("nom") + " ; telephone: " + tel + (f.value.indexOf("essai") === 0 ? "" : " ; jours: " + jours));
    bouton.disabled = true;
    dire("", "Envoi…", "جارٍ الإرسال…");
    fetch(form.getAttribute("action"), { method: "POST", body: donnees, headers: { "Accept": "application/json" } })
      .then(r => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        dire("ok", "Merci ! Votre demande a bien été envoyée.", "شكرًا! تم إرسال طلبك.");
        fini();
      })
      .catch(() => dire("err", "Échec de l'envoi — vérifiez votre connexion et réessayez, ou écrivez-nous sur WhatsApp au 24 321 390.",
        "تعذّر الإرسال — تحقّق من الاتصال وأعد المحاولة، أو راسلنا عبر واتساب على " + iso("24 321 390") + "."))
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
      expire: ["Ce code a expiré le " + dateLisible(r.fin) + ". Pour continuer, choisissez une formule ci-dessus.", "انتهت صلاحية هذا الرمز في " + iso(dateLisible(r.fin)) + ". للمواصلة، اختر صيغة أعلاه."],
      reseau: ["Pas de connexion : vérifiez Internet et réessayez.", "لا يوجد اتصال: تحقّق من الإنترنت وأعد المحاولة."],
      impossible: ["Votre navigateur ne peut pas vérifier le code : mettez-le à jour ou essayez Chrome.", "متصفحك لا يستطيع التثبت من الرمز: حدّثه أو جرّب ⁨Chrome⁩."]
    }[r.etat];
    statut.className = r.etat === "ok" ? "ok" : "err";
    statut.textContent = T(M[0], M[1]);
    if (r.etat === "ok") champ.value = "";
  });
}

/* ---- en-tête : bouton doré « Pass Examen » (dessiné par page.js) ---- */
function majBoutonEntete() {
  document.querySelectorAll(".entete-pass").forEach(a => a.classList.toggle("actif", passActif()));
}
document.addEventListener("pass", majBoutonEntete);
document.addEventListener("DOMContentLoaded", () => {
  brancherFormulairePass();
  brancherCodeAcces();
  reverifierPass().catch(() => {});
});
