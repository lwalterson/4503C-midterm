// player.js — manages current track state and audio playback

const Player = (() => {
  let audio = null;
  let currentSong = null;
  let context = null; // { type: "playlist", playlistId, index } or { type: "search" }

  async function init() {
    audio = document.getElementById("audio-player");

    const state = await getPlayerState();

    // Restore volume
    audio.volume = state?.volume ?? 1.0;

    // Restore context
    context = state?.context ?? null;

    // Restore current song and position
    if (state?.currentSongId) {
      const song = allSongs.find(s => s.id === state.currentSongId);
      if (song) {
        await load(song, context);
        audio.currentTime = state.currentTime ?? 0;
      }
    }

    // Save position as the song plays
    audio.addEventListener("timeupdate", () => {
      savePlayerState(getState());
    });

    // When song ends, advance playlist or loop search
    audio.addEventListener("ended", async () => {
      if (context?.type === "playlist") {
        const songs = await Playlist.getSongs(context.playlistId);
        if (songs.length === 0) { await pause(); return; }
        const nextIndex = (context.index + 1) % songs.length;
        await load(songs[nextIndex], { type: "playlist", playlistId: context.playlistId, index: nextIndex });
        await play();
      } else if (context?.type === "search") {
        audio.currentTime = 0;
        await play();
      }
    });
  }

  async function load(song, newContext) {
    currentSong = song;
    context = newContext ?? null;
    audio.src = song.src;
    audio.load();
    LyricsPanel.render(song);
    await savePlayerState(getState());
  }

  async function play() {
    try {
      await audio.play();
      await savePlayerState(getState());
    } catch (err) {
      console.error("Playback failed:", err);
    }
  }

  async function pause() {
    audio.pause();
    await savePlayerState(getState());
  }

  async function toggle() {
    audio.paused ? await play() : await pause();
  }

  async function skip() {
    if (context?.type === "playlist") {
      const songs = await Playlist.getSongs(context.playlistId);
      if (songs.length === 0) return;
      const nextIndex = (context.index + 1) % songs.length;
      await load(songs[nextIndex], { type: "playlist", playlistId: context.playlistId, index: nextIndex });
      await play();
    } else if (context?.type === "search") {
      audio.currentTime = 0;
      await play();
    }
  }

  function getCurrentSong() {
    return currentSong;
  }

  function getState() {
    return {
      currentSongId: currentSong?.id ?? null,
      isPlaying: !audio.paused,
      volume: audio.volume,
      currentTime: audio.currentTime,
      context: context
    };
  }

  return { init, load, play, pause, toggle, skip, getCurrentSong };
})();
