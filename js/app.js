/**
 * Speaking & Reading — Vanilla JS SPA with hash routing
 */
(function () {
  "use strict";

  const state = {
    topic: null,
    section: null,
    part: "A",
    questionIndex: 0,
    articleId: null,
    answerVisible: false,
    theme: localStorage.getItem("theme") || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
  };

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const sidebar = $("#sidebar");
  const main = $("#main");
  const overlay = $("#sidebar-overlay");

  function applyTheme() {
    document.documentElement.setAttribute("data-theme", state.theme);
    localStorage.setItem("theme", state.theme);
    const btn = $("#theme-toggle");
    if (btn) {
      btn.setAttribute("aria-label", state.theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
      btn.innerHTML = state.theme === "dark"
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;
    }
  }
  function toggleTheme() {
    state.theme = state.theme === "dark" ? "light" : "dark";
    applyTheme();
  }
  function parseHash() {
    return (location.hash.slice(1) || "/").split("/").filter(Boolean);
  }
  function navigate(path) {
    location.hash = path.startsWith("#") ? path : "#" + path;
  }
  function handleRoute() {
    const parts = parseHash();
    closeSidebar();
    if (parts.length === 0) { renderHome(); return; }
    const topic = (window.TOPICS || []).find(t => t.id === parts[0]);
    if (!topic) { renderHome(); return; }
    state.topic = topic;
    if (parts[1] === "speaking") {
      state.section = "speaking";
      const partMap = { "part-a": "A", "part-b": "B", "part-c": "C" };
      state.part = partMap[parts[2] || "part-a"] || "A";
      state.questionIndex = Math.max(0, (parseInt(parts[3], 10) || 1) - 1);
      state.answerVisible = false;
      renderSpeaking();
      return;
    }
    if (parts[1] === "reading") {
      state.section = "reading";
      if (parts[2]) { state.articleId = parts[2]; renderArticle(); }
      else { state.articleId = null; renderReadingList(); }
      return;
    }
    renderHome();
  }
  function getSpeakingData() {
    const key = (state.topic && state.topic.speakingKey) || "FASHION_SPEAKING";
    const data = window[key];
    if (!data) return [];
    return ({ A: data.partA, B: data.partB, C: data.partC })[state.part] || [];
  }
  function getReadingData() {
    const key = (state.topic && state.topic.readingKey) || "FASHION_READING";
    return window[key] || [];
  }
  function getAvailableParts() {
    const key = (state.topic && state.topic.speakingKey) || "FASHION_SPEAKING";
    const data = window[key] || {};
    const parts = [];
    if (data.partA && data.partA.length) parts.push({ id: "A", slug: "part-a", label: "Part A" });
    if (data.partB && data.partB.length) parts.push({ id: "B", slug: "part-b", label: "Part B" });
    if (data.partC && data.partC.length) parts.push({ id: "C", slug: "part-c", label: "Part C" });
    return parts;
  }
  function renderSidebar() {
    const topic = state.topic;
    const isSpeaking = state.section === "speaking";
    const isReading = state.section === "reading";
    let navHtml = "";
    if (topic) {
      navHtml = `
        <div class="sidebar-section">
          <div class="sidebar-label">Topic</div>
          <div class="sidebar-topic-title">${escapeHtml(topic.title)}</div>
        </div>
        <nav class="sidebar-nav" aria-label="Section navigation">
          <a href="#/${topic.id}/speaking/part-a/1" class="nav-item ${isSpeaking ? "active" : ""}">Speaking</a>
          ${isSpeaking ? `<div class="nav-sub">${getAvailableParts().map(pt => `
            <a href="#/${topic.id}/speaking/${pt.slug}/1" class="nav-sub-item ${state.part === pt.id ? "active" : ""}">${pt.label}</a>`).join("")}</div>` : ""}
          <a href="#/${topic.id}/reading" class="nav-item ${isReading ? "active" : ""}">Reading</a>
        </nav>`;
    }
    sidebar.innerHTML = `
      <div class="sidebar-header">
        <a href="#/" class="app-logo"><span class="logo-mark">SR</span><span class="logo-text">Speaking & Reading</span></a>
        <button id="theme-toggle" class="icon-btn" type="button" aria-label="Toggle theme"></button>
      </div>
      ${navHtml}
      <div class="sidebar-footer"><a href="#/" class="nav-item">\u2190 All topics</a></div>`;
    applyTheme();
    $("#theme-toggle")?.addEventListener("click", toggleTheme);
  }
  function openSidebar() {
    sidebar.classList.add("open"); overlay.classList.add("visible"); document.body.classList.add("sidebar-open");
  }
  function closeSidebar() {
    sidebar.classList.remove("open"); overlay.classList.remove("visible"); document.body.classList.remove("sidebar-open");
  }
  function escapeHtml(str) {
    const div = document.createElement("div"); div.textContent = str; return div.innerHTML;
  }
  function highlightChunks(text, chunks) {
    const sorted = [...chunks].sort((a, b) => b.term.length - a.term.length);
    return text.replace(/\*\*(.+?)\*\*/g, (match, term) => {
      const chunk = sorted.find(c => c.term.toLowerCase() === term.toLowerCase() || term.toLowerCase().includes(c.term.toLowerCase()) || c.term.toLowerCase().includes(term.toLowerCase()));
      const safe = escapeHtml(term);
      if (chunk) return `<mark class="chunk" data-tip="${escapeHtml(chunk.def + " \u2014 " + chunk.fa)}" tabindex="0">${safe}</mark>`;
      return `<mark class="chunk">${safe}</mark>`;
    });
  }
  function saveProgress() {
    if (state.section === "speaking" && state.topic)
      localStorage.setItem(`progress:${state.topic.id}:speaking:${state.part}`, String(state.questionIndex));
  }
  function renderHome() {
    state.topic = null; state.section = null; renderSidebar();
    const topics = window.TOPICS || [];
    main.innerHTML = `
      <div class="home fade-in">
        <header class="hero">
          <h1>Speaking & Reading</h1>
          <p class="hero-sub">English practice for intermediate learners. Build fluency with real sample answers and key phrases.</p>
        </header>
        <div class="topic-grid">
          ${topics.map(t => `
            <article class="topic-card">
              <h2>${escapeHtml(t.title)}</h2>
              <p>${escapeHtml(t.description || "")}</p>
              <div class="topic-actions">
                <a href="#/${t.id}/speaking/part-a/1" class="btn btn-primary">Speaking</a>
                <a href="#/${t.id}/reading" class="btn btn-secondary">Reading</a>
              </div>
            </article>`).join("")}
        </div>
      </div>`;
  }
  function renderSpeaking() {
    renderSidebar();
    const questions = getSpeakingData();
    if (!questions.length) {
      main.innerHTML = `<div class="empty">No questions found.</div>`;
      return;
    }
    if (state.questionIndex >= questions.length) state.questionIndex = questions.length - 1;
    if (state.questionIndex < 0) state.questionIndex = 0;
    const q = questions[state.questionIndex];
    const total = questions.length;
    const progress = ((state.questionIndex + 1) / total) * 100;
    const topicId = state.topic.id;
    const partSlug = { A: "part-a", B: "part-b", C: "part-c" }[state.part];
    saveProgress();
    main.innerHTML = `
      <div class="speaking-view fade-in">
        <div class="part-pills" role="tablist">
          ${getAvailableParts().map(pt => `
            <a href="#/${topicId}/speaking/${pt.slug}/1" class="pill ${state.part === pt.id ? "active" : ""}">${pt.label}</a>`).join("")}
        </div>
        <div class="progress-row">
          <span class="progress-label">Question ${state.questionIndex + 1} of ${total}</span>
          <div class="progress-bar" role="progressbar" aria-valuenow="${state.questionIndex + 1}" aria-valuemin="1" aria-valuemax="${total}">
            <div class="progress-fill" style="width:${progress}%"></div>
          </div>
        </div>
        <article class="card question-card">
          <div class="card-label">Question</div>
          <h2 class="question-text">${escapeHtml(q.q)}</h2>
        </article>
        <div class="reveal-wrap">
          <button id="reveal-btn" class="btn btn-primary btn-reveal" type="button" ${state.answerVisible ? "hidden" : ""}>Show sample answer</button>
        </div>
        <div id="answer-panel" class="answer-panel ${state.answerVisible ? "visible" : ""}" ${state.answerVisible ? "" : "hidden"}>
          <article class="card answer-card">
            <div class="card-label">Sample answer</div>
            <p class="answer-text">${highlightChunks(q.answer, q.chunks)}</p>
          </article>
          <section class="key-phrases">
            <h3 class="section-title">Key Phrases</h3>
            <div class="phrase-grid">
              ${q.chunks.map(c => `
                <div class="phrase-card">
                  <div class="phrase-term">${escapeHtml(c.term)}</div>
                  <div class="phrase-def">${escapeHtml(c.def)}</div>
                  <div class="phrase-fa" dir="rtl" lang="fa">${escapeHtml(c.fa)}</div>
                </div>`).join("")}
            </div>
          </section>
        </div>
        <nav class="nav-controls">
          <button id="prev-btn" class="btn btn-secondary" type="button" ${state.questionIndex === 0 ? "disabled" : ""}>\u2190 Previous</button>
          <button id="next-btn" class="btn btn-secondary" type="button" ${state.questionIndex >= total - 1 ? "disabled" : ""}>Next \u2192</button>
        </nav>
      </div>`;
    $("#reveal-btn")?.addEventListener("click", () => {
      state.answerVisible = true;
      const panel = $("#answer-panel"); const btn = $("#reveal-btn");
      if (panel) { panel.hidden = false; panel.classList.add("visible"); }
      if (btn) btn.hidden = true;
    });
    $("#prev-btn")?.addEventListener("click", () => {
      if (state.questionIndex > 0) navigate(`/${topicId}/speaking/${partSlug}/${state.questionIndex}`);
    });
    $("#next-btn")?.addEventListener("click", () => {
      if (state.questionIndex < total - 1) navigate(`/${topicId}/speaking/${partSlug}/${state.questionIndex + 2}`);
    });
    initChunkTooltips();
  }
  function initChunkTooltips() {
    const marks = $$("mark.chunk[data-tip]");
    let tipEl = $("#chunk-tooltip");
    if (!tipEl) {
      tipEl = document.createElement("div");
      tipEl.id = "chunk-tooltip"; tipEl.className = "chunk-tooltip"; tipEl.setAttribute("role", "tooltip");
      document.body.appendChild(tipEl);
    }
    function showTip(el) {
      tipEl.textContent = el.getAttribute("data-tip") || "";
      tipEl.classList.add("visible");
      const rect = el.getBoundingClientRect();
      const tipRect = tipEl.getBoundingClientRect();
      let left = rect.left + rect.width / 2 - tipRect.width / 2;
      let top = rect.top - tipRect.height - 8;
      if (left < 8) left = 8;
      if (left + tipRect.width > window.innerWidth - 8) left = window.innerWidth - tipRect.width - 8;
      if (top < 8) top = rect.bottom + 8;
      tipEl.style.left = left + "px"; tipEl.style.top = top + "px";
    }
    function hideTip() { tipEl.classList.remove("visible"); }
    marks.forEach(m => {
      m.addEventListener("mouseenter", () => showTip(m));
      m.addEventListener("mouseleave", hideTip);
      m.addEventListener("focus", () => showTip(m));
      m.addEventListener("blur", hideTip);
      m.addEventListener("click", e => { e.stopPropagation(); tipEl.classList.contains("visible") ? hideTip() : showTip(m); });
    });
    document.addEventListener("click", hideTip);
  }
  function renderReadingList() {
    renderSidebar();
    const articles = getReadingData();
    const topicId = state.topic.id;
    main.innerHTML = `
      <div class="reading-list fade-in">
        <header class="page-header">
          <h1>Reading</h1>
          <p class="page-sub">Articles with vocabulary and discussion questions.</p>
        </header>
        <div class="article-list">
          ${articles.map(a => `
            <a href="#/${topicId}/reading/${a.id}" class="article-card">
              <h2>${escapeHtml(a.title)}</h2>
              <p>${escapeHtml(a.subtitle)}</p>
              <span class="article-meta">${a.paragraphs.length} paragraphs \u00b7 ${a.vocabulary.length} vocab \u00b7 ${a.discussion.length} discussion</span>
            </a>`).join("")}
        </div>
      </div>`;
  }
  function renderArticle() {
    renderSidebar();
    const article = getReadingData().find(a => a.id === state.articleId);
    if (!article) {
      main.innerHTML = `<div class="empty">Article not found. <a href="#/${state.topic.id}/reading">Back to list</a></div>`;
      return;
    }
    const topicId = state.topic.id;
    main.innerHTML = `
      <div class="article-view fade-in">
        <a href="#/${topicId}/reading" class="back-link">\u2190 Back to reading list</a>
        <header class="article-header">
          <h1>${escapeHtml(article.title)}</h1>
          <p class="article-subtitle">${escapeHtml(article.subtitle)}</p>
        </header>
        <div class="paragraphs">
          ${article.paragraphs.map((p, i) => `
            <div class="para-block" data-idx="${i}">
              <p class="para-en">${escapeHtml(p.en)}</p>
              <button type="button" class="fa-toggle" aria-expanded="false" data-idx="${i}">\u0641\u0627\u0631\u0633\u06cc</button>
              <p class="para-fa" dir="rtl" lang="fa" hidden>${escapeHtml(p.fa)}</p>
            </div>`).join("")}
        </div>
        <section class="vocab-section">
          <h2 class="section-title">Vocabulary</h2>
          <div class="vocab-grid">
            ${article.vocabulary.map(v => `
              <div class="vocab-card">
                <div class="vocab-term">${escapeHtml(v.term)}</div>
                <div class="vocab-def">${escapeHtml(v.def)}</div>
                <div class="vocab-fa" dir="rtl" lang="fa">${escapeHtml(v.fa)}</div>
              </div>`).join("")}
          </div>
        </section>
        <section class="discussion-section">
          <h2 class="section-title">Discussion</h2>
          <div class="discussion-list">
            ${article.discussion.map((q, i) => `
              <div class="discussion-card">
                <span class="discussion-num">${i + 1}</span>
                <p>${escapeHtml(q)}</p>
              </div>`).join("")}
          </div>
        </section>
      </div>`;
    $$(".fa-toggle").forEach(btn => {
      btn.addEventListener("click", () => {
        const idx = btn.getAttribute("data-idx");
        const block = $(`.para-block[data-idx="${idx}"]`);
        const fa = block?.querySelector(".para-fa");
        if (!fa) return;
        const expanded = btn.getAttribute("aria-expanded") === "true";
        fa.hidden = expanded;
        btn.setAttribute("aria-expanded", String(!expanded));
        btn.classList.toggle("active", !expanded);
      });
    });
  }
  function onKeydown(e) {
    if (state.section !== "speaking") return;
    if (e.target.matches("input, textarea, button, a")) return;
    if (e.key === "ArrowLeft") { e.preventDefault(); $("#prev-btn")?.click(); }
    else if (e.key === "ArrowRight") { e.preventDefault(); $("#next-btn")?.click(); }
    else if (e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      if (!state.answerVisible) $("#reveal-btn")?.click();
    }
  }
  function init() {
    applyTheme();
    $("#menu-btn")?.addEventListener("click", openSidebar);
    overlay?.addEventListener("click", closeSidebar);
    window.addEventListener("hashchange", handleRoute);
    document.addEventListener("keydown", onKeydown);
    handleRoute();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
