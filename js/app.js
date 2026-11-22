import * as store from "./store.js";
import { db, save } from "./store.js";
import { lookup, candidates } from "./dict.js";
import { player, speakWord, supported as ttsSupported, englishVoices } from "./tts.js";
import { CATEGORIES, CONNECTORS, LESSONS, findConnectors } from "./grammar.js";
import { vocabQuiz, grammarQuiz } from "./quiz.js";

// ---------- helpers ----------
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const app = $("#app");
const ICON = {
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>',
  prev: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h2v12H6zM9.5 12l8.5 6V6z"/></svg>',
  next: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M16 6h2v12h-2zM6 18l8.5-6L6 6z"/></svg>',
  stop: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 6h12v12H6z"/></svg>',
  speaker: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.5 8.5a5 5 0 010 7M19 5a10 10 0 010 14"/></svg>',
  gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>',
  cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>',
};
const CAT_LABEL = { world: "World", tech: "Technology", history: "History", science: "Science", featured: "Culture & more" };

let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

function topbar(title, { back, right = "" } = {}) {
  return `<header class="topbar"><div class="topbar-in">
    ${back ? `<button class="icon-btn" data-back="${esc(back)}" aria-label="Back">${ICON.back}</button>` : ""}
    <h1>${title}</h1>${right}
    <a class="icon-btn" href="#/settings" aria-label="Settings">${ICON.gear}</a>
  </div></header>`;
}

function applyTheme() {
  if (db.settings.theme === "auto") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", db.settings.theme);
}

// ---------- data loading ----------
let indexCache = null;
const dayCache = {};
async function loadIndex(force) {
  if (indexCache && !force) return indexCache;
  try {
    const r = await fetch("data/index.json", { cache: "no-cache" });
    indexCache = r.ok ? await r.json() : { days: [] };
  } catch { indexCache = { days: [] }; }
  return indexCache;
}
async function loadDay(date) {
  if (!dayCache[date]) {
    dayCache[date] = fetch(`data/articles/${date}.json`).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  }
  return dayCache[date];
}

function dailyPicks(articles) {
  const cats = db.settings.categories;
  const pool = articles.filter((a) => cats.includes(a.category));
  const groups = {};
  pool.forEach((a) => (groups[a.category] ||= []).push(a));
  const order = Object.keys(groups);
  const out = [];
  let i = 0;
  while (out.length < pool.length) {
    const g = groups[order[i % order.length]];
    if (g.length) out.push(g.shift());
    i++;
    if (i > 500) break;
  }
  return out;
}

function fmtDate(d) {
  return new Date(d + "T12:00:00").toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });
}

// ---------- bottom nav ----------
function updateNav(route) {
  $$(".nav a").forEach((a) => a.classList.toggle("active", a.dataset.route === route));
  const due = store.dueWords().length;
  const b = $("#due-badge");
  b.textContent = due;
  b.hidden = !due;
}

// ---------- word sheet ----------
function closeSheet() {
  const s = $(".sheet"), b = $(".sheet-backdrop");
  if (!s) return;
  s.classList.remove("open"); b.classList.remove("open");
  setTimeout(() => { s.remove(); b.remove(); }, 220);
  $$(".w.tapped").forEach((e) => e.classList.remove("tapped"));
}

function sensesHTML(senses, max = 3) {
  return (senses || []).slice(0, max).map(([pos, def, ex, syn]) => `
    <div class="sense"><span class="pos">${esc(pos)}</span> — ${esc(def)}
      ${ex ? `<div class="ex">“${esc(ex)}”</div>` : ""}
      ${syn?.length ? `<div class="syn-chips">${syn.map((s) => `<button data-lookup="${esc(s)}">${esc(s)}</button>`).join("")}</div>` : ""}
    </div>`).join("");
}

function highlightIn(sentence, forms) {
  let html = esc(sentence);
  for (const f of [...new Set(forms)].sort((a, b) => b.length - a.length)) {
    html = html.replace(new RegExp(`\\b(${f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})\\b`, "i"), "<b>$1</b>");
  }
  return html;
}

async function openWordSheet(lemmaOrWord, opts = {}) {
  closeSheet();
  let entry = opts.entry;
  if (!entry) {
    const mine = db.words[lemmaOrWord];
    entry = mine ? { w: mine.w, s: mine.senses } : await lookup(lemmaOrWord);
  }
  const back = document.createElement("div");
  back.className = "sheet-backdrop";
  const sheet = document.createElement("div");
  sheet.className = "sheet";
  document.body.append(back, sheet);
  back.onclick = closeSheet;

  const render = () => {
    if (!entry) {
      sheet.innerHTML = `<div class="grab"></div><h2>${esc(lemmaOrWord)}</h2><p class="muted">No dictionary entry. This is probably a grammar word (like “the”, “that”, “of”) or a name.</p>
        <div class="row"><button class="btn" data-say="${esc(lemmaOrWord)}">${ICON.speaker} Listen</button></div>`;
      return;
    }
    const lemma = entry.w;
    const mine = db.words[lemma];
    const known = db.known[lemma];
    const ctx = opts.ctx;
    const status = mine ? store.mastery(mine) : null;
    sheet.innerHTML = `<div class="grab"></div>
      <div class="row" style="justify-content:space-between">
        <h2>${esc(lemma)}</h2>
        <button class="icon-btn" data-say="${esc(lemma)}" aria-label="Pronounce">${ICON.speaker}</button>
      </div>
      ${opts.surface && opts.surface !== lemma ? `<div class="muted small">in the text: <i>${esc(opts.surface)}</i></div>` : ""}
      ${sensesHTML(entry.s)}
      ${ctx ? `<div class="vcard"><div class="small muted">In this article</div><div class="ctx" style="border:0;padding:0">${highlightIn(ctx.sentence, [opts.surface || lemma, lemma])}</div></div>` : ""}
      ${mine?.ctx?.length && !ctx ? `<div class="small muted" style="margin-top:12px">Seen in:</div>${mine.ctx.slice(0, 4).map((c) => `<div class="ctx vcard" style="margin-top:6px;font-family:var(--read-font);font-size:.92rem">${highlightIn(c.sentence, [c.form || lemma, lemma])}<div class="small muted">— ${esc(c.title || "")}</div></div>`).join("")}` : ""}
      <div class="row" style="margin-top:16px">
        ${mine ? `<span class="status-pill">${status.label} · next review ${store.nextDueLabel(mine)}</span>
                  <button class="btn ghost" data-act="known">✓ I know it now</button>
                  <button class="btn ghost" data-act="remove">Remove</button>`
               : known ? `<span class="status-pill">You marked this as known</span><button class="btn ghost" data-act="unknown">Undo</button><button class="btn primary" data-act="add">+ Learn it</button>`
               : `<button class="btn primary" data-act="add">+ Add to my words</button><button class="btn" data-act="known">✓ I already know it</button>`}
      </div>`;
  };
  render();
  requestAnimationFrame(() => { back.classList.add("open"); sheet.classList.add("open"); });
  sheet.addEventListener("click", async (e) => {
    const t = e.target.closest("button");
    if (!t) return;
    if (t.dataset.say) return speakWord(t.dataset.say);
    if (t.dataset.lookup) return openWordSheet(t.dataset.lookup);
    const lemma = entry.w;
    const act = t.dataset.act;
    if (act === "add") { store.addWord(lemma, entry.s, opts.ctx); toast(`“${lemma}” added to your words`); }
    if (act === "known") { store.markKnown(lemma); toast(`Marked “${lemma}” as known — it won't be highlighted again`); }
    if (act === "remove") { store.removeWord(lemma); toast("Removed"); }
    if (act === "unknown") store.unmarkKnown(lemma);
    opts.onChange?.(lemma);
    updateNav(currentRoute);
    render();
  });
}

