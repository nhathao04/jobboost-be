module.exports = (sequelize, DataTypes) => {
  const CV = sequelize.define(
    "CV",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          len: [1, 255],
          notEmpty: true
        }
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      file_name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      file_path: {
        type: DataTypes.STRING,
        allowNull: false
      },
      file_size: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      mime_type: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isIn: [['application/pdf']] // Only allow PDF files
        }
      },
      is_primary: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        allowNull: false
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: 'active',
        allowNull: false,
        validate: {
          isIn: [['active', 'archived', 'deleted']]
        }
      },
      uploaded_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      }
    },
    {
      tableName: "cvs",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          fields: ["user_id"]
        },
        {
          fields: ["user_id", "is_primary"]
        },
        {
          fields: ["status"]
        }
      ]
    }
  );

  CV.associate = (models) => {
    // Define associations here if User model exists
    // CV.belongsTo(models.User, {
    //   foreignKey: 'user_id',
    //   as: 'user'
    // });
  };

  return CV;
};