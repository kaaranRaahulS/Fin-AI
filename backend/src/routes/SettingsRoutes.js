const express = require("express");
const router = express.Router();
const settingsController = require("../controllers/SettingsController");



router.post("/delete-data", settingsController.deleteData);
router.post("/delete-account", settingsController.deleteAccount);


module.exports = router;
