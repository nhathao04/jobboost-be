const express = require("express");
const router = express.Router();
const jobRoutes = require("./jobRoutes");
const applicationRoutes = require("./applicationRoutes");
const cvRoutes = require("./cv");
const employerRoutes = require("./employerRoutes");
const chatRoutes = require("./chatRoutes");
const walletRoutes = require("./walletRoutes");
const videoCallRoutes = require("./videoCallRoutes");
const { authenticate } = require("../middleware/auth");
// const categoryRoutes = require("./categoryRoutes");

// API Health Check
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running",
    timestamp: new Date(),
  });
});

router.get("/auth-check", authenticate, (req, res) => {
  res.status(200).json({
    success: true,
    message: "Auth middleware is working " + req.userId,
    timestamp: new Date(),
  });
});

// Mount routes
router.use("/", jobRoutes);
router.use("/", applicationRoutes);
router.use("/", cvRoutes);
router.use("/", employerRoutes);
router.use("/", chatRoutes);
router.use("/", walletRoutes);
router.use("/", videoCallRoutes);
// router.use("/v1", categoryRoutes);
module.exports = router;
