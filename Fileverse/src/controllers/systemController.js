const { FILEVERSE_SERVER_URL } = require("../config/env");
const { getConnectionHint, pingFileverseServer } = require("../services/fileverseService");

function ping(req, res) {
  res.json({ message: "server running" });
}

async function pingFileverse(req, res) {
  try {
    const data = await pingFileverseServer();
    res.json({
      reachable: true,
      serverUrl: FILEVERSE_SERVER_URL,
      data,
    });
  } catch (err) {
    res.status(err.status || 502).json({
      reachable: false,
      serverUrl: FILEVERSE_SERVER_URL,
      error: err.message,
      hint: getConnectionHint(),
    });
  }
}

module.exports = {
  ping,
  pingFileverse,
};

