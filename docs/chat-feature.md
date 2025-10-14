# Chat Feature Documentation

## Overview

This document provides information about the chat feature in JobBoost platform, which allows clients and freelancers to communicate in real-time. The chat system consists of two main components:

1. **REST API** - For fetching conversation history, creating new conversations, etc.
2. **WebSockets (Socket.io)** - For real-time messaging and notifications

## API Endpoints

### Authentication

All API endpoints and socket connections require authentication using a JWT token. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Conversations

#### Get all conversations

Retrieves all conversations for the authenticated user.

- **URL**: `/api/v1/conversations`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid",
        "otherUser": {
          "id": "uuid",
          "name": "John Doe",
          "avatar_url": "https://example.com/avatar.jpg"
        },
        "job": {
          "id": "uuid",
          "title": "Website Development"
        },
        "lastMessage": {
          "content": "Hello, I'm interested in your project",
          "created_at": "2023-10-12T15:30:45Z",
          "is_read": false
        },
        "created_at": "2023-10-12T15:30:45Z",
        "updated_at": "2023-10-12T15:30:45Z",
        "last_message_at": "2023-10-12T15:30:45Z"
      }
    ]
  }
  ```

#### Create a new conversation

Creates a new conversation between a client and a freelancer.

- **URL**: `/api/v1/conversations`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "freelancerId": "uuid",
    "jobId": "uuid" // Optional
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Conversation created successfully",
    "data": {
      "id": "uuid",
      "client_id": "uuid",
      "freelancer_id": "uuid",
      "job_id": "uuid",
      "is_active": true,
      "last_message_at": "2023-10-12T15:30:45Z",
      "created_at": "2023-10-12T15:30:45Z",
      "updated_at": "2023-10-12T15:30:45Z"
    }
  }
  ```

### Messages

#### Get messages in a conversation

Retrieves messages for a specific conversation.

- **URL**: `/api/v1/conversations/{conversationId}/messages`
- **Method**: `GET`
- **Query Parameters**:
  - `limit` (optional, default: 20) - Number of messages to retrieve
  - `offset` (optional, default: 0) - Offset for pagination
- **Response**:
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid",
        "conversation_id": "uuid",
        "sender_id": "uuid",
        "message_type": "text",
        "content": "Hello, I'm interested in your project",
        "file_url": null,
        "is_read": true,
        "read_at": "2023-10-12T15:35:45Z",
        "created_at": "2023-10-12T15:30:45Z",
        "updated_at": "2023-10-12T15:35:45Z",
        "sender": {
          "id": "uuid",
          "name": "John Doe",
          "avatar_url": "https://example.com/avatar.jpg"
        }
      }
    ]
  }
  ```

#### Send a message

Sends a message in a conversation.

- **URL**: `/api/v1/conversations/{conversationId}/messages`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "content": "Hello, I'm interested in your project",
    "messageType": "text", // Optional, default: "text" (options: "text", "image", "file", "system")
    "fileUrl": "https://example.com/file.pdf" // Optional
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "message": "Message sent successfully",
    "data": {
      "id": "uuid",
      "conversation_id": "uuid",
      "sender_id": "uuid",
      "message_type": "text",
      "content": "Hello, I'm interested in your project",
      "file_url": null,
      "is_read": false,
      "read_at": null,
      "created_at": "2023-10-12T15:30:45Z",
      "updated_at": "2023-10-12T15:30:45Z",
      "sender": {
        "id": "uuid",
        "name": "John Doe",
        "avatar_url": "https://example.com/avatar.jpg"
      }
    }
  }
  ```

#### Mark messages as read

Marks all unread messages in a conversation as read.

- **URL**: `/api/v1/conversations/{conversationId}/read`
- **Method**: `PATCH`
- **Response**:
  ```json
  {
    "success": true,
    "message": "Messages marked as read",
    "count": 5
  }
  ```

#### Get unread message count

Gets the number of unread messages for the authenticated user.

- **URL**: `/api/v1/conversations/unread-count`
- **Method**: `GET`
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "count": 10
    }
  }
  ```

## Socket.IO Integration

The real-time messaging is handled using Socket.IO. Here's how to integrate it in your client application.

### Connecting to Socket.IO Server

```javascript
import { io } from "socket.io-client";

