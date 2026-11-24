const express = require("express");
const router = express.Router();
const commitController = require("../controllers/commitController");

router.get("/pending", commitController.getPendingChanges);
router.post("/", commitController.createCommit);
router.get("/", commitController.getCommitHistory);
router.get("/diff", commitController.compareCommits);
router.get("/:id", commitController.getCommitById);
router.post("/:id/rollback", commitController.rollbackToCommit);

module.exports = router;