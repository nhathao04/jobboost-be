const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { authConfig } = require("./auth");
const { Conversation, Message } = require("../models");
const { Op } = require("sequelize");

let io;

/**
 * Initialize socket.io server
 * @param {*} server - HTTP server instance
 */
const initialize = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*", // Adjust in production to only allow specific domains
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.split(" ")[1];

      if (!token) {
        return next(new Error("Authentication token is required"));
      }

      let decoded;
      let userId;

      try {
        // First, try to verify with our backend JWT secret
        decoded = jwt.verify(token, authConfig.jwtSecret);
        userId = decoded.id || decoded.sub;
        console.log("✅ Backend JWT token verified:", { userId, tokenType: 'backend' });
      } catch (backendError) {
        try {
          // If backend JWT fails, try Supabase JWT (no verification for now, just decode)
          decoded = jwt.decode(token);
          if (decoded && (decoded.sub || decoded.id)) {
            userId = decoded.sub || decoded.id;
            console.log("✅ Supabase JWT token decoded:", { userId, tokenType: 'supabase' });

            // Additional validation for Supabase tokens
            if (!decoded.aud || !decoded.exp || decoded.exp < Math.floor(Date.now() / 1000)) {
              throw new Error("Invalid or expired Supabase token");
            }
          } else {
            throw new Error("Invalid token format");
          }
        } catch (supabaseError) {
          console.error("❌ Both JWT verification methods failed:", {
            backendError: backendError.message,
            supabaseError: supabaseError.message
          });
          return next(new Error("Invalid authentication token"));
        }
      }

      socket.userId = userId;

      // Add the user to appropriate rooms
      const conversations = await Conversation.findAll({
        where: {
          [Op.or]: [
            { client_id: socket.userId },
            { freelancer_id: socket.userId },
          ],
          is_active: true,
        },
      });

      socket.conversations = conversations.map((conv) => conv.id);
      console.log(`👤 User ${socket.userId} authenticated with ${socket.conversations.length} conversations`);
      next();
    } catch (error) {
      console.error("Socket authentication error:", error);
      next(new Error("Authentication error"));
    }
  });

  // Connection event
  io.on("connection", (socket) => {
    console.log(`User ${socket.userId} connected with socket ID: ${socket.id}`);

    // Join user to their conversation rooms
    socket.conversations.forEach((convId) => {
      socket.join(`conversation:${convId}`);
    });

    // Join user to their personal room
    socket.join(`user:${socket.userId}`);

    // Handle new message event - BROADCASTING ONLY (message already persisted via REST API)
    socket.on("send_message", async (data) => {
      try {
        const { conversationId, content, messageType = "text", fileUrl, messageId } = data;

        // Verify user is part of this conversation
        if (!socket.conversations.includes(conversationId)) {
          socket.emit("error", {
            message: "You don't have access to this conversation",
          });
          return;
        }

        // If messageId is provided, fetch the existing message from database
        let messageToSend;
        if (messageId) {
          messageToSend = await Message.findByPk(messageId);
          if (!messageToSend) {
            console.error(`Message with ID ${messageId} not found`);
            socket.emit("error", { message: "Message not found" });
            return;
          }
          console.log(`📤 Broadcasting existing message: ${messageId}`);
        } else {
          console.error("No messageId provided for broadcasting");
          socket.emit("error", { message: "Message ID required for broadcasting" });
          return;
        }

        // Update conversation's last_message_at
        await Conversation.update(
          { last_message_at: new Date() },
          { where: { id: conversationId } }
        );

        // Get conversation details to find recipient
        const conversation = await Conversation.findByPk(conversationId);
        const recipientId =
          conversation.client_id === socket.userId
            ? conversation.freelancer_id
            : conversation.client_id;

        // Emit message to the conversation room (this will reach all users in the conversation)
        io.to(`conversation:${conversationId}`).emit(
          "new_message",
          messageToSend
        );

        // Also emit a notification to the recipient's personal room
        io.to(`user:${recipientId}`).emit("message_notification", {
          conversationId,
          message: messageToSend,
        });

        console.log(`✅ Message ${messageId} broadcasted to conversation ${conversationId} and user ${recipientId}`);
      } catch (error) {
        console.error("Error handling send_message:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Handle read receipt event
    socket.on("mark_read", async (data) => {
      try {
        const { conversationId } = data;

        // Verify user is part of this conversation
        if (!socket.conversations.includes(conversationId)) {
          socket.emit("error", {
            message: "You don't have access to this conversation",
          });
          return;
        }

        // Update messages as read in database
        await Message.update(
          {
            is_read: true,
            read_at: new Date(),
          },
          {
            where: {
              conversation_id: conversationId,
              sender_id: { [Op.ne]: socket.userId },
              is_read: false,
            },
          }
        );

        // Emit read receipt event to the conversation room
        io.to(`conversation:${conversationId}`).emit("messages_read", {
          conversationId,
          userId: socket.userId,
          timestamp: new Date(),
        });
      } catch (error) {
        console.error("Error handling mark_read:", error);
        socket.emit("error", { message: "Failed to mark messages as read" });
      }
    });

    // Handle typing events
    socket.on("typing_start", (data) => {
      const { conversationId } = data;

      // Verify user is part of this conversation
      if (!socket.conversations.includes(conversationId)) {
        return;
      }

      // Broadcast typing event to others in the conversation
      socket.to(`conversation:${conversationId}`).emit("typing", {
        conversationId,
        userId: socket.userId,
        isTyping: true,
      });
    });

    socket.on("typing_end", (data) => {
      const { conversationId } = data;

      // Verify user is part of this conversation
      if (!socket.conversations.includes(conversationId)) {
        return;
      }

      // Broadcast typing stopped event to others in the conversation
      socket.to(`conversation:${conversationId}`).emit("typing", {
        conversationId,
        userId: socket.userId,
        isTyping: false,
      });
    });

    // Handle disconnect event
    socket.on("disconnect", () => {
      console.log(`User ${socket.userId} disconnected`);
    });
  });

  return io;
};

/**
 * Get the socket.io instance
 */
const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};

module.exports = {
  initialize,
  getIO,
};
