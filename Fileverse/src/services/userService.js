const {
  uploadToFileverse,
  getFileverseDoc,
  listFileverseDocs,
  deleteFileverseDoc,
} = require("./fileverseService");

function parseSessionRecord(doc) {
  const content = doc.content || "";

  const sessionMatch = content.match(/Session ID:\s*(.+)/i);
  const agentMatch = content.match(/Agent ID:\s*(.+)/i);
  const ensMatch = content.match(/ENS ID:\s*(.+)/i);

  const fallbackSessionId = doc.title?.startsWith("session-") ? doc.title.slice("session-".length) : null;
  const sessionId = sessionMatch?.[1]?.trim() || fallbackSessionId || null;

  if (!sessionId) {
    return null;
  }

  return {
    sessionId,
    agentId: agentMatch?.[1]?.trim() || null,
    ensId: ensMatch?.[1]?.trim() || null,
    ddocId: doc.ddocId,
    uploadedAt: doc.uploadedAt,
    fileverseUrl: doc.link || null,
  };
}

async function fetchSessionRecords() {
  const docs = await listFileverseDocs();
  return docs.map(parseSessionRecord).filter(Boolean);
}

async function uploadUserFile({ sessionId, agentId, ensId, content }) {
  if (!sessionId || !agentId || !ensId) {
    const err = new Error("sessionId, agentId and ensId are required");
    err.status = 400;
    throw err;
  }

  if (!content || !String(content).trim()) {
    const err = new Error("content is required");
    err.status = 400;
    throw err;
  }

  const markdown = `# Session Evidence\n\nSession ID: ${sessionId}\nAgent ID: ${agentId}\nENS ID: ${ensId}\n\n\`\`\`\n${content}\n\`\`\``;

  const fileverse = await uploadToFileverse(`session-${sessionId}`, markdown);

  return {
    sessionId,
    agentId,
    ensId,
    ddocId: fileverse.ddocId,
    uploadedAt: new Date().toISOString(),
    fileverseUrl: fileverse.link || null,
  };
}

async function listSessions() {
  return fetchSessionRecords();
}

async function getSessionById(sessionId) {
  const sessions = await fetchSessionRecords();
  return sessions.find((s) => s.sessionId === sessionId) || null;
}

async function deleteSessionById(sessionId) {
  const session = await getSessionById(sessionId);
  if (!session) {
    return false;
  }

  await deleteFileverseDoc(session.ddocId);
  return true;
}

async function getSessionDoc(sessionId) {
  const session = await getSessionById(sessionId);
  if (!session) {
    const err = new Error("session not found");
    err.status = 404;
    throw err;
  }

  const doc = await getFileverseDoc(session.ddocId);

  return {
    ...session,
    doc,
  };
}

module.exports = {
  uploadUserFile,
  listSessions,
  getSessionById,
  deleteSessionById,
  getSessionDoc,
};