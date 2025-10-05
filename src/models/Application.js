module.exports = (sequelize, DataTypes) => {
  const Application = sequelize.define(
    "Application",
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
        onDelete: "CASCADE",
      },
      student_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "student_profiles",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      cover_letter: {
        type: DataTypes.TEXT,
      },
      proposed_rate: {
        type: DataTypes.DECIMAL(10, 2),
      },
      proposed_timeline: {
        type: DataTypes.INTEGER, // in days
      },
      portfolio_links: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: "pending",
        validate: {
          isIn: [["pending", "accepted", "rejected", "withdrawn"]],
        },
      },
      applied_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
      reviewed_at: {
        type: DataTypes.DATE,
      },
      rejection_reason: {
        type: DataTypes.TEXT,
      },
      employer_notes: {
        type: DataTypes.TEXT,
      },
    },
    {
      tableName: "applications",
      timestamps: false, // using custom applied_at field
      indexes: [
        {
          fields: ["job_id"],
        },
        {
          fields: ["student_id"],
        },
        {
          fields: ["status"],
        },
        {
          unique: true,
          fields: ["job_id", "student_id"],
        },
      ],
    }
  );

  return Application;
};
