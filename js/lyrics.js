// lyrics.js — show/hide the lyrics panel and render the current song's lyrics

const LyricsPanel = (() => {
  let panelEl = null;
  let contentEl = null;
  let isOpen = false;

  function init() {
    panelEl = document.getElementById("lyrics-panel");
    contentEl = document.getElementById("lyrics-content");

    document.getElementById("lyrics-toggle-btn").addEventListener("click", toggle);
    document.getElementById("lyrics-close-btn").addEventListener("click", close);
  }

  function toggle() {
    isOpen ? close() : open();
  }

  function open() {
    isOpen = true;
    panelEl.classList.add("is-open");
  }

  function close() {
    isOpen = false;
    panelEl.classList.remove("is-open");
  }

  // Called by player.js whenever the current song changes
  function render(song) {
    if (!song) {
      contentEl.textContent = "No song selected.";
      return;
    }

    if (!song.lyrics) {
      contentEl.textContent = "Lyrics not available for this song.";
      return;
    }

    // Preserve line breaks from the lyrics string
    contentEl.innerHTML = "";
    song.lyrics.split("\n").forEach(line => {
      const p = document.createElement("p");
      p.textContent = line;
      if (line.startsWith("[")) p.classList.add("lyrics-label");
      contentEl.appendChild(p);
    });
  }

  return { init, render, open, close, toggle };
})();
