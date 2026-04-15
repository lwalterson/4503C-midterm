// playlist.js — playlist CRUD operations, all async

const Playlist = (() => {

  async function getAll() {
    return await getPlaylists();
  }

  async function create(name) {
    return await createPlaylist(name.trim());
  }

  async function removePlaylist(playlistId) {
    await deletePlaylist(playlistId);
  }

  async function addSong(playlistId, songId) {
    const playlists = await getPlaylists();
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist || playlist.songIds.includes(songId)) return;
    await updatePlaylistSongs(playlistId, [...playlist.songIds, songId]);
  }

  async function removeSong(playlistId, songId) {
    const playlists = await getPlaylists();
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return;
    await updatePlaylistSongs(playlistId, playlist.songIds.filter(id => id !== songId));
  }

  async function getSongs(playlistId) {
    const playlists = await getPlaylists();
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return [];
    return playlist.songIds.map(id => allSongs.find(s => s.id === id)).filter(Boolean);
  }

  return { getAll, create, removePlaylist, addSong, removeSong, getSongs };
})();
