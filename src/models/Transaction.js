module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define(
    "Transaction",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      assignment_id: {
        type: DataTypes.UUID,
        references: {
          model: "assignments",
          key: "id",
        },
        onDelete: "SET NULL",
      },
      payer_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "RESTRICT",
      },
      payee_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
        onDelete: "RESTRICT",
      },
      transaction_type: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isIn: [
            ["job_payment", "premium_subscription", "platform_fee", "refund"],
          ],
        },
      },
      gross_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      platform_fee_rate: {
        type: DataTypes.DECIMAL(5, 4),
        defaultValue: 0.03, // 3% default
      },
      platform_fee: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      net_amount: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      payment_method: {
        type: DataTypes.STRING(50),
      },
      payment_gateway_transaction_id: {
        type: DataTypes.STRING(100),
      },
      status: {
        type: DataTypes.ENUM(
          "pending",
          "processing",
          "completed",
          "failed",
          "refunded"
        ),
        defaultValue: "pending",
      },
      notes: {
        type: DataTypes.TEXT,
      },
    },
    {
      tableName: "transactions",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          fields: ["payer_id"],
        },
        {
          fields: ["payee_id"],
        },
        {
          fields: ["transaction_type"],
        },
        {
          fields: ["created_at"],
        },
      ],
    }
  );

  return Transaction;
};
