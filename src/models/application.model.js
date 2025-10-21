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
      },
      applicant_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      cover_letter: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      proposed_rate: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
      },
      proposed_timeline: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      portfolio_links: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: "pending",
        validate: {
          isIn: [["pending", "accepted", "rejected", "withdrawn", "completed"]],
        },
        comment: "completed: job đã hoàn thành và thanh toán",
      },
      employer_notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      rejection_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "applications",
      timestamps: true,
      indexes: [
        {
          fields: ["job_id"],
        },
        {
          fields: ["applicant_id"],
        },
        {
          fields: ["status"],
        },
        {
          unique: true,
          fields: ["job_id", "applicant_id"],
          name: "applications_job_applicant_unique",
        },
      ],
    }
  );

  // Define associations in the model index file
  Application.associate = (models) => {
    Application.belongsTo(models.Job, { foreignKey: "job_id", as: "job" });
    Application.belongsTo(models.FreelancerProfile, {
      targetKey: "user_id",
      as: "freelancer",
    });
  };

  return Application;
};
