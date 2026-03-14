const { getConnectionHint } = require("../services/fileverseService");
const {
  uploadUserFile,
  listSessions,
  getSessionById,
  deleteSessionById,
  getSessionDoc,
} = require("../services/userService");

async function upload(req, res) {
  try {
    const record = await uploadUserFile(req.body || {});
    res.json({
      message: "uploaded successfully",
      data: record,
    });
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message,
      hint: getConnectionHint(),
    });
  }
}

async function getSessions(req, res) {
  try {
    const sessions = await listSessions();
    res.json({ total: sessions.length, sessions });
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message,
      hint: getConnectionHint(),
    });
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
    res.status(err.status || 500).json({
      error: err.message,
      hint: getConnectionHint(),
    });
  }
}

async function getDoc(req, res) {
  try {
    const payload = await getSessionDoc(req.params.id);
    res.json(payload);
  } catch (err) {
    res.status(err.status || 500).json({
      error: err.message,
      hint: getConnectionHint(),
    });
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
    res.status(err.status || 500).json({
      error: err.message,
      hint: getConnectionHint(),
    });
  }
}

module.exports = {
  upload,
  getSessions,
  getSession,
  getDoc,
  deleteSession,
};