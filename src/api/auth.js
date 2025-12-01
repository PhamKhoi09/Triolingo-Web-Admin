// Simple auth API helper for signing in
// Use relative path so CRA dev server proxy (`src/setupProxy.js`) can forward requests
// Backend mounts auth routes under /api/auth, so call /api/auth here.
const BASE = "/api/auth";

async function handleResponse(res) {
  const text = await res.text();
  // Try to parse JSON. If parsing fails and response is OK, return raw text.
  // If parsing fails and response is NOT OK, throw a clearer error including HTTP status and a snippet of the body.
  try {
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) {
      const msg = (data && data.message) ? data.message : `${res.status} ${res.statusText}`;
      throw new Error(msg);
    }
    return data;
  } catch (err) {
    if (res.ok) {
      return text; // successful response but not JSON (HTML or plain text)
    }
    // Non-OK response and JSON parse failed: include status + snippet to help debugging
    const snippet = text ? (text.length > 300 ? text.slice(0, 300) + '...' : text) : '';
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${snippet}`);
  }
}

export async function signIn(payload = {}, options = {}) {
  const headers = Object.assign({"Content-Type": "application/json"}, options.headers || {});
  const res = await fetch(`${BASE}/signin`, { method: "POST", headers, body: JSON.stringify(payload) });
  return handleResponse(res);
}

export default { signIn };
