const { getConnectionHint } = require("../services/fileverseService");
const {
  uploadUserFile,
  listSessions,
  getSessionById,
  deleteSessionById,
  getSessionDoc,
  listUsers,
  getUserDocsByEnsId,
} = require("../services/userService");

function errorJson(res, err) {
  return res.status(err.status || 500).json({
    error: err.message,
    upstream: err.upstream || null,
    hint: getConnectionHint(),
  });
}

async function upload(req, res) {
  try {
    const record = await uploadUserFile(req.body || {});
    res.json({
      message: "uploaded successfully",
      data: record,
    });
  } catch (err) {
    return errorJson(res, err);
  }
}

async function getSessions(req, res) {
  try {
    const sessions = await listSessions();
    res.json({ total: sessions.length, sessions });
  } catch (err) {
    return errorJson(res, err);
  }
}

async function getSession(req, res) {
  try {
    const session = await getSessionById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: "session not found" });
    }
    res.json(session);
  } catch (err) {
    return errorJson(res, err);
  }
}

async function getDoc(req, res) {
  try {
    const payload = await getSessionDoc(req.params.id);
    res.json(payload);
  } catch (err) {
    return errorJson(res, err);
  }
}

async function getUsers(req, res) {
  try {
    const users = await listUsers();
    res.json({ total: users.length, users });
  } catch (err) {
    return errorJson(res, err);
  }
}

async function getUserDocs(req, res) {
  try {
    const payload = await getUserDocsByEnsId(req.params.ensId);
    if (!payload) {
      return res.status(404).json({ message: "user docs not found" });
    }
    res.json(payload);
  } catch (err) {
    return errorJson(res, err);
  }
}

async function deleteSession(req, res) {
  try {
    const deleted = await deleteSessionById(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "session not found" });
    }
    res.json({ message: "session deleted successfully" });
  } catch (err) {
    return errorJson(res, err);
  }
}

module.exports = {
  upload,
  getSessions,
  getSession,
  getDoc,
  getUsers,
  getUserDocs,
  deleteSession,
};