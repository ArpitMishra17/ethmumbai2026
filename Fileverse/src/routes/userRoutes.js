const express = require("express");
const {
  upload,
  getSessions,
  getSession,
  getDoc,
  deleteSession,
} = require("../controllers/userController");

const router = express.Router();

router.post("/sessions/upload", upload);
router.get("/sessions", getSessions);
router.get("/sessions/:id", getSession);
router.get("/sessions/:id/doc", getDoc);
router.delete("/sessions/:id", deleteSession);

// Temporary backward-compatible aliases.
router.post("/upload", upload);
router.get("/users", getSessions);
router.get("/users/:id", getSession);
router.get("/users/:id/doc", getDoc);
router.delete("/users/:id", deleteSession);

module.exports = router;