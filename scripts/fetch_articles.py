"""Daily article collector.

Fetches articles from openly-licensed sources (Wikipedia, The Conversation, NASA,
Global Voices), cleans the text, picks vocabulary candidates with definitions and
synonyms from the bundled dictionary, and writes data/articles/<date>.json.

Run:  python scripts/fetch_articles.py [--date YYYY-MM-DD]
"""
import argparse, datetime as dt, html, json, os, re, sys, time, urllib.parse
import feedparser, requests, simplemma
from wordfreq import zipf_frequency

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA = os.path.join(ROOT, "data")
ART_DIR = os.path.join(DATA, "articles")
UA = "LearnEnglishDailyReader/1.0 (educational reader; runs on GitHub Actions)"
S = requests.Session()
S.headers["User-Agent"] = UA
KEEP_DAYS = 120
MIN_WORDS, MAX_WORDS = 250, 1100

# --- sources ---------------------------------------------------------------
# category: world | tech | history | science
FEEDS = [
    # The Conversation — academic journalism, CC BY-ND 4.0 (republishing allowed)
    ("The Conversation", "tech", "https://theconversation.com/us/technology/articles.atom", "CC BY-ND 4.0", 2),
    ("The Conversation", "tech", "https://theconversation.com/global/technology/articles.atom", "CC BY-ND 4.0", 1),
    ("The Conversation", "world", "https://theconversation.com/global/politics/articles.atom", "CC BY-ND 4.0", 1),
    ("The Conversation", "world", "https://theconversation.com/us/politics/articles.atom", "CC BY-ND 4.0", 1),
    ("The Conversation", "history", "https://theconversation.com/us/arts/articles.atom", "CC BY-ND 4.0", 1),
    ("The Conversation", "history", "https://theconversation.com/uk/arts/articles.atom", "CC BY-ND 4.0", 1),
    ("The Conversation", "science", "https://theconversation.com/us/science/articles.atom", "CC BY-ND 4.0", 1),
    # Global Voices — citizen journalism from around the world, CC BY 3.0
    ("Global Voices", "world", "https://globalvoices.org/feed/", "CC BY 3.0", 2),
    # NASA — public domain (U.S. government work)
    ("NASA", "science", "https://www.nasa.gov/news-release/feed/", "Public domain", 1),
    ("NASA", "tech", "https://www.nasa.gov/technology/feed/", "Public domain", 1),
]
HISTORY_WORDS = re.compile(r"\b(history|historical|ancient|medieval|century|war|empire|archaeolog\w*|museum|heritage|dynasty|revolution)\b", re.I)


def log(*a):
    print(*a, file=sys.stderr, flush=True)


def get(url, **kw):
    for attempt in range(3):
        try:
            r = S.get(url, timeout=25, **kw)
            if r.status_code == 200:
                return r
            log(f"  HTTP {r.status_code} {url}")
            if r.status_code in (403, 404, 410):
                return None
        except requests.RequestException as e:
            log(f"  error {e.__class__.__name__} {url}")
        time.sleep(2 * (attempt + 1))
    return None


# --- text cleaning ---------------------------------------------------------
BLOCK_RE = re.compile(r"</?(p|div|h[1-6]|li|blockquote|br|tr|figure|figcaption|section|article)[^>]*>", re.I)
JUNK_RE = re.compile(r"^(read more|related|this article (is|was) republished|copyright|share this|follow us|image:|photo:|subscribe|sign up|click here|the post .* appeared first)", re.I)


def html_to_paragraphs(raw):
    raw = re.sub(r"(?is)<(script|style|figure|figcaption|aside|iframe|noscript|table)[^>]*>.*?</\1>", " ", raw)
    raw = re.sub(r"(?is)<img[^>]*>", " ", raw)
    raw = BLOCK_RE.sub("\n\n", raw)
    raw = re.sub(r"<[^>]+>", " ", raw)
    text = html.unescape(raw)
    return clean_paragraphs(text.split("\n\n"))


