module.exports = (sequelize, DataTypes) => {
  const PlatformRevenue = sequelize.define(
    "PlatformRevenue",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      transaction_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: "ID của wallet transaction tham chiếu",
      },
      job_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: "ID của job",
      },
      total_amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        comment: "Tổng số tiền của job (post_cost)",
      },
      fee_percentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 3.0,
        comment: "Phần trăm phí nền tảng (%)",
      },
      fee_amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        comment: "Số tiền phí thu được (total_amount * fee_percentage / 100)",
      },
      freelancer_amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        comment: "Số tiền freelancer nhận được (total_amount - fee_amount)",
      },
      freelancer_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: "ID của freelancer nhận tiền",
      },
      employer_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: "ID của employer đã post job",
      },
      revenue_type: {
        type: DataTypes.STRING,
        defaultValue: "JOB_COMPLETION",
        comment: "Loại doanh thu: JOB_COMPLETION, SUBSCRIPTION, etc.",
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {},
        comment: "Thông tin bổ sung",
      },
    },
    {
      tableName: "platform_revenues",
      timestamps: true,
      underscored: true,
      indexes: [
        {
          fields: ["created_at"],
          name: "idx_platform_revenues_created_at",
        },
        {
          fields: ["job_id"],
          name: "idx_platform_revenues_job_id",
        },
        {
          fields: ["freelancer_id"],
          name: "idx_platform_revenues_freelancer_id",
        },
        {
          fields: ["employer_id"],
          name: "idx_platform_revenues_employer_id",
        },
        {
          fields: ["revenue_type"],
          name: "idx_platform_revenues_revenue_type",
        },
      ],
    }
  );

  PlatformRevenue.associate = (models) => {
    // Association với WalletTransaction
    PlatformRevenue.belongsTo(models.WalletTransaction, {
      foreignKey: "transaction_id",
      as: "transaction",
    });

    // Association với Job
    PlatformRevenue.belongsTo(models.Job, {
      foreignKey: "job_id",
      as: "job",
    });
  };

  return PlatformRevenue;
};
