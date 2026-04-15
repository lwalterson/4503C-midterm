// app.js — app init, event wiring, UI rendering

const navHistory = [];
let currentPlaylistId = null;
let allSongs = [];

async function init() {
  LyricsPanel.init();

  // Load all songs from Supabase
  try {
    allSongs = await getAllSongs();
  } catch (err) {
    document.getElementById("playlist-grid").innerHTML =
      "<p>Could not connect. An internet connection is required.</p>";
    return;
  }

  await Player.init();

  await renderHome();

  // Navigation
  document.getElementById("logo-btn").addEventListener("click", () => showView("view-home"));
  document.getElementById("back-btn").addEventListener("click", goBack);
  document.getElementById("search-btn").addEventListener("click", handleSearch);
  document.getElementById("search-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleSearch();
  });

  // Player controls
  document.getElementById("play-pause-btn").addEventListener("click", async () => {
    await Player.toggle();
    updatePlayerUI();
  });
  document.getElementById("skip-btn").addEventListener("click", async () => {
    await Player.skip();
    updatePlayerUI();
  });

  // Progress bar seek
  document.getElementById("progress-bar").addEventListener("input", (e) => {
    document.getElementById("audio-player").currentTime = e.target.value;
  });

  // Progress bar updates as song plays
  document.getElementById("audio-player").addEventListener("timeupdate", () => {
    updatePlayerUI();
  });

  // Space to play/pause
  document.addEventListener("keydown", async (e) => {
    if (e.key !== " ") return;
    const tag = document.activeElement.tagName.toLowerCase();
    if (tag === "input" || tag === "textarea" || tag === "button") return;
    e.preventDefault();
    await Player.toggle();
    updatePlayerUI();
  });

  // Search
  Search.init(allSongs, renderSearchResults);

  // Arrow key navigation for song lists
  attachListArrowNav("playlist-song-list");
  attachListArrowNav("search-results-list");

  // Playlist management
  document.getElementById("create-playlist-btn").addEventListener("click", handleCreatePlaylist);
  document.getElementById("delete-playlist-btn").addEventListener("click", handleDeletePlaylist);

  // Add song
  document.getElementById("add-song-btn").addEventListener("click", showAddSongModal);
  document.getElementById("modal-submit-btn").addEventListener("click", handleAddSong);

  updatePlayerUI();
}

function showAddSongModal() {
  document.getElementById("song-file").value = "";
  document.getElementById("song-title").value = "";
  document.getElementById("song-artist").value = "";
  document.getElementById("song-album").value = "";
  document.getElementById("song-lyrics").value = "";

  const modal = document.getElementById("add-song-modal");
  modal.classList.remove("hidden");

  const focusable = [...modal.querySelectorAll(
    "input, textarea, #modal-cancel-btn, #modal-submit-btn"
  )];
  focusable[0].focus();

  function trapFocus(e) {
    if (e.key !== "Tab") return;
    e.preventDefault();
    const currentIndex = focusable.indexOf(document.activeElement);
    if (e.shiftKey) {
      focusable[currentIndex > 0 ? currentIndex - 1 : focusable.length - 1].focus();
    } else {
      focusable[(currentIndex + 1) % focusable.length].focus();
    }
  }

  function closeModal() {
    modal.classList.add("hidden");
    modal.removeEventListener("keydown", trapFocus);
    document.getElementById("add-song-btn").focus();
  }

  modal.addEventListener("keydown", trapFocus);
  modal._closeModal = closeModal;

  document.getElementById("modal-cancel-btn").addEventListener("click", closeModal, { once: true });
}

async function handleAddSong() {
  const file = document.getElementById("song-file").files[0];
  const title = document.getElementById("song-title").value.trim();
  const artist = document.getElementById("song-artist").value.trim();
  const album = document.getElementById("song-album").value.trim();
  const lyrics = document.getElementById("song-lyrics").value.trim();

  if (!file) { alert("Please select an audio file."); return; }
  if (!title) { alert("Title is required."); return; }

  const submitBtn = document.getElementById("modal-submit-btn");
  submitBtn.textContent = "Uploading...";
  submitBtn.disabled = true;

  try {
    const src = await uploadAudioFile(file);
    const newSong = await saveUserSong({ title, artist: artist || null, album: album || null, lyrics: lyrics || null, src });
    allSongs = [...allSongs, newSong];
    Search.init(allSongs, renderSearchResults);
    document.getElementById("add-song-modal")._closeModal();
  } catch (err) {
    alert("Upload failed: " + err.message);
  } finally {
    submitBtn.textContent = "Upload";
    submitBtn.disabled = false;
  }
}

