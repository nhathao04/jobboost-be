const express = require("express");
const router = express.Router();
const cvController = require("../controllers/cvController");
const upload = require("../middleware/upload");
const { authenticate } = require("../middleware/auth");
// const { authenticate } = require("../middleware/auth"); // Uncomment when auth is implemented

router.post("/cvs", authenticate, upload.single("cv"), cvController.uploadCV);
router.get("/cvs", authenticate, cvController.getUserCVs);
router.get("/cvs/:id", authenticate, cvController.getCVById);
router.put("/cvs/:id", authenticate, cvController.updateCV);
router.delete("/cvs/:id", authenticate, cvController.deleteCV);
router.get("/cvs/:id/download", authenticate, cvController.downloadCV);
router.patch("/cvs/:id/set-primary", authenticate, cvController.setPrimaryCV);

module.exports = router;