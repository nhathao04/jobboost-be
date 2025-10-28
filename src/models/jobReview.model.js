module.exports = (sequelize, DataTypes) => {
  const JobReview = sequelize.define(
    "JobReview",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      // Job/Project
      job_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: "ID của job/project",
      },
      // People involved
      employer_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: "ID của employer (job owner)",
      },
      freelancer_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: "ID của freelancer (người làm job)",
      },
      reviewer_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: "ID của người đánh giá (employer hoặc freelancer)",
      },
      reviewer_role: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isIn: [["EMPLOYER", "FREELANCER"]],
        },
        comment:
          "EMPLOYER: employer đánh giá freelancer, FREELANCER: freelancer đánh giá employer",
      },
      // Review content
      rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          min: 1,
          max: 5,
        },
        comment: "Đánh giá từ 1-5 sao",
      },
      comment: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Nội dung đánh giá",
      },
    },
    {
      tableName: "job_reviews",
      timestamps: true,
      underscored: true,
      indexes: [
        {
          unique: true,
          fields: ["job_id", "reviewer_id"],
          name: "unique_review_per_job_reviewer",
        },
        {
          fields: ["job_id"],
          name: "idx_job_reviews_job_id",
        },
        {
          fields: ["employer_id"],
          name: "idx_job_reviews_employer_id",
        },
        {
          fields: ["freelancer_id"],
          name: "idx_job_reviews_freelancer_id",
        },
        {
          fields: ["reviewer_id"],
          name: "idx_job_reviews_reviewer_id",
        },
        {
          fields: ["rating"],
          name: "idx_job_reviews_rating",
        },
        {
          fields: ["created_at"],
          name: "idx_job_reviews_created_at",
        },
      ],
    }
  );

  JobReview.associate = (models) => {
    // Association với Job
    JobReview.belongsTo(models.Job, {
      foreignKey: "job_id",
      as: "job",
    });

    // Note: employer_id, freelancer_id, reviewer_id là UUID từ Supabase
    // Không tạo foreign key constraint vì users được quản lý bởi Supabase
  };

  return JobReview;
};
