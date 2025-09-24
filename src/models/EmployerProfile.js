module.exports = (sequelize, DataTypes) => {
  const EmployerProfile = sequelize.define(
    "EmployerProfile",
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
      company_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      company_size: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      industry: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      website_url: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      verification_status: {
        type: DataTypes.ENUM("pending", "verified", "rejected"),
        defaultValue: "pending",
      },
      total_jobs_posted: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      total_spent: {
        type: DataTypes.DECIMAL(12, 2),
        defaultValue: 0,
      },
      average_rating: {
        type: DataTypes.DECIMAL(3, 2),
        defaultValue: 0,
      },
    },
    {
      tableName: "employer_profiles",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return EmployerProfile;
};
