const express = require("express");
const router = express.Router();

const repositoryRoutes = require("./repositoryRoutes");
const studentRoutes = require("./studentRoutes");
const commitRoutes = require("./commitRoutes");

router.use("/repositories", repositoryRoutes);
router.use("/students", studentRoutes);
router.use("/commits", commitRoutes);

// Alias /changes/pending to commitRoutes
router.get("/changes/pending", (req, res, next) => {
  const commitController = require("../controllers/commitController");
  return commitController.getPendingChanges(req, res, next);
});

module.exports = router;