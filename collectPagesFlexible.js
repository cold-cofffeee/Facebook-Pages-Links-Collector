(async function collectPagesFlexible() {
  function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
  }

  async function autoScroll(maxScrolls = 50) {
    let lastHeight = 0;
    for (let i = 0; i < maxScrolls; i++) {
      window.scrollTo(0, document.body.scrollHeight);
      await sleep(1500);
      const h = document.body.scrollHeight;
      if (h === lastHeight) break;
      lastHeight = h;
    }
  }

  function isInChanges(el) {
    let cur = el.closest("div");
    while (cur) {
      if (
        cur.innerText &&
        /Changes to Pages/i.test(cur.innerText) &&
        cur.innerText.length < 500
      ) {
        return true;
      }
      cur = cur.parentElement;
    }
    return false;
  }

  function collect() {
    const out = new Set();

    // Try anchors with full FB URLs
    document.querySelectorAll('a[href]').forEach(a => {
      const href = a.getAttribute("href");
      if (!href) return;

      // Normalize relative URLs
      let full = href;
      if (href.startsWith("/")) {
        full = location.origin + href;
      }

      // Skip if in "Changes to Pages"
      if (isInChanges(a)) return;

      // Heuristic: page URLs—no query, path length small, not obviously UI links
      // E.g. https://www.facebook.com/SomePageName
      const m = full.match(/^https?:\/\/(www\.)?facebook\.com\/([^\/?]+)\/?$/);
      if (m) {
        out.add(full);
      }
    });

    return Array.from(out);
  }

  console.log("Scrolling to load content...");
  await autoScroll(100);

  console.log("Collecting links...");
  const pages = collect();

  if (pages.length === 0) {
    console.warn("No page links found! Consider inspecting the DOM or running debug to see what anchors exist.");
  } else {
    console.log("Found links:", pages);

    // trigger download
    const blob = new Blob([pages.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "facebook_pages.txt";
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }
})();
