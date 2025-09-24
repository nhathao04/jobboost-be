module.exports = (sequelize, DataTypes) => {
  const StudentProfile = sequelize.define(
    "StudentProfile",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      university: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      major: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      year_of_study: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      student_id: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      bio: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      portfolio_url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      linkedin_url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      github_url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      hourly_rate: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      availability_status: {
        type: DataTypes.ENUM("available", "busy", "unavailable"),
        defaultValue: "available",
      },
      total_jobs_completed: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      total_earnings: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0,
      },
      average_rating: {
        type: DataTypes.DECIMAL(3, 2),
        defaultValue: 0,
      },
    },
    {
      tableName: "student_profiles",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return StudentProfile;
};
