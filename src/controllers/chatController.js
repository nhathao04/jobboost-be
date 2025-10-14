const { Conversation, Message, Job } = require("../models");
const { Op } = require("sequelize");

/**
 * @swagger
 * tags:
 *   name: Chat
 *   description: Chat management endpoints
 */

/**
 * Get all conversations for a user
 */
const getConversations = async (req, res) => {
  try {
    const userId = req.userId;

    const conversations = await Conversation.findAll({
      where: {
        [Op.or]: [{ client_id: userId }, { freelancer_id: userId }],
        is_active: true,
      },
      include: [
        {
          model: Job,
          as: "job",
          attributes: ["id", "title"],
        },
        {
          model: Message,
          as: "messages",
          limit: 1,
          order: [["created_at", "DESC"]],
        },
      ],
      order: [["last_message_at", "DESC"]],
    });

    // Format the response data
    const formattedConversations = conversations.map((conversation) => {
      const isClient = conversation.client_id === userId;
      const otherUserId = isClient
        ? conversation.freelancer_id
        : conversation.client_id;

      return {
        id: conversation.id,
        otherUser: {
          id: otherUserId,
          // Note: User data should be fetched separately from Supabase
          // or through a separate API call
        },
        job: conversation.job
          ? {
              id: conversation.job.id,
              title: conversation.job.title,
            }
          : null,
        lastMessage:
          conversation.messages.length > 0
            ? {
                content: conversation.messages[0].content,
                created_at: conversation.messages[0].created_at,
                is_read: conversation.messages[0].is_read,
              }
            : null,
        created_at: conversation.created_at,
        updated_at: conversation.updated_at,
        last_message_at: conversation.last_message_at,
      };
    });

    res.status(200).json({
      success: true,
      data: formattedConversations,
    });
  } catch (error) {
    console.error("Error in getConversations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch conversations",
      error: error.message,
    });
  }
};

/**
 * Get messages in a specific conversation
 */
const getMessages = async (req, res) => {
  try {
    const userId = req.userId;
    const { conversationId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    // Verify that the user is part of the conversation
    const conversation = await Conversation.findOne({
      where: {
        id: conversationId,
        [Op.or]: [{ client_id: userId }, { freelancer_id: userId }],
      },
    });

    if (!conversation) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this conversation",
      });
    }

    // Get messages
    const messages = await Message.findAll({
      where: {
        conversation_id: conversationId,
      },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [["created_at", "DESC"]],
    });

    // Mark messages from other user as read
    await Message.update(
      {
        is_read: true,
        read_at: new Date(),
      },
      {
        where: {
          conversation_id: conversationId,
          sender_id: { [Op.ne]: userId },
          is_read: false,
        },
      }
    );

    res.status(200).json({
      success: true,
      data: messages,
    });
  } catch (error) {
    console.error("Error in getMessages:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch messages",
      error: error.message,
    });
  }
};

/**
 * Create a new conversation
 */
const createConversation = async (req, res) => {
  try {
    const { freelancerId, jobId } = req.body;
    const clientId = req.userId;

    // Check if conversation already exists
    let conversation = await Conversation.findOne({
      where: {
        client_id: clientId,
        freelancer_id: freelancerId,
        job_id: jobId || null,
      },
    });

    if (conversation) {
      // If conversation exists but inactive, reactivate it
      if (!conversation.is_active) {
        await conversation.update({ is_active: true });
      }

      return res.status(200).json({
        success: true,
        message: "Conversation already exists",
        data: conversation,
      });
    }

    // Create new conversation
    conversation = await Conversation.create({
      client_id: clientId,
      freelancer_id: freelancerId,
      job_id: jobId || null,
      is_active: true,
      last_message_at: new Date(),
    });

    // Create system message
    await Message.create({
      conversation_id: conversation.id,
      sender_id: clientId,
      message_type: "system",
      content: "Conversation started",
      is_read: false,
    });

    res.status(201).json({
      success: true,
      message: "Conversation created successfully",
      data: conversation,
    });
  } catch (error) {
    console.error("Error in createConversation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create conversation",
      error: error.message,
    });
  }
};

/**
 * Create a new message in a conversation
 */
const createMessage = async (req, res) => {
  try {
    const userId = req.userId;
    const { conversationId } = req.params;
    const { content, messageType = "text", fileUrl } = req.body;

    // Verify that the user is part of the conversation
    const conversation = await Conversation.findOne({
      where: {
        id: conversationId,
        [Op.or]: [{ client_id: userId }, { freelancer_id: userId }],
      },
    });

    if (!conversation) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this conversation",
      });
    }

    // Create message
    const message = await Message.create({
      conversation_id: conversationId,
      sender_id: userId,
      message_type: messageType,
      content,
      file_url: fileUrl || null,
      is_read: false,
    });

    // Update last message timestamp in conversation
    await conversation.update({ last_message_at: new Date() });

    // Return the message without sender information
    // User information should be fetched separately from Supabase
    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: message,
    });
  } catch (error) {
    console.error("Error in createMessage:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: error.message,
    });
  }
};

/**
 * Mark messages as read
 */
const markMessagesAsRead = async (req, res) => {
  try {
    const userId = req.userId;
    const { conversationId } = req.params;

    // Verify that the user is part of the conversation
    const conversation = await Conversation.findOne({
      where: {
        id: conversationId,
        [Op.or]: [{ client_id: userId }, { freelancer_id: userId }],
      },
    });

    if (!conversation) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this conversation",
      });
    }

    // Mark unread messages from other users as read
    const result = await Message.update(
      {
        is_read: true,
        read_at: new Date(),
      },
      {
        where: {
          conversation_id: conversationId,
          sender_id: { [Op.ne]: userId },
          is_read: false,
        },
      }
    );

    res.status(200).json({
      success: true,
      message: "Messages marked as read",
      count: result[0],
    });
  } catch (error) {
    console.error("Error in markMessagesAsRead:", error);
    res.status(500).json({
      success: false,
      message: "Failed to mark messages as read",
      error: error.message,
    });
  }
};

/**
 * Get unread message count for a user
 */
const getUnreadCount = async (req, res) => {
  try {
    const userId = req.userId;

    const result = await Message.count({
      where: {
        sender_id: { [Op.ne]: userId },
        is_read: false,
      },
      include: [
        {
          model: Conversation,
          as: "conversation",
          attributes: [],
          required: true,
          where: {
            [Op.or]: [{ client_id: userId }, { freelancer_id: userId }],
            is_active: true,
          },
        },
      ],
    });

    res.status(200).json({
      success: true,
      data: { count: result },
    });
  } catch (error) {
    console.error("Error in getUnreadCount:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get unread count",
      error: error.message,
    });
  }
};

module.exports = {
  getConversations,
  getMessages,
  createConversation,
  createMessage,
  markMessagesAsRead,
  getUnreadCount,
};
