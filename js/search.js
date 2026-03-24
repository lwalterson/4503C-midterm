// search.js — filters the song library by title, artist, and album in real time

const Search = (() => {
  let songLibrary = [];
  let results = [];
  let onChangeCallback = null;

  function init(songs, onChange) {
    songLibrary = songs;
    results = [...songLibrary];
    onChangeCallback = onChange;
    const input = document.getElementById("search-input");
    input.removeEventListener("input", handleInput);
    input.addEventListener("input", handleInput);
  }

  function handleInput(e) {
    const query = e.target.value.trim().toLowerCase();

    if (!query) {
      results = [...songLibrary];
    } else {
      results = songLibrary.filter(song =>
        song.title?.toLowerCase().includes(query) ||
        song.artist?.toLowerCase().includes(query) ||
        song.album?.toLowerCase().includes(query)
      );
    }

    if (onChangeCallback) onChangeCallback(results);
  }

  return { init };
})();
