import { renderTemplate, renderProblem } from "./render.js";
import { generate } from "./template.js";
import { authFetch } from "./auth.js";

export default function init() {
  renderTemplate("main", "form", {
    label: "Playlist ID or URL",
    button: "Get Playlist",
    text: true,
  }).then(() => {
    document.getElementById("playlist-form").onsubmit = onSubmit;

    const args = new URLSearchParams(window.location.search);
    const input = args.get("input");
    if (input) {
      document.getElementById("playlist-input").value = input;
      onSubmit({ preventDefault: () => {} });
    }
  });
}

async function getPlaylist(id) {
  return await authFetch(`https://api.spotify.com/v1/${id}`, {});
}

async function onSubmit(event) {
  event.preventDefault();
  const text = document.getElementById("playlist-input").value;
  history.pushState({}, "", `?input=${text}`);
  const playlistId = text.split("/").pop();
  if (!playlistId) {
    return renderProblem("Invalid playlist URL");
  }
  await renderTemplate("playlist", "loading");
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

    await renderTemplate("playlist", "view-playlist", playlist);
    Array.from(document.getElementsByClassName("audio-button")).forEach(
      (button) => {
        button.onclick = audioButtonHandler;
      }
    );
    document.getElementById("playlist").scrollIntoView();
    document.getElementById("download-template").onclick = () => {
      const data = {
        items: playlist.tracks.items.map((item) => ({
          artists: item.allArtists,
          name: item.track.name,
        })),
        url: playlist.external_urls.spotify,
      };
      generate(data, playlist.name);
      return;
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
