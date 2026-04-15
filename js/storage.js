// storage.js — localStorage helpers and Supabase integration

const SUPABASE_URL = "https://egbvjjsnoxmbifbxpgwt.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnYnZqanNub3htYmlmYnhwZ3d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMDM4MTMsImV4cCI6MjA4OTg3OTgxM30.4jtItDimJkSwfPQWc5IM85lM5GKvO2t_YYnKmZoWihU";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Auth ──

async function signUp(email, password) {
  const { data, error } = await supabaseClient.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

async function signIn(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function signOut() {
  const { error } = await supabaseClient.auth.signOut();
  if (error) throw error;
}

async function getUser() {
  const { data: { user } } = await supabaseClient.auth.getUser();
  return user;
}

function onAuthChange(callback) {
  supabaseClient.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
}

async function deleteAccount() {
  const { data: songs, error: fetchError } = await supabaseClient
    .from("songs")
    .select("src")
    .not("user_id", "is", null);
  if (fetchError) throw fetchError;

  if (songs.length > 0) {
    const paths = songs.map(s => s.src.split("/list/")[1]).filter(Boolean);
    const { error: storageError } = await supabaseClient.storage
      .from("list")
      .remove(paths);
    if (storageError) throw storageError;
  }

  const { error: deleteError } = await supabaseClient.rpc("delete_user");
  if (deleteError) throw deleteError;
}

// ── Supabase: Songs ──

async function uploadAudioFile(file) {
  if (!file.type.startsWith("audio/")) {
    throw new Error("Only audio files are allowed.");
  }
  if (file.size > 20 * 1024 * 1024) {
    throw new Error("File must be under 20MB.");
  }
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `audio/${Date.now()}_${safeName}`;
  const { error } = await supabaseClient.storage
    .from("list")
    .upload(filePath, file);
  if (error) throw error;

  const { data } = supabaseClient.storage
    .from("list")
    .getPublicUrl(filePath);
  return data.publicUrl;
}

async function saveUserSong({ title, artist, album, lyrics, src }) {
  const { data: { user } } = await supabaseClient.auth.getUser();
  const { data, error } = await supabaseClient
    .from("songs")
    .insert([{ title, artist, album, lyrics, src, user_id: user.id }])
    .select()
    .single();
  if (error) throw error;
  return { ...data, id: "us_" + data.id };
}

async function getAllSongs() {
  const { data, error } = await supabaseClient
    .from("songs")
    .select("*");
  if (error) throw error;
  return data.map(song => ({ ...song, id: "us_" + song.id }));
}

// ── Supabase: Playlists ──

async function getPlaylists() {
  const { data, error } = await supabaseClient
    .from("playlists")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data.map(p => ({ ...p, songIds: p.song_ids }));
}

async function createPlaylist(name) {
  const { data, error } = await supabaseClient
    .from("playlists")
    .insert([{ name, song_ids: [] }])
    .select()
    .single();
  if (error) throw error;
  return { ...data, songIds: data.song_ids };
}

async function deletePlaylist(playlistId) {
  const { error } = await supabaseClient
    .from("playlists")
    .delete()
    .eq("id", playlistId);
  if (error) throw error;
}

async function updatePlaylistSongs(playlistId, songIds) {
  const { error } = await supabaseClient
    .from("playlists")
    .update({ song_ids: songIds })
    .eq("id", playlistId);
  if (error) throw error;
}

// ── localStorage: Player State ──

async function getPlayerState() {
  return JSON.parse(localStorage.getItem("playerState")) ?? null;
}

async function savePlayerState(state) {
  localStorage.setItem("playerState", JSON.stringify(state));
}
