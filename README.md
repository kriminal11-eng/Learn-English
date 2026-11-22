# Daily English Reader

A free, phone-friendly web app (PWA) for intermediate learners who want to improve their English by reading real articles every day.

## What it does

- **Daily articles** — world news, technology, science and history, collected automatically every morning by GitHub Actions. Choose 3, 5 or 10 articles a day.
- **Highlighted vocabulary** — useful mid-level words are marked in the text with a definition, part of speech, synonyms and the sentence where they appear. Tap *any* word for its meaning.
- **Personalised** — words you mark as *known* are never highlighted again; words you are learning come back highlighted as *review* when they are due or you haven't seen them for a while.
- **Listening** — the article is read aloud sentence by sentence with the browser's built-in voice (adjustable speed, voice selection, current sentence highlighted). Double-tap a sentence to start from there.
- **My words + spaced repetition** — flashcards with Again / Hard / Good / Easy scheduling (SM-2).
- **Quizzes** — meaning, synonyms, fill-in-the-blank with real sentences, listening, and a linking-words quiz.
- **Grammar** — linking words are underlined in the text with explanations; short lessons (although/despite/however, because/due to, punctuation, passive in news, reporting verbs, relative clauses, present perfect, articles) and a full connector reference.
- Works offline after the first visit. Progress is stored on your device (export/import backup in Settings).

## Sources (openly licensed)

| Source | Topics | Licence |
|---|---|---|
| Wikipedia (In the news, On this day, Featured article) | world, history | CC BY-SA 4.0 |
| The Conversation | technology, politics, arts/history, science | CC BY-ND 4.0 |
| Global Voices | world | CC BY 3.0 |
| NASA | science, technology | Public domain |

Definitions and synonyms: Princeton WordNet 3.1 (bundled in `data/dict/`). Word frequency: [wordfreq](https://github.com/rspeer/wordfreq).

## Setup (one time)

1. Merge this branch into `main`.
2. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
3. **Actions → Daily articles → Run workflow** (or wait for the daily run at 04:17 UTC).
4. Open `https://<user>.github.io/<repo>/` on your phone and choose *Add to Home screen*.

## Development

```bash
pip install -r scripts/requirements.txt
python scripts/fetch_articles.py          # writes data/articles/<today>.json and data/index.json
python -m http.server 8000                # open http://localhost:8000
```

Rebuild the dictionary: `npm pack wordnet-db && tar xzf wordnet-db-*.tgz && python scripts/build_dict.py package/dict`.
