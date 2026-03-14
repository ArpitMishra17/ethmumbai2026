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
    content,
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
    doc: fileverse.raw || null,
  };
}

async function listSessions() {
  return fetchSessionRecords();
}

async function getSessionById(sessionId) {
  const sessions = await fetchSessionRecords();
  return sessions.find((s) => s.sessionId === sessionId) || null;
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

async function deleteSessionById(sessionId) {
  const session = await getSessionById(sessionId);
  if (!session) {
    return false;
  }

  await deleteFileverseDoc(session.ddocId);
  return true;
}

async function listUsers() {
  const sessions = await fetchSessionRecords();
  const map = new Map();

  for (const s of sessions) {
    const key = s.ensId || "unknown";
    const existing = map.get(key) || {
      ensId: s.ensId,
      totalSessions: 0,
      latestUploadAt: null,
      sessionIds: [],
    };

    existing.totalSessions += 1;
    existing.sessionIds.push(s.sessionId);

    if (!existing.latestUploadAt || (s.uploadedAt && s.uploadedAt > existing.latestUploadAt)) {
      existing.latestUploadAt = s.uploadedAt || existing.latestUploadAt;
    }

    map.set(key, existing);
  }

  return Array.from(map.values()).sort((a, b) => b.totalSessions - a.totalSessions);
}

async function getUserDocsByEnsId(ensId) {
  const sessions = await fetchSessionRecords();
  const userSessions = sessions.filter((s) => s.ensId === ensId);

  if (!userSessions.length) {
    return null;
  }

  const docs = await Promise.all(
    userSessions.map(async (s) => {
      const fullDoc = await getFileverseDoc(s.ddocId);
      return {
        sessionId: s.sessionId,
        agentId: s.agentId,
        ensId: s.ensId,
        ddocId: s.ddocId,
        uploadedAt: s.uploadedAt,
        fileverseUrl: s.fileverseUrl,
        doc: fullDoc,
      };
    })
  );

  return {
    ensId,
    totalDocs: docs.length,
    docs,
  };
}

module.exports = {
  uploadUserFile,
  listSessions,
  getSessionById,
  getSessionDoc,
  deleteSessionById,
  listUsers,
  getUserDocsByEnsId,
};