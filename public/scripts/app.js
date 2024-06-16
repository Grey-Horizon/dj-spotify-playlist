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

  if (window.location.pathname.endsWith("/csv")) {
    cvePage(userData);
  } else {
    playlistPage();
  }
}

async function getUserData() {
  return await authFetch("https://api.spotify.com/v1/me", {});
}
