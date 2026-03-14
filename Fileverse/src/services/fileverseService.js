const { FILEVERSE_SERVER_URL, FILEVERSE_API_KEY } = require("../config/env");

function getConnectionHint() {
  return "Check your cloud SERVER_URL, API_KEY, and Cloudflare Worker logs for failures.";
}

function ensureApiKey() {
  if (!FILEVERSE_API_KEY) {
    const err = new Error("API_KEY is required for cloud operations");
    err.status = 500;
    throw err;
  }
}

function cleanText(value = "") {
  return String(value).replace(/\s+/g, " ").trim();
}

function parseCloudflareHtmlError(html = "") {
  if (!html || !/<html/i.test(html)) return null;

  const title = html.match(/<title>(.*?)<\/title>/is)?.[1];
  const subtitle = html.match(/<h2[^>]*>(.*?)<\/h2>/is)?.[1];
  const rayId = html.match(/Ray ID:\s*<strong[^>]*>(.*?)<\/strong>/is)?.[1] || html.match(/Ray ID:\s*([^<\n]+)/i)?.[1];

  return {
    title: cleanText((title || "").replace(/<[^>]+>/g, "")),
    message: cleanText((subtitle || "").replace(/<[^>]+>/g, "")),
    rayId: cleanText((rayId || "").replace(/<[^>]+>/g, "")) || null,
  };
}

async function safeError(response, fallbackMessage) {
  const text = await response.text();
  const cf = parseCloudflareHtmlError(text);

  if (cf) {
    const err = new Error(cf.message || fallbackMessage);
    err.status = response.status;
    err.upstream = {
      type: "cloudflare_html_error",
      title: cf.title || null,
      message: cf.message || null,
      rayId: cf.rayId,
      status: response.status,
      serverUrl: FILEVERSE_SERVER_URL,
    };
    throw err;
  }

  const err = new Error(text || fallbackMessage);
  err.status = response.status;
  err.upstream = {
    type: "upstream_error",
    status: response.status,
    serverUrl: FILEVERSE_SERVER_URL,
    body: text ? text.slice(0, 400) : null,
  };
  throw err;
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
    await safeError(response, "failed to create document");
  }

  const data = await response.json();
  return {
    ddocId: data?.data?.ddocId || data?.ddocId || "",
    link: data?.data?.link || data?.link || "",
    raw: data,
  };
}

async function getFileverseDoc(ddocId) {
  ensureApiKey();

  const url = `${FILEVERSE_SERVER_URL}/api/ddocs/${encodeURIComponent(ddocId)}?apiKey=${FILEVERSE_API_KEY}`;
  const response = await fetch(url, { method: "GET" });

  if (!response.ok) {
    await safeError(response, "failed to fetch document");
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
    await safeError(response, "failed to list documents");
  }

  const payload = await response.json();
  return getDocList(payload).map(normalizeDoc);
}

async function deleteFileverseDoc(ddocId) {
  ensureApiKey();

  const url = `${FILEVERSE_SERVER_URL}/api/ddocs/${encodeURIComponent(ddocId)}?apiKey=${FILEVERSE_API_KEY}`;
  const response = await fetch(url, { method: "DELETE" });

  if (!response.ok) {
    await safeError(response, "failed to delete document");
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