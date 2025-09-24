module.exports = (sequelize, DataTypes) => {
  const Job = sequelize.define(
    "Job",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      employer_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "employer_profiles",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      category_id: {
        type: DataTypes.UUID,
        references: {
          model: "categories",
          key: "id",
        },
        onDelete: "SET NULL",
      },
      job_type: {
        type: DataTypes.ENUM("project", "freelance", "part_time"),
        allowNull: false,
      },
      budget_type: {
        type: DataTypes.ENUM("fixed", "hourly"),
        allowNull: false,
      },
      budget_min: {
        type: DataTypes.DECIMAL(10, 2),
      },
      budget_max: {
        type: DataTypes.DECIMAL(10, 2),
      },
      estimated_hours: {
        type: DataTypes.INTEGER,
      },
      deadline: {
        type: DataTypes.DATEONLY,
      },
      location: {
        type: DataTypes.STRING,
      },
      is_remote: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      experience_level: {
        type: DataTypes.ENUM("beginner", "intermediate", "advanced"),
        defaultValue: "beginner",
      },
      status: {
        type: DataTypes.ENUM(
          "draft",
          "active",
          "paused",
          "completed",
          "cancelled"
        ),
        defaultValue: "active",
      },
      applications_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      views_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      featured_until: {
        type: DataTypes.DATE,
      },
    },
    {
      tableName: "jobs",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          fields: ["employer_id"],
        },
        {
          fields: ["category_id"],
        },
        {
          fields: ["status"],
        },
        {
          fields: ["created_at"],
        },
        {
          fields: ["budget_min", "budget_max"],
        },
      ],
    }
  );

  return Job;
};
