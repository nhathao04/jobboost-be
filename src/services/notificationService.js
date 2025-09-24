const Notification = require('../models/Notification');

const notificationService = {
    createNotification: async (userId, title, message, type, relatedEntityType, relatedEntityId) => {
        try {
            const notification = await Notification.create({
                user_id: userId,
                title: title,
                message: message,
                type: type,
                related_entity_type: relatedEntityType,
                related_entity_id: relatedEntityId,
            });
            return notification;
        } catch (error) {
            throw new Error('Error creating notification: ' + error.message);
        }
    },

    getUserNotifications: async (userId) => {
        try {
            const notifications = await Notification.findAll({
                where: { user_id: userId },
                order: [['created_at', 'DESC']],
            });
            return notifications;
        } catch (error) {
            throw new Error('Error fetching notifications: ' + error.message);
        }
    },

    markAsRead: async (notificationId) => {
        try {
            const notification = await Notification.findByPk(notificationId);
            if (!notification) {
                throw new Error('Notification not found');
            }
            notification.is_read = true;
            await notification.save();
            return notification;
        } catch (error) {
            throw new Error('Error marking notification as read: ' + error.message);
        }
    },

    deleteNotification: async (notificationId) => {
        try {
            const notification = await Notification.destroy({
                where: { id: notificationId },
            });
            return notification;
        } catch (error) {
            throw new Error('Error deleting notification: ' + error.message);
        }
    },
};

module.exports = notificationService;