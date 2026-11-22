// Question generators for vocabulary and linking-word quizzes.
import { CONNECTORS, CATEGORIES, findConnectors, groupOf } from "./grammar.js";

const shuffle = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = (a, n) => shuffle(a).slice(0, n);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const firstSense = (it) => it.senses?.[0] || ["", "", "", []];

function blankSentence(sentence, form) {
  const re = new RegExp(`\\b${form.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
  if (!re.test(sentence)) return null;
  return esc(sentence).replace(re, '<span class="blank">_____</span>');
}

function formIn(sentence, it) {
  const forms = [...(it.forms || []), it.w];
  return forms.find((f) => new RegExp(`\\b${f}\\b`, "i").test(sentence));
}

// items: [{w, senses, ctx:[{sentence}], forms}]
export function vocabQuiz(items, count = 10) {
  items = items.filter((it) => it.senses?.length);
  if (items.length < 4) return [];
  const qs = [];
  const types = ["def2word", "word2def", "cloze", "synonym", "listen"];
  for (const it of pick(items, Math.min(count, items.length))) {
    const [pos, def, , syns] = firstSense(it);
    const others = items.filter((o) => o.w !== it.w);
    const samePos = others.filter((o) => firstSense(o)[0] === pos);
    const distract = (n) => pick(samePos.length >= n ? samePos : others, n);
    const avail = types.filter((t) => {
      if (t === "cloze") return it.ctx?.some((c) => formIn(c.sentence, it));
      if (t === "synonym") return syns?.length && others.length >= 3;
      return true;
    });
    const type = avail[Math.floor(Math.random() * avail.length)];
    let q;
    if (type === "def2word") {
      const opts = shuffle([it, ...distract(3)]);
      q = { type, prompt: `Which word means:<div class="q-def">“${esc(def)}”</div>`, options: opts.map((o) => o.w), answer: opts.indexOf(it) };
    } else if (type === "word2def") {
      const opts = shuffle([it, ...distract(3)]);
      q = { type, prompt: `What does <b class="q-word">${esc(it.w)}</b> mean?`, options: opts.map((o) => firstSense(o)[1]), answer: opts.indexOf(it), speak: it.w };
    } else if (type === "cloze") {
      const c = it.ctx.find((c) => formIn(c.sentence, it));
      const form = formIn(c.sentence, it);
      const opts = shuffle([it, ...distract(3)]);
      q = { type, prompt: `Complete the sentence:<div class="q-ctx">${blankSentence(c.sentence, form)}</div>`,
        options: opts.map((o) => (o === it ? form.toLowerCase() : (o.forms?.[0] || o.w))), answer: opts.indexOf(it) };
    } else if (type === "synonym") {
      const syn = syns[Math.floor(Math.random() * syns.length)];
      const bad = pick(others.filter((o) => !(firstSense(o)[3] || []).includes(syn) && o.w !== syn), 3).map((o) => o.w);
      const opts = shuffle([syn, ...bad]);
      q = { type, prompt: `Which word is closest in meaning to <b class="q-word">${esc(it.w)}</b>?`, options: opts, answer: opts.indexOf(syn), speak: it.w };
    } else {
      const opts = shuffle([it, ...distract(3)]);
      q = { type, prompt: `Listen and choose the word you hear.`, listen: it.w, options: opts.map((o) => o.w), answer: opts.indexOf(it) };
    }
    q.item = it;
    q.explain = `<b>${esc(it.w)}</b> <i>(${esc(pos)})</i>: ${esc(def)}${syns?.length ? `<br><span class="muted">Synonyms: ${esc(syns.join(", "))}</span>` : ""}`;
    qs.push(q);
  }
  return qs;
}

// Linking-word quiz from real article sentences plus built-in examples.
export function grammarQuiz(sentences, count = 10) {
  const pool = [];
  for (const s of sentences) {
    if (s.length > 260) continue;
    for (const f of findConnectors(s)) {
      if (["also", "until", "including", "finally", "especially", "particularly", "whether", "because", "though"].includes(f.c.p)) continue;
      pool.push({ sentence: s, ...f });
    }
  }
  for (const c of CONNECTORS) for (const f of findConnectors(c.ex)) if (f.c.p === c.p) pool.push({ sentence: c.ex, ...f, builtIn: true });
  const qs = [];
  const used = new Set();
  for (const it of shuffle(pool)) {
    if (qs.length >= count) break;
    if (used.has(it.c.p) || used.has(it.sentence)) continue;
    used.add(it.c.p); used.add(it.sentence);
    const g = groupOf(it.c.cat);
    // distractors: different meaning group, same grammar type when possible (so only meaning decides)
    let cands = CONNECTORS.filter((c) => groupOf(c.cat) !== g && c.type === it.c.type && !c.p.includes(" ") === !it.c.p.includes(" "));
    if (cands.length < 3) cands = CONNECTORS.filter((c) => groupOf(c.cat) !== g && c.type === it.c.type);
    const opts = shuffle([it.c, ...pick(cands, 3)]);
    const orig = it.sentence.slice(it.start, it.end);
    const cap = /^[A-Z]/.test(orig);
    const fmt = (p) => (cap ? p[0].toUpperCase() + p.slice(1) : p);
    const shown = esc(it.sentence.slice(0, it.start)) + '<span class="blank">_____</span>' + esc(it.sentence.slice(it.end));
    qs.push({
      type: "grammar", prompt: `Choose the best linking word:<div class="q-ctx">${shown}</div>`,
      options: opts.map((o) => fmt(o.p)), answer: opts.indexOf(it.c),
      explain: `<b>${esc(it.c.p)}</b> — <span class="cat-dot" style="background:${CATEGORIES[it.c.cat].color}"></span>${CATEGORIES[it.c.cat].name}: ${esc(it.c.m)}.<br><span class="muted">${esc(it.c.use)}</span>`,
    });
  }
  return qs;
}
