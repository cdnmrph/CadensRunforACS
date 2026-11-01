// ===== EDIT THESE =====
const CONFIG = {
  givengainUrl: "https://www.givengain.com/donate/ap/137724#amount",
  projectId: 137724,
  apiUrl: "https://partnerapi.givengain.com",
  goal: 2620,     // fundraising goal in dollars
  raised: 0,      // backup only. The site reads the live total from GivenGain.

  // Race day. Add a start time if you want, for example "2027-10-10T07:30:00-05:00".
  raceDate: "2027-10-10T00:00:00-05:00",

  // Strava. The run log shows on desktop. Mobile shows a card that opens the app.
  stravaUrl: "https://www.strava.com/athletes/121091016",
  stravaEmbeds: [
    { src: "https://www.strava.com/athletes/121091016/latest-rides/3d039b56427a58306c326dc596e3749a816d70be", height: 454, title: "Strava latest activities" }
  ],

  // Instagram button. Paste your account link here, for example "https://www.instagram.com/yourhandle/".
  // While this is empty the box only shows in your local preview and stays hidden on the live site.
  instagramUrl: "https://www.instagram.com/amateur.xyz",

  milestones: [
    { amount: 250,  title: "Costume long run", challenge: "I run my entire long run (1.5 - 2.5 hours) in a pretty uncomfortable costume." },
    { amount: 500,  title: "Beer mile", challenge: "1 beer every quarter mile, for a mile." },
    { amount: 750, title: "Donor's choice", challenge: "The donor who crosses this threshold chooses their own challenge."},
    { amount: 1000, title: "Alphabet run", challenge: "I run until I see every letter of the alphabet on store signs." },
    { amount: 1250, title: "Donor's choice", challenge: "The donor who crosses this threshold chooses their own challenge."},
    { amount: 1500, title: "100,000 Steps", challenge: "I aim to take 100,000 steps (roughly 45 miles) in one day throughout Chicago." },
    { amount: 2000, title: "1 mile loop marathon", challenge: "I run 26.2 miles around a 1 mile loop."},
    { amount: 2620, title: "Race with me", challenge: "I put the name of every donor on my shirt that I wear on race day." }
  ]
};
// ======================

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
const money = n => "$" + Math.round(n).toLocaleString("en-US");
const clamp01 = n => Math.max(0, Math.min(1, n));
const plural = (n, word) => n + " " + word + (n === 1 ? "" : "s");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/* ---------- Donate links ---------- */
function setDonateLinks() {
  $$("[data-donate]").forEach(a => {
    a.href = CONFIG.givengainUrl;
    a.target = "_blank";
    a.rel = "noopener";
  });
}

/* ---------- Countdown ---------- */
function renderCountdown() {
  const diff = new Date(CONFIG.raceDate).getTime() - Date.now();
  const days = $("#cd-days"), unit = $("#cd-unit"), rest = $("#cd-rest");
  if (!(diff > 0)) {
    days.textContent = "0";
    unit.textContent = "days";
    rest.textContent = "Race day is here.";
    return;
  }
  const totalMinutes = Math.floor(diff / 60000);
  const d = Math.floor(totalMinutes / 1440);
  const h = Math.floor((totalMinutes % 1440) / 60);
  const m = totalMinutes % 60;
  days.textContent = String(d);
  unit.textContent = d === 1 ? "day" : "days";
  rest.textContent = "and " + plural(h, "hour") + ", " + plural(m, "minute");
}

/* ---------- Progress and challenges ---------- */
const ui = { segFill: [], segSr: [], railFill: [], vItem: [], vStatus: [], cItem: [], cStatus: [] };

