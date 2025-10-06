const { sequelize } = require("../config/sequelize");
const { DataTypes } = require("sequelize");

// Import all models
const Job = require("./job.model")(sequelize, DataTypes);

// Define associations
const defineAssociations = () => {
  // khi nào có thêm model thì thêm associations ở đây
};

// Initialize associations
defineAssociations();

module.exports = {
  Job,
};
