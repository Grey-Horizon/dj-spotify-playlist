import {
  authFetch,
  isAuthorized,
  flow,
  logout,
  redirectToSpotifyAuthorize,
} from "./auth.js";
import playlistPage from "./playlist.js";
import cvePage from "./csv.js";
import { renderProblem, renderTemplate } from "./render.js";

// Auth entry point
await flow();
const authorized = await isAuthorized();
let userData;

// Main entry point
if (!authorized) {
  console.log("not authorized");
  renderTemplate("main", "landing").then(() => {
    document.getElementById("action-button").onclick =
      redirectToSpotifyAuthorize;
  });
} else {
  console.log("authorized");
  try {
    userData = await getUserData();
  } catch (err) {
    renderProblem(err.message);
    console.log(e);
  }

  // Set action button
  renderTemplate("action", "logout", userData).then(() => {
    document.getElementById("action-button").onclick = logout;
  });

  const activeTab =
    "cursor-pointer inline-flex items-center border-b-2 border-indigo-500 px-1 pt-1 text-sm font-medium text-gray-900";
  const inActiveTab =
    "cursor-pointer inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 hover:border-gray-300 hover:text-gray-700";

  document.getElementById("playlist-to-word").onclick = function () {
    document.getElementById("playlist-to-word").className = activeTab;
    document.getElementById("csv-to-playlist").className = inActiveTab;
    playlistPage();
  };
  document.getElementById("csv-to-playlist").onclick = function () {
    document.getElementById("playlist-to-word").className = inActiveTab;
    document.getElementById("csv-to-playlist").className = activeTab;
    cvePage(userData);
  };

  playlistPage();
}

async function getUserData() {
  return await authFetch("https://api.spotify.com/v1/me", {});
}
