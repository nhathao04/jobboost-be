module.exports = (sequelize, DataTypes) => {
  const Message = sequelize.define(
    "Message",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      conversation_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "conversations",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      sender_id: {
        type: DataTypes.UUID,
        allowNull: false,
        onDelete: "CASCADE",
      },
      message_type: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "text",
        validate: {
          isIn: [["text", "image", "file", "system"]],
        },
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      file_url: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      is_read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      read_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "messages",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  Message.associate = (models) => {
    if (models.Conversation) {
      Message.belongsTo(models.Conversation, {
        foreignKey: "conversation_id",
        as: "conversation",
      });
    }

    // User is managed by Supabase, not a Sequelize model
    // So we can't use belongsTo for User associations
  };

  return Message;
};