def clean_paragraphs(chunks):
    out = []
    for p in chunks:
        p = re.sub(r"\s+", " ", p).strip()
        if len(p) < 40 or JUNK_RE.match(p) or p.count(" ") < 6:
            continue
        if not re.search(r"[.!?\"”’)]$", p):  # captions, headings, credits
            continue
        out.append(p)
    return out


def trim(paragraphs):
    out, n = [], 0
    for p in paragraphs:
        w = len(p.split())
        if n + w > MAX_WORDS and n >= MIN_WORDS:
            break
        out.append(p)
        n += w
    return out


# --- vocabulary ------------------------------------------------------------
_dict_cache = {}


def _shard(letter):
    if letter not in _dict_cache:
        path = os.path.join(DATA, "dict", letter + ".json")
        _dict_cache[letter] = json.load(open(path, encoding="utf-8")) if os.path.exists(path) else {"w": {}, "f": {}}
    return _dict_cache[letter]


def lookup(word):
    """Return (lemma, entry) from the bundled dictionary, or (None, None)."""
    d = _shard(word[0])
    lem = d["f"].get(word) or simplemma.lemmatize(word, lang="en").lower()
    if word in d["w"] and not (lem != word and word.endswith(("ed", "ing", "s")) and lem in _shard(lem[0])["w"]):
        return word, d["w"][word]
    if lem and lem != word and lem[0].isalpha():
        d2 = _shard(lem[0])
        if lem in d2["w"]:
            return lem, d2["w"][lem]
    return None, None


TOKEN_RE = re.compile(r"[A-Za-z][A-Za-z'’-]*[A-Za-z]")
SENT_RE = re.compile(r"(?<=[.!?])[\"”’)]?\s+(?=[A-Z\"“‘(])")
STOP_LEMMAS = {"etc", "via", "per", "okay", "ok"}


def analyse(paragraphs):
    sentences = [s for p in paragraphs for s in SENT_RE.split(p)]
    caps, lower = {}, {}
    for s in sentences:
        for i, m in enumerate(TOKEN_RE.finditer(s)):
            t = m.group().replace("’", "'")
            if t[0].isupper():
                if i > 0:
                    caps[t.lower()] = caps.get(t.lower(), 0) + 1
            else:
                lower[t] = lower.get(t, 0) + 1
    cands = {}
    total, rare = 0, 0
    for s in sentences:
        for m in TOKEN_RE.finditer(s):
            raw = m.group().replace("’", "'")
            w = raw.lower()
            total += 1
            zf = zipf_frequency(w, "en")
            if zf < 4.0:
                rare += 1
            if w.endswith("'s"):
                w = w[:-2]
            if len(w) < 4 or "'" in w or (raw[0].isupper() and caps.get(w, 0) and not lower.get(w)):
                continue  # proper nouns / names
            lemma, entry = lookup(w)
            if not entry or lemma in STOP_LEMMAS:
                continue
            z = entry["z"]
            if z > 4.7 or z < 2.3:  # too easy for an intermediate reader / too obscure
                continue
            if lemma not in cands:
                hint = None
                if w != lemma and w.endswith(("ed", "ing")):
                    hint = "verb"
                elif w != lemma and w.endswith("s"):
                    hint = "noun" if any(x[0] == "noun" for x in entry["s"]) else "verb"
                elif w.endswith("ly"):
                    hint = "adverb"
                senses = sorted(entry["s"], key=lambda x: x[0] != hint) if hint else entry["s"]
                cands[lemma] = {"w": lemma, "z": z, "forms": [], "n": 0, "ctx": s, "s": senses}
            c = cands[lemma]
            c["n"] += 1
            if w not in c["forms"]:
                c["forms"].append(w)
            if raw.lower() not in c["forms"]:
                c["forms"].append(raw.lower())
    for c in cands.values():
        # prefer useful mid-frequency words; repeated words get a bonus
        c["score"] = round(-abs(c["z"] - 3.7) + 0.35 * min(c["n"], 3), 3)
    vocab = sorted(cands.values(), key=lambda c: -c["score"])[:45]
    nwords = sum(len(p.split()) for p in paragraphs)
    avg_sent = nwords / max(1, len(sentences))
    rare_ratio = rare / max(1, total)
    diff = rare_ratio * 100 + avg_sent * 0.6
    level = "B1" if diff < 26 else "B2" if diff < 33 else "C1"
    return vocab, {"words": nwords, "minutes": max(1, round(nwords / 180)), "level": level,
                   "difficulty": round(diff, 1)}