function handleSearch() {
  const query = document.getElementById("search-input").value.trim();
  if (!query) return;

  document.getElementById("search-input").dispatchEvent(new Event("input"));
  showView("view-search");
}

function renderSearchResults(results) {
  const list = document.getElementById("search-results-list");
  list.innerHTML = "";

  if (results.length === 0) {
    list.innerHTML = "<li>No songs found.</li>";
    return;
  }

  results.forEach((song, index) => {
    const li = document.createElement("li");

    const info = document.createElement("span");
    info.textContent = [song.title, song.artist, song.album].filter(Boolean).join(" — ");
    info.tabIndex = 10 + (index * 2);
    info.addEventListener("click", async () => {
      await Player.load(song, { type: "search" });
      await Player.play();
      updatePlayerUI();
    });
    info.addEventListener("keydown", async (e) => {
      if (e.key === "Enter") {
        await Player.load(song, { type: "search" });
        await Player.play();
        updatePlayerUI();
      }
    });

    const addBtn = document.createElement("button");
    addBtn.textContent = "+";
    addBtn.tabIndex = 10 + (index * 2) + 1;
    addBtn.classList.add("add-to-playlist-btn");
    addBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      showPlaylistMenu(song, addBtn);
    });

    li.appendChild(info);
    li.appendChild(addBtn);
    list.appendChild(li);
  });
}

async function showPlaylistMenu(song, btn) {
  const existing = document.getElementById("playlist-menu");
  if (existing) {
    existing.remove();
    return;
  }

  const playlists = await Playlist.getAll();
  const menu = document.createElement("div");
  menu.id = "playlist-menu";

  if (playlists.length === 0) {
    const empty = document.createElement("p");
    empty.textContent = "No playlists yet.";
    menu.appendChild(empty);
  } else {
    playlists.forEach(playlist => {
      const option = document.createElement("button");
      option.textContent = playlist.name;
      option.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (playlist.songIds.includes(song.id)) {
          option.textContent = "Already in playlist";
          setTimeout(() => { option.textContent = playlist.name; }, 1500);
        } else {
          await Playlist.addSong(playlist.id, song.id);
          await renderHome();
          option.textContent = "Added!";
          setTimeout(() => { menu.remove(); }, 1000);
        }
      });
      menu.appendChild(option);
    });
  }

  btn.parentElement.style.position = "relative";
  btn.parentElement.appendChild(menu);

  setTimeout(() => {
    document.addEventListener("click", () => menu.remove(), { once: true });
  }, 0);
}

function updatePlayerUI() {
  const song = Player.getCurrentSong();
  const audio = document.getElementById("audio-player");

  document.getElementById("player-title").textContent = song ? song.title : "No song playing";
  document.getElementById("player-artist").textContent = song ? song.artist : "";

  document.getElementById("play-pause-btn").textContent = audio.paused ? "Play" : "Pause";

  document.getElementById("progress-bar").max = audio.duration || 0;
  document.getElementById("progress-bar").value = audio.currentTime || 0;
}

async function renderHome() {
  const grid = document.getElementById("playlist-grid");
  try {
    const playlists = await Playlist.getAll();
    grid.innerHTML = "";

    if (playlists.length === 0) {
      grid.innerHTML = "<p>No playlists yet.</p>";
      return;
    }

    playlists.forEach((playlist, index) => {
      const btn = document.createElement("button");
      btn.textContent = `${playlist.name} (${playlist.songIds.length} songs)`;
      btn.tabIndex = 10 + index;
      btn.addEventListener("click", () => renderPlaylist(playlist.id));
      grid.appendChild(btn);
    });
  } catch (err) {
    grid.innerHTML = "<p>Could not load playlists. Check your connection.</p>";
  }
}

