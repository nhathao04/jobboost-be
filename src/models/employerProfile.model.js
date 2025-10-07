module.exports = (sequelize, DataTypes) => {
  const EmployerProfile = sequelize.define(
    "EmployerProfile",
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
      company_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      company_website: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      company_logo: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      company_description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      industry: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      company_size: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
          isIn: [["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"]],
        },
      },
      is_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "employer_profiles",
      timestamps: true,
    }
  );

  return EmployerProfile;
};
