module.exports = (sequelize, DataTypes) => {
  const PortfolioItem = sequelize.define(
    "PortfolioItem",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      student_id: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: "student_profiles",
          key: "id",
        },
        onDelete: "CASCADE",
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
      },
      image_urls: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
      },
      project_url: {
        type: DataTypes.TEXT,
      },
      technologies_used: {
        type: DataTypes.ARRAY(DataTypes.TEXT),
      },
      assignment_id: {
        type: DataTypes.UUID,
        references: {
          model: "assignments",
          key: "id",
        },
        onDelete: "SET NULL",
      },
      is_featured: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      display_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      tableName: "portfolio_items",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  return PortfolioItem;
};
