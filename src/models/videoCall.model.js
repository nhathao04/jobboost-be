module.exports = (sequelize, DataTypes) => {
  const VideoCall = sequelize.define(
    "VideoCall",
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      host_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      guest_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("pending", "active", "ended", "cancelled"),
        defaultValue: "pending",
      },
      room_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      tableName: "video_calls",
      underscored: true,
    }
  );

  VideoCall.associate = function (models) {
    // associations can be added here if needed
  };

  return VideoCall;
};