def make_article(source, category, title, url, license_, paragraphs, extra=None):
    paragraphs = trim(paragraphs)
    if sum(len(p.split()) for p in paragraphs) < MIN_WORDS:
        return None
    vocab, stats = analyse(paragraphs)
    aid = re.sub(r"[^a-z0-9]+", "-", (source + " " + title).lower()).strip("-")[:80]
    art = {"id": aid, "title": html.unescape(title).strip(), "source": source, "url": url,
           "license": license_, "category": category, "paragraphs": paragraphs, "vocab": vocab, **stats}
    if extra:
        art.update(extra)
    return art


# --- Wikipedia -------------------------------------------------------------
def wiki_extract(title):
    r = get("https://en.wikipedia.org/w/api.php", params={
        "action": "query", "prop": "extracts", "explaintext": 1, "exsectionformat": "wiki",
        "titles": title, "format": "json", "redirects": 1})
    if not r:
        return []
    pages = r.json().get("query", {}).get("pages", {})
    text = next(iter(pages.values()), {}).get("extract", "")
    paras = []
    for block in text.split("\n"):
        if block.startswith("=="):
            if re.search(r"(See also|References|Notes|Further reading|External links|Bibliography|Sources)", block):
                break
            continue
        paras.append(block)
    return clean_paragraphs(paras)


def wiki_url(title):
    return "https://en.wikipedia.org/wiki/" + urllib.parse.quote(title.replace(" ", "_"))


def wikipedia(date, seen):
    out = []
    r = get(f"https://en.wikipedia.org/api/rest_v1/feed/featured/{date:%Y/%m/%d}")
    if not r:
        return out
    feed = r.json()
    lic = "CC BY-SA 4.0"
    # In the news -> world events
    for story in feed.get("news", [])[:4]:
        links = story.get("links", [])
        # the event article usually has a year in its title
        links.sort(key=lambda l: 0 if re.search(r"\b(19|20)\d\d\b", l.get("normalizedtitle", l.get("title", ""))) else 1)
        for link in links[:2]:
            t = link.get("normalizedtitle") or link.get("title", "").replace("_", " ")
            if wiki_url(t) in seen:
                continue
            art = make_article("Wikipedia · In the news", "world", t, wiki_url(t), lic, wiki_extract(t),
                               {"summary": re.sub(r"<[^>]+>", "", story.get("story", ""))})
            if art:
                out.append(art)
                break
    # On this day -> history
    events = feed.get("onthisday", [])
    hist = 0
    for ev in events:
        if hist >= 2:
            break
        for page in ev.get("pages", [])[:2]:
            t = page.get("normalizedtitle") or page.get("title", "").replace("_", " ")
            desc = (page.get("description") or "").lower()
            if any(k in desc for k in ("country", "city", "capital", "born", "politician", "actor", "singer")):
                continue
            if wiki_url(t) in seen:
                continue
            art = make_article("Wikipedia · On this day", "history", t, wiki_url(t), lic, wiki_extract(t),
                               {"summary": f"{ev.get('year')}: {ev.get('text', '')}"})
            if art:
                out.append(art)
                hist += 1
                break
    # Today's featured article
    tfa = feed.get("tfa")
    if tfa:
        t = tfa.get("normalizedtitle") or tfa.get("title", "").replace("_", " ")
        if wiki_url(t) not in seen:
            cat = "history" if HISTORY_WORDS.search(tfa.get("extract", "") + " " + (tfa.get("description") or "")) else "featured"
            art = make_article("Wikipedia · Featured article", cat, t, wiki_url(t), lic, wiki_extract(t),
                               {"summary": tfa.get("description", "")})
            if art:
                out.append(art)
    return out


