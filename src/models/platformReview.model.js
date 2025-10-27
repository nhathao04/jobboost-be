module.exports = (sequelize, DataTypes) => {
  const PlatformReview = sequelize.define(
    "PlatformReview",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: "ID của user (freelancer hoặc employer) đánh giá",
      },
      user_role: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isIn: [["FREELANCER", "EMPLOYER"]],
        },
        comment: "Vai trò của người đánh giá",
      },
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
        comment: "Nội dung đánh giá chi tiết",
      },
      aspects: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment:
          "Đánh giá chi tiết các khía cạnh: {user_interface, job_quality, support, payment, etc.}",
      },
      completed_jobs_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: "Số lượng job đã hoàn thành khi đánh giá (để tham khảo)",
      },
      total_earned: {
        type: DataTypes.DECIMAL(15, 2),
        defaultValue: 0,
        comment: "Tổng số tiền kiếm được/chi tiêu trên nền tảng (để tham khảo)",
      },
      is_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: "Đánh giá đã được xác thực (từ user có hoạt động thực tế)",
      },
      is_visible: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: "Hiển thị đánh giá này ra ngoài",
      },
      helpful_count: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: "Số lượng người thấy đánh giá này hữu ích",
      },
      admin_response: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: "Phản hồi từ admin (nếu có)",
      },
      status: {
        type: DataTypes.STRING,
        defaultValue: "active",
        validate: {
          isIn: [["active", "hidden", "reported", "removed"]],
        },
      },
    },
    {
      tableName: "platform_reviews",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          fields: ["user_id"],
        },
        {
          fields: ["user_role"],
        },
        {
          fields: ["rating"],
        },
        {
          fields: ["is_verified"],
        },
        {
          fields: ["status"],
        },
        {
          fields: ["created_at"],
        },
      ],
    }
  );

  return PlatformReview;
};
