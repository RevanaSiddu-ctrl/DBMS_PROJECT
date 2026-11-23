const express = require("express");
const router = express.Router();
const repositoryController = require("../controllers/repositoryController");

router.get("/", repositoryController.listRepositories);
router.post("/", repositoryController.createRepository);
router.get("/:id", repositoryController.getRepositoryById);

module.exports = router;