# --- RSS / Atom feeds ------------------------------------------------------
def feed_articles(seen):
    out = []
    for source, cat, url, lic, limit in FEEDS:
        r = get(url)
        if not r:
            continue
        f = feedparser.parse(r.content)
        got = 0
        for e in f.entries[:12]:
            if got >= limit:
                break
            link = e.get("link", "")
            if not link or link in seen:
                continue
            content = ""
            if e.get("content"):
                content = max((c.get("value", "") for c in e.content), key=len)
            content = content or e.get("summary", "")
            paras = html_to_paragraphs(content)
            if sum(len(p.split()) for p in paras) < MIN_WORDS:
                try:
                    import trafilatura
                    page = get(link)
                    txt = trafilatura.extract(page.text, include_comments=False, include_tables=False) if page else None
                    paras = clean_paragraphs((txt or "").split("\n"))
                except Exception as ex:  # noqa
                    log("  trafilatura failed", ex)
            category = cat
            if cat != "history" and HISTORY_WORDS.search(e.get("title", "")):
                category = "history"
            art = make_article(source, category, e.get("title", "Untitled"), link, lic, paras,
                               {"summary": re.sub(r"<[^>]+>", "", html.unescape(e.get("summary", "")))[:300].strip(),
                                "author": e.get("author", "")})
            if art:
                out.append(art)
                seen.add(link)
                got += 1
        log(f"{source} [{cat}] {url}: {got} articles")
    return out


# --- main ------------------------------------------------------------------
def load_seen():
    seen = set()
    if os.path.isdir(ART_DIR):
        for fn in os.listdir(ART_DIR):
            try:
                for a in json.load(open(os.path.join(ART_DIR, fn), encoding="utf-8"))["articles"]:
                    seen.add(a["url"])
            except Exception:
                pass
    return seen


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", default=dt.datetime.utcnow().strftime("%Y-%m-%d"))
    ap.add_argument("--force", action="store_true")
    args = ap.parse_args()
    date = dt.date.fromisoformat(args.date)
    os.makedirs(ART_DIR, exist_ok=True)
    path = os.path.join(ART_DIR, f"{date}.json")
    if os.path.exists(path) and not args.force:
        log(f"{path} exists; use --force to rebuild")
    else:
        seen = load_seen()
        if args.force and os.path.exists(path):
            for a in json.load(open(path, encoding="utf-8"))["articles"]:
                seen.discard(a["url"])
        arts = []
        try:
            arts += wikipedia(date, seen)
        except Exception as ex:
            log("wikipedia failed:", ex)
        log(f"Wikipedia: {len(arts)} articles")
        try:
            arts += feed_articles(seen)
        except Exception as ex:
            log("feeds failed:", ex)
        # dedupe by id
        uniq = {a["id"]: a for a in arts}
        arts = list(uniq.values())
        order = {"world": 0, "tech": 1, "history": 2, "science": 3, "featured": 4}
        arts.sort(key=lambda a: (order.get(a["category"], 9), a["difficulty"]))
        if not arts:
            log("No articles fetched — not writing a file.")
            return 1
        json.dump({"date": str(date), "generated": dt.datetime.utcnow().isoformat(timespec="seconds") + "Z",
                   "articles": arts}, open(path, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
        log(f"Wrote {len(arts)} articles to {path}")
    # prune + index
    files = sorted((f[:-5] for f in os.listdir(ART_DIR) if f.endswith(".json")), reverse=True)
    for old in files[KEEP_DAYS:]:
        os.remove(os.path.join(ART_DIR, old + ".json"))
    files = files[:KEEP_DAYS]
    index = []
    for d in files:
        try:
            arts = json.load(open(os.path.join(ART_DIR, d + ".json"), encoding="utf-8"))["articles"]
            index.append({"date": d, "count": len(arts),
                          "titles": [[a["id"], a["title"], a["category"], a["level"]] for a in arts]})
        except Exception:
            pass
    json.dump({"updated": dt.datetime.utcnow().isoformat(timespec="seconds") + "Z", "days": index},
              open(os.path.join(DATA, "index.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)
    return 0


if __name__ == "__main__":
    sys.exit(main())
