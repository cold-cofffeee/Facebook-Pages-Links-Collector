(async function exportFacebookFollowing() {
  const scrollDelay = 700;
  const maxScrollAttempts = 200;
  const maxNoChangeAttempts = 6;

  function sleep(ms){ return new Promise(r => setTimeout(r, ms)); }
  const scrollElement = document.scrollingElement || document.documentElement || document.body;

  // Auto-scroll to load everything
  let lastHeight = scrollElement.scrollHeight;
  let noChangeCount = 0;
  for (let i = 0; i < maxScrollAttempts; i++) {
    scrollElement.scrollTo({ top: scrollElement.scrollHeight, behavior: 'smooth' });
    await sleep(scrollDelay);
    const newHeight = scrollElement.scrollHeight;
    if (newHeight === lastHeight) {
      noChangeCount++;
      if (noChangeCount >= maxNoChangeAttempts) break;
    } else {
      lastHeight = newHeight;
      noChangeCount = 0;
    }
  }

  const profiles = new Map();

  // Grab all visible anchors inside the main area
  const anchors = document.querySelectorAll('div[role="main"] a[href]');

  anchors.forEach(a => {
    const name = (a.innerText || '').trim();
    if (!name) return;

    const url = new URL(a.href, location.origin).href;

    // Skip if it's a suggestion (look for "Add Friend" nearby)
    if (a.closest('[aria-label*="People You May Know"], [aria-label*="Suggestions"]')) return;
    if (a.parentElement && a.parentElement.innerText.match(/Add Friend/i)) return;

    // Skip if the link is clearly not a profile
    if (url.match(/\/(groups|pages|events|marketplace|watch|privacy|settings|help)\b/i)) return;

    // Only accept if the anchor looks like a profile: /username or /profile.php?id=
    if (!url.match(/facebook\.com\/(profile\.php\?id=\d+|[^\/?#]+)$/i)) return;

    if (!profiles.has(url)) {
      profiles.set(url, name);
    }
  });

  if (profiles.size === 0) {
    alert('No profiles found. Try scrolling manually, then re-run. If still empty, Facebook changed the markup again.');
    return;
  }

  const lines = Array.from(profiles.entries()).map(([url, name]) => `${name}\t${url}`);
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const filename = `facebook-following-${(new Date()).toISOString().slice(0,10)}.txt`;

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);

  alert(`Export complete — ${lines.length} entries. File downloaded as "${filename}".`);
})();
