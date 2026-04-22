/**
 * Chat Server - Express + Socket.io backend
 * Handles room creation, joining, messaging, and lifecycle management
 */

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

/**
 * In-memory room storage
 * Structure: Map<roomId, { id: string, participants: Set<{id, socketId, name}> }>
 * Note: Can be swapped for Redis/PostgreSQL in production
 */
const rooms = new Map();

/**
 * Generate a unique 4-digit room ID
 * Range: 1000-9999 (excludes leading zeros for UX)
 * Collision handling: Simple retry - in production, use a counter or UUID
 */
function generateRoomId() {
  const usedIds = new Set(rooms.keys());
  let attempts = 0;
  let roomId;
  
  do {
    roomId = Math.floor(1000 + Math.random() * 9000).toString();
    attempts++;
  } while (usedIds.has(roomId) && attempts < 100);
  
  return roomId;
}

/**
 * Format timestamp for messages
 */
function formatTime(date) {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
}

/**
 * REST: Check if room exists
 */
app.get('/api/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  const exists = rooms.has(roomId);
  res.json({ exists, roomId });
});

/**
 * REST: Create a new room (returns new roomId)
 */
app.post('/api/rooms', (req, res) => {
  const roomId = generateRoomId();
  rooms.set(roomId, {
    id: roomId,
    participants: new Map(),
    createdAt: new Date()
  });
  res.json({ roomId });
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  /**
   * User joins a room
   */
  socket.on('join-room', ({ roomId, username }) => {
    const room = rooms.get(roomId);
    
    if (!room) {
      socket.emit('error', { message: 'Room does not exist' });
      return;
    }

    const user = {
      id: socket.id,
      name: username || 'Anonymous'
    };

    // Add user to room
    room.participants.set(socket.id, user);
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.user = user;

    // Notify room members
    io.to(roomId).emit('user-joined', {
      user: user.name,
      time: formatTime(new Date())
    });

    // Send message history (empty for now - can add Redis later)
    socket.emit('message-history', []);
  });

  /**
   * User creates and joins a new room
   */
  socket.on('create-room', ({ username }, callback) => {
    const roomId = generateRoomId();
    rooms.set(roomId, {
      id: roomId,
      participants: new Map(),
      createdAt: new Date()
    });

    const user = {
      id: socket.id,
      name: username || 'Anonymous'
    };

    const room = rooms.get(roomId);
    room.participants.set(socket.id, user);
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.user = user;

    callback({ roomId });
  });

  /**
   * Handle incoming messages
   */
  socket.on('chat-message', (message) => {
    const roomId = socket.data.roomId;
    const user = socket.data.user;

    if (!roomId || !user) return;

    io.to(roomId).emit('chat-message', {
      user: user.name,
      text: message,
      time: formatTime(new Date())
    });
  });

  /**
   * Handle disconnect - cleanup room if empty
   */
  socket.on('disconnect', () => {
    const roomId = socket.data.roomId;
    const user = socket.data.user;

    if (roomId && user) {
      const room = rooms.get(roomId);
      
      if (room) {
        room.participants.delete(socket.id);

        // Notify others in room
        io.to(roomId).emit('user-left', {
          user: user.name,
          time: formatTime(new Date())
        });

        // Remove room if empty
        if (room.participants.size === 0) {
          rooms.delete(roomId);
          console.log(`Room ${roomId} removed (empty)`);
        }
      }
    }

    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});