require("dotenv").config();

const PORT = Number(process.env.PORT) || 8000;
const FILEVERSE_SERVER_URL = (process.env.SERVER_URL || "http://localhost:8001").replace(/\/+$/, "");
const FILEVERSE_API_KEY = process.env.API_KEY;

module.exports = {
  PORT,
  FILEVERSE_SERVER_URL,
  FILEVERSE_API_KEY,
};