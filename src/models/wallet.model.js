module.exports = (sequelize, DataTypes) => {
  const Wallet = sequelize.define(
    "Wallet",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: "ID của user (employer) sở hữu ví",
      },
      balance: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        allowNull: false,
        validate: {
          min: 0,
        },
        comment: "Số dư hiện tại trong ví",
      },
      currency: {
        type: DataTypes.STRING,
        defaultValue: "VND",
        validate: {
          isIn: [["USD", "VND", "EUR", "JPY"]],
        },
      },
      wallet_code: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: true,
      },
      total_deposited: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        comment: "Tổng số tiền đã nạp vào",
      },
      total_spent: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        comment: "Tổng số tiền đã chi tiêu",
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: "Trạng thái ví có đang hoạt động không",
      },
    },
    {
      tableName: "wallets",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          fields: ["user_id"],
          unique: true,
        },
      ],
    }
  );

  Wallet.associate = (models) => {
    // Liên kết với Transaction
    Wallet.hasMany(models.WalletTransaction, {
      foreignKey: "wallet_id",
      as: "transactions",
    });
  };

  return Wallet;
};
