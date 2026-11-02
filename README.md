# Fashion — Speaking & Reading

A professional, static language-learning web app for intermediate English learners. Focuses on **Speaking** (sample answers + key phrase chunks with Farsi glosses) and **Reading** (articles with per-paragraph Farsi toggles, vocabulary, and discussion questions).

Built with **vanilla HTML, CSS, and JavaScript only** — no frameworks, no build step, no npm.

## Live structure

```
/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   └── data/
│       ├── topics.js
│       ├── fashion-speaking.js
│       └── fashion-reading.js
└── README.md
```

## Features

- Hash-based routing (`#/fashion/speaking/part-a/1`) — works with GitHub Pages and browser back/forward
- Speaking: 3 parts (A 15 qs · B 10 qs · C 4 qs), sample answers with highlighted chunks, tooltips, Key Phrases cards
- Reading: 2 articles, paragraph-by-paragraph Farsi toggle, vocabulary grid, discussion questions
- Dark / light mode (system preference + manual toggle, persisted)
- Fully responsive sidebar (drawer on mobile)
- Keyboard: ← → navigate questions, Space to reveal answer
- Progress remembered per part in `localStorage`
- Accessible: semantic HTML, focus styles, ARIA, RTL for Farsi

## Deploy to GitHub Pages

1. Push this repo to GitHub.
2. Go to **Settings → Pages**.
3. Under **Source**, choose **Deploy from a branch**.
4. Branch: `main`, folder: `/ (root)`.
5. Save. The site will be live at `https://<user>.github.io/<repo>/`.

No build step required.

## Adding a new topic

1. Create `js/data/<topic>-speaking.js` that assigns a data object to `window` (same shape as `FASHION_SPEAKING`).
2. Create `js/data/<topic>-reading.js` that assigns an array of articles to `window` (same shape as `FASHION_READING`).
3. Register the topic in `js/data/topics.js`:

```js
window.TOPICS = [
  { id: "fashion", title: "Fashion", ... },
  {
    id: "travel",
    title: "Travel",
    description: "...",
    speakingFiles: ["travel-speaking"],
    readingFiles: ["travel-reading"]
  }
];
```

4. Add the new script tags to `index.html` (after the data files, before `app.js`).
5. Extend `app.js` slightly if the data keys differ (currently hard-coded to `FASHION_SPEAKING` / `FASHION_READING` for the fashion topic). A small registry map can be added when you introduce the second topic.

## Local use

Open `index.html` directly in a browser (`file://`) — no server needed. Data is loaded as JS modules assigned to `window`, so there are no CORS issues.

## License

Content and code provided as-is for educational use.
