const clientId = "d0d55991a2ef4703a156a4249d66acb1"; // your clientId
// Recreate path
const origin = new URL(window.location.href);
origin.search = "";
const redirectUrl = origin.toString(); // your redirect URL - must be localhost URL and/or HTTPS

const authorizationEndpoint = "https://accounts.spotify.com/authorize";
const tokenEndpoint = "https://accounts.spotify.com/api/token";
const scope =
  "user-read-private user-read-email playlist-read-private playlist-read-collaborative";

// Data structure that manages the current active token, caching it in localStorage
const currentToken = {
  get access_token() {
    return localStorage.getItem("access_token") || null;
  },
  get refresh_token() {
    return localStorage.getItem("refresh_token") || null;
  },
  get expires_in() {
    return localStorage.getItem("refresh_in") || null;
  },
  get expires() {
    return localStorage.getItem("expires") || null;
  },

  save: function (response) {
    const { access_token, refresh_token, expires_in } = response;
    if (!access_token || !refresh_token || !expires_in) {
      throw ("response couldn't be parsed", response);
    }
    localStorage.setItem("access_token", access_token);
    localStorage.setItem("refresh_token", refresh_token);
    localStorage.setItem("expires_in", expires_in);

    const now = new Date();
    const expiry = new Date(now.getTime() + expires_in * 1000);
    localStorage.setItem("expires", expiry);
  },
};

export async function flow() {
  console.log("flow");
  // On page load, try to fetch auth code from current browser search URL
  const args = new URLSearchParams(window.location.search);
  const code = args.get("code");

  // If we find a code, we're in a callback, do a token exchange
  if (code) {
    console.log("has code");
    const token = await getToken(code);
    currentToken.save(token);
    console.log("token saved", currentToken.expires_in);

    // Remove code from URL so we can refresh correctly.
    const url = new URL(window.location.href);
    url.searchParams.delete("code");
    url.search = localStorage.getItem("url_params") || "";

    console.log("updating url");
    const updatedUrl = url.search ? url.href : url.href.replace("?", "");
    window.history.replaceState({}, document.title, updatedUrl);
  }
}

export async function redirectToSpotifyAuthorize() {
  console.log("logging in ");
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const randomValues = crypto.getRandomValues(new Uint8Array(64));
  const randomString = randomValues.reduce(
    (acc, x) => acc + possible[x % possible.length],
    ""
  );

  const code_verifier = randomString;
  const data = new TextEncoder().encode(code_verifier);
  const hashed = await crypto.subtle.digest("SHA-256", data);

  const code_challenge_base64 = btoa(
    String.fromCharCode(...new Uint8Array(hashed))
  )
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  window.localStorage.setItem("code_verifier", code_verifier);

  // Store the params in the URL to reload them after the redirect
  window.localStorage.setItem("url_params", window.location.search);

  const authUrl = new URL(authorizationEndpoint);
  const params = {
    response_type: "code",
    client_id: clientId,
    scope: scope,
    code_challenge_method: "S256",
    code_challenge: code_challenge_base64,
    redirect_uri: redirectUrl,
  };

  console.log("going to spotify");
  authUrl.search = new URLSearchParams(params).toString();
  window.location.href = authUrl.toString(); // Redirect the user to the authorization server for login
}

// Soptify API Calls
async function getToken(code) {
  console.log("get token");
  const code_verifier = localStorage.getItem("code_verifier");

  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: "authorization_code",
      code: code,
      redirect_uri: redirectUrl,
      code_verifier: code_verifier,
    }),
  });

  if (!response.ok) {
    console.log("get token not ok, logging out");
    logout();
  }

  return await response.json();
}

async function refreshToken() {
  console.log("refresh token");
  const response = await fetch(tokenEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: "refresh_token",
      refresh_token: currentToken.refresh_token,
    }),
  });

  if (!response.ok) {
    console.log("refresh token not ok, logging out");
    logout();
  }

  return await response.json();
}

export async function authFetch(url, options, depth = 0) {
  if (depth > 2) {
    console.log("auth fetch stuck in refresh loop");
    return logout();
  }

  let response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: "Bearer " + currentToken.access_token,
    },
  });

  if (response.status === 401) {
    console.log("auth fetch 401 response getting refresh token");
    const token = await refreshToken();
    currentToken.save(token);
    return await authFetch(url, options, depth + 1);
  }

  if (!response.ok) {
    console.log("auth fetch response not ok");
    const res = await response.json();
    throw new Error(
      `Failed to fetch data from Spotify API, ${res.error.message}`
    );
  }

  return await response.json();
}

export async function isAuthorized() {
  console.log("is authoized called");
  if (!currentToken.access_token) {
    return false;
  }
  if (new Date(currentToken.expires) < new Date()) {
    const token = await refreshToken();
    currentToken.save(token);
  }

  return true;
}

export async function getCurrentToken() {
  if (!currentToken.access_token) {
    return null;
  }

  if (new Date(currentToken.expires) < new Date()) {
    const token = await refreshToken();
    currentToken.save(token);
  }

  return currentToken;
}

export function logout() {
  console.log("logging out");
  localStorage.clear();
  window.location.replace(redirectUrl);
}