function buildProgress() {
  const segments = $("#segments"), vlist = $("#vlist"), clist = $("#clist");
  CONFIG.milestones.forEach(m => {
    // Desktop segment: shows the amount only, not the challenge.
    const seg = el("li", "seg");
    const bar = el("div", "seg-bar");
    const fill = el("div", "seg-fill");
    bar.appendChild(fill);
    const label = el("span", "seg-label", money(m.amount));
    const sr = el("span", "sr");
    label.appendChild(sr);
    seg.append(bar, label);
    segments.appendChild(seg);
    ui.segFill.push(fill);
    ui.segSr.push(sr);

    // Mobile item: vertical bar with the challenge listed.
    const item = el("li", "vitem");
    const rail = el("div", "rail");
    const railFill = el("div", "rail-fill");
    rail.appendChild(railFill);
    const body = el("div", "v-body");
    const status = el("p", "v-status");
    body.append(el("p", "v-amount", money(m.amount)), el("h3", "v-title", m.title), el("p", "v-desc", m.challenge), status);
    item.append(rail, body);
    vlist.appendChild(item);
    ui.railFill.push(railFill);
    ui.vItem.push(item);
    ui.vStatus.push(status);

    // Desktop carousel slide: full challenge list.
    const c = el("li", "citem");
    const cStatus = el("p", "c-status");
    const text = el("div");
    text.append(el("p", "c-title", m.title), el("p", "c-desc", m.challenge), cStatus);
    c.append(el("p", "c-amount", money(m.amount)), text);
    clist.appendChild(c);
    ui.cItem.push(c);
    ui.cStatus.push(cStatus);
  });
}

function applyRaised(raised) {
  $$("[data-raised]").forEach(e => { e.textContent = money(raised); });
  $$("[data-goal]").forEach(e => { e.textContent = money(CONFIG.goal); });

  CONFIG.milestones.forEach((m, i) => {
    const start = i === 0 ? 0 : CONFIG.milestones[i - 1].amount;
    const fraction = clamp01((raised - start) / (m.amount - start));
    const done = raised >= m.amount;
    const statusText = done ? "Unlocked" : money(m.amount - raised) + " to go";

    ui.segFill[i].style.width = (fraction * 100) + "%";
    ui.segSr[i].textContent = done ? " reached" : "";
    ui.railFill[i].style.height = (fraction * 100) + "%";
    ui.vItem[i].classList.toggle("unlocked", done);
    ui.vStatus[i].textContent = statusText;
    ui.cItem[i].classList.toggle("unlocked", done);
    ui.cStatus[i].textContent = statusText;
  });

  // On mobile, bring the next challenge into view inside the scrollable bar.
  const vwrap = $("#vwrap");
  const next = CONFIG.milestones.findIndex(m => raised < m.amount);
  if (vwrap && next > 0) vwrap.scrollTop = Math.max(0, ui.vItem[next].offsetTop - vwrap.offsetTop - 8);
}

async function loadRaised() {
  try {
    const res = await fetch(CONFIG.apiUrl + "/project/" + CONFIG.projectId);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    const n = Number(data.amountRaised);
    if (Number.isFinite(n)) return n;
  } catch (err) {
    // Fall back to the number in CONFIG.
  }
  return CONFIG.raised;
}

