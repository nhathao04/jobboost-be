const { sequelize } = require("../config/database");
const { DataTypes } = require("sequelize");

// Import all models
const User = require("./User")(sequelize, DataTypes);
const StudentProfile = require("./StudentProfile")(sequelize, DataTypes);
const EmployerProfile = require("./EmployerProfile")(sequelize, DataTypes);
const Category = require("./Category")(sequelize, DataTypes);
const Skill = require("./Skill")(sequelize, DataTypes);
const Job = require("./Job")(sequelize, DataTypes);
const Application = require("./Application")(sequelize, DataTypes);
const Assignment = require("./Assignment")(sequelize, DataTypes);
const Review = require("./Review")(sequelize, DataTypes);
const Transaction = require("./Transaction")(sequelize, DataTypes);
const PortfolioItem = require("./PortfolioItem")(sequelize, DataTypes);
const Notification = require("./Notification")(sequelize, DataTypes);

// Define associations
const defineAssociations = () => {
  // User associations
  User.hasOne(StudentProfile, { foreignKey: "user_id", as: "studentProfile" });
  User.hasOne(EmployerProfile, {
    foreignKey: "user_id",
    as: "employerProfile",
  });
  User.hasMany(Notification, { foreignKey: "user_id", as: "notifications" });
  User.hasMany(Review, { foreignKey: "reviewer_id", as: "reviewsGiven" });
  User.hasMany(Review, { foreignKey: "reviewee_id", as: "reviewsReceived" });

  // StudentProfile associations
  StudentProfile.belongsTo(User, { foreignKey: "user_id", as: "user" });
  StudentProfile.hasMany(Application, {
    foreignKey: "student_id",
    as: "applications",
  });
  StudentProfile.hasMany(Assignment, {
    foreignKey: "student_id",
    as: "assignments",
  });
  StudentProfile.hasMany(PortfolioItem, {
    foreignKey: "student_id",
    as: "portfolioItems",
  });
  StudentProfile.belongsToMany(Skill, {
    through: "student_skills",
    foreignKey: "student_id",
    otherKey: "skill_id",
    as: "skills",
  });

  // EmployerProfile associations
  EmployerProfile.belongsTo(User, { foreignKey: "user_id", as: "user" });
  EmployerProfile.hasMany(Job, { foreignKey: "employer_id", as: "jobs" });

  // Category associations
  Category.hasMany(Skill, { foreignKey: "category_id", as: "skills" });
  Category.hasMany(Job, { foreignKey: "category_id", as: "jobs" });

  // Skill associations
  Skill.belongsTo(Category, { foreignKey: "category_id", as: "category" });
  Skill.belongsToMany(StudentProfile, {
    through: "student_skills",
    foreignKey: "skill_id",
    otherKey: "student_id",
    as: "students",
  });
  Skill.belongsToMany(Job, {
    through: "job_skills",
    foreignKey: "skill_id",
    otherKey: "job_id",
    as: "jobs",
  });

  // Job associations
  Job.belongsTo(EmployerProfile, { foreignKey: "employer_id", as: "employer" });
  Job.belongsTo(Category, { foreignKey: "category_id", as: "category" });
  Job.hasMany(Application, { foreignKey: "job_id", as: "applications" });
  Job.hasOne(Assignment, { foreignKey: "job_id", as: "assignment" });
  Job.belongsToMany(Skill, {
    through: "job_skills",
    foreignKey: "job_id",
    otherKey: "skill_id",
    as: "requiredSkills",
  });

  // Application associations
  Application.belongsTo(Job, { foreignKey: "job_id", as: "job" });
  Application.belongsTo(StudentProfile, {
    foreignKey: "student_id",
    as: "student",
  });
  Application.hasOne(Assignment, {
    foreignKey: "application_id",
    as: "assignment",
  });

  // Assignment associations
  Assignment.belongsTo(Job, { foreignKey: "job_id", as: "job" });
  Assignment.belongsTo(StudentProfile, {
    foreignKey: "student_id",
    as: "student",
  });
  Assignment.belongsTo(Application, {
    foreignKey: "application_id",
    as: "application",
  });
  Assignment.hasMany(Review, { foreignKey: "assignment_id", as: "reviews" });
  Assignment.hasMany(Transaction, {
    foreignKey: "assignment_id",
    as: "transactions",
  });
  Assignment.hasMany(PortfolioItem, {
    foreignKey: "assignment_id",
    as: "portfolioItems",
  });

  // Review associations
  Review.belongsTo(Assignment, {
    foreignKey: "assignment_id",
    as: "assignment",
  });
  Review.belongsTo(User, { foreignKey: "reviewer_id", as: "reviewer" });
  Review.belongsTo(User, { foreignKey: "reviewee_id", as: "reviewee" });

  // Transaction associations
  Transaction.belongsTo(Assignment, {
    foreignKey: "assignment_id",
    as: "assignment",
  });
  Transaction.belongsTo(User, { foreignKey: "payer_id", as: "payer" });
  Transaction.belongsTo(User, { foreignKey: "payee_id", as: "payee" });

  // PortfolioItem associations
  PortfolioItem.belongsTo(StudentProfile, {
    foreignKey: "student_id",
    as: "student",
  });
  PortfolioItem.belongsTo(Assignment, {
    foreignKey: "assignment_id",
    as: "assignment",
  });

  // Notification associations
  Notification.belongsTo(User, { foreignKey: "user_id", as: "user" });
};

// Initialize associations
defineAssociations();

module.exports = {
  sequelize,
  User,
  StudentProfile,
  EmployerProfile,
  Category,
  Skill,
  Job,
  Application,
  Assignment,
  Review,
  Transaction,
  PortfolioItem,
  Notification,
};