// Replace with your actual server URL
const socket = io("http://localhost:5000", {
  auth: {
    token: "your_jwt_token",
  },
});

// Handle connection
socket.on("connect", () => {
  console.log("Connected to chat server");
});

// Handle connection errors
socket.on("connect_error", (error) => {
  console.error("Connection failed:", error.message);
});
```

### Event Handling

#### Sending a message

```javascript
const sendMessage = (conversationId, content) => {
  socket.emit("send_message", {
    conversationId,
    content,
    messageType: "text", // or "image", "file"
  });
};
```

#### Receiving a new message

```javascript
socket.on("new_message", (message) => {
  console.log("New message received:", message);
  // Update your UI with the new message
});
```

#### Receiving message notifications

```javascript
socket.on("message_notification", (data) => {
  console.log("New message notification:", data);
  // Show notification to user
});
```

#### Marking messages as read

```javascript
const markMessagesAsRead = (conversationId) => {
  socket.emit("mark_read", {
    conversationId,
  });
};
```

#### Handling read receipts

```javascript
socket.on("messages_read", (data) => {
  console.log("Messages read:", data);
  // Update your UI to show messages as read
});
```

#### Handling typing indicators

```javascript
// When user starts typing
const startTyping = (conversationId) => {
  socket.emit("typing_start", {
    conversationId,
  });
};

// When user stops typing
const stopTyping = (conversationId) => {
  socket.emit("typing_end", {
    conversationId,
  });
};

// Listening for typing indicators from others
socket.on("typing", (data) => {
  const { conversationId, userId, isTyping } = data;
  // Update UI to show typing indicator
});
```

### Handling Errors

```javascript
socket.on("error", (error) => {
  console.error("Socket error:", error.message);
});
```

### Disconnecting

```javascript
// Disconnect from the socket server
const disconnect = () => {
  socket.disconnect();
};
```

## Example Usage

Here's a simple example of how to implement the chat feature in a React component:

```jsx
import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import axios from "axios";

const ChatComponent = ({ conversationId, token }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [socket, setSocket] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    const socketIo = io("http://localhost:5000", {
      auth: { token },
    });

    socketIo.on("connect", () => {
      console.log("Connected to chat server");
    });

    socketIo.on("new_message", (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    socketIo.on("messages_read", (data) => {
      if (data.conversationId === conversationId) {
        setMessages((prevMessages) =>
          prevMessages.map((msg) => ({
            ...msg,
            is_read: true,
            read_at: msg.is_read ? msg.read_at : data.timestamp,
          }))
        );
      }
    });

    setSocket(socketIo);

    return () => {
      socketIo.disconnect();
    };
  }, [token, conversationId]);

  // Load message history
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.get(
          `/api/v1/conversations/${conversationId}/messages`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setMessages(response.data.data);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();
  }, [conversationId, token]);

  // Send a message
  const handleSendMessage = () => {
    if (!newMessage.trim() || !socket) return;

    socket.emit("send_message", {
      conversationId,
      content: newMessage.trim(),
    });

    setNewMessage("");
  };

  // Mark messages as read
  useEffect(() => {
    if (socket && messages.some((msg) => !msg.is_read)) {
      socket.emit("mark_read", { conversationId });
    }
  }, [messages, socket, conversationId]);

  return (
    <div className="chat-container">
      <div className="messages-container">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`message ${
              msg.sender_id === currentUserId ? "sent" : "received"
            }`}
          >
            <div className="message-content">{msg.content}</div>
            <div className="message-meta">
              {new Date(msg.created_at).toLocaleTimeString()}
              {msg.is_read && " ✓"}
            </div>
          </div>
        ))}
      </div>

      <div className="message-input">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button onClick={handleSendMessage}>Send</button>
      </div>
    </div>
  );
};

export default ChatComponent;
```

## Best Practices

1. **Reconnect Logic**: Implement reconnect logic in case the socket connection is lost.
2. **Error Handling**: Always handle errors gracefully to provide a good user experience.
3. **Message Pagination**: When loading message history, implement pagination to improve performance.
4. **Offline Support**: Consider implementing offline support to store messages when the user is offline.
5. **File Uploads**: For sending files or images, use a separate API endpoint to upload the file first, then send the URL through Socket.IO.
6. **Security**: Always validate incoming messages on the server to prevent malicious content.