/* ---------- Carousel ---------- */
function setupCarousel() {
  const panel = $(".carousel-panel"), track = $("#track"), controls = $("#controls");
  const dots = $("#dots"), prev = $("#prev"), next = $("#next");
  const visibleSlides = () => $$(".slide", track).filter(s => s.offsetParent !== null);
  const currentIndex = () => Math.round(track.scrollLeft / Math.max(1, track.clientWidth));

  function goTo(i) {
    const last = visibleSlides().length - 1;
    const target = Math.max(0, Math.min(last, i));
    track.scrollTo({ left: target * track.clientWidth, behavior: reduceMotion ? "auto" : "smooth" });
  }

  function update() {
    const i = currentIndex();
    $$(".dot", dots).forEach((d, n) => d.setAttribute("aria-current", n === i ? "true" : "false"));
    prev.disabled = i <= 0;
    next.disabled = i >= visibleSlides().length - 1;
  }

  // With one slide (mobile) there is nothing to swipe, so the controls stay hidden.
  function rebuild() {
    const slides = visibleSlides();
    const multi = slides.length > 1;
    controls.hidden = !multi;
    if (multi) panel.setAttribute("aria-roledescription", "carousel");
    else panel.removeAttribute("aria-roledescription");

    dots.replaceChildren();
    slides.forEach((s, n) => {
      if (multi) {
        s.setAttribute("role", "group");
        s.setAttribute("aria-roledescription", "slide");
        s.setAttribute("aria-label", "Slide " + (n + 1) + " of " + slides.length);
        const b = el("button", "dot");
        b.type = "button";
        b.setAttribute("aria-label", "Go to slide " + (n + 1));
        b.addEventListener("click", () => goTo(n));
        dots.appendChild(b);
      } else {
        s.removeAttribute("role");
        s.removeAttribute("aria-roledescription");
        s.removeAttribute("aria-label");
      }
    });
    update();
  }

  // Auto-advance every 2 seconds and loop. Any interaction stops it for good.
  let timer = null;
  function stopAuto() {
    if (timer) window.clearInterval(timer);
    timer = null;
  }
  if (!reduceMotion) {
    timer = window.setInterval(() => {
      const count = visibleSlides().length;
      if (count < 2) return;
      const i = currentIndex();
      goTo(i >= count - 1 ? 0 : i + 1);
    }, 2000);
    ["pointerdown", "touchstart", "wheel", "keydown", "focusin"].forEach(evt =>
      panel.addEventListener(evt, stopAuto, { passive: true })
    );
  }

  prev.addEventListener("click", () => goTo(currentIndex() - 1));
  next.addEventListener("click", () => goTo(currentIndex() + 1));
  track.addEventListener("scroll", () => window.requestAnimationFrame(update), { passive: true });
  window.matchMedia("(min-width: 70rem)").addEventListener("change", rebuild);
  rebuild();
}

/* ---------- Strava ---------- */
function mountEmbeds(panel, box, frames, on) {
  box.replaceChildren();
  if (!on || !frames.length) {
    panel.classList.remove("has-embed");
    return;
  }
  frames.forEach(f => {
    const frame = document.createElement("iframe");
    frame.src = f.src;
    frame.title = f.title;
    frame.height = f.height;
    frame.loading = "lazy";
    frame.setAttribute("frameborder", "0");
    frame.setAttribute("scrolling", "no");
    frame.setAttribute("allowtransparency", "true");
    box.appendChild(frame);
  });
  panel.classList.add("has-embed");
}

function setupStrava() {
  $("#strava-card").href = CONFIG.stravaUrl;
  const desktop = window.matchMedia("(min-width: 70rem)");
  const sync = () => mountEmbeds($("#strava-panel"), $("#strava-embed"), CONFIG.stravaEmbeds, desktop.matches);
  desktop.addEventListener("change", sync);
  sync();
}

/* ---------- Instagram button ---------- */
function setupInstagram() {
  const panel = $("#insta-panel"), btn = $("#insta-btn"), setup = $("#insta-setup");
  const hasUrl = Boolean(CONFIG.instagramUrl);
  const preview = ["localhost", "127.0.0.1", "[::1]", ""].includes(window.location.hostname);
  const show = hasUrl || preview;

  panel.hidden = !show;
  $("#dash").classList.toggle("no-insta", !show);

  if (hasUrl) {
    btn.href = CONFIG.instagramUrl;
  } else {
    btn.removeAttribute("href");
    btn.removeAttribute("target");
    btn.setAttribute("aria-disabled", "true");
    setup.hidden = false;
  }
}

/* ---------- Start ---------- */
setDonateLinks();
renderCountdown();
window.setInterval(renderCountdown, 30000);

setupCarousel();
setupStrava();
setupInstagram();

buildProgress();
applyRaised(CONFIG.raised);
loadRaised().then(applyRaised);
