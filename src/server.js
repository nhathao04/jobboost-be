const express = require("express");
const { sequelize, testConnection } = require("./config/sequelize");
const config = require("./config");
const app = require("./app");

// Import models to initialize them
require("./models");

const PORT = process.env.PORT || 5000;

// Initialize database connection and models
const initializeDatabase = async () => {
  try {
    // Test database connection
    await testConnection();

    // Skip syncing since we don't have CREATE TABLE permission
    // The tables should already exist in the remote database
    console.log("✅ Database connection established successfully");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    process.exit(1);
  }
};

// Start the server
const startServer = async () => {
  try {
    await initializeDatabase();

    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Server startup failed:", error);
    process.exit(1);
  }
};

startServer();
