const { FILEVERSE_SERVER_URL, FILEVERSE_API_KEY } = require("../config/env");

function getConnectionHint() {
  if (FILEVERSE_SERVER_URL.includes("localhost") || FILEVERSE_SERVER_URL.includes("127.0.0.1")) {
    return "Start local fileverse server: npx @fileverse/api";
  }
  return "Check your cloud SERVER_URL and API_KEY configuration.";
}

function ensureApiKey() {
  if (!FILEVERSE_API_KEY) {
    const err = new Error("API_KEY is required for cloud operations");
    err.status = 500;
    throw err;
  }
}

async function uploadToFileverse(title, content) {
  ensureApiKey();

  const url = `${FILEVERSE_SERVER_URL}/api/ddocs?apiKey=${FILEVERSE_API_KEY}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, content }),
  });

  if (!response.ok) {
    const text = await response.text();
    const err = new Error(text || "failed to create document");
    err.status = response.status;
    throw err;
  }

  const data = await response.json();
  return {
    ddocId: data?.data?.ddocId || data?.ddocId || "",
    link: data?.data?.link || data?.link || "",
  };
}

async function getFileverseDoc(ddocId) {
  ensureApiKey();

  const url = `${FILEVERSE_SERVER_URL}/api/ddocs/${encodeURIComponent(ddocId)}?apiKey=${FILEVERSE_API_KEY}`;
  const response = await fetch(url, { method: "GET" });

  if (!response.ok) {
    const text = await response.text();
    const err = new Error(text || "failed to fetch document");
    err.status = response.status;
    throw err;
  }

  const data = await response.json();
  return data?.data || data;
}

function getDocList(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data?.ddocs)) return payload.data.ddocs;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.ddocs)) return payload.ddocs;
  if (Array.isArray(payload?.items)) return payload.items;
  return [];
}

function normalizeDoc(doc) {
  const base = doc?.data ? doc.data : doc;
  return {
    ddocId: base?.ddocId || "",
    title: base?.title || "",
    content: base?.content || "",
    link: base?.link || "",
    uploadedAt: base?.uploadedAt || base?.createdAt || null,
    raw: base,
  };
}

async function listFileverseDocs() {
  ensureApiKey();

  const url = `${FILEVERSE_SERVER_URL}/api/ddocs?apiKey=${FILEVERSE_API_KEY}`;
  const response = await fetch(url, { method: "GET" });

  if (!response.ok) {
    const text = await response.text();
    const err = new Error(text || "failed to list documents");
    err.status = response.status;
    throw err;
  }

  const payload = await response.json();
  return getDocList(payload).map(normalizeDoc);
}

async function deleteFileverseDoc(ddocId) {
  ensureApiKey();

  const url = `${FILEVERSE_SERVER_URL}/api/ddocs/${encodeURIComponent(ddocId)}?apiKey=${FILEVERSE_API_KEY}`;
  const response = await fetch(url, { method: "DELETE" });

  if (!response.ok) {
    const text = await response.text();
    const err = new Error(text || "failed to delete document");
    err.status = response.status;
    throw err;
  }

  return response.json().catch(() => ({ ok: true }));
}

async function pingFileverseServer() {
  const response = await fetch(`${FILEVERSE_SERVER_URL}/ping`, { method: "GET" });
  if (!response.ok) {
    const err = new Error(`fileverse server responded with status ${response.status}`);
    err.status = response.status;
    throw err;
  }
  return response.json();
}

module.exports = {
  getConnectionHint,
  uploadToFileverse,
  getFileverseDoc,
  listFileverseDocs,
  deleteFileverseDoc,
  pingFileverseServer,
};