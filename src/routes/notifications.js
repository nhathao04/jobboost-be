const express = require("express");
const router = express.Router();
const notificationController = require("../controllers/notificationController");
const { authenticate } = require("../middleware/auth");

// Route to get notifications for a user
router.get(
  "/:userId",
  authenticate,
  notificationController.getUserNotifications
);

// Route to create a new notification
router.post("/", authenticate, notificationController.createNotification);

// Route to mark a notification as read
router.patch("/:id/read", authenticate, notificationController.markAsRead);

// Route to delete a notification
router.delete("/:id", authenticate, notificationController.deleteNotification);

module.exports = router;
