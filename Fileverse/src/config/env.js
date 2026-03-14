require("dotenv").config();

const PORT = Number(process.env.PORT) || 8000;
const FILEVERSE_SERVER_URL = (process.env.SERVER_URL || "").replace(/\/+$/, "");
const FILEVERSE_API_KEY = process.env.API_KEY;
const CLOUD_ONLY = process.env.CLOUD_ONLY !== "false";

if (!FILEVERSE_SERVER_URL) {
  throw new Error("SERVER_URL is required in .env");
}

if (CLOUD_ONLY && /(localhost|127\.0\.0\.1)/i.test(FILEVERSE_SERVER_URL)) {
  throw new Error("Cloud-only mode is enabled. SERVER_URL must point to your cloud provider URL.");
}

module.exports = {
  PORT,
  FILEVERSE_SERVER_URL,
  FILEVERSE_API_KEY,
  CLOUD_ONLY,
};