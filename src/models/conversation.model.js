module.exports = (sequelize, DataTypes) => {
  const Conversation = sequelize.define(
    "Conversation",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      client_id: {
        type: DataTypes.UUID,
        allowNull: false,
        onDelete: "CASCADE",
      },
      freelancer_id: {
        type: DataTypes.UUID,
        allowNull: false,
        onDelete: "CASCADE",
      },
      job_id: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: "jobs",
          key: "id",
        },
        onDelete: "SET NULL",
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      last_message_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      tableName: "conversations",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  Conversation.associate = (models) => {
    // User is managed by Supabase, not a Sequelize model
    // So we can't use belongsTo for User associations

    if (models.Job) {
      Conversation.belongsTo(models.Job, {
        foreignKey: "job_id",
        as: "job",
      });
    }

    if (models.Message) {
      Conversation.hasMany(models.Message, {
        foreignKey: "conversation_id",
        as: "messages",
      });
    }
  };

  return Conversation;
};
