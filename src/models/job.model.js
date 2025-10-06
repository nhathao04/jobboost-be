module.exports = (sequelize, DataTypes) => {
  const Job = sequelize.define(
    'Job',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      owner: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      job_type: {
        type: DataTypes.ENUM('project', 'freelance', 'part_time'),
        allowNull: false,
      },
      budget_type: {
        type: DataTypes.ENUM('fixed', 'hourly'),
        allowNull: false,
      },
      budget_min: {
        type: DataTypes.DECIMAL(15, 2),
      },
      budget_max: {
        type: DataTypes.DECIMAL(15, 2),
      },
      currency: {
        type: DataTypes.ENUM('USD', 'VND', 'EUR', 'JPY'),
        defaultValue: 'VND',
      },
      experience_level: {
        type: DataTypes.ENUM('intern', 'junior', 'middle', 'senior'),
        defaultValue: 'intern',
      },
      status: {
        type: DataTypes.ENUM('draft', 'active', 'paused', 'completed', 'cancelled', 'rejected', 'pending'),
        defaultValue: 'pending',
      },
      applications_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      views_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      tableName: 'jobs',
      timestamps: true,
    }
  );

  return Job;
};
