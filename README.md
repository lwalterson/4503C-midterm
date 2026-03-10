# Music Streaming App

A browser-based music streaming app built with vanilla HTML, CSS, and JavaScript. No frameworks, no backend — just a clean, responsive UI with data persisted in localStorage, designed so the storage layer can be swapped to a cloud database in the future.

---

## Features

- **Search** — Filter songs by title in real time
- **Playback** — Play and pause songs with a persistent player bar
- **Create Playlist** — Add new named playlists
- **Delete Playlist** — Remove a playlist entirely
- **Add Songs to Playlist** — Add any song from the library to a playlist
- **Remove Songs from Playlist** — Remove individual songs from a playlist

---

## Tech Stack

| Layer | Technology |
|---|---|
| Markup | HTML5 |
| Styles | CSS3 (Flexbox, Grid, custom properties) |
| Logic | Vanilla JavaScript (ES6+, async/await) |
| Storage | localStorage (cloud DB ready) |
| Audio | HTML5 Audio API |
| Build | None — runs directly in the browser |

---

## Project Structure

```
music-app/
├── index.html
├── css/
│   ├── main.css          # Base styles, variables, reset
│   ├── layout.css        # Responsive grid/flexbox layout
│   └── components.css    # Player, cards, modals, sidebar
├── js/
│   ├── data.js           # Static song library
│   ├── storage.js        # localStorage read/write (swappable)
│   ├── player.js         # Play/pause, current track state
│   ├── search.js         # Search and filter logic
│   ├── playlist.js       # Playlist CRUD operations
│   └── app.js            # App init, event wiring, UI rendering
└── assets/
    └── audio/            # Audio files or URLs
```

---

## Data Design

**Songs** are static and defined in `data.js`. Each song has an `id`, `title`, `artist`, `album`, `duration`, `src`, and `cover`.

**Playlists** are stored in localStorage as an array of objects, each with an `id`, `name`, `createdAt` timestamp, and a `songIds` array referencing song IDs.

**Player state** (current song, play status, volume, position) is also persisted in localStorage so playback context survives page refreshes.

---

## Cloud Database Migration

All localStorage access is contained in `storage.js`. Migrating to a cloud database only requires updating that file — no changes needed in the rest of the app. All storage calls are written as `async/await` from the start to make this migration seamless.

---

## Decisions & Rationale

**Why vanilla JS/CSS/HTML?**
No build tools, no dependencies, no framework churn. The app runs directly in the browser and is easy to understand, modify, and hand off.

**Why isolate storage in one file (`storage.js`)?**
So the rest of the app never touches localStorage directly. When migrating to a cloud database (e.g. Firebase, Supabase), only `storage.js` needs to change. The interface — `getPlaylists()`, `savePlaylists()`, etc. — stays the same.

**Why write all storage calls as `async/await` even though localStorage is synchronous?**
localStorage doesn't need async, but a cloud database does. Writing async from day one means zero refactoring in `playlist.js`, `player.js`, and `app.js` when the backend changes.

**Why store `songIds` in playlists instead of full song objects?**
Avoids data duplication. Songs live in one place (`data.js`) and playlists just reference them by ID. If a song's metadata changes, it only needs updating in one place.

**Why use `"pl_" + Date.now()` for playlist IDs?**
Simple and unique enough for a single-user local app with no server. When moving to a cloud DB, this can be replaced with server-generated UUIDs.

**Why split CSS into three files (`main`, `layout`, `components`)?**
Keeps styles organized by concern. `main.css` handles global tokens and resets, `layout.css` handles the responsive page structure, and `components.css` handles individual UI pieces like the player bar, cards, and modals.

**Why a fixed bottom player bar?**
Matches the UX pattern users expect from music apps (Spotify, Apple Music). It stays visible regardless of what the user is browsing.

**Why no build step?**
Keeps the project simple and beginner-friendly. Files are linked directly in `index.html`. If the project grows, a bundler like Vite could be added later without restructuring the codebase.
