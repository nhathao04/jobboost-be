module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      google_id: {
        type: DataTypes.STRING(100),
        unique: true,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
        validate: {
          isEmail: true,
        },
      },
      full_name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      avatar_url: {
        type: DataTypes.TEXT,
      },
      phone: {
        type: DataTypes.STRING(20),
      },
      user_type: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isIn: [["student", "employer", "admin"]],
        },
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      is_premium: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      premium_expires_at: {
        type: DataTypes.DATE,
      },
    },
    {
      tableName: "users",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          fields: ["email"],
        },
        {
          fields: ["google_id"],
        },
        {
          fields: ["user_type"],
        },
      ],
    }
  );

  return User;
};
