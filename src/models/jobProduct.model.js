module.exports = (sequelize, DataTypes) => {
  const JobProduct = sequelize.define(
    "JobProduct",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      job_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: "Reference to the job this product belongs to",
      },
      applicant_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: "Freelancer who uploaded this product (Supabase user ID)",
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [3, 255],
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      files: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
        comment: "Array of Firebase Storage public URLs",
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: "pending",
        allowNull: false,
        validate: {
          isIn: [["pending", "rejected", "approved"]],
        },
      },
      rejection_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Reason for rejection if status is rejected",
      },
      reviewed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      reviewed_by: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: "Employer who reviewed this product (Supabase user ID)",
      },
    },
    {
      tableName: "job_products",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
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
          fields: ["job_id", "status"],
        },
      ],
    }
  );

  JobProduct.associate = (models) => {
    JobProduct.belongsTo(models.Job, {
      foreignKey: "job_id",
      as: "job",
    });
  };

  return JobProduct;
};
