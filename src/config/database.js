const { Sequelize } = require("sequelize");
require("dotenv").config();

// Sequelize instance
const sequelize = new Sequelize({
  database: process.env.DB_NAME || "jobboost_db",
  username: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "password",
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 5432,
  dialect: "postgres",
  logging: false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
  },
});

// Test connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ PostgreSQL database connected successfully with Sequelize");
  } catch (error) {
    console.error("❌ Unable to connect to the database:", error);
  }
};

module.exports = {
  sequelize,
  testConnection,
};
