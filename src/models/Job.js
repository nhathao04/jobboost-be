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
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isIn: [["project", "freelance", "part_time"]],
        },
      },
      budget_type: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isIn: [["fixed", "hourly"]],
        },
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
        type: DataTypes.STRING,
        defaultValue: "beginner",
        validate: {
          isIn: [["beginner", "intermediate", "advanced"]],
        },
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: "active",
        validate: {
          isIn: [["draft", "active", "paused", "completed", "cancelled"]],
        },
      },
      approval_status: {
        type: DataTypes.STRING,
        defaultValue: "pending",
        validate: {
          isIn: [["pending", "approved", "rejected"]],
        },
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
        {
          fields: ["location"],
        },
        {
          fields: ["approval_status"],
        },
      ],
    }
  );

  return Job;
};
