// playlist.js — playlist CRUD operations, all async

const Playlist = (() => {

  async function getAll() {
    return await getPlaylists();
  }

  async function create(name) {
    const playlists = await getPlaylists();
    const newPlaylist = {
      id: "pl_" + Date.now(),
      name: name.trim(),
      createdAt: Date.now(),
      songIds: []
    };
    playlists.push(newPlaylist);
    await savePlaylists(playlists);
    return newPlaylist;
  }

  async function removePlaylist(playlistId) {
    const playlists = await getPlaylists();
    await savePlaylists(playlists.filter(p => p.id !== playlistId));
  }

  async function addSong(playlistId, songId) {
    const playlists = await getPlaylists();
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist || playlist.songIds.includes(songId)) return;
    playlist.songIds.push(songId);
    await savePlaylists(playlists);
  }

  async function removeSong(playlistId, songId) {
    const playlists = await getPlaylists();
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return;
    playlist.songIds = playlist.songIds.filter(id => id !== songId);
    await savePlaylists(playlists);
  }

  async function getSongs(playlistId) {
    const playlists = await getPlaylists();
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return [];
    return playlist.songIds.map(id => allSongs.find(s => s.id === id)).filter(Boolean);
  }

  return { getAll, create, removePlaylist, addSong, removeSong, getSongs };
})();
