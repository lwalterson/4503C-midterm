// storage.js — localStorage helpers and Supabase integration

const SUPABASE_URL = "https://egbvjjsnoxmbifbxpgwt.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnYnZqanNub3htYmlmYnhwZ3d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMDM4MTMsImV4cCI6MjA4OTg3OTgxM30.4jtItDimJkSwfPQWc5IM85lM5GKvO2t_YYnKmZoWihU";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// ── Supabase ──

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
  const { data, error } = await supabaseClient
    .from("songs")
    .insert([{ title, artist, album, lyrics, src }])
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

// ── localStorage ──

async function getPlaylists() {
  return JSON.parse(localStorage.getItem("playlists")) ?? [];
}

async function savePlaylists(list) {
  localStorage.setItem("playlists", JSON.stringify(list));
}

async function getPlayerState() {
  return JSON.parse(localStorage.getItem("playerState")) ?? null;
}

async function savePlayerState(state) {
  localStorage.setItem("playerState", JSON.stringify(state));
}
