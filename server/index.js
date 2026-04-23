/**
 * Chat Server - Express backend with REST API polling
 * Handles room creation, joining, messaging, and lifecycle management
 * Works on Vercel serverless functions
 */

import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

const rooms = new Map();
const messages = new Map();
const deletedRooms = new Map();

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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  const exists = rooms.has(roomId);
  const creator = exists ? rooms.get(roomId).creator : null;
  res.json({ exists, roomId, creator });
});

app.post('/api/rooms', (req, res) => {
  const { username } = req.body;
  const roomId = generateRoomId();
  rooms.set(roomId, {
    id: roomId,
    creator: username || 'Anonymous',
    createdAt: new Date()
  });
  messages.set(roomId, []);
  res.json({ roomId, creator: username || 'Anonymous' });
});

app.get('/api/rooms/:roomId/messages', (req, res) => {
  const { roomId } = req.params;
  const since = parseInt(req.query.since) || 0;
  
  if (!rooms.has(roomId)) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  const roomMessages = messages.get(roomId) || [];
  const newMessages = roomMessages.filter(m => m.timestamp > since);
  
  res.json({ messages: newMessages });
});

app.post('/api/rooms/:roomId/messages', (req, res) => {
  const { roomId } = req.params;
  const { user, text, file } = req.body;
  
  if (!rooms.has(roomId)) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  if (!user || (!text && !file)) {
    return res.status(400).json({ error: 'User and text or file required' });
  }
  
  const message = {
    id: Date.now().toString(),
    user,
    text: text || '',
    time: formatTime(new Date()),
    timestamp: Date.now()
  };
  
  if (file) {
    message.file = {
      name: file.name,
      type: file.type,
      data: file.data
    };
  }
  
  const roomMessages = messages.get(roomId) || [];
  roomMessages.push(message);
  messages.set(roomId, roomMessages);
  
  res.json({ success: true, message });
});

app.post('/api/rooms/:roomId/join', (req, res) => {
  const { roomId } = req.params;
  const { username } = req.body;
  
  if (!rooms.has(roomId)) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  const room = rooms.get(roomId);
  const joinMessage = {
    id: Date.now().toString(),
    type: 'system-joined',
    user: username || 'Anonymous',
    text: `${username || 'Anonymous'} joined the room`,
    time: formatTime(new Date()),
    timestamp: Date.now()
  };
  
  const roomMessages = messages.get(roomId) || [];
  roomMessages.push(joinMessage);
  messages.set(roomId, roomMessages);
  
  res.json({ success: true });
});

app.post('/api/rooms/:roomId/leave', (req, res) => {
  const { roomId } = req.params;
  const { username } = req.body;
  
  if (!rooms.has(roomId)) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  const leaveMessage = {
    id: Date.now().toString(),
    type: 'system-left',
    user: username || 'Anonymous',
    text: `${username || 'Anonymous'} left the room`,
    time: formatTime(new Date()),
    timestamp: Date.now()
  };
  
  const roomMessages = messages.get(roomId) || [];
  roomMessages.push(leaveMessage);
  messages.set(roomId, roomMessages);
  
  res.json({ success: true });
});

app.delete('/api/rooms/:roomId', (req, res) => {
  const { roomId } = req.params;
  const { username } = req.body;
  
  if (!rooms.has(roomId)) {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  const room = rooms.get(roomId);
  if (room.creator !== username) {
    return res.status(403).json({ error: 'Only creator can delete room' });
  }
  
  const deleteMessage = {
    id: Date.now().toString(),
    type: 'system-deleted',
    user: username,
    text: `Room was deleted by ${username}`,
    time: formatTime(new Date()),
    timestamp: Date.now()
  };
  
  const roomMessages = messages.get(roomId) || [];
  roomMessages.push(deleteMessage);
  messages.set(roomId, roomMessages);
  
  deletedRooms.set(roomId, {
    room: rooms.get(roomId),
    messages: messages.get(roomId)
  });
  
  rooms.delete(roomId);
  messages.delete(roomId);
  
  res.json({ success: true });
});

app.post('/api/rooms/:roomId/recover', (req, res) => {
  const { roomId } = req.params;
  const { username } = req.body;
  
  const deletedData = deletedRooms.get(roomId);
  if (deletedData) {
    if (deletedData.room.creator !== username) {
      return res.status(403).json({ error: 'Only original creator can recover this room' });
    }
    
    rooms.set(roomId, deletedData.room);
    messages.set(roomId, deletedData.messages);
    deletedRooms.delete(roomId);
  } else if (rooms.has(roomId)) {
    const room = rooms.get(roomId);
    if (room.creator !== username) {
      return res.status(403).json({ error: 'Only creator can re-activate room' });
    }
  } else {
    return res.status(404).json({ error: 'Room not found' });
  }
  
  const recoverMessage = {
    id: Date.now().toString(),
    type: 'system-recovered',
    user: username,
    text: `Room was recovered by ${username}`,
    time: formatTime(new Date()),
    timestamp: Date.now()
  };
  
  const roomMessages = messages.get(roomId) || [];
  roomMessages.push(recoverMessage);
  messages.set(roomId, roomMessages);
  
  res.json({ success: true, roomId });
});

app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Chat API running' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;