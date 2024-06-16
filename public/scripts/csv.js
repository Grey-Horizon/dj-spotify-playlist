import { renderTemplate, renderProblem } from "./render.js";
import { authFetch } from "./auth.js";
import { setupAudioButtons } from "./playSample.js";

export default function init(userData) {
  renderTemplate("main", "form", {
    label: "CSV File",
    button: "Get tracks",
    file: true,
  }).then(() => {
    document.getElementById("playlist-form").onsubmit = onSubmit(userData);
  });
}

function onSubmit(userData) {
  return function (event) {
    event.preventDefault();
    const file = document.getElementById("playlist-input").files[0];
    Papa.parse(file, {
      skipEmptyLines: true,
      complete: getTracks(userData),
    });
  };
}

function getTracks(userData) {
  return async function ({ data: rows }) {
    // Skip the first 2 rows
    rows = rows.slice(2);

    // Get the track and artist from each row
    const tracks = await Promise.all(
      rows
        .map((row, idx) => {
          return {
            index: idx + 1,
            // Strip * from the strings
            track: stripStar(row[0]),
            artist: stripStar(row[1]),
          };
        })
        .map((track) => {
          return authFetch(
            `https://api.spotify.com/v1/search?q=track:${track.track}%20artist:${track.artist}&type=track&limit=1`,
            {}
          )
            .then((data) => {
              const searchResults = data.tracks.items;
              if (searchResults.length === 0) {
                return { ...track, found: false };
              }
              const result = searchResults[0];
              return {
                ...track,
                found: true,
                spotify: result,
              };
            })
            .catch((error) => {
              console.log("failed to query spotify for track", track, error);
              return { ...track, found: false };
            });
        })
    );
    await renderTemplate("playlist", "create-playlist", { tracks });
    setupAudioButtons();
    document.getElementById("playlist").scrollIntoView();
    document.getElementById("create-playlist").onclick = createPlaylist(
      userData,
      tracks
    );
  };
}

function createPlaylist(userData, tracks) {
  return async function (event) {
    event.preventDefault();
    try {
      const name = document.getElementById("playlist-name-input").value;
      const playlist = await authFetch(
        `https://api.spotify.com/v1/users/${userData.id}/playlists`,
        {
          method: "POST",
          body: JSON.stringify({ name }),
        }
      );
      const uris = tracks
        .filter((track) => track.found)
        .map((track) => track.spotify.uri);
      await authFetch(
        `https://api.spotify.com/v1/playlists/${playlist.id}/tracks`,
        {
          method: "POST",
          body: JSON.stringify({ uris }),
        }
      );
      await renderTemplate("playlist", "created-playlist", {
        name,
        url: playlist.external_urls.spotify,
      });
    } catch (error) {
      console.log("failed to create playlist", error);
      renderProblem(`Failed to create playlist, ${error.message}`);
    }
  };
}

function stripStar(string) {
  return string.startsWith("* ") ? string.replace("* ", "") : string;
}
