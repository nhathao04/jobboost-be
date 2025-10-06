const { Sequelize } = require("sequelize");
const { env } = require("./env");

// Sequelize configuration
const sequelize = new Sequelize(
  env.DATABASE.NAME,
  env.DATABASE.USER,
  env.DATABASE.PASSWORD,
  {
    host: env.DATABASE.HOST,
    port: env.DATABASE.PORT,
    dialect: "postgres",
    logging: false,
    dialectOptions: {
      ssl: env.DATABASE.SSL
        ? {
            require: true,
            rejectUnauthorized: false,
          }
        : false,
    },
    pool: {
      max: env.DATABASE.POOL.MAX,
      idle: env.DATABASE.POOL.IDLE_TIMEOUT,
      acquire: env.DATABASE.POOL.CONNECTION_TIMEOUT,
    },
    // Avoid using PostgreSQL native enums which require schema privileges
    define: {
      timestamps: true,
      underscored: true,
      freezeTableName: false,
      charset: "utf8mb4",
      dialectOptions: {
        collate: "utf8mb4_unicode_ci",
      },
    },
  }
);

// Test the connection
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: env.DB_SYNC === 'true' });
    console.log("Connection to database has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
    throw error;
  }
};

module.exports = {
  sequelize,
  testConnection,
};
