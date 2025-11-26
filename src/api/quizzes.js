// Minimal API wrapper for quizzes.
// These functions are simple wrappers around `fetch` and are intended
// to be replaced or extended when your backend is ready.

const BASE = "/api/quizzes";

async function handleResponse(res) {
  const text = await res.text();
  try {
    const data = text ? JSON.parse(text) : null;
    if (!res.ok) throw new Error(data && data.message ? data.message : res.statusText);
    return data;
  } catch (err) {
    // If JSON parse failed but response was ok, return raw text
    if (res.ok) return text;
    throw err;
  }
}

export async function fetchQuizzes(options = {}) {
  const headers = Object.assign({"Content-Type": "application/json"}, options.headers || {});
  const res = await fetch(BASE, { method: "GET", headers });
  return handleResponse(res);
}

export async function fetchTopics(options = {}) {
  // Return a list of topics from the API. Expected shape: array of strings or objects {id, name}
  const headers = Object.assign({"Content-Type": "application/json"}, options.headers || {});
  const res = await fetch("/api/topics", { method: "GET", headers });
  return handleResponse(res);
}

export async function createQuiz(payload = {}, options = {}) {
  const headers = Object.assign({"Content-Type": "application/json"}, options.headers || {});
  const res = await fetch(BASE, { method: "POST", headers, body: JSON.stringify(payload) });
  return handleResponse(res);
}

export default { fetchQuizzes, createQuiz };
