const express = require("express");
const { sequelize, testConnection } = require("./config/database");
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

    // Sync database models (create tables if they don't exist)
    await sequelize.sync({ force: false }); // set force: true to drop and recreate tables
    console.log("✅ Database models synchronized successfully");
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
