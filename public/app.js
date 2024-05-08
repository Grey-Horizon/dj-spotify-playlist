import {
  authFetch,
  isAuthorized,
  flow,
  logout,
  redirectToSpotifyAuthorize,
} from "./auth.js";

// Auth entry point
await flow();
const authorized = await isAuthorized();
let userData;

if (authorized) {
  try {
    userData = await getUserData();
  } catch (e) {
    console.log(e);
    logout();
  }
}

// Set action button
if (authorized) {
  renderTemplate("action", "logout", userData);
  document.getElementById("action-button").onclick = logout;
}

// Main entry point
if (!authorized) {
  renderTemplate("main", "landing");
  document.getElementById("action-button").onclick = redirectToSpotifyAuthorize;
}

if (authorized) {
  renderTemplate("main", "new-playlist");
  document.getElementById("playlist-form").onsubmit = onSubmit;

  const args = new URLSearchParams(window.location.search);
  const input = args.get("input");
  if (input) {
    document.getElementById("playlist-input").value = input;
    onSubmit({ preventDefault: () => {} });
  }
}

async function getUserData() {
  return await authFetch("https://api.spotify.com/v1/me", {});
}

async function getPlaylist(id) {
  return await authFetch(`https://api.spotify.com/v1/${id}`, {});
}

function renderProblem(message = "Something went wrong. Please try again.") {
  renderTemplate("playlist", "uh-oh", { message });
}

async function onSubmit(event) {
  event.preventDefault();
  const text = document.getElementById("playlist-input").value;
  history.pushState({}, "", `?input=${text}`);
  const playlistId = text.split("/").pop();
  if (!playlistId) {
    return renderProblem("Invalid playlist URL");
  }
  renderTemplate("playlist", "loading");
  try {
    const playlist = await getPlaylist(`playlists/${playlistId}`);

    if (playlist.type !== "playlist") {
      return renderProblem("This is not a playlist");
    }

    if (playlist.tracks.items.length === 0) {
      return renderProblem("This playlist is empty");
    }

    // Fetch all tracks if the playlist is paginated
    if (playlist.tracks.total > playlist.tracks.items.length) {
      while (playlist.tracks.total > playlist.tracks.items.length) {
        const next = playlist.tracks.next;
        const more = await authFetch(next, {});
        playlist.tracks.items = playlist.tracks.items.concat(more.items);
        playlist.tracks.next = more.next;
      }
    }

    // Custom formatting
    playlist.tracks.items.forEach((item, idx) => {
      item.allArtists = item.track.artists.map((a) => a.name).join(", ");
      item.track.index = idx + 1;
    });

    renderTemplate("playlist", "view-playlist", playlist);
    Array.from(document.getElementsByClassName("audio-button")).forEach(
      (button) => {
        button.onclick = audioButtonHandler;
      }
    );
    document.getElementById("view-playlist").scrollIntoView();
    document.getElementById("download-csv").onclick = () => {
      const csv = [
        ["Name", "Artists", "Sample Link", "Song Link", "Arist Link"].join(","),
        ...playlist.tracks.items.map((item) =>
          [
            item.track.name,
            item.allArtists,
            item.track.preview_url,
            item.track.external_urls.spotify,
            item.track.artists[0].external_urls.spotify,
          ]
            .map((val) => val.replace(/"/g, '""'))
            .map((val) => `"${val}"`)
            .join(",")
        ),
      ];

      const blob = new Blob([csv.join("\n")], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${playlist.name}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };
  } catch (err) {
    renderProblem(err.message);
  }
}

function audioButtonHandler(event) {
  const button = event.target;

  const audioId = button.getAttribute("data-audio-id");
  const audio = document.getElementById(audioId);

  const icon = button.querySelector("i");

  if (audio.paused) {
    audio.play();
    icon.classList.remove("fa-play");
    icon.classList.add("fa-pause");
  } else {
    audio.pause();
    icon.classList.add("fa-play");
    icon.classList.remove("fa-pause");
  }
}

// HTML Template Rendering with Mustache
function renderTemplate(targetId, templateId, data = {}) {
  const template = document.getElementById(templateId).innerHTML;
  const rendered = Mustache.render(template, data);
  document.getElementById(targetId).innerHTML = rendered;
}
