module.exports = (sequelize, DataTypes) => {
  const Assignment = sequelize.define(
    "Assignment",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      job_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "jobs",
          key: "id",
        },
        onDelete: "RESTRICT",
      },
      student_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "student_profiles",
          key: "id",
        },
        onDelete: "RESTRICT",
      },
      application_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "applications",
          key: "id",
        },
        onDelete: "RESTRICT",
      },
      agreed_rate: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      agreed_timeline: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      start_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      expected_end_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      actual_end_date: {
        type: DataTypes.DATEONLY,
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: "active",
        validate: {
          isIn: [["active", "completed", "cancelled", "disputed"]],
        },
      },
      completion_notes: {
        type: DataTypes.TEXT,
      },
    },
    {
      tableName: "assignments",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          fields: ["student_id"],
        },
        {
          fields: ["job_id"],
        },
        {
          fields: ["status"],
        },
      ],
    }
  );

  return Assignment;
};