async function renderPlaylist(playlistId, navigate = true) {
  const playlists = await Playlist.getAll();
  const playlist = playlists.find(p => p.id === playlistId);
  if (!playlist) return;

  currentPlaylistId = playlistId;
  document.getElementById("playlist-title").textContent = playlist.name;

  const songs = await Playlist.getSongs(playlistId);
  renderPlaylistSongs(songs, playlistId);

  const input = document.getElementById("playlist-search-input");
  input.value = "";
  input.oninput = () => {
    const query = input.value.trim().toLowerCase();
    const filtered = !query ? songs : songs.filter(s =>
      s.title?.toLowerCase().includes(query) ||
      s.artist?.toLowerCase().includes(query) ||
      s.album?.toLowerCase().includes(query)
    );
    renderPlaylistSongs(filtered, playlistId);
  };

  if (navigate) showView("view-playlist");
}

function renderPlaylistSongs(songs, playlistId) {
  const list = document.getElementById("playlist-song-list");
  list.innerHTML = "";

  if (songs.length === 0) {
    list.innerHTML = "<li>No songs found.</li>";
    return;
  }

  songs.forEach((song, index) => {
    const li = document.createElement("li");

    const info = document.createElement("span");
    info.textContent = [song.title, song.artist, song.album].filter(Boolean).join(" — ");
    info.tabIndex = 10 + (index * 2);
    info.addEventListener("click", async () => {
      await Player.load(song, { type: "playlist", playlistId, index });
      await Player.play();
      updatePlayerUI();
    });
    info.addEventListener("keydown", async (e) => {
      if (e.key === "Enter") {
        await Player.load(song, { type: "playlist", playlistId, index });
        await Player.play();
        updatePlayerUI();
      }
    });

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "−";
    removeBtn.tabIndex = 10 + (index * 2) + 1;
    removeBtn.classList.add("remove-from-playlist-btn");
    removeBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      await Playlist.removeSong(playlistId, song.id);
      await renderHome();
      await renderPlaylist(playlistId, false);
    });

    li.appendChild(info);
    li.appendChild(removeBtn);
    list.appendChild(li);
  });
}

async function handleCreatePlaylist() {
  const name = prompt("Enter playlist name:");
  if (!name || !name.trim()) { alert("Please enter a playlist name."); return; }
  try {
    await Playlist.create(name);
    await renderHome();
  } catch (err) {
    alert("Could not create playlist. Check your connection.");
  }
}

async function handleDeletePlaylist() {
  if (!currentPlaylistId) return;
  try {
    const playlists = await Playlist.getAll();
    const playlist = playlists.find(p => p.id === currentPlaylistId);
    if (!playlist) return;
    const confirmed = confirm(`Delete "${playlist.name}"?`);
    if (!confirmed) return;
    await Playlist.removePlaylist(currentPlaylistId);
    currentPlaylistId = null;
    await renderHome();
    showView("view-home");
  } catch (err) {
    alert("Could not delete playlist. Check your connection.");
  }
}

function showView(id, addToHistory = true) {
  if (addToHistory) {
    const current = document.querySelector(".view:not(.hidden)");
    if (current && current.id !== id) navHistory.push(current.id);
  }

  document.querySelectorAll(".view").forEach(v => v.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");

  document.getElementById("back-btn").style.display =
    id === "view-home" ? "none" : "inline-block";
}

async function goBack() {
  if (navHistory.length === 0) return;
  const previous = navHistory.pop();
  showView(previous, false);
  if (previous === "view-playlist" && currentPlaylistId) {
    await renderPlaylist(currentPlaylistId, false);
  }
}

function attachListArrowNav(listId) {
  const list = document.getElementById(listId);
  list.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    e.preventDefault();

    const spans = [...list.querySelectorAll("span[tabindex]")];
    const current = document.activeElement;
    const currentIndex = spans.indexOf(current);
    if (currentIndex === -1) return;

    if (e.key === "ArrowDown" && currentIndex < spans.length - 1) {
      spans[currentIndex + 1].focus();
    } else if (e.key === "ArrowUp" && currentIndex > 0) {
      spans[currentIndex - 1].focus();
    }
  });
}

