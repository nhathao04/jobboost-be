const express = require("express");
const router = express.Router();
const cvController = require("../controllers/cvController");
const {
  uploadCV,
  uploadToFirebase,
} = require("../middleware/uploadCVFirebase");
const { authenticate } = require("../middleware/auth");

router.post(
  "/cvs",
  authenticate,
  uploadCV.single("cv"),
  uploadToFirebase,
  cvController.uploadCV
);
router.get("/cvs", authenticate, cvController.getUserCVs);
router.get("/cvs/:id", authenticate, cvController.getCVById);
router.put("/cvs/:id", authenticate, cvController.updateCV);
router.delete("/cvs/:id", authenticate, cvController.deleteCV);
router.get("/cvs/:id/download", authenticate, cvController.downloadCV);
router.patch("/cvs/:id/set-primary", authenticate, cvController.setPrimaryCV);

module.exports = router;
