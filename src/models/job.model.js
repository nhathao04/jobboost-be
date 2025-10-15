module.exports = (sequelize, DataTypes) => {
  const Job = sequelize.define(
    "Job",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      owner_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      image_url: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      job_type: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isIn: [["FULL_TIME", "PROJECT", "FREELANCE", "PART_TIME"]],
        },
      },
      budget_type: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isIn: [["FIXED", "HOURLY"]],
        },
      },
      budget_min: {
        type: DataTypes.DECIMAL(15, 2),
      },
      budget_max: {
        type: DataTypes.DECIMAL(15, 2),
      },
      currency: {
        type: DataTypes.STRING,
        defaultValue: "VND",
        validate: {
          isIn: [["USD", "VND", "EUR", "JPY"]],
        },
      },
      experience_level: {
        type: DataTypes.STRING,
        defaultValue: "INTERN",
        validate: {
          isIn: [["INTERN", "JUNIOR", "MIDDLE", "SENIOR"]],
        },
      },
      deadline: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: "pending",
        validate: {
          isIn: [
            ["active", "paused", "completed", "deleted", "rejected", "pending"],
          ],
        },
        comment:
          "pending: waiting for admin approval; active: approved and visible",
      },
      applications_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      skills_required: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
      },
      rejection_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "jobs",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  // Define associations in the model index file
  Job.associate = (models) => {
    // Liên kết với Category đã bị vô hiệu hóa vì cột category_id không tồn tại
    // Job.belongsTo(models.Category, {
    //   foreignKey: "category_id",
    //   as: "category",
    // });
    Job.hasMany(models.Application, {
      foreignKey: "job_id",
      as: "applications",
    });
    // Note: User is managed by Supabase, not a Sequelize model
  };

  return Job;
};