// ---------- Today ----------
let showAll = false;
async function viewToday(dateParam) {
  app.innerHTML = topbar("Daily Reading") + `<main><div class="spinner"></div></main>`;
  const idx = await loadIndex();
  const days = idx.days || [];
  const date = dateParam || days[0]?.date;
  const main = $("main");
  const due = store.dueWords().length;
  const nWords = Object.keys(db.words).length;
  const header = `
    <div class="stats">
      <div class="stat"><b>🔥 ${store.streak()}</b><span>day streak</span></div>
      <a class="stat" href="#/words"><b>${nWords}</b><span>my words</span></a>
      <a class="stat" href="#/review"><b>${due}</b><span>to review</span></a>
    </div>`;
  if (!date) {
    main.innerHTML = header + `<div class="empty card" style="margin-top:20px"><h3>No articles yet</h3>
      <p>The daily collector runs automatically on GitHub every morning. Once it has run, today's articles will appear here.</p></div>`;
    return;
  }
  const data = await loadDay(date);
  const articles = data ? dailyPicks(data.articles) : [];
  const n = db.settings.dailyCount;
  const list = showAll ? articles : articles.slice(0, n);
  const readCount = articles.slice(0, n).filter((a) => db.read[a.id]).length;
  main.innerHTML = header + `
    <div class="section-title">
      <h2>${date === days[0]?.date ? "Today" : "Archive"} · <span class="muted" style="font-weight:400">${fmtDate(date)}</span></h2>
      <span class="small muted">${readCount}/${Math.min(n, articles.length)} read</span>
    </div>
    <div class="chips" style="margin-bottom:12px">
      ${days.slice(0, 30).map((d) => `<button class="chip ${d.date === date ? "on" : ""}" data-date="${d.date}">${d.date === days[0].date ? "Today" : new Date(d.date + "T12:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</button>`).join("")}
    </div>
    <div class="stack">
      ${list.map((a) => articleCard(a, date)).join("") || `<div class="empty">No articles in your selected categories. Change them in Settings.</div>`}
    </div>
    ${articles.length > n ? `<div style="text-align:center;margin-top:16px"><button class="btn" id="more">${showAll ? "Show fewer" : `Show all ${articles.length} articles`}</button></div>` : ""}`;
  main.addEventListener("click", (e) => {
    const d = e.target.closest("[data-date]");
    if (d) { showAll = false; location.hash = `#/today/${d.dataset.date}`; }
    if (e.target.id === "more") { showAll = !showAll; viewToday(date); }
  });
}

function articleCard(a, date) {
  const read = db.read[a.id];
  const newWords = a.vocab.filter((v) => store.wordStatus(v.w) === "new").length;
  const reviewWords = a.vocab.filter((v) => store.wordStatus(v.w) === "review").length;
  return `<a class="card article-card ${read ? "read" : ""}" href="#/read/${date}/${encodeURIComponent(a.id)}">
    <div class="meta"><span class="tag ${a.category}">${CAT_LABEL[a.category] || a.category}</span><span>${esc(a.source)}</span>${read ? '<span class="done-mark">✓ Read</span>' : ""}</div>
    <h3>${esc(a.title)}</h3>
    ${a.summary ? `<p>${esc(a.summary)}</p>` : ""}
    <div class="meta" style="margin-top:8px"><span>${a.level}</span>·<span>${a.minutes} min</span>·<span>${Math.min(newWords, db.settings.highlights)} new words</span>${reviewWords ? `·<span>${reviewWords} to review</span>` : ""}</div>
  </a>`;
}

