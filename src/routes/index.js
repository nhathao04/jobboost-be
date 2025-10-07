const express = require("express");
const router = express.Router();
const jobRoutes = require("./jobRoutes");
const applicationRoutes = require("./applicationRoutes");
// const categoryRoutes = require("./categoryRoutes");

// API Health Check
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is running",
    timestamp: new Date(),
  });
});

// Mount routes
router.use("/v1", jobRoutes);
router.use("/v1", applicationRoutes);
// router.use("/v1", categoryRoutes);

module.exports = router;
