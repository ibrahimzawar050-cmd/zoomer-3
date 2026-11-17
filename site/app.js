(() => {
  const app = document.getElementById("app");
  const form = document.getElementById("form");
  const input = document.getElementById("q");
  const statusEl = document.getElementById("status");
  const list = document.getElementById("results");
  const pager = document.getElementById("pager");
  let token = 0;

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const say = (text) => { statusEl.textContent = text; };

  function setMode(hasSearch) {
    app.classList.toggle("home", !hasSearch);
    app.classList.toggle("results-mode", hasSearch);
  }

  function hostOf(url) {
    try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
  }

  function errorText(code) {
    if (code === "not_configured") return "Zoomer isn’t connected to a search engine yet. Add SEARXNG_URL in your Netlify settings.";
    if (code === "engine_error") return "The search engine returned an error. Try again in a moment.";
    return "Zoomer couldn’t reach the search engine. Check that it is running, then try again.";
  }

  async function load(q, page, my) {
    for (let i = 0; i < 8; i++) {
      let res;
      try {
        res = await fetch(`/api/search?q=${encodeURIComponent(q)}&page=${page}`);
      } catch {
        return { error: "unreachable" };
      }
      if (my !== token) return null;
      if (res.status === 504) {
        say("The search engine is waking up. This can take about a minute.");
        await sleep(5000);
        if (my !== token) return null;
        continue;
      }
      let body = {};
      try { body = await res.json(); } catch { /* ignore */ }
      return res.ok ? { data: body } : { error: body.error || "failed" };
    }
    return { error: "timeout" };
  }

  function renderResults(q, page, results) {
    list.replaceChildren();
    for (const r of results) {
      const li = document.createElement("li");
      li.className = "result";

      const host = document.createElement("div");
      host.className = "host";
      host.textContent = hostOf(r.url);

      const h2 = document.createElement("h2");
      const a = document.createElement("a");
      a.href = r.url;
      a.rel = "noopener noreferrer";
      a.textContent = r.title;
      h2.appendChild(a);

      li.append(host, h2);
      if (r.content) {
        const p = document.createElement("p");
        p.textContent = r.content;
        li.appendChild(p);
      }
      list.appendChild(li);
    }

    pager.replaceChildren();
    if (page > 1) {
      const prev = document.createElement("button");
      prev.type = "button";
      prev.textContent = "Previous";
      prev.addEventListener("click", () => search(q, page - 1, true));
      pager.appendChild(prev);
    }
    if (results.length) {
      const label = document.createElement("span");
      label.textContent = `Page ${page}`;
      pager.appendChild(label);
    }
    if (results.length && page < 10) {
      const next = document.createElement("button");
      next.type = "button";
      next.textContent = "Next";
      next.addEventListener("click", () => search(q, page + 1, true));
      pager.appendChild(next);
    }
  }

  async function search(q, page = 1, push = true) {
    q = q.trim();
    const my = ++token;
    if (!q) {
      setMode(false);
      list.replaceChildren();
      pager.replaceChildren();
      say("");
      document.title = "Zoomer";
      return;
    }

    input.value = q;
    setMode(true);
    list.replaceChildren();
    pager.replaceChildren();
    say("Searching…");
    document.title = `${q} – Zoomer`;
    if (push) {
      history.pushState({}, "", `/?q=${encodeURIComponent(q)}${page > 1 ? `&page=${page}` : ""}`);
    }

    const out = await load(q, page, my);
    if (out === null || my !== token) return;
    if (out.error) { say(errorText(out.error)); return; }

    const results = out.data.results || [];
    say(results.length ? "" : `No results for “${q}”. Try different words.`);
    renderResults(q, page, results);
    window.scrollTo({ top: 0 });
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    search(input.value, 1, true);
  });

  window.addEventListener("popstate", () => {
    const p = new URLSearchParams(location.search);
    search(p.get("q") || "", parseInt(p.get("page") || "1", 10) || 1, false);
  });

  const start = new URLSearchParams(location.search);
  if (start.get("q")) search(start.get("q"), parseInt(start.get("page") || "1", 10) || 1, false);
})();
