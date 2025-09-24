const { Notification, User } = require('../models');
const { handleError } = require('../utils/helpers');

// Create a new notification
exports.createNotification = async (req, res) => {
    try {
        const { user_id, title, message, type, related_entity_type, related_entity_id } = req.body;

        const notification = await Notification.create({
            user_id,
            title,
            message,
            type,
            related_entity_type,
            related_entity_id,
            is_read: false
        });

        res.status(201).json({ success: true, data: notification });
    } catch (error) {
        handleError(res, error);
    }
};

// Get notifications for a user
exports.getUserNotifications = async (req, res) => {
    try {
        const { userId } = req.params;
        const { limit = 50, offset = 0, is_read } = req.query;

        const whereClause = { user_id: userId };
        if (is_read !== undefined) {
            whereClause.is_read = is_read === 'true';
        }

        const notifications = await Notification.findAndCountAll({
            where: whereClause,
            include: [
                { model: User, attributes: ['id', 'full_name', 'avatar_url'] }
            ],
            order: [['created_at', 'DESC']],
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.status(200).json({ 
            success: true, 
            data: notifications.rows,
            total: notifications.count,
            pagination: {
                limit: parseInt(limit),
                offset: parseInt(offset),
                total: notifications.count
            }
        });
    } catch (error) {
        handleError(res, error);
    }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;

        const notification = await Notification.findByPk(notificationId);
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        await notification.update({ is_read: true });

        res.status(200).json({ 
            success: true, 
            message: 'Notification marked as read',
            data: notification
        });
    } catch (error) {
        handleError(res, error);
    }
};

// Mark all notifications as read for a user
exports.markAllAsRead = async (req, res) => {
    try {
        const { userId } = req.params;

        await Notification.update(
            { is_read: true },
            { where: { user_id: userId, is_read: false } }
        );

        res.status(200).json({ 
            success: true, 
            message: 'All notifications marked as read'
        });
    } catch (error) {
        handleError(res, error);
    }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;

        const notification = await Notification.findByPk(notificationId);
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        await notification.destroy();

        res.status(200).json({ 
            success: true, 
            message: 'Notification deleted successfully'
        });
    } catch (error) {
        handleError(res, error);
    }
};

// Get unread notification count
exports.getUnreadCount = async (req, res) => {
    try {
        const { userId } = req.params;

        const count = await Notification.count({
            where: { user_id: userId, is_read: false }
        });

        res.status(200).json({ 
            success: true, 
            data: { unread_count: count }
        });
    } catch (error) {
        handleError(res, error);
    }
};
// Mark a notification as read
exports.markAsRead = async (req, res) => {
    try {
        const { notificationId } = req.params;

        const notification = await Notification.findByPk(notificationId);
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        notification.is_read = true;
        await notification.save();

        return res.status(200).json({ success: true, notification });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// Delete a notification
exports.deleteNotification = async (req, res) => {
    try {
        const { notificationId } = req.params;

        const notification = await Notification.findByPk(notificationId);
        if (!notification) {
            return res.status(404).json({ success: false, message: 'Notification not found' });
        }

        await notification.destroy();

        return res.status(204).json({ success: true, message: 'Notification deleted' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};