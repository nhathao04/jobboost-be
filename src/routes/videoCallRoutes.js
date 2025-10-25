const express = require("express");
const router = express.Router();
const videoCallController = require("../controllers/videoCallController");
const { authenticate } = require("../middleware/auth");
const { param, body } = require("express-validator");

router.post("/video/calls", authenticate, videoCallController.createCall);
router.post(
  "/video/calls/:callId/join",
  param("callId").isUUID(),
  authenticate,
  videoCallController.joinCall
);
router.post(
  "/video/calls/:callId/end",
  param("callId").isUUID(),
  authenticate,
  videoCallController.endCall
);
router.get(
  "/video/calls/:callId",
  param("callId").isUUID(),
  authenticate,
  videoCallController.getCall
);

module.exports = router;