async function startApp(user) {
  document.getElementById("auth-overlay").classList.add("hidden");
  document.getElementById("app-layout").classList.remove("hidden");
  document.getElementById("user-email").textContent = user.email;
  await init();
}

function setupAuthUI() {
  const tabSignIn = document.getElementById("tab-signin");
  const tabSignUp = document.getElementById("tab-signup");
  const submitBtn = document.getElementById("auth-submit-btn");
  const form = document.getElementById("auth-form");
  let mode = "signin";

  tabSignIn.addEventListener("click", () => {
    mode = "signin";
    tabSignIn.classList.add("active");
    tabSignUp.classList.remove("active");
    submitBtn.textContent = "Sign In";
    document.getElementById("auth-message").className = "hidden";
    document.getElementById("auth-password").autocomplete = "current-password";
    const confirmField = document.getElementById("auth-confirm-password");
    confirmField.classList.add("hidden");
    confirmField.value = "";
    confirmField.required = false;
  });

  tabSignUp.addEventListener("click", () => {
    mode = "signup";
    tabSignUp.classList.add("active");
    tabSignIn.classList.remove("active");
    submitBtn.textContent = "Sign Up";
    document.getElementById("auth-message").className = "hidden";
    document.getElementById("auth-email").value = "";
    document.getElementById("auth-password").value = "";
    document.getElementById("auth-password").autocomplete = "new-password";
    const confirmField = document.getElementById("auth-confirm-password");
    confirmField.classList.remove("hidden");
    confirmField.required = true;
    confirmField.value = "";
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("auth-email").value.trim();
    const password = document.getElementById("auth-password").value;
    const confirmPassword = document.getElementById("auth-confirm-password").value;
    const msgEl = document.getElementById("auth-message");

    submitBtn.disabled = true;
    msgEl.className = "hidden";

    try {
      if (mode === "signup") {
        if (password !== confirmPassword) {
          msgEl.textContent = "Passwords do not match.";
          msgEl.className = "auth-error";
          document.getElementById("auth-password").value = "";
          document.getElementById("auth-confirm-password").value = "";
          return;
        }
        const result = await signUp(email, password);
        if (result.session) {
          await startApp(result.user);
        } else {
          msgEl.textContent = "Account created! Check your email to confirm, then sign in.";
          msgEl.className = "auth-success";
        }
      } else {
        const result = await signIn(email, password);
        await startApp(result.user);
      }
    } catch (err) {
      msgEl.textContent = err.message;
      msgEl.className = "auth-error";
      document.getElementById("auth-password").value = "";
      document.getElementById("auth-confirm-password").value = "";
    } finally {
      submitBtn.disabled = false;
    }
  });

  document.getElementById("logout-btn").addEventListener("click", async () => {
    try {
      await signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    } finally {
      localStorage.removeItem("playerState");
      location.reload();
    }
  });

  document.getElementById("delete-account-btn").addEventListener("click", async () => {
    const confirmed = confirm("Are you sure you want to delete your account? This will permanently delete your account, all your playlists, and all your uploaded songs. This cannot be undone.");
    if (!confirmed) return;

    const deleteBtn = document.getElementById("delete-account-btn");
    deleteBtn.disabled = true;
    deleteBtn.textContent = "Deleting...";

    try {
      await deleteAccount();
    } catch (err) {
      alert("Could not delete account: " + err.message);
      deleteBtn.disabled = false;
      deleteBtn.textContent = "Delete Account";
    } finally {
      localStorage.removeItem("playerState");
      location.reload();
    }
  });

  onAuthChange((event) => {
    if (event === "SIGNED_OUT") {
      const appVisible = !document.getElementById("app-layout").classList.contains("hidden");
      if (appVisible) {
        localStorage.removeItem("playerState");
        location.reload();
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  setupAuthUI();
  try {
    const user = await getUser();
    if (user) {
      await startApp(user);
    }
  } catch (err) {
    document.getElementById("auth-message").textContent = "Could not connect. Check your internet connection.";
    document.getElementById("auth-message").className = "auth-error";
  }
});
