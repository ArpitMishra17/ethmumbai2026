const express = require("express");
const {
  upload,
  getSessions,
  getSession,
  getDoc,
  getUsers,
  getUserDocs,
  deleteSession,
} = require("../controllers/userController");

const router = express.Router();

router.post("/sessions/upload", upload);
router.get("/sessions", getSessions);
router.get("/sessions/:id", getSession);
router.get("/sessions/:id/doc", getDoc);
router.delete("/sessions/:id", deleteSession);

// User account level routes
router.get("/accounts", getUsers);
router.get("/accounts/:ensId/docs", getUserDocs);

// Backward-compatible aliases
router.post("/upload", upload);
router.get("/users", getUsers);
router.get("/users/:ensId/docs", getUserDocs);
router.get("/users/sessions", getSessions);
router.get("/users/sessions/:id", getSession);
router.get("/users/sessions/:id/doc", getDoc);
router.delete("/users/sessions/:id", deleteSession);

module.exports = router;