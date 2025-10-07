module.exports = (sequelize, DataTypes) => {
  const FreelancerProfile = sequelize.define(
    "FreelancerProfile",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      bio: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      skills: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
      },
      experience_level: {
        type: DataTypes.STRING,
        defaultValue: "intern",
      },
      hourly_rate: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
      },
      portfolio_links: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        defaultValue: [],
      },
      resume_url: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      is_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "freelancer_profiles",
      timestamps: true,
    }
  );

  return FreelancerProfile;
};
