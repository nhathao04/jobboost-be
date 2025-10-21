module.exports = (sequelize, DataTypes) => {
  const WalletTransaction = sequelize.define(
    "WalletTransaction",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      wallet_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: "ID của ví",
      },
      transaction_type: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isIn: [["DEPOSIT", "WITHDRAW", "JOB_POST", "REFUND", "BONUS"]],
        },
        comment:
          "Loại giao dịch: Nạp tiền, Rút tiền, Đăng tin, Hoàn tiền, Thưởng",
      },
      amount: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        comment: "Số tiền giao dịch",
      },
      currency: {
        type: DataTypes.STRING,
        defaultValue: "VND",
        validate: {
          isIn: [["USD", "VND", "EUR", "JPY"]],
        },
      },
      balance_before: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        comment: "Số dư trước giao dịch",
      },
      balance_after: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: false,
        comment: "Số dư sau giao dịch",
      },
      reference_id: {
        type: DataTypes.UUID,
        allowNull: true,
        comment: "ID tham chiếu (ví dụ: job_id nếu là đăng tin)",
      },
      reference_type: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: "Loại tham chiếu: JOB, PAYMENT, etc.",
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Mô tả giao dịch",
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: "completed",
        validate: {
          isIn: [["pending", "completed", "failed", "cancelled"]],
        },
      },
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: "Thông tin bổ sung về giao dịch",
      },
    },
    {
      tableName: "wallet_transactions",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          fields: ["wallet_id"],
        },
        {
          fields: ["transaction_type"],
        },
        {
          fields: ["reference_id"],
        },
        {
          fields: ["created_at"],
        },
      ],
    }
  );

  WalletTransaction.associate = (models) => {
    // Liên kết với Wallet
    WalletTransaction.belongsTo(models.Wallet, {
      foreignKey: "wallet_id",
      as: "wallet",
    });
  };

  return WalletTransaction;
};
