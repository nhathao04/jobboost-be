const express = require("express");
const authRoutes = require("./auth");
const userRoutes = require("./users");
const jobRoutes = require("./jobs");
const applicationRoutes = require("./applications");
const assignmentRoutes = require("./assignments");
const reviewRoutes = require("./reviews");
const paymentRoutes = require("./payments");
const portfolioRoutes = require("./portfolio");
const notificationRoutes = require("./notifications");
const adminRoutes = require("./admin");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/jobs", jobRoutes);
router.use("/applications", applicationRoutes);
router.use("/assignments", assignmentRoutes);
router.use("/reviews", reviewRoutes);
router.use("/payments", paymentRoutes);
router.use("/portfolio", portfolioRoutes);
router.use("/notifications", notificationRoutes);
router.use("/admin", adminRoutes);

module.exports = router;