// ---------- Reader ----------
const SENT_SPLIT = /(?<=[.!?]["”’)]?)\s+(?=["“‘(]?[A-Z0-9])/;
const TOKEN = /[A-Za-z][A-Za-z'’-]*[A-Za-z]|[A-Za-z]/g;

function myWordForms() {
  const map = {};
  for (const w of Object.values(db.words)) {
    map[w.w] = w.w;
    for (const c of w.ctx || []) if (c.form) map[c.form.toLowerCase()] = w.w;
  }
  return map;
}

async function viewRead(date, id) {
  app.innerHTML = topbar("", { back: `#/today/${date}` }) + `<main><div class="spinner"></div></main>`;
  const data = await loadDay(date);
  const a = data?.articles.find((x) => x.id === id);
  if (!a) { $("main").innerHTML = `<div class="empty">Article not found.</div>`; return; }

  // ---- decide which words to highlight (personalised) ----
  const N = db.settings.highlights;
  const status = Object.fromEntries(a.vocab.map((v) => [v.w, store.wordStatus(v.w)]));
  const review = a.vocab.filter((v) => status[v.w] === "review");
  const fresh = a.vocab.filter((v) => status[v.w] === "new");
  const nReview = Math.min(review.length, Math.ceil(N / 2));
  const chosen = [...review.slice(0, nReview), ...fresh.slice(0, N - nReview)];
  const formMap = {};    // surface form -> {lemma, kind}
  for (const v of a.vocab) {
    const kind = chosen.includes(v) ? status[v.w] : status[v.w] === "learning" || status[v.w] === "review" ? "learning" : null;
    for (const f of v.forms) formMap[f] = { lemma: v.w, kind, v };
  }
  // my words that are not in the candidate list (e.g. words I tapped myself)
  const mine = myWordForms();
  const vocabByLemma = Object.fromEntries(a.vocab.map((v) => [v.w, v]));

  // ---- render text ----
  const sentences = [];
  let firstCtx = {};
  const connFound = [];
  const paraHTML = a.paragraphs.map((p) => {
    const sents = p.split(SENT_SPLIT);
    return "<p>" + sents.map((s) => {
      const si = sentences.length;
      sentences.push(s);
      const conns = findConnectors(s);
      conns.forEach((c) => connFound.push({ ...c, sentence: s }));
      let out = "", last = 0, m;
      TOKEN.lastIndex = 0;
      while ((m = TOKEN.exec(s))) {
        out += esc(s.slice(last, m.index));
        const raw = m[0];
        const low = raw.toLowerCase().replace(/’/g, "'");
        let info = formMap[low];
        if (!info) {
          const lem = mine[low] || candidates(low).find((c) => db.words[c]);
          if (lem && db.words[lem] && !(raw[0] === raw[0].toUpperCase() && m.index > 0 && !mine[low])) {
            const st = store.wordStatus(lem);
            info = { lemma: lem, kind: st === "review" ? "review" : "learning" };
          }
        }
        const conn = conns.find((c) => m.index >= c.start && m.index < c.end);
        const cls = ["w"];
        if (info?.kind) cls.push("hl-" + info.kind);
        if (conn) cls.push("conn");
        if (info && !firstCtx[info.lemma]) firstCtx[info.lemma] = { sentence: s, form: low };
        out += `<span class="${cls.join(" ")}"${info ? ` data-l="${esc(info.lemma)}"` : ""}${conn ? ` data-c="${esc(conn.c.p)}" style="--cc:${CATEGORIES[conn.c.cat].color}"` : ""}>${esc(raw)}</span>`;
        last = m.index + raw.length;
      }
      out += esc(s.slice(last));
      return `<span class="s" data-i="${si}">${out}</span>`;
    }).join(" ") + "</p>";
  }).join("");

  // vocabulary list (in text order)
  const chosenSet = new Set(chosen.map((v) => v.w));
  const shownVocab = Object.keys(firstCtx).filter((l) => chosenSet.has(l) || (vocabByLemma[l] && status[l] === "review"))
    .map((l) => ({ v: vocabByLemma[l], kind: status[l] }));
  // grammar spotlight: unique connectors
  const seenConn = new Set();
  const spotlight = connFound.filter((c) => (seenConn.has(c.c.p) ? false : seenConn.add(c.c.p)));

  const main = $("main");
  $(".topbar h1").textContent = a.source;
  main.innerHTML = `
    <div class="reader-head">
      <div class="meta"><span class="tag ${a.category}">${CAT_LABEL[a.category] || a.category}</span><span>${a.level}</span>·<span>${a.words} words</span>·<span>${a.minutes} min</span></div>
      <h1>${esc(a.title)}</h1>
      ${a.summary ? `<div class="summary">${esc(a.summary)}</div>` : ""}
    </div>
    <div class="legend">
      <span><i style="background:var(--new-bg);box-shadow:inset 0 -2px 0 var(--new-line)"></i>New word</span>
      <span><i style="background:var(--review-bg);box-shadow:inset 0 -2px 0 var(--review-line)"></i>Review</span>
      <span><i style="border-bottom:2px dotted var(--learn-line);border-radius:0"></i>Learning</span>
      <label><input type="checkbox" id="g-toggle" ${db.settings.showGrammar ? "checked" : ""}> Linking words</label>
    </div>
    <p class="small muted" style="margin:4px 0 14px">Tap any word for its meaning. ${ttsSupported ? "Press ▶ to listen." : ""}</p>
    <article class="text ${db.settings.showGrammar ? "show-grammar" : ""}" id="text">${paraHTML}</article>

    <div class="section-title"><h2>Key vocabulary</h2><span class="small muted">${shownVocab.length} words</span></div>
    <div class="vocab-list" id="vocab">${shownVocab.map(({ v, kind }) => vocabCard(v, kind, firstCtx[v.w])).join("") || `<div class="muted">No new words for you here — great!</div>`}</div>
    ${shownVocab.some(({ v }) => !db.words[v.w] && !db.known[v.w]) ? `<div class="row" style="margin-top:12px"><button class="btn" id="add-all">+ Add all new words</button></div>` : ""}

    ${spotlight.length ? `<div class="section-title"><h2>Grammar spotlight: linking words</h2><a class="small" href="#/grammar">All lessons</a></div>
    <div class="vocab-list">${spotlight.slice(0, 8).map((c) => {
      const cat = CATEGORIES[c.c.cat];
      const sent = esc(c.sentence.slice(0, c.start)) + "<b>" + esc(c.sentence.slice(c.start, c.end)) + "</b>" + esc(c.sentence.slice(c.end));
      return `<div class="vcard gcard" style="--cc:${cat.color}"><div class="vcard-head"><span class="word">${esc(c.c.p)}</span><span class="status-pill" style="color:${cat.color}">${cat.name}</span></div>
        <div class="def">${esc(c.c.m)}</div><div class="syn">${esc(c.c.use)}</div><div class="gsent">${sent}</div></div>`;
    }).join("")}</div>` : ""}

    <div class="row" style="margin-top:24px">
      <button class="btn primary" id="mark-read">${db.read[a.id] ? "✓ Read" : "Mark as read"}</button>
      <a class="btn" href="#/quiz/article/${date}/${encodeURIComponent(a.id)}">Quiz me on this article</a>
    </div>
    <div class="attribution">Source: <a href="${esc(a.url)}" target="_blank" rel="noopener">${esc(a.source)}${a.author ? " — " + esc(a.author) : ""}</a>. Licence: ${esc(a.license)}.
      ${a.license.includes("ND") ? "Republished without changes to the text; highlights are added only by this app." : ""}
      ${a.source.startsWith("Wikipedia") ? "Text from Wikipedia, shortened." : ""}</div>`;

  // exposure: words you are learning appear again in a real context
  for (const [lemma, ctx] of Object.entries(firstCtx)) if (db.words[lemma]) store.exposure(lemma, { ...ctx, title: a.title, date });

  const ctxFor = (lemma) => firstCtx[lemma] ? { ...firstCtx[lemma], title: a.title, date } : null;
  const refreshVocab = () => {
    $("#vocab").innerHTML = shownVocab.map(({ v, kind }) => vocabCard(v, kind, firstCtx[v.w])).join("");
  };
  const text = $("#text");
  text.addEventListener("click", (e) => {
    const w = e.target.closest(".w");
    if (!w) return;
    if (e.target.closest(".conn") && !w.dataset.l && db.settings.showGrammar) return openConnSheet(w.dataset.c);
    $$(".w.tapped").forEach((x) => x.classList.remove("tapped"));
    w.classList.add("tapped");
    const sentence = sentences[+w.closest(".s").dataset.i];
    const surface = w.textContent.toLowerCase().replace(/’/g, "'");
    const lemma = w.dataset.l;
    const v = lemma && vocabByLemma[lemma];
    openWordSheet(lemma || surface, { entry: v ? { w: v.w, s: v.s } : null, surface, ctx: { sentence, form: surface, title: a.title, date }, onChange: refreshVocab });
  });
  $("#g-toggle").onchange = (e) => { db.settings.showGrammar = e.target.checked; save(); text.classList.toggle("show-grammar", e.target.checked); };
  $("#vocab").addEventListener("click", (e) => {
    const t = e.target.closest("button");
    if (!t) return;
    const lemma = t.closest(".vcard").dataset.l;
    const v = vocabByLemma[lemma];
    if (t.dataset.say) return speakWord(lemma);
    if (t.dataset.act === "add") { store.addWord(lemma, v.s, ctxFor(lemma)); toast(`“${lemma}” added`); }
    if (t.dataset.act === "known") { store.markKnown(lemma); toast(`“${lemma}” marked as known`); }
    if (t.dataset.act === "more") return openWordSheet(lemma, { entry: { w: v.w, s: v.s }, ctx: ctxFor(lemma), onChange: refreshVocab });
    refreshVocab(); updateNav(currentRoute);
  });
  $("#add-all")?.addEventListener("click", (e) => {
    let n = 0;
    for (const { v } of shownVocab) if (!db.words[v.w] && !db.known[v.w]) { store.addWord(v.w, v.s, ctxFor(v.w)); n++; }
    toast(`${n} words added to your list`);
    e.target.remove(); refreshVocab(); updateNav(currentRoute);
  });
  $("#mark-read").onclick = (e) => {
    if (!db.read[a.id]) { db.read[a.id] = Date.now(); store.bump("read"); }
    e.target.textContent = "✓ Read";
    toast("Nice work! Article marked as read.");
  };

  // ---- audio player ----
  if (ttsSupported) {
    player.load(sentences);
    const bar = document.createElement("div");
    bar.className = "player";
    bar.innerHTML = `<div class="player-in">
      <button class="icon-btn" data-p="prev" aria-label="Previous sentence">${ICON.prev}</button>
      <button class="icon-btn play" data-p="play" aria-label="Play">${ICON.play}</button>
      <button class="icon-btn" data-p="next" aria-label="Next sentence">${ICON.next}</button>
      <span class="prog">Listen · ${a.minutes + 1} min</span>
      <select aria-label="Speed">${[0.7, 0.8, 0.9, 0.95, 1, 1.1, 1.25].map((r) => `<option value="${r}" ${r === db.settings.rate ? "selected" : ""}>${r}×</option>`).join("")}</select>
      <button class="icon-btn" data-p="stop" aria-label="Stop">${ICON.stop}</button>
    </div>`;
    app.append(bar);
    const prog = $(".prog", bar);
    player.onchange = (p) => {
      $$(".s.speaking").forEach((x) => x.classList.remove("speaking"));
      $('[data-p="play"]', bar).innerHTML = p.playing ? ICON.pause : ICON.play;
      if (p.playing || p.index > 0) {
        const el = $(`.s[data-i="${p.index}"]`);
        if (el) { el.classList.add("speaking"); if (p.playing) el.scrollIntoView({ block: "center", behavior: "smooth" }); }
        prog.textContent = `Sentence ${p.index + 1} / ${p.sentences.length}`;
      } else prog.textContent = `Listen · ${a.minutes + 1} min`;
    };
    bar.addEventListener("click", (e) => {
      const b = e.target.closest("[data-p]");
      if (!b) return;
      const act = b.dataset.p;
      if (act === "play") player.playing ? player.pause() : player.play();
      if (act === "prev") player.skip(-1);
      if (act === "next") player.skip(1);
      if (act === "stop") player.stop();
    });
    $("select", bar).onchange = (e) => { db.settings.rate = +e.target.value; save(); if (player.playing) player.play(); };
    // double-tap a sentence to start reading from there
    text.addEventListener("dblclick", (e) => { const s = e.target.closest(".s"); if (s) { closeSheet(); player.play(+s.dataset.i); } });
  }
}

function vocabCard(v, kind, ctx) {
  const [pos, def, , syn] = v.s[0] || [];
  const inList = db.words[v.w], known = db.known[v.w];
  return `<div class="vcard ${kind}" data-l="${esc(v.w)}">
    <div class="vcard-head"><span class="word">${esc(v.w)}</span><span class="pos">${esc(pos || "")}</span><span class="grow"></span>
      <span class="status-pill ${kind}">${kind === "review" ? "Review" : "New"}</span>
      <button class="icon-btn" data-say="1" aria-label="Pronounce" style="width:34px;height:34px">${ICON.speaker}</button></div>
    <div class="def">${esc(def || "")}</div>
    ${syn?.length ? `<div class="syn">≈ ${esc(syn.slice(0, 4).join(", "))}</div>` : ""}
    ${ctx ? `<div class="ctx">${highlightIn(ctx.sentence, [ctx.form, v.w, ...v.forms])}</div>` : ""}
    <div class="actions">
      ${inList ? `<span class="status-pill">In my words · ${store.mastery(inList).label}</span>` : known ? `<span class="status-pill">Known</span>` :
        `<button class="btn primary" data-act="add">+ Learn</button><button class="btn" data-act="known">✓ I know it</button>`}
      <button class="btn ghost" data-act="more">More</button>
    </div>
  </div>`;
}

function openConnSheet(phrase) {
  const c = CONNECTORS.find((x) => x.p === phrase);
  if (!c) return;
  closeSheet();
  const cat = CATEGORIES[c.cat];
  const back = Object.assign(document.createElement("div"), { className: "sheet-backdrop" });
  const sheet = Object.assign(document.createElement("div"), { className: "sheet" });
  sheet.innerHTML = `<div class="grab"></div><h2>${esc(c.p)}</h2>
    <p><span class="cat-dot" style="background:${cat.color}"></span><b>${cat.name}</b> — ${esc(cat.desc)}</p>
    <p><b>Meaning:</b> ${esc(c.m)}</p><p><b>How to use it:</b> ${esc(c.use)}</p>
    <p class="muted" style="font-family:var(--read-font)"><i>${esc(c.ex)}</i></p>
    <p class="small">Type: ${c.type === "adverb" ? "sentence connector (adverb)" : c.type === "conj" ? "conjunction — joins two clauses" : "preposition — followed by a noun or -ing"}</p>
    <a class="btn" href="#/grammar/connectors">See all linking words</a>`;
  document.body.append(back, sheet);
  back.onclick = closeSheet;
  sheet.querySelector("a").onclick = closeSheet;
  requestAnimationFrame(() => { back.classList.add("open"); sheet.classList.add("open"); });
}

// ---------- My words ----------
let wordsTab = "learning", wordsSort = "recent", wordsQuery = "";
function viewWords() {
  const all = Object.values(db.words);
  const known = Object.keys(db.known);
  app.innerHTML = topbar("My Words") + `<main>
    <div class="stats">
      <div class="stat"><b>${all.length}</b><span>learning</span></div>
      <div class="stat"><b>${all.filter((w) => w.srs.interval >= 21).length}</b><span>mastered</span></div>
      <div class="stat"><b>${known.length}</b><span>already known</span></div>
    </div>
    <div class="row" style="margin:16px 0 8px">
      <div class="seg"><button data-tab="learning" class="${wordsTab === "learning" ? "on" : ""}">My words</button><button data-tab="known" class="${wordsTab === "known" ? "on" : ""}">Known</button></div>
      <select id="sort" ${wordsTab === "known" ? "hidden" : ""}>
        <option value="recent">Newest</option><option value="due">Next review</option><option value="az">A–Z</option><option value="weak">Weakest</option>
      </select>
    </div>
    <input type="search" id="q" placeholder="Search words…" value="${esc(wordsQuery)}">
    <div id="list"></div></main>`;
  $("#sort").value = wordsSort;
  const renderList = () => {
    const q = wordsQuery.toLowerCase();
    let html = "";
    if (wordsTab === "learning") {
      let ws = all.filter((w) => w.w.includes(q));
      const sorters = { recent: (a, b) => b.added - a.added, due: (a, b) => a.srs.due - b.srs.due, az: (a, b) => a.w.localeCompare(b.w), weak: (a, b) => a.srs.interval - b.srs.interval || b.srs.lapses - a.srs.lapses };
      ws.sort(sorters[wordsSort]);
      html = ws.map((w) => {
        const m = store.mastery(w);
        return `<div class="word-row" data-l="${esc(w.w)}"><div class="grow"><b>${esc(w.w)}</b> <span class="small muted"><i>${esc(w.senses?.[0]?.[0] || "")}</i></span>
          <div class="d">${esc(w.senses?.[0]?.[1] || "")}</div></div>
          <div style="text-align:right"><span class="mbar">${[1, 2, 3, 4].map((i) => `<i class="${m.level >= i ? "on" : ""}"></i>`).join("")}</span><div class="small muted">${store.nextDueLabel(w)}</div></div></div>`;
      }).join("") || `<div class="empty">No words yet. While reading, tap <b>+ Learn</b> on a highlighted word to add it here.</div>`;
    } else {
      html = known.filter((w) => w.includes(q)).sort().map((w) => `<div class="word-row" data-l="${esc(w)}"><div class="grow"><b>${esc(w)}</b></div><span class="small muted">known</span></div>`).join("")
        || `<div class="empty">Words you mark as “I already know it” appear here. They are never highlighted again.</div>`;
    }
    $("#list").innerHTML = html;
  };
  renderList();
  $("main").addEventListener("click", (e) => {
    const tab = e.target.closest("[data-tab]");
    if (tab) { wordsTab = tab.dataset.tab; viewWords(); return; }
    const row = e.target.closest(".word-row");
    if (row) openWordSheet(row.dataset.l, { onChange: renderList });
  });
  $("#sort").onchange = (e) => { wordsSort = e.target.value; renderList(); };
  $("#q").oninput = (e) => { wordsQuery = e.target.value; renderList(); };
}

// ---------- Review (spaced repetition flashcards) ----------
function viewReview(practice) {
  let queue = practice ? Object.values(db.words).sort(() => Math.random() - 0.5).slice(0, 15) : store.dueWords().slice(0, 50);
  const total = queue.length;
  let done = 0;
  app.innerHTML = topbar(practice ? "Practice" : "Review") + `<main id="rv"></main>`;
  const main = $("#rv");
  const nextCard = () => {
    if (!queue.length) {
      const upcoming = Object.values(db.words).sort((a, b) => a.srs.due - b.srs.due)[0];
      main.innerHTML = `<div class="card empty"><div style="font-size:3rem">🎉</div><h3>${total ? `Done! You reviewed ${done} cards.` : "Nothing to review right now"}</h3>
        <p>${upcoming ? `Next review: ${store.nextDueLabel(upcoming)}.` : "Add words while reading to start your review deck."}</p>
        <div class="row" style="justify-content:center">${Object.keys(db.words).length >= 1 ? `<button class="btn" id="practice">Practice anyway</button>` : ""}<a class="btn primary" href="#/quiz">Take a quiz</a></div></div>`;
      $("#practice")?.addEventListener("click", () => viewReview(true));
      updateNav("review");
      return;
    }
    const w = queue[0];
    const ctx = w.ctx?.[0];
    let blanked = "";
    if (ctx) {
      const form = ctx.form || w.w;
      blanked = esc(ctx.sentence).replace(new RegExp(`\\b${form.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i"), '<span class="blank">_____</span>');
    }
    main.innerHTML = `
      <div class="progress"><div style="width:${(done / Math.max(1, total)) * 100}%"></div></div>
      <p class="small muted">${done + 1} / ${total}${practice ? " · practice mode (schedule not changed)" : ""}</p>
      <div class="card flash">
        <div class="big">${esc(w.w)}</div>
        <div><button class="btn ghost" id="say">${ICON.speaker} Listen</button></div>
        ${blanked ? `<p class="muted" style="font-family:var(--read-font)">${blanked}</p>` : ""}
        <p class="small muted">Do you remember what it means?</p>
        <div id="back"></div>
      </div>
      <div id="ctrl" style="margin-top:16px"><button class="btn primary block" id="show">Show answer</button></div>`;
    $("#say").onclick = () => speakWord(w.w);
    speakWord(w.w);
    $("#show").onclick = () => {
      $("#back").innerHTML = `<div class="back">${sensesHTML(w.senses)}${ctx ? `<div class="vcard"><div class="ctx" style="border:0;padding:0">${highlightIn(ctx.sentence, [ctx.form || w.w, w.w])}</div><div class="small muted">— ${esc(ctx.title || "")}</div></div>` : ""}</div>`;
      const s = w.srs;
      const preview = (g) => {
        if (practice) return "";
        if (g === 0) return "10 min";
        const i = s.reps === 0 ? [0, 1, 1, 3][g] : s.reps === 1 ? [0, 2, 3, 6][g] : Math.round(s.interval * s.ease * [0, 0.7, 1, 1.35][g]) || 1;
        return `${i} d`;
      };
      $("#ctrl").innerHTML = `<div class="grades">${["Again", "Hard", "Good", "Easy"].map((l, g) => `<button class="g${g}" data-g="${g}">${l}<small>${preview(g)}</small></button>`).join("")}</div>`;
    };
    main.onclick = (e) => {
      const b = e.target.closest("[data-g]");
      if (b) {
        const g = +b.dataset.g;
        if (!practice) { store.review(w.w, g); store.bump("reviewed"); }
        queue.shift();
        if (g === 0) queue.splice(Math.min(queue.length, 3), 0, w); // see it again soon
        else done++;
        nextCard();
        return;
      }
      if (e.target.closest("[data-lookup]")) openWordSheet(e.target.closest("[data-lookup]").dataset.lookup);
    };
  };
  nextCard();
}

// ---------- Quiz ----------
async function recentArticles(nDays = 3) {
  const idx = await loadIndex();
  const out = [];
  for (const d of (idx.days || []).slice(0, nDays)) {
    const data = await loadDay(d.date);
    if (data) out.push(...data.articles.map((a) => ({ ...a, date: d.date })));
  }
  return out;
}

function vocabItemFromArticle(v) {
  return { w: v.w, senses: v.s, forms: v.forms, ctx: [{ sentence: v.ctx }] };
}

async function viewQuizMenu() {
  const nMine = Object.keys(db.words).length;
  const acc = db.quiz.total ? Math.round((db.quiz.correct / db.quiz.total) * 100) : null;
  app.innerHTML = topbar("Quiz") + `<main class="stack">
    ${acc != null ? `<p class="muted small">All-time accuracy: <b>${acc}%</b> (${db.quiz.correct}/${db.quiz.total})</p>` : ""}
    <a class="card article-card" href="#/quiz/mine"><h3>📚 My words</h3><p>Mixed questions on all ${nMine} words in your list: meanings, synonyms, fill in the blank, listening.</p>${nMine < 4 ? `<p class="small" style="color:var(--bad)">Add at least 4 words to unlock.</p>` : ""}</a>
    <a class="card article-card" href="#/quiz/weak"><h3>🎯 Weak & due words</h3><p>Focus on words you got wrong or that are due for review.</p></a>
    <a class="card article-card" href="#/quiz/recent"><h3>📰 Words from recent articles</h3><p>Test yourself on key vocabulary from the last few days — even words you haven't added.</p></a>
    <a class="card article-card" href="#/quiz/grammar"><h3>🔗 Linking words</h3><p>Choose the right connector (however, despite, therefore…) in real sentences from your articles.</p></a>
  </main>`;
}

async function viewQuiz(mode, date, id) {
  app.innerHTML = topbar("Quiz", { back: "#/quiz" }) + `<main id="qz"><div class="spinner"></div></main>`;
  let qs = [];
  const mineItems = () => Object.values(db.words).map((w) => ({ w: w.w, senses: w.senses, ctx: w.ctx, forms: w.ctx.map((c) => c.form).filter(Boolean) }));
  if (mode === "grammar") {
    const arts = await recentArticles(3);
    const sents = arts.flatMap((a) => a.paragraphs.flatMap((p) => p.split(SENT_SPLIT)));
    qs = grammarQuiz(sents, 10);
  } else if (mode === "article") {
    const data = await loadDay(date);
    const a = data?.articles.find((x) => x.id === id);
    if (a) {
      const items = a.vocab.slice(0, 20).map(vocabItemFromArticle);
      qs = vocabQuiz(items, 8);
      const sents = a.paragraphs.flatMap((p) => p.split(SENT_SPLIT));
      qs.push(...grammarQuiz(sents, 2).filter((q) => q));
    }
  } else if (mode === "recent") {
    const arts = await recentArticles(3);
    const items = arts.flatMap((a) => a.vocab.slice(0, 12)).filter((v) => !db.known[v.w]).map(vocabItemFromArticle);
    const uniq = Object.values(Object.fromEntries(items.map((i) => [i.w, i])));
    qs = vocabQuiz(uniq, 10);
  } else {
    let items = mineItems();
    if (mode === "weak") {
      const weak = Object.values(db.words).filter((w) => w.srs.due <= Date.now() || w.srs.lapses > 0 || w.srs.interval < 3).map((w) => w.w);
      const pool = items.filter((i) => weak.includes(i.w));
      qs = vocabQuiz(pool.length >= 4 ? pool : items, 10);
      // vocabQuiz needs ≥4 items for distractors; when the weak pool is small, use all words as distractors
      if (pool.length && pool.length < 4 && items.length >= 4) qs = vocabQuiz(items, 10).sort((a, b) => weak.includes(b.item.w) - weak.includes(a.item.w));
    } else qs = vocabQuiz(items, 10);
  }
  const main = $("#qz");
  if (!qs.length) {
    main.innerHTML = `<div class="card empty"><h3>Not enough words yet</h3><p>Add at least 4 words to your list while reading, or try “Words from recent articles”.</p><a class="btn" href="#/quiz">Back</a></div>`;
    return;
  }
  let i = 0, score = 0;
  const mistakes = [];
  const show = () => {
    if (i >= qs.length) {
      const pct = Math.round((score / qs.length) * 100);
      main.innerHTML = `<div class="card" style="text-align:center"><div style="font-size:3rem">${pct >= 80 ? "🏆" : pct >= 50 ? "👍" : "💪"}</div>
        <h2>${score} / ${qs.length}</h2><p class="muted">${pct >= 80 ? "Excellent!" : pct >= 50 ? "Good job — keep going." : "Keep practising — these words will come back in your reviews."}</p></div>
        ${mistakes.length ? `<div class="section-title"><h2>Review your mistakes</h2></div><div class="vocab-list">${mistakes.map((q) => `<div class="vcard">${q.explain}
          ${q.item && !db.words[q.item.w] ? `<div class="actions"><button class="btn primary" data-add="${esc(q.item.w)}">+ Add to my words</button></div>` : ""}</div>`).join("")}</div>` : ""}
        <div class="row" style="margin-top:16px"><button class="btn primary" id="again">New quiz</button><a class="btn" href="#/quiz">Other quizzes</a></div>`;
      $("#again").onclick = () => viewQuiz(mode, date, id);
      main.onclick = (e) => {
        const b = e.target.closest("[data-add]");
        if (!b) return;
        const q = mistakes.find((m) => m.item?.w === b.dataset.add);
        store.addWord(q.item.w, q.item.senses, q.item.ctx?.[0]);
        b.replaceWith(Object.assign(document.createElement("span"), { className: "status-pill", textContent: "Added ✓" }));
        updateNav("quiz");
      };
      return;
    }
    const q = qs[i];
    main.innerHTML = `<div class="progress"><div style="width:${(i / qs.length) * 100}%"></div></div>
      <p class="small muted">Question ${i + 1} / ${qs.length} · Score ${score}</p>
      <div class="card"><div>${q.prompt}</div>
        ${q.listen ? `<div style="margin-top:12px"><button class="btn primary" id="listen">${ICON.speaker} Play</button></div>` : ""}
        ${q.speak ? `<button class="btn ghost" id="speak" style="margin-top:8px">${ICON.speaker}</button>` : ""}
        <div class="options">${q.options.map((o, k) => `<button data-k="${k}">${esc(o)}</button>`).join("")}</div>
        <div id="fb"></div></div>`;
    if (q.listen) { $("#listen").onclick = () => speakWord(q.listen); setTimeout(() => speakWord(q.listen), 300); }
    if (q.speak) $("#speak").onclick = () => speakWord(q.speak);
    main.onclick = (e) => {
      const b = e.target.closest("[data-k]");
      if (!b || main.dataset.answered) return;
      main.dataset.answered = "1";
      const k = +b.dataset.k;
      const ok = k === q.answer;
      $$(".options button", main).forEach((x, j) => { if (j === q.answer) x.classList.add("correct"); else if (j === k) x.classList.add("wrong"); x.disabled = true; });
      if (ok) score++; else mistakes.push(q);
      db.quiz.total++; if (ok) db.quiz.correct++;
      store.bump("quiz"); if (ok) store.bump("correct");
      if (q.item && db.words[q.item.w]) {
        const w = db.words[q.item.w];
        if (!ok) store.review(q.item.w, 0);
        else if (w.srs.due <= Date.now()) store.review(q.item.w, 2);
      }
      $("#fb").innerHTML = `<div class="explain">${ok ? "✅ Correct!" : "❌ Not quite."}<br>${q.explain}</div>
        <button class="btn primary block" id="nextq" style="margin-top:12px">${i + 1 < qs.length ? "Next" : "See results"}</button>`;
      $("#nextq").onclick = () => { delete main.dataset.answered; i++; show(); };
    };
  };
  show();
}

// ---------- Grammar ----------
function viewGrammar(lessonId) {
  if (lessonId === "connectors") {
    const byCat = {};
    CONNECTORS.forEach((c) => (byCat[c.cat] ||= []).push(c));
    app.innerHTML = topbar("Linking Words", { back: "#/grammar" }) + `<main class="stack">
      <p class="muted">Linking words (connectors) show how ideas relate. Knowing them makes long articles much easier to follow. Tap a word to hear it.</p>
      ${Object.entries(byCat).map(([cat, list]) => `<div class="card gcard" style="--cc:${CATEGORIES[cat].color}">
        <h3><span class="cat-dot" style="background:${CATEGORIES[cat].color}"></span>${CATEGORIES[cat].name}</h3>
        <p class="muted small">${CATEGORIES[cat].desc}</p>
        ${list.map((c) => `<div style="padding:10px 0;border-top:1px solid var(--border)">
          <button class="btn ghost" style="padding:2px 8px" data-say="${esc(c.p)}"><b>${esc(c.p)}</b></button>
          <span class="small muted">${c.type === "adverb" ? "sentence connector" : c.type === "conj" ? "conjunction" : "preposition"}</span>
          <div class="small">${esc(c.m)}. <span class="muted">${esc(c.use)}</span></div>
          <div class="small" style="font-family:var(--read-font);font-style:italic">${esc(c.ex)}</div></div>`).join("")}
      </div>`).join("")}
    </main>`;
    $("main").onclick = (e) => { const b = e.target.closest("[data-say]"); if (b) speakWord(b.dataset.say); };
    return;
  }
  if (lessonId) {
    const l = LESSONS.find((x) => x.id === lessonId);
    app.innerHTML = topbar(l ? l.title : "Lesson", { back: "#/grammar" }) + `<main>${l ? `<div class="card lesson"><span class="tag">${l.level}</span><h2 style="margin-top:10px">${l.title}</h2>${l.html}</div>
      <div class="row" style="margin-top:16px"><a class="btn primary" href="#/quiz/grammar">Practise linking words</a></div>` : "Not found"}</main>`;
    return;
  }
  app.innerHTML = topbar("Grammar") + `<main class="stack">
    <p class="muted">Short lessons on the grammar you meet most in news and history articles.</p>
    <a class="card article-card" href="#/grammar/connectors"><span class="tag">Reference</span><h3>🔗 Linking words: the complete list</h3><p>${CONNECTORS.length} connectors in ${Object.keys(CATEGORIES).length} groups — meaning, grammar pattern and an example for each.</p></a>
    ${LESSONS.map((l) => `<a class="card article-card" href="#/grammar/${l.id}"><span class="tag">${l.level}</span><h3>${l.title}</h3></a>`).join("")}
    <a class="card article-card" href="#/quiz/grammar"><h3>✍️ Linking-word quiz</h3><p>Practise with real sentences from your articles.</p></a>
  </main>`;
}

// ---------- Settings ----------
function viewSettings() {
  const s = db.settings;
  const seg = (key, vals, labels = vals) => `<div class="seg" data-key="${key}">${vals.map((v, i) => `<button data-v="${v}" class="${s[key] == v ? "on" : ""}">${labels[i]}</button>`).join("")}</div>`;
  const voices = englishVoices();
  app.innerHTML = topbar("Settings", { back: "#/today" }) + `<main>
    <div class="setting"><div><b>Articles per day</b><div class="small muted">How many articles to show on the Today page.</div></div>${seg("dailyCount", [3, 5, 10])}</div>
    <div class="setting"><div><b>Highlighted words per article</b><div class="small muted">New + review words marked in each text.</div></div>${seg("highlights", [5, 10, 15])}</div>
    <div class="setting" style="display:block"><b>Topics</b><div class="chips" style="margin-top:8px;flex-wrap:wrap">${Object.entries(CAT_LABEL).map(([k, v]) => `<button class="chip ${s.categories.includes(k) ? "on" : ""}" data-cat="${k}">${v}</button>`).join("")}</div></div>
    <div class="setting"><div><b>Voice</b><div class="small muted">${ttsSupported ? `${voices.length} English voices on this device.` : "Speech is not supported in this browser."}</div></div>
      <select id="voice"><option value="">Automatic</option>${voices.map((v) => `<option value="${esc(v.voiceURI)}" ${v.voiceURI === s.voice ? "selected" : ""}>${esc(v.name)} (${v.lang})</option>`).join("")}</select></div>
    <div class="setting"><div><b>Reading speed</b> <span id="rate-l">${s.rate}×</span></div><input type="range" id="rate" min="0.6" max="1.3" step="0.05" value="${s.rate}"><button class="btn" id="test">Test</button></div>
    <div class="setting"><div><b>Theme</b></div>${seg("theme", ["auto", "light", "dark"], ["Auto", "Light", "Dark"])}</div>
    <div class="setting"><div><b>Backup</b><div class="small muted">Your words and progress are stored only on this device. Export a backup to move them to another phone or browser.</div></div>
      <div class="row"><button class="btn" id="export">Export</button><label class="btn">Import<input type="file" id="import" accept="application/json" hidden></label></div></div>
    <div class="setting"><div><b>Reset “known” words</b><div class="small muted">${Object.keys(db.known).length} words are marked as known.</div></div><button class="btn" id="reset-known">Reset</button></div>
    <p class="small muted" style="margin-top:24px">Articles come from openly licensed sources (Wikipedia, The Conversation, Global Voices, NASA) and are collected automatically every day. Definitions and synonyms: Princeton WordNet 3.1. Word frequency: wordfreq.</p>
  </main>`;
  const main = $("main");
  main.addEventListener("click", (e) => {
    const b = e.target.closest(".seg button");
    if (b) {
      const key = b.parentElement.dataset.key;
      s[key] = isNaN(b.dataset.v) ? b.dataset.v : +b.dataset.v;
      save(); applyTheme(); viewSettings(); return;
    }
    const c = e.target.closest("[data-cat]");
    if (c) {
      const k = c.dataset.cat;
      s.categories = s.categories.includes(k) ? s.categories.filter((x) => x !== k) : [...s.categories, k];
      if (!s.categories.length) s.categories = [k];
      save(); viewSettings();
    }
  });
  $("#voice").onchange = (e) => { s.voice = e.target.value; save(); speakWord("This is how I sound."); };
  $("#rate").oninput = (e) => { s.rate = +e.target.value; $("#rate-l").textContent = s.rate + "×"; save(); };
  $("#test").onclick = () => speakWord("Although the weather was terrible, the expedition continued.");
  $("#export").onclick = () => {
    const blob = new Blob([store.exportData()], { type: "application/json" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `learn-english-backup-${store.today()}.json` });
    a.click();
  };
  $("#import").onchange = async (e) => {
    try { store.importData(await e.target.files[0].text()); toast("Backup restored"); applyTheme(); viewSettings(); }
    catch (err) { toast("Could not import: " + err.message); }
  };
  $("#reset-known").onclick = () => { if (confirm("Reset all known words?")) { db.known = {}; save(); viewSettings(); } };
}

// ---------- router ----------
let currentRoute = "today";
async function route() {
  closeSheet();
  player.stop();
  player.onchange = null;
  $(".player")?.remove();
  const parts = location.hash.replace(/^#\/?/, "").split("/").map(decodeURIComponent);
  const [r, a, b, c] = parts;
  currentRoute = r || "today";
  updateNav(currentRoute === "read" ? "today" : currentRoute);
  window.scrollTo(0, 0);
  if (!r || r === "today") return viewToday(a);
  if (r === "read") return viewRead(a, b);
  if (r === "words") return viewWords();
  if (r === "review") return viewReview();
  if (r === "quiz") return a ? viewQuiz(a, b, c) : viewQuizMenu();
  if (r === "grammar") return viewGrammar(a);
  if (r === "settings") return viewSettings();
  viewToday();
}

document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-back]");
  if (b) { if (history.length > 1) history.back(); else location.hash = b.dataset.back; }
});
window.addEventListener("hashchange", route);
applyTheme();
route();

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("sw.js").catch(() => {});
}
