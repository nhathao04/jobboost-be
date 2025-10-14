const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const { authenticate } = require("../middleware/auth");
const { validate } = require("../middleware/validation");
const { body, param } = require("express-validator");

router.get(
  "/conversations/unread-count",
  authenticate,
  chatController.getUnreadCount
);
router.get("/conversations", authenticate, chatController.getConversations);

router.get(
  "/conversations/:conversationId/messages",
  param("conversationId").isUUID(),
  authenticate,
  chatController.getMessages
);

router.post(
  "/conversations",
  body("freelancerId").isUUID(),
  body("jobId").optional().isUUID(),
  authenticate,
  chatController.createConversation
);

router.post(
  "/conversations/:conversationId/messages",
  param("conversationId").isUUID(),
  body("content").notEmpty(),
  body("messageType").optional().isIn(["text", "image", "file", "system"]),
  body("fileUrl").optional().isURL(),
  authenticate,
  chatController.createMessage
);

router.patch(
  "/conversations/:conversationId/read",
  param("conversationId").isUUID(),
  authenticate,
  chatController.markMessagesAsRead
);

module.exports = router;
