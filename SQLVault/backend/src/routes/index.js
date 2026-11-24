const express = require("express");
const router = express.Router();

const repositoryRoutes = require("./repositoryRoutes");
const studentRoutes = require("./studentRoutes");
const commitRoutes = require("./commitRoutes");
const queryRoutes = require("./queryRoutes");

router.use("/repositories", repositoryRoutes);
router.use("/students", studentRoutes);
router.use("/commits", commitRoutes);
router.use("/query", queryRoutes);

// Alias /changes/pending to commitRoutes
router.get("/changes/pending", (req, res, next) => {
  const commitController = require("../controllers/commitController");
  return commitController.getPendingChanges(req, res, next);
});

module.exports = router;