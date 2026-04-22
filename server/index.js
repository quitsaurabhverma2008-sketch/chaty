/**
 * Chat Server - Express + Socket.io backend
 * Handles room creation, joining, messaging, and lifecycle management
 * Configured for Vercel serverless deployment
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
  },
  transports: ['websocket', 'polling'],
  allowUpgrades: true
});

app.use(cors());
app.use(express.json());

const rooms = new Map();

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

function formatTime(date) {
  return date.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
}

app.get('/api/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  const exists = rooms.has(roomId);
  res.json({ exists, roomId });
});

app.post('/api/rooms', (req, res) => {
  const roomId = generateRoomId();
  rooms.set(roomId, {
    id: roomId,
    participants: new Map(),
    createdAt: new Date()
  });
  res.json({ roomId });
});

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Chat Server running' });
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

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

    room.participants.set(socket.id, user);
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.user = user;

    io.to(roomId).emit('user-joined', {
      user: user.name,
      time: formatTime(new Date())
    });

    socket.emit('message-history', []);
  });

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

  socket.on('disconnect', () => {
    const roomId = socket.data.roomId;
    const user = socket.data.user;

    if (roomId && user) {
      const room = rooms.get(roomId);
      
      if (room) {
        room.participants.delete(socket.id);

        io.to(roomId).emit('user-left', {
          user: user.name,
          time: formatTime(new Date())
        });

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

export default app;